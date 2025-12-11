export const DEFAULT_CEREBRAS_MODEL = "qwen-3-235b-a22b-instruct-2507"

export const SAFE_CEREBRAS_MODELS = [
  "qwen-3-235b-a22b-instruct-2507",
  "qwen-3-32b",
  "gpt-oss-120b",
  "llama-4-scout-17b-16e-instruct",
  "qwen-3-coder-480b",
]

export async function createCerebrasStream(
  messages: Array<{ role: string; content: string }>,
  model = DEFAULT_CEREBRAS_MODEL,
  options: {
    temperature?: number
    top_p?: number
    max_tokens?: number
    max_completion_tokens?: number
    reasoning_effort?: "low" | "medium" | "high"
  } = {},
) {
  const apiKey = process.env.CEREBRAS_API_KEY

  if (!apiKey) {
    throw new Error("CEREBRAS_API_KEY environment variable is not set")
  }

  const bodyPayload: Record<string, any> = {
    model,
    messages,
    stream: true,
    temperature: model === "qwen-3-coder-480b" ? 0.7 : (options.temperature ?? 0.7),
    top_p: model === "qwen-3-coder-480b" ? 0.8 : (options.top_p ?? 0.9),
    max_completion_tokens:
      model === "qwen-3-coder-480b" ? 40000 : (options.max_completion_tokens ?? options.max_tokens ?? 8192),
  }

  if (options.reasoning_effort && /-thinking-/i.test(model)) {
    bodyPayload.reasoning_effort = options.reasoning_effort
  }

  const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(bodyPayload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Cerebras API error: ${response.status} ${errorText}`)
  }

  return response.body
}

export async function* parseCerebrasStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  const decoder = new TextDecoder("utf-8")
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === "data: [DONE]") continue
        if (trimmed.startsWith("data: ")) {
          try {
            const jsonStr = trimmed.slice(6).trim()
            if (!jsonStr) continue
            const json = JSON.parse(jsonStr)
            yield json
          } catch (e) {
            console.error("[v0] Failed to parse Cerebras chunk, skipping malformed JSON:", trimmed.slice(6))
            continue
          }
        }
      }
    }

    const finalChunk = decoder.decode()
    if (finalChunk.trim()) {
      buffer += finalChunk
      const lines = buffer.split("\n")

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === "data: [DONE]") continue
        if (trimmed.startsWith("data: ")) {
          try {
            const jsonStr = trimmed.slice(6).trim()
            if (!jsonStr) continue
            const json = JSON.parse(jsonStr)
            yield json
          } catch (e) {
            // silently skip final corrupted chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
