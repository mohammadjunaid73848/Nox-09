import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createSubscription, PLAN_PRICING } from "@/lib/payin"
import { getNextBillingDate } from "@/lib/subscription"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planType } = await request.json()

    if (!planType || !["pro_monthly", "pro_yearly"].includes(planType)) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 })
    }

    // Check if user already has an active subscription
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    if (existingSub && existingSub.plan_type !== "free") {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create subscription with Pay.in
    const result = await createSubscription({
      customerId: user.id,
      customerEmail: user.email || "",
      planType: planType as "pro_monthly" | "pro_yearly",
      returnUrl: `${baseUrl}/subscription?status=success`,
      webhookUrl: `${baseUrl}/api/subscription/webhook`,
    })

    if (!result.success) {
      console.error("[v0] Subscription creation failed:", result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const plan = PLAN_PRICING[planType as keyof typeof PLAN_PRICING]
    const nextBillingDate = getNextBillingDate(planType as any)

    // Create or update subscription record
    const { error: subError } = await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan_type: planType,
        status: "pending",
        payment_gateway: "payin",
        subscription_id: result.subscriptionId,
        mandate_id: result.mandateId,
        amount_inr: plan.amount,
        next_billing_date: nextBillingDate.toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )

    if (subError) {
      console.error("[v0] Error creating subscription record:", subError)
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl,
      subscriptionId: result.subscriptionId,
    })
  } catch (error) {
    console.error("[v0] Subscription creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
