import { NextResponse } from "next/server"
import { JSDOM } from "jsdom"
import { Readability } from "@mozilla/readability"
import { Together } from "together-ai"

async function getTextFromURL(url: string): Promise<string> {
  try {
    const res = await fetch(url, { method: "GET" })
    const html = await res.text()
    const dom = new JSDOM(html, { url })
    const doc = dom.window.document
    const parsed = new Readability(doc).parse()
    const text = parsed?.textContent || doc.body?.textContent || ""
    return text.trim()
  } catch (e: any) {
    return `Failed to extract: ${url}. Reason: ${e?.message || e}`
  }
}

export async function POST(req: Request) {
  try {
    const { question } = await req.json()
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing question" }, { status: 400 })
    }

    const googleKey = process.env.GOOGLE_CSE_API_KEY
    const googleCx = process.env.GOOGLE_CSE_CX

    if (!googleKey || !googleCx) {
      return NextResponse.json(
        { error: "Google CSE is not configured. Please set GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX." },
        { status: 500 },
      )
    }

    const params = new URLSearchParams({
      q: question,
      num: "6",
      safe: "active",
      key: googleKey,
      cx: googleCx,
    })
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params.toString()}`)
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: "Google CSE failed", details: text }, { status: 502 })
    }
    const json = await res.json()
    const items = (json.items || []) as Array<any>
    const sources = items.map((i) => ({
      name: i.title,
      url: i.link,
    }))

    const texts = await Promise.all(sources.map((s) => getTextFromURL(s.url)))
    const contexts = texts.join("\n\n---\n\n")

    const systemPrompt = `
Given a user question and context from multiple web pages, write a clean, concise, accurate answer grounded ONLY in the provided context. Cite URLs inline when appropriate.
<contexts>
${contexts}
</contexts>`.trim()

    const together = new Together({
      apiKey: process.env.TOGETHER_API_KEY,
    })

    const runner = await together.chat.completions.stream({
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
    })

    // Stream back to client
    return new Response(runner.toReadableStream(), {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to get answer", details: err?.message || String(err) }, { status: 500 })
  }
}
