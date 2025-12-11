"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2, Edit2, Upload } from "lucide-react"

interface Avatar {
  id: string
  name: string
  description: string
  character_description: string
  prompt: string
  image_url: string
  creator_name: string
  download_count: number
}

export default function PublishAvatarPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    character_description: "",
    prompt: "",
    creator_name: "",
  })
  const [userAvatars, setUserAvatars] = useState<Avatar[]>([])
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const checkUserAndFetchAvatars = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        setUser(currentUser)

        if (!currentUser) {
          setLoading(false)
          return
        }

        const { data: avatars } = await supabase
          .from("avatars")
          .select("*")
          .eq("creator_id", currentUser.id)
          .order("created_at", { ascending: false })

        setUserAvatars(avatars || [])
      } catch (error) {
        console.error("Error fetching user avatars:", error)
      } finally {
        setLoading(false)
      }
    }

    checkUserAndFetchAvatars()
  }, [supabase])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setPublishing(true)
    try {
      let imageUrl = formData.name // Use placeholder if no image

      if (imageFile) {
        const fileName = `${user.id}/${Date.now()}-${imageFile.name}`
        const { error: uploadError } = await supabase.storage.from("avatar-images").upload(fileName, imageFile)

        if (uploadError) {
          console.error("[v0] Upload error:", uploadError)
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        const { data: publicUrl } = supabase.storage.from("avatar-images").getPublicUrl(fileName)

        imageUrl = publicUrl.publicUrl
      }

      const creatorName = formData.creator_name?.trim() || user.email?.split("@")[0] || "Anonymous"

      const avatarData = {
        name: formData.name,
        description: formData.description,
        character_description: formData.character_description,
        prompt: formData.prompt,
        creator_name: creatorName,
        image_url: imageUrl,
        creator_id: user.id,
        is_public: true,
      }

      if (editingId) {
        const { error } = await supabase
          .from("avatars")
          .update(avatarData)
          .eq("id", editingId)
          .eq("creator_id", user.id)

        if (error) throw error
        setEditingId(null)
      } else {
        const { error } = await supabase.from("avatars").insert(avatarData)
        if (error) throw error
      }

      // Reset form
      setFormData({ name: "", description: "", character_description: "", prompt: "", creator_name: "" })
      setImageFile(null)
      setImagePreview("")

      // Refresh avatars list
      const { data: avatars } = await supabase
        .from("avatars")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })

      setUserAvatars(avatars || [])
      alert(editingId ? "Avatar updated successfully!" : "Avatar published successfully!")
    } catch (error) {
      console.error("Error publishing avatar:", error)
      alert(`Failed to publish avatar: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setPublishing(false)
    }
  }

  const handleEdit = (avatar: Avatar) => {
    setEditingId(avatar.id)
    setFormData({
      name: avatar.name,
      description: avatar.description,
      character_description: avatar.character_description,
      prompt: avatar.prompt,
      creator_name: avatar.creator_name,
    })
    setImagePreview(avatar.image_url)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (avatarId: string) => {
    if (!confirm("Are you sure you want to delete this avatar?")) return

    try {
      const { error } = await supabase.from("avatars").delete().eq("id", avatarId).eq("creator_id", user.id)

      if (error) throw error

      setUserAvatars((prev) => prev.filter((a) => a.id !== avatarId))
      alert("Avatar deleted successfully!")
    } catch (error) {
      console.error("Error deleting avatar:", error)
      alert("Failed to delete avatar")
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ name: "", description: "", character_description: "", prompt: "", creator_name: "" })
    setImageFile(null)
    setImagePreview("")
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <p>Please sign in to publish avatars</p>
        <Link href="/auth/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Publish Your Avatar</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Form */}
          <form onSubmit={handlePublish} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Avatar Image</label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  {imagePreview ? (
                    <div className="relative w-24 h-24 mx-auto mb-2">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">Click to upload image</p>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Avatar Name</label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Einstein the Physicist"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Name (Creator)</label>
              <Input
                type="text"
                name="creator_name"
                value={formData.creator_name}
                onChange={handleInputChange}
                placeholder="Your name or username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Short Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of your avatar"
                className="w-full border rounded-md p-2 min-h-20 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Character Description</label>
              <textarea
                name="character_description"
                value={formData.character_description}
                onChange={handleInputChange}
                placeholder="Describe the character's personality, background, and traits..."
                className="w-full border rounded-md p-2 min-h-24 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Behavior Prompt</label>
              <textarea
                name="prompt"
                value={formData.prompt}
                onChange={handleInputChange}
                placeholder="System prompt that defines how this avatar behaves as a character..."
                className="w-full border rounded-md p-2 min-h-32 text-sm"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={publishing} className="flex-1">
                {publishing ? "Publishing..." : editingId ? "Update Avatar" : "Publish Avatar"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          {/* Published Avatars */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Published Avatars</h2>
            {userAvatars.length === 0 ? (
              <p className="text-muted-foreground">No avatars published yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {userAvatars.map((avatar) => (
                  <div key={avatar.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="flex gap-3">
                      {avatar.image_url && (
                        <img
                          src={avatar.image_url || "/placeholder.svg"}
                          alt={avatar.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{avatar.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">by {avatar.creator_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">Downloads: {avatar.download_count}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(avatar)} className="h-8 w-8 p-0">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(avatar.id)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
