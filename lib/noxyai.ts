// NoxyAI integration - supernoxy.v1 model with web search capabilities
export interface NoxyAIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface NoxyAIStreamChunk {
  choices: Array<{
    delta: {
      content?: string
    }
    finish_reason?: string | null
  }>
}

export interface NoxyAIResponse {
  model: string
  id: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  sources?: string[]
  summary?: boolean
}

export async function createNoxyAIStream(
  messages: NoxyAIMessage[],
  model = "supernoxy.v1",
  options: {
    temperature?: number
    top_p?: number
    max_tokens?: number
  } = {},
) {
  const apiKey = process.env.NOXYAI_API_KEY

  if (!apiKey) {
    throw new Error("NOXYAI_API_KEY environment variable is not set")
  }

  const response = await fetch("https://dev.noxyai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages,
      model,
      stream: true,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? 0.8,
      max_tokens: options.max_tokens ?? 4096,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`NoxyAI API error: ${response.status} - ${errorText}`)
  }

  return response.body
}

export async function* parseNoxyAIStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  const decoder = new TextDecoder("utf-8")
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

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
            yield json as NoxyAIStreamChunk
          } catch (e) {
            console.error("[v0] Failed to parse NoxyAI chunk, skipping:", trimmed.slice(6))
            continue
          }
        }
      }
    }

    const finalChunk = decoder.decode()
    if (finalChunk.trim()) {
      buffer += finalChunk
      const finalLines = buffer.split("\n")

      for (const line of finalLines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === "data: [DONE]") continue
        if (trimmed.startsWith("data: ")) {
          try {
            const jsonStr = trimmed.slice(6).trim()
            if (!jsonStr) continue
            const json = JSON.parse(jsonStr)
            yield json as NoxyAIStreamChunk
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

export async function createNoxyAICompletion(
  messages: NoxyAIMessage[],
  model = "supernoxy.v1",
  options: {
    temperature?: number
    top_p?: number
    max_tokens?: number
  } = {},
): Promise<NoxyAIResponse> {
  const apiKey = process.env.NOXYAI_API_KEY

  if (!apiKey) {
    throw new Error("NOXYAI_API_KEY environment variable is not set")
  }

  const response = await fetch("https://dev.noxyai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages,
      model,
      stream: false,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? 0.8,
      max_tokens: options.max_tokens ?? 4096,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`NoxyAI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data as NoxyAIResponse
}
