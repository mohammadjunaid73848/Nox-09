import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { cancelSubscription as cancelPayinSubscription } from "@/lib/payin"
import { cancelSubscription as cancelPaypalSubscription } from "@/lib/paypal"

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

    if (subscription.subscription_id) {
      let result
      if (subscription.payment_gateway === "paypal") {
        result = await cancelPaypalSubscription(subscription.subscription_id)
      } else {
        result = await cancelPayinSubscription(subscription.subscription_id)
      }

      if (!result.success) {
        console.error("Failed to cancel with gateway:", result.error)
        return NextResponse.json(
          {
            success: false,
            error: result.error || "Failed to cancel subscription with payment provider",
          },
          { status: 500 },
        )
      }
    }

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Cancel subscription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
