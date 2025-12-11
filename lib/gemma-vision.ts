import { getImageHash, getCachedImageAnalysis, cacheImageAnalysis } from "./image-cache"

export interface GemmaVisionResult {
  analysis: string
  confidence: number
}

export async function analyzeImageWithGemma(imageBase64: string, userQuestion?: string): Promise<string> {
  try {
    const imageHash = await getImageHash(imageBase64)
    const cachedAnalysis = await getCachedImageAnalysis(imageHash)

    if (cachedAnalysis) {
      console.log("[v0] Using cached image analysis")
      return cachedAnalysis
    }

    const apiKey = process.env.TOGETHER_API_KEY

    if (!apiKey) {
      return "Image analysis is not configured. Please add TOGETHER_API_KEY to your environment variables."
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "")

    const systemPrompt =
      "You are an image analysis AI. Provide a brief, accurate description of the image in 2-3 sentences. Focus on the key elements, main subject, and any important details that would help answer questions about the image. Be concise and factual."

    const userPrompt = userQuestion
      ? `The user asked: "${userQuestion}"\n\nDescribe this image briefly, focusing on details relevant to answering their question.`
      : "Describe this image briefly in 2-3 sentences."

    // Use Google Gemma 3n-E4B-it model for vision analysis
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemma-3n-E4B-it",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemma Vision API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()

    if (!result.choices || result.choices.length === 0) {
      return "I couldn't analyze this image. The vision model didn't return any results."
    }

    const analysis = result.choices[0].message.content

    if (!analysis || analysis.trim().length === 0) {
      return "I couldn't generate a meaningful analysis of this image."
    }

    await cacheImageAnalysis(imageHash, analysis)

    return analysis
  } catch (error) {
    console.error("[v0] Gemma Vision error:", error)
    return `I encountered an error analyzing this image: ${error instanceof Error ? error.message : "Unknown error"}`
  }
}
