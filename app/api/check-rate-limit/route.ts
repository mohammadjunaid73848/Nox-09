import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { userId, actionType } = await request.json()

    if (!userId || !actionType) {
      return NextResponse.json({ error: "Missing userId or actionType" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    let { data: rateLimit, error: fetchError } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("action_type", actionType)
      .single()

    // If no record exists, create one
    if (fetchError?.code === "PGRST116" || !rateLimit) {
      const { data: newRecord, error: insertError } = await supabase
        .from("rate_limits")
        .insert({
          user_id: userId,
          action_type: actionType,
          attempt_count: 0,
          is_blocked: false,
          first_attempt_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error("[v0] Failed to create rate limit record:", insertError)
        return NextResponse.json({ attempts: 0, maxAttempts: 3, remaining: 3, blocked: false, resetTime: null })
      }

      rateLimit = newRecord
    }

    const now = new Date()
    const blockedUntil = rateLimit?.blocked_until ? new Date(rateLimit.blocked_until) : null

    if (blockedUntil && blockedUntil <= now) {
      console.log("[v0] 2-hour lockout expired, resetting rate limit")
      const { data: updatedRecord } = await supabase
        .from("rate_limits")
        .update({
          is_blocked: false,
          blocked_until: null,
          attempt_count: 0,
          first_attempt_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("action_type", actionType)
        .select()
        .single()

      if (updatedRecord) {
        rateLimit = updatedRecord
      }

      // Return 200 status with reset data
      return NextResponse.json({
        attempts: 0,
        maxAttempts: 3,
        remaining: 3,
        blocked: false,
        resetTime: null,
      })
    }

    // Check if currently blocked within lockout period
    if (rateLimit?.is_blocked && blockedUntil && blockedUntil > now) {
      console.log("[v0] User is currently blocked, lockout expires at:", blockedUntil)
      const minutesLeft = Math.ceil((blockedUntil.getTime() - now.getTime()) / (1000 * 60))
      return NextResponse.json(
        {
          attempts: rateLimit.attempt_count,
          maxAttempts: 3,
          remaining: 0,
          blocked: true,
          resetTime: blockedUntil.toISOString(),
          reason: `Too many attempts. Try again in ${minutesLeft} minutes.`,
        },
        { status: 429 },
      )
    }

    if (rateLimit?.attempt_count >= 3) {
      console.log("[v0] Attempt limit reached, blocking user")
      const newBlockedUntil = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours
      await supabase
        .from("rate_limits")
        .update({
          is_blocked: true,
          blocked_until: newBlockedUntil.toISOString(),
        })
        .eq("user_id", userId)
        .eq("action_type", actionType)

      return NextResponse.json(
        {
          attempts: rateLimit.attempt_count,
          maxAttempts: 3,
          remaining: 0,
          blocked: true,
          resetTime: newBlockedUntil.toISOString(),
          reason: `Too many attempts. Try again in 120 minutes.`,
        },
        { status: 429 },
      )
    }

    // User is not blocked
    return NextResponse.json({
      attempts: rateLimit?.attempt_count || 0,
      maxAttempts: 3,
      remaining: Math.max(0, 3 - (rateLimit?.attempt_count || 0)),
      blocked: false,
      resetTime: null,
    })
  } catch (error) {
    console.error("[v0] Rate limit check error:", error)
    return NextResponse.json({ attempts: 0, maxAttempts: 3, remaining: 3, blocked: false, resetTime: null })
  }
}
