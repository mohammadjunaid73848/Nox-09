import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createSubscription as createPayUSubscription, PLAN_PRICING as PAYU_PRICING } from "@/lib/payu"
import { createSubscription as createPayPalSubscription, PLAN_PRICING_USD as PAYPAL_PRICING } from "@/lib/paypal"
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

    let planType: string
    let paymentMethod = "payu" // Default to PayU
    try {
      const body = await request.json()
      planType = body.planType
      paymentMethod = body.paymentMethod || "payu" // Support PayPal payment method
    } catch (parseError) {
      console.error("[v0] Invalid JSON in request body:", parseError)
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    if (!planType || !["pro_monthly", "pro_yearly"].includes(planType)) {
      console.error("[v0] Invalid plan type received:", planType)
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 })
    }

    if (!["payu", "paypal"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
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

    let result: any
    let plan: any
    let amount: number

    if (paymentMethod === "paypal") {
      // Create PayPal subscription
      result = await createPayPalSubscription({
        customerId: user.id,
        customerEmail: user.email || "",
        customerName: user.user_metadata?.name,
        planType: planType as "pro_monthly" | "pro_yearly",
        returnUrl: `${baseUrl}/subscription`,
      })

      plan = PAYPAL_PRICING[planType as keyof typeof PAYPAL_PRICING]
      amount = plan.amountInr // Store INR equivalent
    } else {
      // Create PayU subscription (existing logic)
      result = await createPayUSubscription({
        customerId: user.id,
        customerEmail: user.email || "",
        customerPhone: user.phone,
        planType: planType as "pro_monthly" | "pro_yearly",
        returnUrl: `${baseUrl}/subscription?status=success`,
      })

      plan = PAYU_PRICING[planType as keyof typeof PAYU_PRICING]
      amount = plan.amount
    }

    if (!result.success) {
      console.error("[v0] Subscription creation failed:", result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const nextBillingDate = getNextBillingDate(planType as any)

    // Create or update subscription record
    const { error: subError } = await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan_type: planType,
        status: "pending",
        payment_gateway: paymentMethod, // Store payment gateway
        subscription_id: result.subscriptionId || null, // Store PayPal subscription ID
        amount_inr: amount,
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

    if (paymentMethod === "paypal") {
      return NextResponse.json({
        success: true,
        paymentMethod: "paypal",
        approvalUrl: result.approvalUrl,
        subscriptionId: result.subscriptionId,
      })
    } else {
      return NextResponse.json({
        success: true,
        paymentMethod: "payu",
        paymentUrl: result.paymentUrl,
        formData: result.formData,
      })
    }
  } catch (error) {
    console.error("[v0] Subscription creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
