import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyWebhookSignature } from "@/lib/paypal"

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Supabase configuration missing")
  }

  return createClient(url, key)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function getNextBillingDate(planType: string): Date {
  const now = new Date()

  if (planType === "pro_yearly") {
    now.setFullYear(now.getFullYear() + 1)
  } else {
    now.setMonth(now.getMonth() + 1)
  }
  return now
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const webhookEvent = JSON.parse(body)

    console.log("[v0] PayPal Webhook received:", webhookEvent.event_type)

    // Verify webhook signature (optional for sandbox testing)
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    const webhookId = process.env.PAYPAL_WEBHOOK_ID
    if (webhookId && !verifyWebhookSignature(webhookEvent, headers)) {
      console.error("[v0] Invalid PayPal webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const supabase = getSupabaseClient()
    const eventType = webhookEvent.event_type
    const resource = webhookEvent.resource

    // Handle different webhook events
    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const subscriptionId = resource.id
        const customId = resource.custom_id // User ID passed from SDK button
        const planId = resource.plan_id
        const subscriberEmail = resource.subscriber?.email_address

        console.log("[v0] Processing subscription activation:", {
          subscriptionId,
          customId,
          planId,
          subscriberEmail,
        })

        let planType: string
        if (planId === "P-2E389376EP025560JNE7G7VI") {
          planType = "pro_monthly"
        } else if (planId === "P-3UA6156419729621GNE7HLYY") {
          planType = "pro_yearly"
        } else {
          planType = "pro_monthly" // Default fallback
        }

        const nextBillingDate = getNextBillingDate(planType)
        const gracePeriodEnd = addDays(nextBillingDate, 3)

        const amountUsd =
          Math.round(
            Number.parseFloat(
              resource.billing_info?.last_payment?.amount?.value ||
                resource.plan_details?.billing_cycles?.[1]?.pricing_scheme?.fixed_price?.value ||
                "0",
            ) * 100,
          ) || (planType === "pro_yearly" ? 15999 : 1599)
        const amountInr = Math.round(amountUsd * 83)

        let finalUserId = null

        // Method 1: Use custom_id if provided
        if (customId && customId !== "guest") {
          finalUserId = customId
          console.log("[v0] Found user from custom_id:", finalUserId)
        }

        // Method 2: Look up by email from subscriber info
        if (!finalUserId && subscriberEmail) {
          const { data: user } = await supabase.from("profiles").select("id").eq("email", subscriberEmail).single()

          if (user) {
            finalUserId = user.id
            console.log("[v0] Found user from email:", finalUserId)
          }
        }

        // Method 3: Check auth.users table
        if (!finalUserId && subscriberEmail) {
          const { data: authUsers } = await supabase.rpc("get_user_by_email", { user_email: subscriberEmail })

          if (authUsers && authUsers.length > 0) {
            finalUserId = authUsers[0].id
            console.log("[v0] Found user from auth.users:", finalUserId)
          }
        }

        if (finalUserId) {
          const { error: upsertError } = await supabase.from("subscriptions").upsert(
            {
              user_id: finalUserId,
              plan_type: planType,
              status: "active",
              payment_gateway: "paypal",
              subscription_id: subscriptionId,
              current_period_start: new Date().toISOString(),
              current_period_end: nextBillingDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              payment_due_date: gracePeriodEnd.toISOString(),
              last_payment_date: new Date().toISOString(),
              last_payment_status: "success",
              payment_retry_count: 0,
              amount_inr: amountInr,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          )

          if (upsertError) {
            console.error("[v0] Subscription upsert error:", upsertError)
          }

          // Record payment in history
          await supabase.from("payment_history").insert({
            user_id: finalUserId,
            transaction_id: subscriptionId,
            gateway_payment_id: subscriptionId,
            amount_inr: amountInr,
            currency: "USD",
            status: "success",
            payment_method: "paypal",
            gateway_response: resource,
            completed_at: new Date().toISOString(),
          })

          console.log("[v0] PayPal subscription activated successfully:", subscriptionId)
        } else {
          console.error("[v0] Could not identify user for PayPal subscription:", {
            subscriptionId,
            subscriberEmail,
            customId,
          })
          // Store pending subscription for manual review
          await supabase.from("pending_subscriptions").insert({
            subscription_id: subscriptionId,
            gateway: "paypal",
            subscriber_email: subscriberEmail,
            plan_id: planId,
            plan_type: planType,
            amount_inr: amountInr,
            raw_data: resource,
            created_at: new Date().toISOString(),
          })
        }
        break
      }

      case "PAYMENT.SALE.COMPLETED": {
        const saleId = resource.id
        const subscriptionId = resource.billing_agreement_id
        const amountUsd = Math.round(Number.parseFloat(resource.amount?.total || "0") * 100)
        const amountInr = Math.round(amountUsd * 83)

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("subscription_id", subscriptionId)
          .single()

        if (subscription) {
          const nextBillingDate = getNextBillingDate(subscription.plan_type)
          const gracePeriodEnd = addDays(nextBillingDate, 3)

          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: nextBillingDate.toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
              payment_due_date: gracePeriodEnd.toISOString(),
              last_payment_date: new Date().toISOString(),
              last_payment_status: "success",
              payment_retry_count: 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id)

          await supabase.from("payment_history").insert({
            user_id: subscription.user_id,
            subscription_id: subscription.id,
            transaction_id: saleId,
            gateway_payment_id: saleId,
            amount_inr: amountInr,
            currency: "USD",
            status: "success",
            payment_method: "paypal",
            gateway_response: resource,
            completed_at: new Date().toISOString(),
          })

          console.log("[v0] PayPal payment successful:", saleId)
        }
        break
      }

      case "PAYMENT.SALE.DENIED":
      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
        const subscriptionId = resource.id || resource.billing_agreement_id

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("subscription_id", subscriptionId)
          .single()

        if (subscription) {
          const retryCount = (subscription.payment_retry_count || 0) + 1

          if (retryCount >= 3) {
            await supabase
              .from("subscriptions")
              .update({
                status: "expired",
                last_payment_status: "failed",
                payment_retry_count: retryCount,
                updated_at: new Date().toISOString(),
              })
              .eq("id", subscription.id)
          } else {
            await supabase
              .from("subscriptions")
              .update({
                status: "payment_due",
                last_payment_status: "failed",
                payment_retry_count: retryCount,
                payment_due_date: addDays(new Date(), 3).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", subscription.id)
          }

          await supabase.from("payment_history").insert({
            user_id: subscription.user_id,
            subscription_id: subscription.id,
            transaction_id: resource.id,
            status: "failed",
            payment_method: "paypal",
            gateway_response: resource,
          })

          console.log("[v0] PayPal payment failed:", subscriptionId)
        }
        break
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        const subscriptionId = resource.id

        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("subscription_id", subscriptionId)

        console.log("[v0] PayPal subscription cancelled:", subscriptionId)
        break
      }

      default:
        console.log("[v0] Unhandled PayPal webhook event:", eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] PayPal webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
