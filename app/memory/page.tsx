"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Trash2, ArrowLeft, Brain } from "lucide-react"
import { useRouter } from "next/navigation"

type Memory = { id: string; key: string; value: string; category: string; created_at: string }

export default function MemoryPage() {
  const supabase = createClient()
  const router = useRouter()
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      loadMemories()
    } else {
      setLoading(false)
    }
  }

  const loadMemories = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("user_memories").select("*").order("created_at", { ascending: false })
    if (!error) setMemories(data as any)
    setLoading(false)
  }

  const deleteMemory = async (id: string) => {
    const prev = memories
    setMemories((m) => m.filter((x) => x.id !== id))
    const { error } = await supabase.from("user_memories").delete().eq("id", id)
    if (error) setMemories(prev) // revert on failure
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-base font-medium">Memories</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 py-6 max-w-3xl">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading memories...</div>
            </div>
          ) : !user ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Brain className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign in to view memories</h2>
              <p className="text-muted-foreground mb-6">Save important information from your conversations</p>
              <Button onClick={() => router.push("/auth/login")}>Sign In</Button>
            </div>
          ) : memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Brain className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No memories yet</h2>
              <p className="text-muted-foreground">
                Click the "Remember" button on any AI response to save it to your memory
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {memories.map((memory) => (
                <div key={memory.id} className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                          {memory.category}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDate(memory.created_at)}</span>
                      </div>
                      <p className="text-sm break-words">{memory.value}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMemory(memory.id)}
                      aria-label="Delete memory"
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
