"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart3, TrendingUp, Trash2 } from "lucide-react"

interface Avatar {
  id: string
  name: string
  description: string
  character_description: string
  image_url: string
  creator_name: string
  creator_id: string
  download_count: number
}

export default function AvatarPage() {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const fetchUserAndAvatars = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        setUser(currentUser)

        if (!currentUser) {
          setLoading(false)
          return
        }

        const { data: downloads, error: downloadError } = await supabase
          .from("avatar_downloads")
          .select("avatar_id")
          .eq("user_id", currentUser.id)

        if (downloadError) {
          console.error("Download fetch error:", downloadError.message)
        }

        const avatarIds = downloads?.map((d) => d.avatar_id) || []
        let fetchedAvatars: Avatar[] = []

        if (avatarIds.length > 0) {
          const { data: avatarList, error: avatarError } = await supabase
            .from("avatars")
            .select("*")
            .in("id", avatarIds)
            .order("created_at", { ascending: false })

          if (avatarError) {
            console.error("Avatar fetch error:", avatarError.message)
          }

          fetchedAvatars = avatarList || []
        }

        setAvatars(fetchedAvatars)

        const { data: selected, error: selectedError } = await supabase
          .from("user_selected_avatar")
          .select("avatar_id, is_selected")
          .eq("user_id", currentUser.id)
          .eq("is_selected", true)
          .maybeSingle()

        if (selectedError && selectedError.code !== "PGRST116") {
          console.error("Selected avatar fetch error:", selectedError.message)
        }

        if (selected) {
          setSelectedAvatarId(selected.avatar_id)
        }
      } catch (error) {
        console.error("Unexpected error:", error instanceof Error ? error.message : String(error))
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndAvatars()
  }, [supabase])

  const handleSelectAvatar = async (avatarId: string) => {
    if (!user) return

    try {
      const isCurrentlySelected = selectedAvatarId === avatarId
      const newIsSelected = !isCurrentlySelected

      if (!newIsSelected) {
        const { error: updateError } = await supabase
          .from("user_selected_avatar")
          .update({
            is_selected: false,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        if (updateError) {
          console.error("Error deselecting avatar:", updateError)
          alert("Error: " + updateError.message)
        } else {
          setSelectedAvatarId(null)
          alert("Avatar deselected!")
        }
      } else {
        const { data: existing, error: fetchError } = await supabase
          .from("user_selected_avatar")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()

        if (fetchError) {
          console.error("Error fetching existing avatar:", fetchError)
          return
        }

        if (existing) {
          const { error: updateError } = await supabase
            .from("user_selected_avatar")
            .update({
              avatar_id: avatarId,
              is_selected: true,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)

          if (updateError) {
            console.error("Error updating avatar:", updateError)
            alert("Error: " + updateError.message)
          } else {
            setSelectedAvatarId(avatarId)
            alert("Avatar activated!")
          }
        } else {
          const { error: insertError } = await supabase.from("user_selected_avatar").insert({
            user_id: user.id,
            avatar_id: avatarId,
            is_selected: true,
          })

          if (insertError) {
            console.error("Error inserting avatar:", insertError)
            alert("Error: " + insertError.message)
          } else {
            setSelectedAvatarId(avatarId)
            alert("Avatar activated!")
          }
        }
      }
    } catch (error) {
      console.error("Exception in handleSelectAvatar:", error)
      alert("Error: " + String(error))
    }
  }

  const handleRemoveAvatar = async (avatarId: string) => {
    if (!user || !confirm("Remove this avatar from your collection?")) return

    try {
      await supabase.from("avatar_downloads").delete().eq("avatar_id", avatarId).eq("user_id", user.id)

      if (selectedAvatarId === avatarId) {
        setSelectedAvatarId(null)
        await supabase.from("user_selected_avatar").delete().eq("user_id", user.id)
      }

      setAvatars((prev) => prev.filter((a) => a.id !== avatarId))
    } catch (error) {
      console.error("Error removing avatar:", error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading avatars...</div>
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <p>Please sign in to manage avatars</p>
        <Link href="/auth/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">My Avatars</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link href="/avatar/analytics" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full bg-transparent">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link href="/public/avatars" className="flex-1 sm:flex-none">
              <Button className="w-full">Browse More</Button>
            </Link>
          </div>
        </div>

        {avatars.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No avatars installed yet</p>
            <Link href="/public/avatars">
              <Button>Explore Avatar Store</Button>
            </Link>
          </div>
        ) : (
          <>
            {selectedAvatarId && (
              <div className="mb-8 p-4 md:p-6 bg-primary/10 border border-primary rounded-lg">
                {avatars.find((a) => a.id === selectedAvatarId) && (
                  <div className="flex items-center gap-4">
                    <img
                      src={avatars.find((a) => a.id === selectedAvatarId)?.image_url || "/placeholder.svg"}
                      alt="Selected"
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Currently Active Avatar</p>
                      <h2 className="text-lg md:text-xl font-bold">
                        {avatars.find((a) => a.id === selectedAvatarId)?.name}
                      </h2>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        by {avatars.find((a) => a.id === selectedAvatarId)?.creator_name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {avatars.map((avatar) => (
                <div
                  key={avatar.id}
                  className={`border rounded-lg p-4 md:p-6 transition-all ${
                    selectedAvatarId === avatar.id ? "border-primary bg-primary/5 shadow-lg" : "hover:shadow-lg"
                  }`}
                >
                  <div className="flex justify-center mb-4">
                    <img
                      src={avatar.image_url || "/placeholder.svg"}
                      alt={avatar.name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-primary"
                    />
                  </div>

                  <h3 className="text-lg md:text-xl font-semibold text-center mb-1">{avatar.name}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground text-center mb-2">by {avatar.creator_name}</p>

                  <p className="text-xs md:text-sm text-foreground text-center mb-4 line-clamp-2">
                    {avatar.character_description || avatar.description}
                  </p>

                  <div className="flex items-center justify-center gap-2 mb-4 text-xs md:text-sm">
                    <span className="text-muted-foreground">
                      {avatar.download_count} {avatar.download_count === 1 ? "user" : "users"}
                    </span>
                    {avatar.download_count > 10 && <TrendingUp className="w-4 h-4 text-green-600" />}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSelectAvatar(avatar.id)}
                      variant={selectedAvatarId === avatar.id ? "default" : "outline"}
                      className="flex-1 text-sm"
                    >
                      {selectedAvatarId === avatar.id ? "Active" : "Select"}
                    </Button>
                    <Button
                      onClick={() => handleRemoveAvatar(avatar.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
