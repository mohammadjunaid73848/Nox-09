import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

export async function setupDailyEmails() {
  try {
    // This would typically be set up as a cron job
    // For now, we'll create a function that can be called by a scheduler

    const { data: users, error } = await supabase
      .from("auth.users")
      .select("id, email, raw_user_meta_data")
      .eq("email_confirmed_at", "not.is.null")

    if (error) {
      console.error("Error fetching users:", error)
      return
    }

    for (const user of users || []) {
      const name = user.raw_user_meta_data?.name || "Friend"

      // Send daily email
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://noxyai.com"}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: user.email,
          type: "daily",
          name,
        }),
      })

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    console.log("Daily emails sent successfully")
  } catch (error) {
    console.error("Error setting up daily emails:", error)
  }
}
