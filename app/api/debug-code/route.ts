import type { NextRequest } from "next/server"
import { createCerebrasStream, parseCerebrasStream, DEFAULT_CEREBRAS_MODEL } from "@/lib/cerebras"

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json()
    if (typeof code !== "string" || code.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Invalid code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const messages = [
      {
        role: "system",
        content:
          "You are an expert code debugger and fixer. Analyze the user's code, identify issues, and provide a corrected version.\n" +
          "Respond STRICTLY as compact JSON with keys: summary (string), correctedCode (string). Do not include backticks.",
      },
      {
        role: "user",
        content:
          `Language: ${language || "unknown"}\n` +
          "Please analyze and correct this code. Keep the original intent and structure when possible. If you change anything, explain why in the summary.\n\n" +
          code,
      },
    ]

    const streamBody = await createCerebrasStream(messages, DEFAULT_CEREBRAS_MODEL, {
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 4096,
    })

    if (!streamBody) {
      throw new Error("No stream returned from Cerebras")
    }

    let full = ""
    for await (const chunk of parseCerebrasStream(streamBody)) {
      const content = chunk?.choices?.[0]?.delta?.content || ""
      full += content
    }

    // Try strict JSON first
    let summary = ""
    let correctedCode = ""
    try {
      const parsed = JSON.parse(full)
      summary = String(parsed.summary || "")
      correctedCode = String(parsed.correctedCode || "")
    } catch {
      // Fallback: attempt to extract fenced code and a brief summary
      const codeMatch = full.match(/```[\s\S]*?\n([\s\S]*?)```/m)
      correctedCode = codeMatch ? codeMatch[1] : ""
      summary = full
        .replace(/```[\s\S]*?```/g, "")
        .trim()
        .slice(0, 2000)
    }

    return new Response(JSON.stringify({ summary, correctedCode }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: "Failed to debug code", details: error?.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
