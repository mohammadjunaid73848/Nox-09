"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { Loader2 } from "lucide-react"

interface Avatar {
  id: string
  name: string
  logo_url: string
}

export function AvatarGallery() {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const { data } = await supabase
          .from("avatars")
          .select("id, name, logo_url")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(4)

        setAvatars(data || [])
      } catch (err) {
        console.error("Failed to fetch avatars:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAvatars()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
      {avatars.map((avatar) => (
        <Link key={avatar.id} href={`/avatar/${avatar.id}`}>
          <div className="group cursor-pointer">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 flex items-center justify-center">
              {avatar.logo_url ? (
                <img
                  src={avatar.logo_url || "/placeholder.svg"}
                  alt={avatar.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <span className="text-4xl font-bold">{avatar.name.charAt(0)}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
