import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyWebhookSignature, type WebhookPayload } from "@/lib/payin"
import { addGracePeriod, getNextBillingDate } from "@/lib/subscription"

// Use service role client for webhook processing
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-payin-signature") || ""

    // Verify webhook signature
    if (process.env.PAYIN_WEBHOOK_SECRET && !verifyWebhookSignature(body, signature)) {
      console.error("Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payload: WebhookPayload = JSON.parse(body)
    console.log("Webhook received:", payload.event, payload.subscriptionId)

    // Find subscription by gateway subscription ID
    const { data: subscription, error: findError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("subscription_id", payload.subscriptionId)
      .single()

    if (findError || !subscription) {
      console.error("Subscription not found:", payload.subscriptionId)
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    switch (payload.event) {
      case "subscription.activated":
      case "payment.success": {
        // Payment successful - activate subscription
        const nextBillingDate = getNextBillingDate(subscription.plan_type)

        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: nextBillingDate.toISOString(),
            next_billing_date: nextBillingDate.toISOString(),
            last_payment_date: new Date().toISOString(),
            last_payment_status: "success",
            payment_retry_count: 0,
            payment_due_date: null,
          })
          .eq("id", subscription.id)

        // Record payment
        await supabase.from("payment_history").insert({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          transaction_id: payload.transactionId,
          gateway_payment_id: payload.data?.payment_id as string,
          amount_inr: payload.amount || subscription.amount_inr,
          status: "success",
          payment_method: payload.data?.payment_method as string,
          gateway_response: payload.data,
          completed_at: new Date().toISOString(),
        })
        break
      }

      case "payment.failed": {
        // Payment failed - add 3 day grace period
        const retryCount = (subscription.payment_retry_count || 0) + 1
        const gracePeriodEnd = addGracePeriod(new Date(), 3)

        if (retryCount >= 3) {
          // Max retries reached - expire subscription
          await supabase
            .from("subscriptions")
            .update({
              status: "expired",
              last_payment_status: "failed",
              payment_retry_count: retryCount,
            })
            .eq("id", subscription.id)
        } else {
          // Set payment_due status with grace period
          await supabase
            .from("subscriptions")
            .update({
              status: "payment_due",
              last_payment_status: "failed",
              payment_retry_count: retryCount,
              payment_due_date: gracePeriodEnd.toISOString(),
            })
            .eq("id", subscription.id)
        }

        // Record failed payment
        await supabase.from("payment_history").insert({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          transaction_id: payload.transactionId,
          gateway_payment_id: payload.data?.payment_id as string,
          amount_inr: payload.amount || subscription.amount_inr,
          status: "failed",
          gateway_response: payload.data,
        })
        break
      }

      case "subscription.cancelled":
      case "mandate.revoked": {
        // Subscription cancelled
        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("id", subscription.id)
        break
      }

      case "mandate.created": {
        // Mandate created for autopay
        await supabase
          .from("subscriptions")
          .update({
            mandate_id: payload.mandateId,
          })
          .eq("id", subscription.id)
        break
      }

      default:
        console.log("Unhandled webhook event:", payload.event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
