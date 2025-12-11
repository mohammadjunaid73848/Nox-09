import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Diverse prompts for auto-generation
const AUTO_PROMPTS = [
  "A serene mountain landscape at sunset with golden light",
  "A futuristic cyberpunk city with neon lights at night",
  "A magical forest with glowing mushrooms and fireflies",
  "An astronaut floating in space with Earth in background",
  "A cozy coffee shop interior with warm lighting",
  "A majestic lion portrait with detailed fur",
  "A beautiful underwater coral reef scene",
  "A vintage car on an empty desert highway",
  "A steampunk airship flying through clouds",
  "A peaceful zen garden with cherry blossoms",
  "A dramatic ocean wave crashing on rocks",
  "A mystical dragon flying over mountains",
  "A colorful hot air balloon festival",
  "A medieval castle on a hilltop at dawn",
  "A tropical beach paradise with palm trees",
  "A snowy cabin in the woods at night",
  "A vibrant street market in Morocco",
  "A majestic eagle soaring through the sky",
  "A fantasy treehouse village in giant trees",
  "A northern lights display over snowy landscape",
  "A vintage library with tall bookshelves",
  "A samurai warrior in traditional armor",
  "A field of lavender flowers at golden hour",
  "A futuristic robot in a high-tech lab",
  "A peaceful lakeside cabin reflection",
  "A colorful parrot in tropical rainforest",
  "A gothic cathedral interior with stained glass",
  "A desert oasis with palm trees and water",
  "A vintage train station with steam locomotive",
  "A mystical unicorn in an enchanted forest",
  "A bustling Tokyo street at night with neon signs",
  "A peaceful countryside farm at sunrise",
  "A dramatic lightning storm over city skyline",
  "A beautiful peacock displaying its feathers",
  "A cozy reading nook by a rainy window",
  "A majestic waterfall in lush jungle",
  "A vintage bicycle leaning against old wall",
  "A colorful butterfly on a flower",
  "A mysterious fog-covered forest path",
  "A beautiful sunset over ocean pier",
  "A cute red panda in bamboo forest",
  "A grand piano in elegant concert hall",
  "A vibrant autumn forest with colorful leaves",
  "A futuristic space station orbiting planet",
  "A peaceful meditation garden with koi pond",
  "A dramatic mountain peak with clouds",
  "A vintage record player with vinyl collection",
  "A beautiful hummingbird feeding on flowers",
  "A mystical portal in ancient ruins",
  "A cozy fireplace in rustic cabin",
  "A majestic white tiger in snow",
  "A colorful carnival at night with lights",
  "A peaceful countryside windmill at sunset",
  "A futuristic motorcycle on neon street",
  "A beautiful rose garden in full bloom",
  "A dramatic cliff overlooking the ocean",
  "A vintage typewriter on wooden desk",
  "A magical fairy in moonlit garden",
  "A bustling fish market in Japan",
  "A peaceful bamboo forest path",
  "A majestic phoenix rising from flames",
  "A colorful graffiti wall art in urban setting",
  "A vintage camera collection on shelf",
  "A beautiful sunset through tree silhouettes",
  "A futuristic holographic display interface",
  "A peaceful monastery in the mountains",
  "A dramatic tornado in open plains",
  "A cute fox in autumn forest",
  "A vintage jukebox in retro diner",
  "A mystical crystal cave with glowing gems",
  "A beautiful lighthouse on rocky coast",
  "A colorful macaw in tropical setting",
  "A peaceful yoga pose at sunrise",
  "A majestic elk in misty forest",
  "A vintage compass on old map",
  "A futuristic flying car in city",
  "A beautiful cherry blossom tree in spring",
  "A dramatic volcanic eruption at night",
  "A cute penguin on ice",
  "A vintage telescope pointing at stars",
  "A mystical mermaid underwater scene",
  "A peaceful countryside church at dawn",
  "A majestic snow leopard on mountain",
  "A colorful kite festival in the sky",
  "A vintage pocket watch on chain",
  "A futuristic cityscape with flying vehicles",
  "A beautiful iris flower close-up",
  "A dramatic sandstorm in desert",
  "A cute koala in eucalyptus tree",
  "A vintage globe on antique desk",
  "A mystical wizard casting spell",
  "A peaceful rice terrace landscape",
  "A majestic polar bear on ice",
  "A colorful fireworks display over city",
  "A vintage lantern in dark forest",
  "A futuristic space helmet close-up",
  "A beautiful orchid flower arrangement",
  "A dramatic avalanche on mountain",
  "A cute otter floating in water",
  "A vintage hourglass with sand flowing",
]

const ASPECT_RATIOS = ["square", "16:9", "9:16"] as const

function enhancePrompt(userPrompt: string): string {
  const qualityTerms = ["high quality", "detailed", "professional", "8k", "hd", "masterpiece"]
  const hasQuality = qualityTerms.some((term) => userPrompt.toLowerCase().includes(term))

  let enhanced = userPrompt.trim()

  if (!hasQuality) {
    enhanced = `${enhanced}, highly detailed, professional quality, sharp focus, vibrant colors`
  }

  if (userPrompt.split(" ").length < 5) {
    enhanced = `${enhanced}, beautiful composition, cinematic lighting`
  }

  return enhanced
}

async function generateSingleImage(
  prompt: string,
  aspectRatio: (typeof ASPECT_RATIOS)[number],
  supabase: ReturnType<typeof createClient>,
) {
  const enhancedPrompt = enhancePrompt(prompt)

  const dimensions: Record<string, { width: number; height: number }> = {
    square: { width: 1024, height: 1024 },
    "16:9": { width: 1344, height: 768 },
    "9:16": { width: 768, height: 1344 },
  }

  const { width, height } = dimensions[aspectRatio]

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
    throw new Error(`Together AI error: ${response.status}`)
  }

  const data = await response.json()
  const imageUrl = data.data?.[0]?.url

  if (!imageUrl) {
    throw new Error("No image URL in response")
  }

  await supabase.from("generated_images").insert({
    prompt,
    image_url: imageUrl,
    aspect_ratio: aspectRatio,
  })

  return imageUrl
}

export async function GET(req: NextRequest) {
  try {
    // const authHeader = req.headers.get("authorization")
    // if (authHeader !== `Bearer ${CRON_SECRET}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    if (!TOGETHER_API_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Missing API keys" }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check current image count
    const { count, error: countError } = await supabase
      .from("generated_images")
      .select("*", { count: "exact", head: true })

    if (countError) {
      throw new Error(`Count error: ${countError.message}`)
    }

    // If not exactly 100 images, delete all and regenerate
    if (count !== 100) {
      console.log(`[v0] Current count: ${count}. Regenerating all images...`)

      // Delete all existing images
      const { error: deleteError } = await supabase
        .from("generated_images")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000")

      if (deleteError) {
        throw new Error(`Delete error: ${deleteError.message}`)
      }

      // Generate 100 new images one by one
      const results = []
      for (let i = 0; i < 100; i++) {
        try {
          const prompt = AUTO_PROMPTS[i % AUTO_PROMPTS.length]
          const aspectRatio = ASPECT_RATIOS[i % ASPECT_RATIOS.length]

          const imageUrl = await generateSingleImage(prompt, aspectRatio, supabase)
          results.push({ success: true, index: i + 1, imageUrl })

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`[v0] Failed to generate image ${i + 1}:`, error)
          results.push({ success: false, index: i + 1, error: String(error) })
        }
      }

      const successCount = results.filter((r) => r.success).length
      return NextResponse.json({
        message: `Regenerated ${successCount}/100 images`,
        results,
      })
    }

    return NextResponse.json({
      message: "Image count is correct (100). No action needed.",
      count,
    })
  } catch (error) {
    console.error("[v0] Auto-generate error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
