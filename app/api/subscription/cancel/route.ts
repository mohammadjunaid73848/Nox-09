import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { cancelSubscription } from "@/lib/payin"

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

    // Cancel with payment gateway
    if (subscription.subscription_id) {
      const result = await cancelSubscription(subscription.subscription_id)
      if (!result.success) {
        console.error("Failed to cancel with gateway:", result.error)
      }
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Cancel subscription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
