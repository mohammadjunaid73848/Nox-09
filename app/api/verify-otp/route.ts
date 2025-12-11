import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateCheckRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/check-rate-limit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        actionType: "otp_verify",
      }),
    })

    if (!rateCheckRes.ok) {
      const rateLimitData = await rateCheckRes.json()
      return NextResponse.json(
        { error: rateLimitData.reason || "Too many verification attempts. Try again later." },
        { status: 429 },
      )
    }

    // Find valid OTP code
    const { data: otpData, error: otpError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("user_id", user.id)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpData) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/increment-rate-limit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          actionType: "otp_verify",
        }),
      })

      return NextResponse.json({ error: "Invalid or expired OTP code" }, { status: 400 })
    }

    // Mark OTP as used
    const { error: updateError } = await supabase.from("otp_codes").update({ used: true }).eq("id", otpData.id)

    if (updateError) {
      console.error("[v0] Error updating OTP:", updateError)
      return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
    })
  } catch (error) {
    console.error("[v0] Error verifying OTP:", error)
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
  }
}
