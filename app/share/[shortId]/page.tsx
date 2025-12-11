"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { MessageContent } from "@/components/message-content"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export default function SharePage() {
  const params = useParams()
  const shortId = params.shortId as string
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionTitle, setSessionTitle] = useState("Shared Chat")
  const supabase = createClient()

  useEffect(() => {
    const fetchSharedChat = async () => {
      try {
        setLoading(true)
        const { data: sessionData, error: sessionError } = await supabase
          .from("chat_sessions")
          .select("id, title, is_public")
          .eq("short_id", shortId)
          .eq("is_public", true)
          .single()

        if (sessionError || !sessionData) {
          setError("Chat not found or is not public")
          return
        }

        setSessionTitle(sessionData.title)

        const { data: messagesData, error: messagesError } = await supabase
          .from("chat_messages")
          .select("id, role, content, created_at")
          .eq("session_id", sessionData.id)
          .order("created_at", { ascending: true })

        if (messagesError) {
          setError("Failed to load messages")
          return
        }

        setMessages(messagesData || [])
      } catch (err) {
        console.error("Error fetching shared chat:", err)
        setError("An error occurred while loading the chat")
      } finally {
        setLoading(false)
      }
    }

    if (shortId) {
      fetchSharedChat()
    }
  }, [shortId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared chat...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Link href="/chat">
            <Button>Start a New Chat</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <Link href="/chat">
          <Button variant="ghost" size="icon" className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold flex-1 text-center truncate">{sessionTitle}</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 py-6 space-y-6 max-w-3xl">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center min-h-[60vh] text-center">
              <p className="text-muted-foreground">No messages in this chat</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="space-y-3">
                {message.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-muted rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-[80%] text-sm break-words">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                        <AvatarImage
                          src="/logo-black.png"
                          alt="Noxy"
                          className="dark:invert dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-sm leading-relaxed break-words min-w-0">
                        <MessageContent content={message.content} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-border px-4 py-4 bg-background flex-shrink-0 text-center text-sm text-muted-foreground">
        <p>This is a shared read-only chat. Start your own conversation to continue.</p>
        <Link href="/chat" className="text-primary hover:underline mt-2 inline-block">
          Start a New Chat
        </Link>
      </div>
    </div>
  )
}
