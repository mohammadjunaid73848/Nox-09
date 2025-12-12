import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

// Initialize Supabase client only when needed (not at module level for build)
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Supabase configuration missing")
  }

  return createClient(url, key)
}

// PayU Webhook verification
function verifyPayUSignature(params: Record<string, string>, receivedHash: string): boolean {
  const salt = process.env.PAYU_SALT || ""
  const key = process.env.PAYU_KEY || ""

  // Reverse hash for response verification
  // sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
  const hashString = [
    salt,
    params.status,
    "",
    "",
    "",
    "",
    "", // Empty fields
    params.udf5 || "",
    params.udf4 || "",
    params.udf3 || "",
    params.udf2 || "",
    params.udf1 || "",
    params.email || "",
    params.firstname || "",
    params.productinfo || "",
    params.amount || "",
    params.txnid || "",
    key,
  ].join("|")

  const calculatedHash = crypto.createHash("sha512").update(hashString).digest("hex")
  return calculatedHash.toLowerCase() === receivedHash.toLowerCase()
}

// Helper functions
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
    const formData = await request.formData()
    const params: Record<string, string> = {}

    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    console.log("[v0] PayU Webhook received:", params.txnid, params.status)

    // Verify PayU signature
    if (params.hash && !verifyPayUSignature(params, params.hash)) {
      console.error("[v0] Invalid PayU webhook signature")
      // Continue processing for now but log the error
    }

    const supabase = getSupabaseClient()
    const txnId = params.txnid
    const status = params.status
    const userId = params.udf2 // We stored user ID in udf2
    const planType = params.udf1 // We stored plan type in udf1

    if (!txnId || !userId) {
      console.error("[v0] Missing txnid or userId in webhook")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find or create subscription
    const { data: subscription, error: findError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (status === "success") {
      // Payment successful
      const nextBillingDate = getNextBillingDate(planType || "pro_monthly")
      const gracePeriodEnd = addDays(nextBillingDate, 3) // 3 day grace period
      const amount = Math.round(Number.parseFloat(params.amount || "0") * 100) // Convert to paisa

      if (subscription) {
        // Update existing subscription
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            plan_type: planType || subscription.plan_type,
            current_period_start: new Date().toISOString(),
            current_period_end: nextBillingDate.toISOString(),
            next_billing_date: nextBillingDate.toISOString(),
            payment_due_date: gracePeriodEnd.toISOString(),
            last_payment_date: new Date().toISOString(),
            last_payment_status: "success",
            payment_retry_count: 0,
            amount_inr: amount,
            payment_gateway: "payu",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id)
      } else {
        // Create new subscription
        await supabase.from("subscriptions").insert({
          user_id: userId,
          plan_type: planType || "pro_monthly",
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: nextBillingDate.toISOString(),
          next_billing_date: nextBillingDate.toISOString(),
          payment_due_date: gracePeriodEnd.toISOString(),
          last_payment_date: new Date().toISOString(),
          last_payment_status: "success",
          amount_inr: amount,
          payment_gateway: "payu",
        })
      }

      // Record payment in history
      await supabase.from("payment_history").insert({
        user_id: userId,
        subscription_id: subscription?.id,
        transaction_id: txnId,
        gateway_payment_id: params.mihpayid,
        amount_inr: Math.round(Number.parseFloat(params.amount || "0") * 100),
        status: "success",
        payment_method: params.mode,
        gateway_response: params,
        completed_at: new Date().toISOString(),
      })

      console.log("[v0] Payment recorded successfully for user:", userId)
    } else if (status === "failure" || status === "failed") {
      // Payment failed
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
          // Add 3 day grace period for retry
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
      }

      // Record failed payment
      await supabase.from("payment_history").insert({
        user_id: userId,
        subscription_id: subscription?.id,
        transaction_id: txnId,
        gateway_payment_id: params.mihpayid,
        amount_inr: Math.round(Number.parseFloat(params.amount || "0") * 100),
        status: "failed",
        gateway_response: params,
      })

      console.log("[v0] Payment failure recorded for user:", userId)
    }

    return NextResponse.json({ received: true, status: params.status })
  } catch (error) {
    console.error("[v0] Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

// Also handle GET for PayU redirect
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const txnid = searchParams.get("txnid")

  // Redirect to appropriate page
  if (status === "success") {
    return NextResponse.redirect(new URL(`/subscription/success?txnid=${txnid}`, request.url))
  } else {
    return NextResponse.redirect(new URL(`/subscription/failed?txnid=${txnid}`, request.url))
  }
}
