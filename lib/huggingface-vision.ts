export interface HuggingFaceVisionResult {
  label: string
  score: number
}

export async function analyzeImageWithHuggingFace(imageBase64: string): Promise<string> {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY

    if (!apiKey) {
      return "Image analysis is not configured. Please add HUGGINGFACE_API_KEY to your environment variables."
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "")

    const response = await fetch("https://api-inference.huggingface.co/models/google/vit-base-patch16-224", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: base64Data,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`)
    }

    const results = (await response.json()) as HuggingFaceVisionResult[]

    if (!results || results.length === 0) {
      return "I couldn't analyze this image. The vision model didn't return any results."
    }

    const topResult = results[0]
    const secondaryResults = results.slice(1, 4)

    let description = `This image appears to show ${topResult.label}.`

    if (secondaryResults.length > 0) {
      const alternatives = secondaryResults.map((r) => r.label).join(", ")
      description += ` It could also be ${alternatives}.`
    }

    // Add step-by-step analysis
    description += `\n\n**Image Analysis:**\n`
    results.slice(0, 5).forEach((r, i) => {
      description += `${i + 1}. ${r.label}\n`
    })

    return description
  } catch (error) {
    console.error("[v0] Hugging Face Vision error:", error)
    return `I encountered an error analyzing this image: ${error instanceof Error ? error.message : "Unknown error"}`
  }
}
