import type { NextRequest } from "next/server"
import { createTogetherStream, parseTogetherStream } from "@/lib/together-ai"

export async function POST(req: NextRequest) {
  try {
    const { firstMessage } = await req.json()

    const messages = [
      {
        role: "system" as const,
        content:
          "Generate a short, descriptive title (3-6 words) for a chat conversation based on the first message. Be concise and capture the main topic. Don't use quotes or punctuation.",
      },
      {
        role: "user" as const,
        content: firstMessage,
      },
    ]

    const streamBody = await createTogetherStream(messages, "meta-llama/Llama-3.3-70b-instruct-turbo", {
      temperature: 0.3,
      max_tokens: 20,
    })

    if (!streamBody) {
      return Response.json({ title: "New Chat" })
    }

    const stream = parseTogetherStream(streamBody)
    let title = ""

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ""
      title += content
    }

    return Response.json({ title: title.trim() || "New Chat" })
  } catch (error) {
    console.error("Title generation error:", error)
    return Response.json({ title: "New Chat" })
  }
}
