import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: rateLimitData } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("user_id", user.id)
      .eq("action", "2fa_otp")
      .single()

    if (!rateLimitData) {
      return NextResponse.json({
        attempts: 0,
        maxAttempts: 3,
        remaining: 3,
        blocked: false,
        resetTime: null,
      })
    }

    const now = new Date()
    const resetTime = new Date(rateLimitData.reset_at)
    const isBlocked = rateLimitData.attempts >= 3 && now < resetTime

    return NextResponse.json({
      attempts: rateLimitData.attempts,
      maxAttempts: 3,
      remaining: Math.max(0, 3 - rateLimitData.attempts),
      blocked: isBlocked,
      resetTime: resetTime.toISOString(),
    })
  } catch (error) {
    console.error("[v0] Rate limit check error:", error)
    return NextResponse.json({ error: "Failed to check rate limit" }, { status: 500 })
  }
}
