import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, text, url, file } = body

    let message = ""
    if (title) message += `${title}\n\n`
    if (text) message += text
    if (url) message += `${text ? "\n\n" : ""}${url}`

    // Validate that we have some content
    if (!message.trim() && !file) {
      return NextResponse.json({ error: "No content to share" }, { status: 400 })
    }

    const { data: shareRecord, error: insertError } = await supabase
      .from("shared_content")
      .insert({
        user_id: user.id,
        content: message.trim(),
        file_data: file || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Share insert error:", insertError)
      return NextResponse.json({ error: "Failed to save shared content" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: message.trim(),
      shareId: shareRecord?.id,
    })
  } catch (error) {
    console.error("[v0] Share handler error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
