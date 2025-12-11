import { createClient } from "@/lib/supabase/client"

export async function handleLogout() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)
      return false
    }

    // Clear any local storage
    localStorage.removeItem("hasSeenTermsNotice")

    if (user) {
      localStorage.removeItem(`2fa_verified_${user.id}`)
    }

    // Redirect to home
    window.location.href = "/"

    return true
  } catch (error) {
    console.error("Error during logout:", error)
    return false
  }
}
