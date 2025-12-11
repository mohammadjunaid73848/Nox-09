import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getUserSubscription, createFreeSubscription, isPro } from "@/lib/subscription"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let subscription = await getUserSubscription(user.id)

    // Create free subscription if none exists
    if (!subscription) {
      subscription = await createFreeSubscription(user.id)
    }

    return NextResponse.json({
      subscription,
      isPro: isPro(subscription),
    })
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
