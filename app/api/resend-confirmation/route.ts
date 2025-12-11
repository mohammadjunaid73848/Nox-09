import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    console.log("[v0] Resend confirmation started for email:", email)

    if (!email) {
      console.log("[v0] Email is missing")
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    console.log("[v0] Listed users - error:", listError, "user count:", users?.length)

    const user = users?.find((u) => u.email === email)
    console.log("[v0] Found user:", user?.id, "for email:", email)

    if (!user) {
      console.log("[v0] User not found for email:", email)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const rateCheckRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/check-rate-limit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        actionType: "confirm_email",
      }),
    })

    console.log("[v0] Rate limit check - status:", rateCheckRes.status)

    if (!rateCheckRes.ok) {
      const rateLimitData = await rateCheckRes.json()
      console.log("[v0] Rate limited - data:", rateLimitData)
      return NextResponse.json(
        { error: rateLimitData.reason || "Too many confirmation email requests. Try again later." },
        { status: 429 },
      )
    }

    const rateLimitData = await rateCheckRes.json()
    console.log("[v0] Rate limit OK - attempts:", rateLimitData.attempts, "remaining:", rateLimitData.remaining)

    // Resend confirmation email
    console.log("[v0] Calling Supabase resendEnvelopeConfirmationEmail for:", email)
    const { error } = await supabase.auth.resendEnvelopeConfirmationEmail(email, {
      type: "signup",
    })

    console.log("[v0] Supabase response - error:", error)

    if (error) {
      console.error("[v0] Supabase confirmation error details:", JSON.stringify(error))
      throw error
    }

    console.log("[v0] Email sent successfully, incrementing rate limit")

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/increment-rate-limit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        actionType: "confirm_email",
      }),
    })

    console.log("[v0] Rate limit incremented successfully")
    return NextResponse.json({ success: true, message: "Confirmation email sent" })
  } catch (error) {
    console.error("[v0] Error resending confirmation:", error instanceof Error ? error.message : error)
    console.error("[v0] Full error:", error)
    return NextResponse.json({ error: "Failed to resend confirmation email" }, { status: 500 })
  }
}
