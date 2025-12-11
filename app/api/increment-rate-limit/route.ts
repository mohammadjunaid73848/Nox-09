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

    const { data: existing } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("action_type", actionType)
      .single()

    if (existing) {
      await supabase
        .from("rate_limits")
        .update({
          attempt_count: existing.attempt_count + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("action_type", actionType)
    } else {
      await supabase.from("rate_limits").insert({
        user_id: userId,
        action_type: actionType,
        attempt_count: 1,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Increment rate limit error:", error)
    return NextResponse.json({ error: "Failed to update rate limit" }, { status: 500 })
  }
}
