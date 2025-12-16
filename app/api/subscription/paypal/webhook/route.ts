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

function getPlanPricing(planType: "pro_monthly" | "pro_yearly") {
  if (planType === "pro_monthly") {
    return {
      amountUsd: 1433, // $14.33 in cents
      amountInr: 129900, // ₹1299 in paisa
    }
  } else {
    return {
      amountUsd: 23171, // $231.71 in cents
      amountInr: 1299900, // ₹12999 in paisa
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const webhookEvent = JSON.parse(body)

    console.log("[v0] PayPal Webhook received:", webhookEvent.event_type)

    // Verify webhook signature
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    if (!verifyWebhookSignature(webhookEvent, headers)) {
      console.error("[v0] Invalid PayPal webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const supabase = getSupabaseClient()
    const eventType = webhookEvent.event_type
    const resource = webhookEvent.resource

    // Handle different webhook events
    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        // Subscription activated after customer approval
        const subscriptionId = resource.id
        const userId = resource.custom_id
        const planId = resource.plan_id

        let planType: "pro_monthly" | "pro_yearly" = "pro_monthly"

        // Check plan_id against environment variable plan IDs
        const monthlyPlanId = process.env.PAYPAL_MONTHLY_PLAN_ID
        const yearlyPlanId = process.env.PAYPAL_YEARLY_PLAN_ID

        if (planId === yearlyPlanId) {
          planType = "pro_yearly"
        } else if (planId === monthlyPlanId) {
          planType = "pro_monthly"
        } else {
          // Fallback: try to detect from billing info
          const billingInfo = resource.billing_info
          const frequency = billingInfo?.cycle_executions?.[0]?.pricing_scheme?.fixed_price?.currency_code

          // Check the billing cycles array
          if (resource.plan?.billing_cycles) {
            const regularCycle = resource.plan.billing_cycles.find((c: any) => c.tenure_type === "REGULAR")
            if (regularCycle?.frequency?.interval_unit === "YEAR") {
              planType = "pro_yearly"
            }
          }
        }

        console.log("[v0] PayPal plan type detected:", planType, "for plan_id:", planId)

        const nextBillingDate = getNextBillingDate(planType)
        const gracePeriodEnd = addDays(nextBillingDate, 3)

        const pricing = getPlanPricing(planType)

        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
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
            amount_inr: pricing.amountInr, // Use correct pricing
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )

        await supabase.from("payment_history").insert({
          user_id: userId,
          transaction_id: resource.billing_info?.last_payment?.time || new Date().toISOString(),
          gateway_payment_id: subscriptionId,
          amount_inr: pricing.amountInr,
          currency: "USD",
          status: "success",
          payment_method: "paypal",
          payment_gateway: "paypal",
          gateway_response: resource,
          completed_at: new Date().toISOString(),
        })

        console.log("[v0] PayPal subscription activated:", subscriptionId)
        break
      }

      case "PAYMENT.SALE.COMPLETED": {
        // Recurring payment successful
        const saleId = resource.id
        const subscriptionId = resource.billing_agreement_id

        // Find subscription by subscription_id
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("subscription_id", subscriptionId)
          .single()

        if (subscription) {
          const nextBillingDate = getNextBillingDate(subscription.plan_type)
          const gracePeriodEnd = addDays(nextBillingDate, 3)

          const pricing = getPlanPricing(subscription.plan_type as "pro_monthly" | "pro_yearly")

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
            amount_inr: pricing.amountInr,
            currency: "USD",
            status: "success",
            payment_method: "paypal",
            payment_gateway: "paypal",
            gateway_response: resource,
            completed_at: new Date().toISOString(),
          })

          console.log("[v0] PayPal payment successful:", saleId)
        }
        break
      }

      case "PAYMENT.SALE.DENIED":
      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
        // Payment failed
        const subscriptionId = resource.id || resource.billing_agreement_id

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("subscription_id", subscriptionId)
          .single()

        if (subscription) {
          const retryCount = (subscription.payment_retry_count || 0) + 1

          if (retryCount >= 3) {
            // Max retries - expire subscription
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
            // Add 3 day grace period
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

          // Record failed payment
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
        // Subscription cancelled
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
