// Together AI client for free Llama models with web search and vision support
export interface TogetherMessage {
  role: "system" | "user" | "assistant"
  content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>
}

export interface TogetherStreamChunk {
  choices: Array<{
    delta: {
      content?: string
    }
    finish_reason?: string | null
  }>
}

export async function createTogetherStream(
  messages: TogetherMessage[],
  model = "meta-llama/Llama-3.3-70b-instruct-turbo",
  options: {
    temperature?: number
    top_p?: number
    max_tokens?: number
  } = {},
) {
  const apiKey = process.env.TOGETHER_API_KEY

  if (!apiKey) {
    throw new Error("TOGETHER_API_KEY environment variable is not set")
  }

  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? 0.8,
      max_tokens: options.max_tokens ?? 4096,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Together AI API error: ${response.status} - ${errorText}`)
  }

  return response.body
}

export async function createTogetherVisionStream(
  messages: Array<{
    role: "system" | "user" | "assistant"
    content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>
  }>,
  model = "google/gemma-3n-E4B-it", // Updated default vision model to google/gemma-3n-E4B-it (free model)
  options: {
    temperature?: number
    top_p?: number
    max_tokens?: number
  } = {},
) {
  const apiKey = process.env.TOGETHER_API_KEY

  if (!apiKey) {
    throw new Error("TOGETHER_API_KEY environment variable is not set")
  }

  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? 0.9,
      max_tokens: options.max_tokens ?? 4096,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Together AI Vision API error: ${response.status} - ${errorText}`)
  }

  return response.body
}

export async function* parseTogetherStream(stream: ReadableStream<Uint8Array>) {
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
      // Keep the last incomplete line in buffer
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === "data: [DONE]") continue

        if (trimmed.startsWith("data: ")) {
          try {
            const jsonStr = trimmed.slice(6).trim()
            if (!jsonStr) continue
            const json = JSON.parse(jsonStr)
            yield json as TogetherStreamChunk
          } catch (e) {
            console.error("[v0] Failed to parse Together AI chunk, skipping:", trimmed.slice(6))
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
            yield json as TogetherStreamChunk
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

export async function blobUrlToBase64(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
