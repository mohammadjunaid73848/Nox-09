import { createCerebrasStream, parseCerebrasStream } from "./cerebras"
import { createTogetherStream, parseTogetherStream } from "./together-ai"
import { searchWebJSON } from "./web-search-json"

type Msg = { role: "system" | "user" | "assistant"; content: string }

export type DeepPassResponse = {
  provider: "together" | "cerebras"
  temperature: number
  content: string
  model: string
}

export type DeepPassStatus = {
  provider: "together" | "cerebras"
  temperature: number
  ok: boolean
  error?: string
}

export async function gatherDeepPasses(params: {
  systemPrompt: string
  messages: Msg[]
  togetherModel: string
  cerebrasModel: string
  includeTogether: boolean
  includeCerebras: boolean
  userQuery: string // Added user query for web search
}): Promise<{
  responses: DeepPassResponse[]
  statuses: DeepPassStatus[]
  summary: string
  searchResults?: any[]
  searchContext?: string
}> {
  const { systemPrompt, messages, togetherModel, cerebrasModel, includeTogether, includeCerebras, userQuery } = params

  let searchResults: any[] = []
  let searchContext = ""

  try {
    const searchResponse = await searchWebJSON(userQuery)
    searchResults = searchResponse.results

    if (searchResults.length > 0) {
      searchContext =
        "\n\n=== LIVE WEB SEARCH RESULTS (Deep Search Enhanced) ===\n" +
        'Query: "' +
        userQuery +
        '"\n\n' +
        searchResults
          .map(
            (result, index) =>
              "[" +
              (index + 1) +
              "] " +
              result.title +
              "\n    " +
              result.snippet +
              "\n    Source: " +
              result.url +
              "\n    Domain: " +
              result.domain,
          )
          .join("\n\n")
    }
  } catch (error) {
    console.error("[v0] Deep search web search failed:", error)
  }

  const enhancedSystemPrompt = systemPrompt + searchContext

  const chatMessages = [{ role: "system", content: enhancedSystemPrompt } as Msg, ...messages]

  const passes: Array<{
    id: string
    provider: "together" | "cerebras"
    temperature: number
    model: string
    run: () => Promise<string>
  }> = []

  const temps = [0.6, 0.9]

  if (includeTogether) {
    for (const t of temps) {
      passes.push({
        id: `together-${t}`,
        provider: "together",
        temperature: t,
        model: togetherModel,
        run: async () => {
          const body = await createTogetherStream(chatMessages as any, togetherModel, {
            temperature: t,
            top_p: t === 0.6 ? 0.9 : 0.95,
            max_tokens: 4096,
          })
          let full = ""
          for await (const chunk of parseTogetherStream(body)) {
            full += chunk.choices?.[0]?.delta?.content || ""
          }
          return full.trim()
        },
      })
    }
  }

  if (includeCerebras) {
    for (const t of temps) {
      passes.push({
        id: `cerebras-${t}`,
        provider: "cerebras",
        temperature: t,
        model: cerebrasModel,
        run: async () => {
          const body = await createCerebrasStream(chatMessages as any, cerebrasModel, {
            temperature: t,
            top_p: t === 0.6 ? 0.9 : 0.95,
            max_tokens: 8192,
          })
          let full = ""
          for await (const chunk of parseCerebrasStream(body)) {
            const content = (chunk as any).choices?.[0]?.delta?.content || ""
            full += content
          }
          return full.trim()
        },
      })
    }
  }

  const startTime = Date.now()
  const settled = await Promise.allSettled(passes.map((p) => p.run()))
  const elapsedTime = Date.now() - startTime
  const minThinkTime = 10000 // 10 seconds minimum

  if (elapsedTime < minThinkTime) {
    await new Promise((resolve) => setTimeout(resolve, minThinkTime - elapsedTime))
  }

  const responses: DeepPassResponse[] = []
  const statuses: DeepPassStatus[] = []

  settled.forEach((res, idx) => {
    const pass = passes[idx]
    if (res.status === "fulfilled") {
      if (res.value) {
        responses.push({
          provider: pass.provider,
          temperature: pass.temperature,
          content: res.value,
          model: pass.model,
        })
      }
      statuses.push({ provider: pass.provider, temperature: pass.temperature, ok: true })
    } else {
      statuses.push({
        provider: pass.provider,
        temperature: pass.temperature,
        ok: false,
        error: res.reason instanceof Error ? res.reason.message : String(res.reason),
      })
    }
  })

  const summary =
    "Deep Think passes — " +
    statuses
      .map((s) => {
        const name = s.provider === "together" ? "Together" : "Cerebras"
        const mark = s.ok ? "✅" : "❌"
        return `${name}(${s.temperature}) ${mark}${s.ok ? "" : ` (${s.error?.slice(0, 60) ?? "error"})`}`
      })
      .join(", ") +
    (searchResults.length > 0 ? ` | Web: ${searchResults.length} results` : "")

  return { responses, statuses, summary, searchResults, searchContext }
}

export function buildSynthesisPrompt(userMessage: string, responses: DeepPassResponse[]) {
  const body = responses
    .map((r, i) => `\n=== Pass ${i + 1} — ${r.provider.toUpperCase()} (temp ${r.temperature}) ===\n` + r.content)
    .join("\n\n")
  return `You are synthesizing responses from ${responses.length} different passes into ONE comprehensive, deep, impeccably organized answer.

User's Question:
${userMessage}

Responses:
${body}

Synthesize a single, long, thorough answer that combines unique insights, removes redundancy, and is extremely well-structured. Provide the final answer now:`
}
