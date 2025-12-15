import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { cancelSubscription } from "@/lib/payin"
import { paypalConfig } from "@/lib/config/env"

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 })
    }

    if (subscription.plan_type === "free") {
      return NextResponse.json({ error: "Cannot cancel free plan" }, { status: 400 })
    }

    // PayPal subscriptions must be cancelled via PayPal API
    if (subscription.payment_gateway === "paypal" && subscription.subscription_id) {
      if (!paypalConfig.isConfigured) {
        return NextResponse.json({ error: "PayPal not configured" }, { status: 500 })
      }

      try {
        // Get access token
        const tokenResponse = await fetch(`${paypalConfig.baseUrl}/v1/oauth2/token`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "grant_type=client_credentials",
        })

        const { access_token } = await tokenResponse.json()

        // Cancel on PayPal
        const cancelResponse = await fetch(
          `${paypalConfig.baseUrl}/v1/billing/subscriptions/${subscription.subscription_id}/cancel`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ reason: "User requested cancellation" }),
          },
        )

        if (!cancelResponse.ok) {
          const error = await cancelResponse.json()
          console.error("PayPal cancel error:", error)
          return NextResponse.json({ error: "Failed to cancel PayPal subscription" }, { status: 500 })
        }
      } catch (error) {
        console.error("PayPal cancellation error:", error)
        return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
      }
    } else if (subscription.payment_gateway === "payu" && subscription.subscription_id) {
      const result = await cancelSubscription(subscription.subscription_id)
      if (!result.success) {
        console.error("Failed to cancel with PayU:", result.error)
        return NextResponse.json({ error: "Failed to cancel PayU subscription" }, { status: 500 })
      }
    }

    // Update subscription status only after payment gateway confirms
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update subscription status" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Subscription cancelled successfully" })
  } catch (error) {
    console.error("Cancel subscription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
