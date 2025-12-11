import { NextResponse } from "next/server"

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
    const mapped = items.map((i) => ({
      name: i.title,
      url: i.link,
    }))
    return NextResponse.json(mapped)
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to get sources", details: err?.message || String(err) }, { status: 500 })
  }
}
