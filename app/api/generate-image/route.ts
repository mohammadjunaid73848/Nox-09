import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function moderateContentWithAI(prompt: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!CEREBRAS_API_KEY) {
    console.error("[v0] Cerebras API key not configured, skipping AI moderation")
    return { allowed: true }
  }

  try {
    console.log("[v0] Using Cerebras AI to moderate prompt:", prompt)

    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3.1-8b",
        messages: [
          {
            role: "system",
            content: `You are a content moderation AI. Analyze the following image generation prompt and determine if it contains:
- Violence, gore, or harmful content
- Sexual, nude, or explicit content
- Hate speech, discrimination, or offensive content
- Illegal activities or dangerous content

Respond with ONLY "ALLOWED" if the prompt is safe and appropriate, or "REJECTED: [brief reason]" if it violates content policies.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 50,
      }),
    })

    if (!response.ok) {
      console.error("[v0] Cerebras API error:", await response.text())
      // If AI moderation fails, allow the prompt (fail open)
      return { allowed: true }
    }

    const data = await response.json()
    const result = data.choices?.[0]?.message?.content?.trim() || ""

    console.log("[v0] Cerebras moderation result:", result)

    if (result.startsWith("REJECTED")) {
      const reason = result.replace("REJECTED:", "").trim()
      return {
        allowed: false,
        reason: reason || "Your prompt contains inappropriate content. Please try a different prompt.",
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error("[v0] AI moderation error:", error)
    // If AI moderation fails, allow the prompt (fail open)
    return { allowed: true }
  }
}

// Enhance user prompts for better image generation
function enhancePrompt(userPrompt: string): string {
  // Add quality enhancers if not already present
  const qualityTerms = ["high quality", "detailed", "professional", "8k", "hd", "masterpiece"]
  const hasQuality = qualityTerms.some((term) => userPrompt.toLowerCase().includes(term))

  let enhanced = userPrompt.trim()

  // Add quality descriptors if missing
  if (!hasQuality) {
    enhanced = `${enhanced}, highly detailed, professional quality, sharp focus, vibrant colors`
  }

  // Add artistic style hints if prompt is very short
  if (userPrompt.split(" ").length < 5) {
    enhanced = `${enhanced}, beautiful composition, cinematic lighting`
  }

  return enhanced
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, aspectRatio = "square" } = await req.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("[v0] Moderating content with Cerebras AI for prompt:", prompt)
    const moderation = await moderateContentWithAI(prompt)

    if (!moderation.allowed) {
      console.log("[v0] Content rejected by AI:", moderation.reason)
      return NextResponse.json({ error: moderation.reason }, { status: 400 })
    }

    if (!TOGETHER_API_KEY) {
      return NextResponse.json({ error: "Together AI API key not configured" }, { status: 500 })
    }

    // Enhance the prompt for better results
    const enhancedPrompt = enhancePrompt(prompt)
    console.log("[v0] Enhanced prompt:", enhancedPrompt)

    // Map aspect ratios to dimensions
    const dimensions: Record<string, { width: number; height: number }> = {
      square: { width: 1024, height: 1024 },
      "16:9": { width: 1344, height: 768 },
      "9:16": { width: 768, height: 1344 },
    }

    const { width, height } = dimensions[aspectRatio] || dimensions.square

    // Generate image using Together AI
    const response = await fetch("https://api.together.xyz/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "black-forest-labs/FLUX.1-schnell-Free",
        prompt: enhancedPrompt,
        width,
        height,
        steps: 4,
        n: 1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Together AI error:", errorText)
      return NextResponse.json({ error: "Failed to generate image" }, { status: response.status })
    }

    const data = await response.json()
    const imageUrl = data.data?.[0]?.url

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL in response" }, { status: 500 })
    }

    // Store in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const { data: insertedData, error: dbError } = await supabase
      .from("generated_images")
      .insert({
        prompt: prompt, // Store original prompt, not enhanced
        image_url: imageUrl,
        aspect_ratio: aspectRatio,
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      // Still return the image even if DB insert fails
      return NextResponse.json({
        imageUrl,
        prompt,
        aspectRatio,
        warning: "Image generated but not saved to gallery",
      })
    }

    return NextResponse.json({
      id: insertedData.id,
      imageUrl,
      prompt,
      aspectRatio,
      createdAt: insertedData.created_at,
    })
  } catch (error) {
    console.error("[v0] Image generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
