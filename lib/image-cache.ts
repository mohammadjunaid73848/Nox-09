import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function getImageHash(base64Data: string): Promise<string> {
  // Remove data URL prefix if present
  const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "")
  // Create SHA-256 hash of the image data
  return crypto.createHash("sha256").update(cleanBase64).digest("hex")
}

export async function getCachedImageAnalysis(imageHash: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("image_analyses")
      .select("analysis_text")
      .eq("image_hash", imageHash)
      .single()

    if (error || !data) {
      return null
    }

    return data.analysis_text
  } catch (error) {
    console.error("[v0] Error fetching cached image analysis:", error)
    return null
  }
}

export async function cacheImageAnalysis(imageHash: string, analysisText: string): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from("image_analyses").upsert(
      {
        image_hash: imageHash,
        analysis_text: analysisText,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "image_hash",
      },
    )
  } catch (error) {
    console.error("[v0] Error caching image analysis:", error)
  }
}
