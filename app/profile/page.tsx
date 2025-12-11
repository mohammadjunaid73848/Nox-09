"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2, AlertTriangle, Shield } from "lucide-react"
import { Toast } from "@/components/ui/toast"
import Link from "next/link"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [allowDataTraining, setAllowDataTraining] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        return
      }

      setUser(authUser)

      // Fetch user preferences
      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("allow_data_training")
        .eq("user_id", authUser.id)
        .maybeSingle()

      if (preferences) {
        setAllowDataTraining(preferences.allow_data_training ?? true)
      }

      const { data: twoFactorSettings } = await supabase
        .from("user_2fa_settings")
        .select("enabled")
        .eq("user_id", authUser.id)
        .maybeSingle()

      setTwoFactorEnabled(twoFactorSettings?.enabled ?? false)

      setLoading(false)
    }

    fetchUser()
  }, [])

  const handleToggleDataTraining = async (checked: boolean) => {
    if (!user) return

    setAllowDataTraining(checked)

    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        allow_data_training: checked,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )

    if (error) {
      console.error("Error updating preferences:", error)
      setToastMessage("Failed to update preferences")
      setShowToast(true)
      setAllowDataTraining(!checked) // Revert on error
    } else {
      setToastMessage(checked ? "Data training enabled" : "Data training disabled")
      setShowToast(true)
    }
  }

  const handleToggle2FA = async (checked: boolean) => {
    if (!user) return

    try {
      const { error } = await supabase.from("user_2fa_settings").upsert(
        {
          user_id: user.id,
          enabled: checked,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )

      if (error) throw error

      setTwoFactorEnabled(checked)
      setToastMessage(checked ? "Two-Factor Authentication enabled" : "Two-Factor Authentication disabled")
      setShowToast(true)
    } catch (error: any) {
      console.error("Error updating 2FA settings:", error)
      setToastMessage("Failed to update 2FA settings")
      setShowToast(true)
      setTwoFactorEnabled(!checked) // Revert on error
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    setIsDeleting(true)

    try {
      const { error: deleteRecordError } = await supabase.from("deleted_accounts").insert({
        user_id: user.id,
        email: user.email,
        deleted_at: new Date().toISOString(),
        reason: "User requested account deletion",
      })

      if (deleteRecordError) {
        console.error("Error creating deletion record:", deleteRecordError)
        // Continue with deletion even if this fails
      }

      // Delete user data from database
      await supabase.from("chat_sessions").delete().eq("user_id", user.id)
      await supabase.from("user_memories").delete().eq("user_id", user.id)
      await supabase.from("user_preferences").delete().eq("user_id", user.id)
      await supabase.from("user_selected_avatar").delete().eq("user_id", user.id)

      // Sign out and redirect to delete page
      await supabase.auth.signOut()
      router.push("/delete")
    } catch (error) {
      console.error("Error deleting account:", error)
      setToastMessage("Failed to delete account. Please try again.")
      setShowToast(true)
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/chat">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Profile Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* User Info */}
        <div className="bg-muted/30 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Account Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Name</label>
              <p className="text-base font-medium">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="text-base font-medium">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Data Training Toggle */}
        <div className="bg-muted/30 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Privacy Settings</h2>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium mb-1">Allow data training</p>
              <p className="text-sm text-muted-foreground">
                Help us improve our AI models by allowing us to use your conversations for training. Your data will only
                be used to enhance the AI experience.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={allowDataTraining}
                onChange={(e) => handleToggleDataTraining(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* 2FA Toggle */}
        <div className="bg-muted/30 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Security</h2>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="font-medium">Two-Factor Authentication</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security by requiring a code from your email every time you log in.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => handleToggle2FA(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-destructive mb-2">Delete Account</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Are you absolutely sure?</p>
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}
    </div>
  )
}
