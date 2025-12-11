"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, MessageSquare, LogOut, MoreVertical, Lock, Unlock, Copy, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Toast } from "@/components/ui/toast"
import { formatDate } from "@/utils/formatDate"
import { deleteSession } from "@/utils/deleteSession"
import { handleLogout } from "@/utils/handleLogout"

interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
  is_public: boolean
  short_id?: string
}

interface HistoryMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelectSession: (sessionId: string) => void
  currentSessionId?: string | null
}

export function HistoryMenu({ isOpen, onClose, onSelectSession, currentSessionId }: HistoryMenuProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Small delay to trigger animation after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      // Wait for animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const fetchSessions = async () => {
      setLoading(true)
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()
        setUser(authUser)

        if (authUser) {
          const { data, error } = await supabase
            .from("chat_sessions")
            .select("*")
            .eq("user_id", authUser.id)
            .order("updated_at", { ascending: false })

          if (error) {
            console.error("Error fetching sessions:", error)
            setToastMessage("Failed to load history")
            setShowToast(true)
          } else {
            setSessions(data || [])
          }
        }
      } catch (error) {
        console.error("Error in fetchSessions:", error)
        setToastMessage("Failed to load history")
        setShowToast(true)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [isOpen])

  const generateShortId = () => {
    return Math.random().toString(36).substring(2, 9)
  }

  const togglePublic = async (sessionId: string, currentPublic: boolean, e: React.MouseEvent) => {
    e.stopPropagation()

    const shortId = !currentPublic ? generateShortId() : null

    const { error } = await supabase
      .from("chat_sessions")
      .update({ is_public: !currentPublic, short_id: shortId })
      .eq("id", sessionId)

    if (error) {
      console.error("Error updating session privacy:", error)

      if (error.message?.includes("short_id")) {
        const { error: fallbackError } = await supabase
          .from("chat_sessions")
          .update({ is_public: !currentPublic })
          .eq("id", sessionId)

        if (fallbackError) {
          setToastMessage("Failed to update privacy")
          setShowToast(true)
          return
        }
      } else {
        setToastMessage("Failed to update privacy")
        setShowToast(true)
        return
      }
    }

    setSessions(
      sessions.map((s) =>
        s.id === sessionId ? { ...s, is_public: !currentPublic, short_id: shortId || undefined } : s,
      ),
    )

    if (!currentPublic) {
      const shareUrl = `${window.location.origin}/share/${shortId}`
      try {
        await navigator.clipboard.writeText(shareUrl)
        setToastMessage("Chat set to public! Share link copied to clipboard")
        setShowToast(true)
      } catch {
        setToastMessage("Chat set to public")
        setShowToast(true)
      }
    } else {
      setToastMessage("Chat set to private")
      setShowToast(true)
    }
  }

  const copyShareLink = async (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!session.is_public || !session.short_id) {
      setToastMessage("This chat is not public")
      setShowToast(true)
      return
    }

    const shareUrl = `${window.location.origin}/share/${session.short_id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setToastMessage("Share link copied!")
      setShowToast(true)
    } catch {
      setToastMessage("Failed to copy link")
      setShowToast(true)
    }
  }

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(onClose, 300)
  }

  if (!isVisible) return null

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ease-out ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      >
        <div
          className={`fixed left-0 top-0 h-full w-80 bg-background border-r border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            isAnimating ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-border flex-shrink-0 flex items-center justify-between">
            <h2 className="text-lg font-semibold truncate">Chat History</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg transition-all duration-200 hover:bg-muted hover:scale-105 active:scale-95"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground animate-pulse">Loading history...</span>
              </div>
            </div>
          ) : !user ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-4 animate-in fade-in zoom-in duration-500" />
              <p className="text-muted-foreground mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                Sign in to save your chat history
              </p>
              <Button
                onClick={() => router.push("/auth")}
                className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 transition-all hover:scale-105 active:scale-95"
              >
                Sign In
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full p-2">
                  {sessions.length === 0 ? (
                    <div className="text-center text-muted-foreground p-4 animate-in fade-in duration-300">
                      No chat history yet
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {sessions.map((session, index) => (
                        <div
                          key={session.id}
                          className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ease-out hover:bg-muted/50 hover:translate-x-1 active:scale-[0.98] ${
                            currentSessionId === session.id ? "bg-muted" : ""
                          }`}
                          style={{
                            animation: `fadeSlideIn 0.3s ease-out ${index * 0.05}s both`,
                          }}
                          onClick={() => {
                            onSelectSession(session.id)
                            handleClose()
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{session.title}</p>
                              {session.is_public && (
                                <span
                                  className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 animate-pulse"
                                  title="Public"
                                />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{formatDate(session.updated_at)}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 animate-in fade-in zoom-in-95 duration-200"
                            >
                              <DropdownMenuItem
                                onClick={(e) => copyShareLink(session, e)}
                                className="transition-colors duration-150 cursor-pointer"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Share Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => togglePublic(session.id, session.is_public, e)}
                                className="transition-colors duration-150 cursor-pointer"
                              >
                                {session.is_public ? (
                                  <>
                                    <Lock className="w-4 h-4 mr-2" />
                                    Set Private
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Set Public
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => deleteSession(session.id, e)}
                                className="text-destructive transition-colors duration-150 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div className="p-4 border-t border-border flex-shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {user && (
                  <Link href="/profile">
                    <Button
                      variant="ghost"
                      className="w-full justify-start mb-2 transition-all duration-200 hover:translate-x-1 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                          <span className="text-sm font-medium">{user.email?.charAt(0).toUpperCase() || "U"}</span>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium truncate">
                            {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start transition-all duration-200 hover:translate-x-1 hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}
