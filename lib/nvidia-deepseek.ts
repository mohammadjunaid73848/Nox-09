import type { ReadableStream } from "stream/web"

const NVIDIA_API_KEY = process.env.NVIDIA_DEEPSEEK_API_KEY
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface NvidiaStreamOptions {
  temperature?: number
  top_p?: number
  max_tokens?: number
  reasoning_effort?: "low" | "medium" | "high"
  chat_template_kwargs?: { thinking?: boolean }
}

export async function createNvidiaDeepSeekStream(
  messages: Message[],
  modelId = "deepseek-ai/deepseek-r1",
  options: NvidiaStreamOptions = {},
) {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA_DEEPSEEK_API_KEY environment variable not set")
  }

  const {
    temperature = 0.7,
    top_p = 0.9,
    max_tokens = 8192,
    reasoning_effort = "medium",
    chat_template_kwargs,
  } = options

  const body: any = {
    model: modelId,
    messages,
    temperature,
    top_p,
    max_tokens,
    stream: true,
  }

  // Add chat_template_kwargs for models that support thinking
  if (chat_template_kwargs?.thinking) {
    body.chat_template_kwargs = { thinking: true }
  }

  // Only add reasoning_effort for DeepSeek R1
  if (modelId.includes("deepseek-r1")) {
    body.reasoning_effort = reasoning_effort
  }

  const response = await fetch(`${NVIDIA_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`NVIDIA API error: ${response.status} - ${error}`)
  }

  return response.body
}

export async function* parseNvidiaStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") continue

          try {
            const parsed = JSON.parse(data)
            yield {
              choices: [
                {
                  delta: {
                    content: parsed.choices[0]?.delta?.content || "",
                    thinking: parsed.choices[0]?.delta?.reasoning_content || "",
                  },
                  finish_reason: parsed.choices[0]?.finish_reason,
                },
              ],
            }
          } catch {
            // Continue on parse error
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
