import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getPaymentHistory } from "@/lib/subscription"

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

    const payments = await getPaymentHistory(user.id)

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("Error fetching payment history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
