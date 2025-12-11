"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageCircle, Download, Share2 } from "lucide-react"
import Link from "next/link"

interface Avatar {
  id: string
  name: string
  character_description: string
  prompt: string
  logo_url: string
  image_url: string
  creator_name: string
  download_count: number
  created_at: string
}

export default function AvatarPage() {
  const params = useParams()
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [user, setUser] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const fetchAvatarAndUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        setUser(currentUser)

        const { data, error: fetchError } = await supabase.from("avatars").select("*").eq("id", params.id).single()

        if (fetchError) throw fetchError
        setAvatar(data)

        if (currentUser) {
          const { data: downloads } = await supabase
            .from("avatar_downloads")
            .select("id")
            .eq("avatar_id", params.id)
            .eq("user_id", currentUser.id)
            .single()

          setIsInstalled(!!downloads)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load avatar")
      } finally {
        setLoading(false)
      }
    }

    fetchAvatarAndUser()
  }, [params.id, supabase])

  const handleInstall = async () => {
    if (!user) {
      alert("Please sign in to install avatars")
      return
    }

    if (isInstalled) {
      alert("Avatar already installed")
      return
    }

    try {
      await supabase.from("avatar_downloads").insert({
        avatar_id: params.id,
        user_id: user.id,
      })

      if (avatar) {
        await supabase
          .from("avatars")
          .update({ download_count: avatar.download_count + 1 })
          .eq("id", params.id)
      }

      setIsInstalled(true)
      alert("Avatar installed successfully!")
    } catch (err) {
      console.error("Error installing avatar:", err)
      alert("Failed to install avatar")
    }
  }

  const handleDownload = () => {
    if (!avatar) return
    const avatarData = JSON.stringify(avatar, null, 2)
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(avatarData))
    element.setAttribute("download", `${avatar.name.toLowerCase().replace(/\s+/g, "-")}.json`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleShare = async () => {
    if (!avatar) return
    const shareUrl = `${window.location.origin}/avatar/${avatar.id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert("Avatar link copied to clipboard!")
    } catch {
      alert("Failed to copy link")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading avatar...</p>
        </div>
      </div>
    )
  }

  if (error || !avatar) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Avatar not found"}</p>
          <Link href="/">
            <Button className="bg-white text-black hover:bg-gray-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 sticky top-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-lg md:text-xl font-bold truncate">{avatar.name}</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Avatar Image */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-6 flex items-center justify-center">
              {avatar.image_url ? (
                <img
                  src={avatar.image_url || "/placeholder.svg"}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-4xl">{avatar.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Link href={`/chat?avatar=${avatar.id}`} className="w-full">
                <Button className="w-full bg-white text-black hover:bg-gray-200 py-6 text-base md:text-lg">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat with {avatar.name}
                </Button>
              </Link>
              <Button
                onClick={handleInstall}
                disabled={isInstalled}
                variant="outline"
                className="w-full py-6 text-base md:text-lg border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                {isInstalled ? "✓ Installed" : "Install Avatar"}
              </Button>
              <div className="flex gap-3">
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="flex-1 py-6 border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="flex-1 py-6 border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Avatar Details */}
          <div className="space-y-6 md:space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{avatar.name}</h2>
              <p className="text-gray-400 text-base md:text-lg">{avatar.character_description}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 overflow-hidden">
              <h3 className="text-xs md:text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                System Prompt
              </h3>
              <p className="text-white leading-relaxed text-sm md:text-base break-words">{avatar.prompt}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-gray-400 text-xs md:text-sm mb-1">Created by</p>
                <p className="text-white font-semibold text-sm md:text-base truncate">
                  {avatar.creator_name || "System"}
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-gray-400 text-xs md:text-sm mb-1">Downloads</p>
                <p className="text-white font-semibold text-sm md:text-base">
                  {avatar.download_count.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4 md:p-6">
              <h3 className="font-semibold mb-2 text-sm md:text-base">About this Avatar</h3>
              <p className="text-gray-300 text-xs md:text-sm">
                This AI avatar is designed to provide specialized assistance. Start a conversation to experience its
                unique capabilities and personality.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
