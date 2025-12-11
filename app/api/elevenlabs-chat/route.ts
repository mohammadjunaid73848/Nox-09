import { type NextRequest, NextResponse } from "next/server"

const AGENT_ID = "agent_4401k9q421w5fad81mfg4dvwvnbb"
const API_KEY = process.env.NOXYAI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { message, agentId } = await request.json()

    if (!API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const response = await fetch("https://dev.noxyai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }],
        model: "supernoxy.v1",
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: data.choices?.[0]?.message?.content || "No response",
    })
  } catch (error) {
    console.error("Error in elevenlabs-chat:", error)
    return NextResponse.json({ error: "Failed to process voice message" }, { status: 500 })
  }
}
