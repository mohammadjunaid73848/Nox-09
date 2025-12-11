"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { ModelLogo } from "@/components/model-logo"

interface Avatar {
  id: string
  name: string
  description: string
  character_description: string
  image_url: string
  creator_name: string
  creator_id: string
  download_count: number
  is_public: boolean
}

interface DefaultAvatar {
  id: string
  name: string
  description: string
  character_description: string
  logo_url: string
  order_index: number
}

export default function PublicAvatarStorePage() {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [defaultAvatars, setDefaultAvatars] = useState<DefaultAvatar[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [installedAvatarIds, setInstalledAvatarIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const fetchAvatarsAndUser = async () => {
      try {
        setError(null)
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        setUser(currentUser)

        const { data: publicAvatars, error: fetchError } = await supabase
          .from("avatars")
          .select("*")
          .eq("is_public", true)
          .order("download_count", { ascending: false })

        if (fetchError) {
          console.error("[v0] Error fetching avatars:", fetchError)
          setError(`Failed to load avatars: ${fetchError.message}`)
          setAvatars([])
        } else {
          console.log("[v0] Fetched user-uploaded avatars:", publicAvatars?.length || 0)
          setAvatars(publicAvatars || [])
        }

        const { data: defaults, error: defaultsError } = await supabase
          .from("default_avatars")
          .select("*")
          .eq("is_active", true)
          .order("order_index", { ascending: true })

        if (defaultsError) {
          console.error("[v0] Error fetching default avatars:", defaultsError)
        } else {
          console.log("[v0] Fetched default avatars:", defaults?.length || 0)
          setDefaultAvatars(defaults || [])
        }

        if (currentUser) {
          const { data: downloads } = await supabase
            .from("avatar_downloads")
            .select("avatar_id")
            .eq("user_id", currentUser.id)

          setInstalledAvatarIds(new Set(downloads?.map((d) => d.avatar_id) || []))
        }
      } catch (error) {
        console.error("[v0] Error in fetchAvatarsAndUser:", error)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchAvatarsAndUser()
  }, [supabase])

  const handleInstallAvatar = async (avatarId: string) => {
    if (!user) {
      alert("Please sign in to install avatars")
      return
    }

    try {
      if (installedAvatarIds.has(avatarId)) {
        alert("Avatar already installed")
        return
      }

      await supabase.from("avatar_downloads").insert({
        avatar_id: avatarId,
        user_id: user.id,
      })

      const avatar = avatars.find((a) => a.id === avatarId)
      if (avatar) {
        await supabase
          .from("avatars")
          .update({ download_count: avatar.download_count + 1 })
          .eq("id", avatarId)
      }

      setInstalledAvatarIds((prev) => new Set([...prev, avatarId]))
      setAvatars((prev) => prev.map((a) => (a.id === avatarId ? { ...a, download_count: a.download_count + 1 } : a)))

      alert("Avatar installed successfully!")
    } catch (error) {
      console.error("[v0] Error installing avatar:", error)
      alert("Failed to install avatar")
    }
  }

  const filteredAvatars = avatars.filter(
    (avatar) =>
      avatar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      avatar.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      avatar.creator_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading avatars...</div>
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Avatars</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Discover AI characters created by users</p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search avatars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-background text-foreground placeholder-muted-foreground"
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
            {error}
          </div>
        )}

        {filteredAvatars.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {avatars.length === 0 ? "No user-created avatars available yet" : "No avatars match your search"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredAvatars.map((avatar) => (
              <div key={avatar.id} className="group">
                <Link href={`/avatar/${avatar.id}`}>
                  <div className="cursor-pointer">
                    <div className="relative mb-3 flex justify-center overflow-hidden rounded-lg bg-muted aspect-square hover:shadow-lg transition-shadow">
                      {avatar.image_url ? (
                        <img
                          src={avatar.image_url || "/placeholder.svg"}
                          alt={avatar.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <ModelLogo modelName={avatar.name} className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm md:text-base font-semibold text-center truncate group-hover:text-primary transition-colors">
                      {avatar.name}
                    </h3>
                  </div>
                </Link>
                <p className="text-xs text-muted-foreground text-center mt-1">by {avatar.creator_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
