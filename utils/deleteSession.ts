import type React from "react"
import { createClient } from "@/lib/supabase/client"

export async function deleteSession(sessionId: string, e?: React.MouseEvent) {
  if (e) {
    e.stopPropagation()
  }

  const supabase = createClient()

  try {
    const { error } = await supabase.from("chat_sessions").delete().eq("id", sessionId)

    if (error) {
      console.error("Error deleting session:", error)
      return false
    }

    // Dispatch event to notify components of deletion
    window.dispatchEvent(
      new CustomEvent("session-deleted", {
        detail: { sessionId },
      }),
    )

    return true
  } catch (error) {
    console.error("Error deleting session:", error)
    return false
  }
}
