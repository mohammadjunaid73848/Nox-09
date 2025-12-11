"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Menu,
  Pause,
  Paperclip,
  X,
  RefreshCw,
  Copy,
  ChevronUp,
  Plus,
  MoreVertical,
  History,
  Brain,
  MapPin,
  Settings,
  Mic,
  MicOff,
  ChevronDown,
  Share2,
  Users,
  Home,
} from "lucide-react"
import { MessageContent } from "@/components/message-content"
import { SearchSources } from "@/components/search-sources"
import { HistoryMenu } from "@/components/history-menu"
import { createClient } from "@/lib/supabase/client"
import { ModelPicker, MODEL_OPTIONS, type ModelId } from "@/components/model-picker"
import { Toast } from "@/components/ui/toast"
import { FeedbackNotification } from "@/components/feedback-notification"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ThinkingStatus } from "@/components/thinking-status"
import Link from "next/link"
import { CodeWidget } from "@/components/code-widget"
import { ImageUploadDialog } from "@/components/image-upload-dialog"
import { useToast } from "@/components/ui/use-toast" // Import useToast
import { AgeVerificationDialog } from "@/components/age-verification-dialog" // Import AgeVerificationDialog
// import { ElevenLabsVoiceModal } from "@/components/elevenlabs-voice-modal" // Removed
import { FREE_PLAN_MODELS } from "@/lib/subscription-types"

interface SearchSource {
  title: string
  link: string
  snippet: string
  displayLink: string
  image?: string
  video?: string
}
interface AttachmentMeta {
  name: string
  type: "image" | "pdf"
  size: number
  previewUrl: string
  dataUrl?: string
  storageUrl?: string
  text?: string
}
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
  searchResults?: SearchSource[]
  attachment?: AttachmentMeta[]
}

interface Session {
  id: string
  title: string
  is_public: boolean | null
  short_id: string | null
}

function dispatchDebugLog(type: "info" | "search" | "ai" | "error", message: string, data?: any) {
  const event = new CustomEvent("debug-log", {
    detail: { type, message, data },
  })
  window.dispatchEvent(event)
  console.log(`[v0 Debug] [${type.toUpperCase()}]`, message, data || "")
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([])
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelId>(MODEL_OPTIONS[0].id)
  const [isPro, setIsPro] = useState(false)
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("") // Corrected from `set和ToastMessage`
  const [currentAIProvider, setCurrentAIProvider] = useState<"cerebras" | "together" | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [memoryOpen, setMemoryOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<string | null>(null)
  const [locationPermission, setLocationPermission] = useState<"prompt" | "granted" | "denied">("prompt")
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [customInstructions, setCustomInstructions] = useState("")
  const [showThinkingStatus, setShowThinkingStatus] = useState(false)
  const [showReasoningForMessage, setShowReasoningForMessage] = useState<{ [key: string]: boolean }>({})
  const [messageThinking, setMessageThinking] = useState<{ [key: string]: string }>({})
  const [deepSearch, setDeepSearch] = useState(false)
  const [thinkingAction, setThinkingAction] = useState<string>("")
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>("")
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [showTermsNotice, setShowTermsNotice] = useState(false)
  const [showCodeApproval, setShowCodeApproval] = useState(false)
  const [codePlan, setCodePlan] = useState("")
  const [codeApprovalMessageId, setCodeApprovalMessageId] = useState<string | null>(null)
  const [vibeCoding, setVibeCoding] = useState(false)
  const [thinkingTimer, setThinkingTimer] = useState(0)
  const [sessions, setSessions] = useState<Session[]>([]) // Declare sessions state
  const [selectedAvatar, setSelectedAvatar] = useState<any>(null)
  const [codeWidgetOpen, setCodeWidgetOpen] = useState(false)
  const [codeWidgetData, setCodeWidgetData] = useState<{ code: string; language: string; appId?: string }>({
    code: "",
    language: "text",
  })
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false)
  const [showImagePopup, setShowImagePopup] = useState(false)
  const [popupImageUrl, setPopupImageUrl] = useState("")
  const [popupImages, setPopupImages] = useState<string[]>([])
  const [popupImageIndex, setPopupImageIndex] = useState(0)
  const { toast } = useToast() // Use useToast hook
  const [showAgeVerification, setShowAgeVerification] = useState(false) // Add age verification state
  // const [showVoiceModal, setShowVoiceModal] = useState(false) // Removed

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isSpeakingRef = useRef(false)
  const transcriptRef = useRef("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    // messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    // if (isLoading || streamingMessageId) {
    //   scrollToBottom()
    // }
  }, [messages, isLoading, streamingMessageId])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setIsDark(true)
      document.documentElement.classList.add("dark")
    } else if (savedTheme === "light") {
      setIsDark(false)
      document.documentElement.classList.remove("dark")
    } else {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      setIsDark(mediaQuery.matches)
      if (mediaQuery.matches) document.documentElement.classList.add("dark")
      else document.documentElement.classList.remove("dark")
    }
  }, [])

  useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem("theme")
      if (savedTheme === "dark") {
        setIsDark(true)
        document.documentElement.classList.add("dark")
      } else if (savedTheme === "light") {
        setIsDark(false)
        document.documentElement.classList.remove("dark")
      }
    }

    window.addEventListener("theme-changed", handleThemeChange)
    return () => window.removeEventListener("theme-changed", handleThemeChange)
  }, [])

  useEffect(() => {
    const handleQueryParam = () => {
      const queryParam = searchParams.get("q")
      if (queryParam && !isLoading && messages.length === 0) {
        const decodedQuery = decodeURIComponent(queryParam)
        setInput(decodedQuery)
        // Use setTimeout to ensure state is updated before submitting
        setTimeout(() => {
          const event = new Event("submit", { bubbles: true })
          inputRef.current?.form?.dispatchEvent(event)
        }, 100)
      }
    }
    handleQueryParam()
  }, [searchParams, isLoading, messages])

  useEffect(() => {
    const handleShowImagePopup = (e: CustomEvent) => {
      const { images, index } = e.detail
      if (images && Array.isArray(images)) {
        setPopupImages(images)
        setPopupImageIndex(index || 0)
      } else {
        setPopupImages([e.detail.url])
        setPopupImageIndex(0)
      }
      setShowImagePopup(true)
    }

    window.addEventListener("show-image-popup", handleShowImagePopup as EventListener)
    return () => window.removeEventListener("show-image-popup", handleShowImagePopup as EventListener)
  }, [])

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = true
      recognitionInstance.lang = "en-US"

      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " "
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          transcriptRef.current += finalTranscript
          setInput(transcriptRef.current.trim())
          if (transcriptRef.current.trim().length > 3) {
            setTimeout(() => {
              stopRecordingAndSend()
            }, 500)
          }
        } else if (interimTranscript) {
          setInput((transcriptRef.current + interimTranscript).trim())
        }
      }

      recognitionInstance.onerror = (event: any) => {
        console.error("[v0] Speech recognition error:", event.error)
        if (event.error !== "aborted" && event.error !== "no-speech") {
          setToastMessage("Something went wrong")
          setShowToast(true)
        }
        setIsRecording(false)
        setAudioLevel(0)
        stopAudioAnalysis()
        transcriptRef.current = ""
      }

      recognitionInstance.onend = () => {
        if (!isRecording) {
          setAudioLevel(0)
          stopAudioAnalysis()
        }
      }

      setRecognition(recognitionInstance)
    }
  }, [])

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((res) => res.json())
      .then((data) => {
        setIsPro(data.isPro || false)
        setSubscriptionLoaded(true)
        // If not pro and selected model is pro-only, switch to free model
        if (!data.isPro && !FREE_PLAN_MODELS.includes(selectedModel) && selectedModel !== "nvidia-deepseek-r1") {
          setSelectedModel("nvidia-deepseek-r1")
        }
      })
      .catch((err) => {
        console.error("Error fetching subscription:", err)
        setSubscriptionLoaded(true)
      })
  }, [])

  useEffect(() => {
    const initializeChat = async () => {
      console.log("[v0] Initializing chat...")
      setIsInitialLoading(true)
      setIsCheckingAuth(true) // Moved to true here

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setUser(user)

          // Check if account is deleted
          const { data: deletedAccount } = await supabase
            .from("deleted_accounts")
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (deletedAccount) {
            console.log("[v0] Account is deleted, redirecting to /delete")
            router.push("/delete")
            return
          }

          const { data: twoFactorSettings } = await supabase
            .from("user_2fa_settings")
            .select("enabled")
            .eq("user_id", user.id)
            .maybeSingle()

          // Check if 2FA is enabled and user hasn't verified in this session
          if (twoFactorSettings?.enabled) {
            const verified2FA = localStorage.getItem(`2fa_verified_${user.id}`)

            if (!verified2FA) {
              // User needs to verify 2FA, redirect to 2FA page
              router.push("/2fa")
              return
            }
          }

          // Check if user has verified age
          const { data: ageData } = await supabase.from("user_ages").select("age").eq("user_id", user.id).maybeSingle()

          if (!ageData) {
            setShowAgeVerification(true)
          }
        }

        // Check for shared content from Web Share API
        const sharedContent = sessionStorage.getItem("shared_content")
        if (sharedContent) {
          console.log("[v0] Shared content found:", sharedContent)
          setInput(sharedContent)
          sessionStorage.removeItem("shared_content")
        }

        const { data: avatarData, error: avatarError } = await supabase
          .from("user_selected_avatar")
          .select("avatar_id, is_selected")
          .eq("user_id", user ? user.id : "null") // Handle case where user is null
          .eq("is_selected", true)
          .maybeSingle()

        console.log("[v0] Avatar data on init:", { avatarData, avatarError })

        if (!avatarData || !avatarData.avatar_id) {
          console.log("[v0] No avatar selected (is_selected=false or no record)")
          setSelectedAvatar(null)
          dispatchDebugLog("info", "No avatar selected on initialization", {})
        } else {
          const { data: avatar, error: fetchError } = await supabase
            .from("avatars")
            .select("*")
            .eq("id", avatarData.avatar_id)
            .maybeSingle()

          if (fetchError) {
            console.error("[v0] Error fetching avatar:", fetchError)
            setSelectedAvatar(null)
          } else if (avatar) {
            console.log("[v0] Avatar loaded:", avatar.name)
            setSelectedAvatar(avatar)
            dispatchDebugLog("info", "Avatar loaded on chat initialization", {
              avatarId: avatar.id,
              avatarName: avatar.name,
            })
          } else {
            setSelectedAvatar(null)
          }
        }

        const { data: fetchedSessions, error } = await supabase
          .from("chat_sessions")
          .select("id, title, is_public, short_id")
          .eq("user_id", user ? user.id : "null") // Handle case where user is null
          .order("updated_at", { ascending: false })

        if (!error && fetchedSessions) {
          setSessions(fetchedSessions)
        } else if (error) {
          console.error("Error fetching sessions:", error)
          if (error.message?.includes("short_id")) {
            const { data: fallbackSessions } = await supabase
              .from("chat_sessions")
              .select("id, title, is_public")
              .eq("user_id", user ? user.id : "null") // Handle case where user is null
              .order("updated_at", { ascending: false })

            if (fallbackSessions) {
              setSessions(fallbackSessions.map((s) => ({ ...s, short_id: null })))
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error during initialization:", error)
      } finally {
        setIsCheckingAuth(false)
        setIsInitialLoading(false)
      }
    }

    initializeChat()
    // Removed the specific check for user from dependencies, as supabase.auth.getUser() will be called
    // and the logic inside handles the presence or absence of a user.
  }, [router])

  const createNewSession = async () => {
    if (!user) return null // Only create session if user is logged in
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title: "New Chat", is_public: false })
      .select()
      .single()
    if (error) {
      console.error("Error creating session:", error)
      return null
    }
    setSessions((prev) => [data, ...prev])
    return data.id
  }

  const saveMessage = async (sessionId: string, role: "user" | "assistant", content: string) => {
    if (!user) return // Only save message if user is logged in
    const { error } = await supabase.from("chat_messages").insert({ session_id: sessionId, role, content })
    if (error) console.error("Error saving message:", error)
  }

  const updateSessionTitle = async (sessionId: string, firstMessage: string) => {
    if (!user) return // Only update title if user is logged in
    try {
      const response = await fetch("/api/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstMessage }),
      })
      const { title } = await response.json()
      const { error } = await supabase
        .from("chat_sessions")
        .update({ title: title || "New Chat", updated_at: new Date().toISOString() })
        .eq("id", sessionId)
      if (error) console.error("Error updating session title:", error)

      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title: title || "New Chat" } : s)))
    } catch (error) {
      const fallbackTitle = firstMessage.length > 50 ? firstMessage.substring(0, 50) + "..." : firstMessage
      await supabase
        .from("chat_sessions")
        .update({ title: fallbackTitle, updated_at: new Date().toISOString() })
        .eq("id", sessionId)
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title: fallbackTitle } : s)))
    }
  }

  const loadSession = async (sessionId: string) => {
    if (!user) return // Only load session if user is logged in
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
    if (error) return

    const loadedMessages: Message[] = data.map((msg: any) => {
      let content = msg.content
      let attachments: AttachmentMeta[] | undefined = undefined

      try {
        if (content && typeof content === "string" && content.includes("[Attachment")) {
          const attachmentMarkerIndex = content.search(/\[Attachments?\]/i)

          if (attachmentMarkerIndex !== -1) {
            // Split content at the attachment marker
            const mainContent = content.substring(0, attachmentMarkerIndex).trim()
            const attachmentText = content.substring(attachmentMarkerIndex)

            // Try to parse attachments
            const imageMatches = attachmentText.matchAll(
              /- name:\s*([^\n]+)\s*\n- type:\s*image\s*\n- size:\s*(\d+)\s*\n- (?:url|data):\s*([^\n]+)/gi,
            )

            const parsedAttachments: AttachmentMeta[] = []
            for (const match of imageMatches) {
              const [, name, size, url] = match
              if (name && size && url) {
                const cleanUrl = url.trim()
                parsedAttachments.push({
                  name: name.trim(),
                  type: "image",
                  size: Number.parseInt(size.trim()),
                  previewUrl: cleanUrl,
                  dataUrl: cleanUrl.startsWith("data:") ? cleanUrl : undefined,
                  storageUrl: cleanUrl.startsWith("http") ? cleanUrl : undefined,
                })
              }
            }

            // Only update content and attachments if we successfully parsed attachments
            if (parsedAttachments.length > 0) {
              attachments = parsedAttachments
              content = mainContent
            }
          }
        }
      } catch (parseError) {
        // If parsing fails, keep the original content
        console.error("Failed to parse attachments, keeping original content:", parseError)
      }

      return {
        id: msg.id,
        role: msg.role,
        content,
        timestamp: new Date(msg.created_at),
        attachment: attachments,
      }
    })

    setMessages(loadedMessages)
    setCurrentSessionId(sessionId)
    setShowHistory(false)
  }

  const onSelectFiles: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      setFileInputKey((k) => k + 1)
      return
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign up or sign in to upload images",
        variant: "destructive",
      })
      setFileInputKey((k) => k + 1)
      return
    }

    const file = files[0]
    const maxSize = 5 * 1024 * 1024
    const maxCount = 10

    if (attachments.length >= maxCount) {
      toast({
        title: "Limit reached",
        description: `Maximum ${maxCount} images allowed`,
        variant: "destructive",
      })
      setFileInputKey((k) => k + 1)
      return
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Only image files are allowed",
        variant: "destructive",
      })
      setFileInputKey((k) => k + 1)
      return
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      })
      setFileInputKey((k) => k + 1)
      return
    }

    setIsUploadingImage(true)

    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const base64Data = await base64Promise

      const fileExt = file.name.split(".").pop()
      const fileName = `chat/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}` // Added chat/ prefix to organize files

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatar-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("[v0] Upload error:", uploadError)

        if (uploadError.message?.includes("Bucket not found")) {
          toast({
            title: "Storage not configured",
            description: "Please contact support",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Upload failed",
            description: uploadError.message,
            variant: "destructive",
          })
        }

        setIsUploadingImage(false)
        setFileInputKey((k) => k + 1)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatar-images").getPublicUrl(fileName)

      setAttachments((prev) => [
        ...prev,
        {
          name: file.name,
          type: "image",
          size: file.size,
          previewUrl: publicUrl,
          dataUrl: base64Data,
          storageUrl: publicUrl,
        },
      ])

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error) {
      console.error("[v0] Upload error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFileInputKey((k) => k + 1)
      setIsUploadingImage(false)
    }
  }

  const handleImageUploadDialogSelect = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign up or sign in to upload images",
        variant: "destructive",
      })
      setShowImageUploadDialog(false)
      return
    }

    const maxSize = 5 * 1024 * 1024
    const maxCount = 10

    if (attachments.length >= maxCount) {
      toast({
        title: "Limit reached",
        description: `Maximum ${maxCount} images allowed`,
        variant: "destructive",
      })
      setShowImageUploadDialog(false)
      return
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Only image files are allowed",
        variant: "destructive",
      })
      return
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploadingImage(true)

    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const base64Data = await base64Promise

      const fileExt = file.name.split(".").pop()
      const fileName = `chat/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}` // Added chat/ prefix to organize files

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatar-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("[v0] Upload error:", uploadError)

        if (uploadError.message?.includes("Bucket not found")) {
          toast({
            title: "Storage not configured",
            description: "Please contact support",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Upload failed",
            description: uploadError.message,
            variant: "destructive",
          })
        }

        setIsUploadingImage(false)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatar-images").getPublicUrl(fileName)

      setAttachments((prev) => [
        ...prev,
        {
          name: file.name,
          type: "image",
          size: file.size,
          previewUrl: publicUrl,
          dataUrl: base64Data,
          storageUrl: publicUrl,
        },
      ])

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error) {
      console.error("[v0] Upload error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const removeAttachment = (name: string) => {
    setAttachments((prev) => {
      prev.forEach((a) => {
        if (a.name === name && a.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(a.previewUrl)
      })
      return prev.filter((a) => a.name !== name)
    })
  }

  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      microphone.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const SPEECH_THRESHOLD = 50
      const SILENCE_DURATION = 1500

      const updateLevel = () => {
        if (!analyserRef.current) return

        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        const normalizedLevel = Math.min(average / 50, 2)
        setAudioLevel(normalizedLevel)

        const isSpeaking = average > SPEECH_THRESHOLD

        if (isSpeaking) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }
          isSpeakingRef.current = true
        } else if (isSpeakingRef.current && transcriptRef.current.trim()) {
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              if (transcriptRef.current.trim()) {
                stopRecordingAndSend()
              }
            }, SILENCE_DURATION)
          }
        }

        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }

      updateLevel()
    } catch (error) {
      console.error("[v0] Audio analysis error:", error)
      setIsRecording(false)
      setAudioLevel(0)
      setToastMessage("Something went wrong")
      setShowToast(true)
    }
  }

  const stopAudioAnalysis = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    analyserRef.current = null
    setAudioLevel(0)
    isSpeakingRef.current = false
  }

  const stopRecordingAndSend = () => {
    if (recognition) {
      try {
        recognition.stop()
      } catch (error) {
        console.error("[v0] Error stopping recognition:", error)
      }
    }
    setIsRecording(false)
    stopAudioAnalysis()

    if (transcriptRef.current.trim().length > 3) {
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as unknown as React.FormEvent
        handleSubmit(fakeEvent)
        transcriptRef.current = ""
      }, 100)
    } else {
      transcriptRef.current = ""
    }
  }

  const handleVoiceInput = () => {
    router.push("/voice")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachments.length === 0) || isLoading) return

    if (showTermsNotice) {
      setShowTermsNotice(false)
      localStorage.setItem("hasSeenTermsNotice", "true")
    }

    const userContent = input.trim()
    const userAttachments: AttachmentMeta[] = [...attachments]

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userContent || `(Attached ${attachments.length} ${attachments.length > 1 ? "files" : "file"})`,
      timestamp: new Date(),
      attachment: userAttachments.length > 0 ? userAttachments : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    const userQuery = input.trim()
    setInput("")
    setIsLoading(true)

    const hasImage = attachments.some((a) => a.type === "image")
    const willUseTogetherAI = false // Placeholder for future logic
    setCurrentAIProvider("cerebras")

    const isCodeRequest = userQuery.toLowerCase().includes("code") || userQuery.toLowerCase().includes("generate")
    const shouldShowCodeApproval = vibeCoding && isCodeRequest

    dispatchDebugLog("info", `User submitted message: "${userMessage.content}"`, {
      hasAttachment: !!attachments.length,
      attachmentTypes: attachments.map((a) => a.type),
      selectedModel,
      aiProvider: "Google Gemma Vision + " + (willUseTogetherAI ? "Together AI" : "Cerebras"),
      userLocation,
      hasCustomInstructions: !!customInstructions,
      deepSearch,
      vibeCoding,
    })

    let sessionId = currentSessionId
    if (!sessionId && user) {
      // Only create session if user is logged in
      sessionId = await createNewSession()
      setCurrentSessionId(sessionId)
    }
    if (sessionId && user) {
      // Only save message if user is logged in
      await saveMessage(
        sessionId,
        "user",
        userMessage.content +
          (attachments.length > 0
            ? `\n\n[Attachments]\n${attachments
                .map((a) => {
                  if (a.type === "image") {
                    return `- name: ${a.name}\n- type: image\n- size: ${a.size}\n- url: ${a.storageUrl || a.previewUrl}`
                  }
                  return `- name: ${a.name}\n- type: pdf\n- size: ${a.size}\n- pdf_text:\n${a.text || ""}`
                })
                .join("\n\n")}`
            : ""),
      )
      if (messages.length === 0) await updateSessionTitle(sessionId, userMessage.content)
    }

    let assistantMessage: Message | null = null

    try {
      const controller = new AbortController()
      setAbortCtrl(controller)

      dispatchDebugLog("info", "Sending request to /api/chat", {
        model: selectedModel,
        messageCount: messages.length + 1,
        attachmentCount: attachments.length,
        userLocation,
        deepSearch,
        vibeCoding,
      })

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        credentials: "include",
        body: JSON.stringify({
          model: selectedModel,
          userLocation,
          customInstructions: customInstructions || undefined,
          deepSearch,
          vibeCoding,
          messages: [...messages, userMessage].map((m) => {
            let content = m.content
            if (m.attachment && m.attachment.length > 0) {
              const blocks = m.attachment
                .map((a) => {
                  if (a.type === "image") {
                    return `[Attachment]
- name: ${a.name}
- type: image
- size: ${a.size}
- data: ${a.dataUrl || ""}`
                  }
                  return `[Attachment]
- name: ${a.name}
- type: pdf
- size: ${a.size}
- pdf_text:
${a.text || ""}`
                })
                .join("\n\n")
              content += `\n\n${blocks}`
            }
            return { role: m.role, content }
          }),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || "Something went wrong. Please try again.")
      }

      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""
      let hasStartedStreaming = false
      let searchResults: SearchSource[] = []
      let thinkingContent = ""
      let buffer = ""

      assistantMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      }
      setMessages((prev) => [...prev, assistantMessage!])
      setStreamingMessageId(assistantMessage.id)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              dispatchDebugLog("ai", "Stream completed successfully", {
                contentLength: fullContent.length,
                hadSearchResults: searchResults.length > 0,
              })
              break
            }
            try {
              const parsed = JSON.parse(data)

              const content = parsed.choices?.[0]?.delta?.content
              const thinking = parsed.choices?.[0]?.delta?.thinking
              const results = parsed.choices?.[0]?.delta?.searchResults
              const searchPerformed = parsed.choices?.[0]?.delta?.searchPerformed
              const debugInfo = parsed.choices?.[0]?.delta?.debugInfo

              if (thinking) {
                thinkingContent += thinking
                setMessageThinking((prev) => ({
                  ...prev,
                  [assistantMessage!.id]: (prev[assistantMessage!.id] || "") + thinking,
                }))
              }

              if (debugInfo) {
                if (debugInfo.message?.includes("Searching") || debugInfo.message?.includes("search")) {
                  setShowThinkingStatus(true)
                  setThinkingAction("searching")
                  setCurrentSearchQuery(userQuery)
                } else if (debugInfo.message?.includes("Deep") || debugInfo.message?.includes("Synthesizing")) {
                  setShowThinkingStatus(true)
                  setThinkingAction("synthesizing")
                } else if (debugInfo.message?.includes("Analyzing image")) {
                  setShowThinkingStatus(true)
                  setThinkingAction("analyzing")
                }
              }

              if (searchPerformed) {
                setIsSearching(true)
                setShowThinkingStatus(true)
                setThinkingAction("searching")
                setCurrentSearchQuery(userQuery)
                dispatchDebugLog("search", "Web search initiated by API", {})
              }

              if (results && results.length > 0) {
                searchResults = results
                setIsSearching(false)
                dispatchDebugLog("search", `Received ${results.length} search results`, {
                  results: results.map((r: any) => ({ title: r.title, link: r.link })),
                })
                setMessages((prev) =>
                  prev.map((msg) => (msg.id === assistantMessage!.id ? { ...msg, searchResults: results } : msg)),
                )
              }

              if (content) {
                if (!hasStartedStreaming) {
                  setShowThinkingStatus(false)
                  hasStartedStreaming = true
                }
                fullContent += content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage!.id ? { ...msg, content: msg.content + content } : msg,
                  ),
                )
              }
            } catch (parseError) {
              // Silently continue if parsing fails
              if (data.length > 0) {
                console.error("Failed to parse stream chunk:", parseError)
              }
            }
          }
        }
      }

      setMessages((prev) => prev.map((msg) => (msg.id === assistantMessage!.id ? { ...msg, isStreaming: false } : msg)))
      setStreamingMessageId(null)
      setIsSearching(false)
      setCurrentAIProvider(null)

      if (sessionId && user && fullContent) await saveMessage(sessionId, "assistant", fullContent)
    } catch (error) {
      let friendly = "Something went wrong. Please try again."
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          friendly = "Response generation was stopped."
          dispatchDebugLog("info", "User aborted the request", {})
        } else if (error.message.includes("Failed to fetch")) {
          friendly = "Something went wrong. Please check your internet connection."
          dispatchDebugLog("error", "Network connection failed", { error: error.message })
        } else if (error.message.includes("API returned")) {
          friendly = `Server error: ${error.message}`
          dispatchDebugLog("error", "API returned error status", { error: error.message })
          //window.dispatchEvent(new CustomEvent("open-debug-panel"))
        } else {
          friendly = "Something went wrong. Please try again."
          dispatchDebugLog("error", "Unexpected error during chat", { error: error.message, stack: error.stack })
          //window.dispatchEvent(new CustomEvent("open-debug-panel"))
        }
      }

      toast({ title: "Error", description: friendly, variant: "destructive" })
      if (assistantMessage) {
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage!.id))
      }
      setStreamingMessageId(null)
      setIsSearching(false)
      setCurrentAIProvider(null)
      setShowThinkingStatus(false)
    } finally {
      setIsLoading(false)
      setShowThinkingStatus(false)
      setStreamingMessageId(null)
      setIsSearching(false)
      setCurrentAIProvider(null)
      attachments.forEach((a) => {
        if (a.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(a.previewUrl)
      })
      setAttachments([])
      setAbortCtrl(null)
      inputRef.current?.focus()
    }
  }

  const handlePause = () => {
    abortCtrl?.abort()
    dispatchDebugLog("info", "User paused response generation", {})
  }

  const handleRegenerate = async (msgIndex: number) => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    if (!lastUser) return
    setInput(lastUser.content)
    dispatchDebugLog("info", "Regenerating response", { originalMessage: lastUser.content })
    await new Promise((r) => setTimeout(r, 0))
    const fakeEvent = { preventDefault: () => {} } as unknown as React.FormEvent
    handleSubmit(fakeEvent)
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setToastMessage("Successfully copied")
      setShowToast(true)
      dispatchDebugLog("info", "Copied message to clipboard", { length: text.length })
    } catch {
      setToastMessage("Failed to copy")
      setShowToast(true)
    }
  }

  const saveToMemory = async (content: string) => {
    if (!user) {
      setToastMessage("Please sign in to save memories")
      setShowToast(true)
      return
    }
    const key = `note-${Date.now()}`
    try {
      const { error } = await supabase.from("user_memories").insert({
        user_id: user.id,
        key,
        value: content.slice(0, 200),
        category: "note",
      })
      if (error) throw error
      setToastMessage("Saved to memory")
      setShowToast(true)
      dispatchDebugLog("ai", "Saved message to memory", { key, length: content.length })
    } catch (err: any) {
      setToastMessage("Failed to save memory")
      setShowToast(true)
      dispatchDebugLog("error", "Save to memory failed", { error: err?.message || String(err) })
      window.dispatchEvent(new CustomEvent("open-debug-panel"))
    }
  }

  const suggestions = useMemo(
    () => [
      "Latest news about India budget",
      "Stock price of TCS today",
      "Weather in Delhi today",
      "Summarize a PDF I upload",
      "Explain this equation: $$E = mc^2$$",
      "Make a table comparing iPhone 15 vs 16",
    ],
    [],
  )

  const startNewChat = () => {
    setMessages([])
    setCurrentSessionId(null)
    router.push("/chat")
    dispatchDebugLog("info", "Started new chat session", {})
  }

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            const response = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`,
            )
            const data = await response.json()
            if (data.results && data.results.length > 0) {
              const location = `${data.results[0].name}, ${data.results[0].country}`
              setUserLocation(location)
              setLocationPermission("granted")
              dispatchDebugLog("info", "Location detected", { location, latitude, longitude })
            }
          } catch (error) {
            dispatchDebugLog("error", "Failed to reverse geocode location", { error })
          }
        },
        (error) => {
          setLocationPermission("denied")
          dispatchDebugLog("error", "Location permission denied", { error: error.message })
        },
      )
    }
  }

  const requestLocation = () => {
    getUserLocation()
  }

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.permissions?.query({ name: "geolocation" }).then((result) => {
        setLocationPermission(result.state as "prompt" | "granted" | "denied")
        if (result.state === "granted") {
          getUserLocation()
        }
      })
    }
  }, [])

  useEffect(() => {
    const handleInstructionsUpdate = (e: CustomEvent) => {
      setCustomInstructions(e.detail.instructions)
    }
    window.addEventListener("custom-instructions-updated", handleInstructionsUpdate as EventListener)

    return () => {
      window.removeEventListener("custom-instructions-updated", handleInstructionsUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!deepSearch || !isLoading) {
      setThinkingTimer(0)
      return
    }

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setThinkingTimer(Math.min(elapsed, 60))
    }, 100)

    return () => clearInterval(interval)
  }, [deepSearch, isLoading])

  useEffect(() => {
    const handleCodeGenerated = async (e: CustomEvent) => {
      const { code, language } = e.detail

      try {
        const response = await fetch("/api/generate-app", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language, userMessage: input }),
        })

        if (response.ok) {
          const { appId } = await response.json()
          setCodeWidgetData({ code, language, appId })
        } else {
          setCodeWidgetData({ code, language })
        }
      } catch (error) {
        console.error("[v0] Failed to generate app:", error)
        setCodeWidgetData({ code, language })
      }

      setCodeWidgetOpen(true)
    }

    window.addEventListener("code-generated", handleCodeGenerated as EventListener)
    return () => window.removeEventListener("code-generated", handleCodeGenerated as EventListener)
  }, [input])

  const handleDeselectAvatar = async () => {
    if (!user) return

    try {
      dispatchDebugLog("info", "Attempting to deselect avatar", {
        userId: user.id,
        currentAvatarId: selectedAvatar?.id,
      })

      const { error: deleteError } = await supabase.from("user_selected_avatar").delete().eq("user_id", user.id)

      if (deleteError) {
        dispatchDebugLog("error", "Error deleting avatar record", { error: deleteError })
        console.error("[v0] Delete error:", deleteError)
      } else {
        dispatchDebugLog("info", "Successfully deleted avatar record", {})
        console.log("[v0] Avatar record deleted successfully")
        setSelectedAvatar(null)
        setToastMessage("Avatar deselected - AI will now respond normally")
        setShowToast(true)
      }
    } catch (error) {
      console.error("[v0] Error deselecting avatar:", error)
      dispatchDebugLog("error", "Exception in handleDeselectAvatar", { error: String(error) })
    }
  }

  const deleteSelectedAvatar = async () => {
    if (!user || !selectedAvatar) return

    try {
      const { error } = await supabase.from("user_selected_avatar").delete().eq("user_id", user.id)

      if (!error) {
        setSelectedAvatar(null)
        setToastMessage("Avatar unselected")
        setShowToast(true)
      }
    } catch (err) {
      console.error("[v0] Error deleting avatar:", err)
    }
  }

  const handleAgeSubmit = async (age: number) => {
    if (!user) return

    try {
      const { error } = await supabase.from("user_ages").insert({
        user_id: user.id,
        age,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error saving age:", error)
        toast({
          title: "Error",
          description: "Failed to save age. Please try again.",
          variant: "destructive",
        })
      } else {
        setShowAgeVerification(false)
        toast({
          title: "Success",
          description: "Age verified successfully",
        })
      }
    } catch (error) {
      console.error("Error saving age:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isInitialLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-lg font-medium">Loading Noxy AI</p>
            <p className="text-sm text-muted-foreground">Preparing your chat experience...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg flex-shrink-0 transition-all duration-300 ease-out hover:scale-105 hover:bg-accent/80 active:scale-95"
          onClick={() => setShowHistory(true)}
        >
          <Menu className="w-5 h-5 transition-transform duration-200" />
        </Button>
        <div className="flex-1 overflow-hidden mx-4">
          <div className="flex items-center justify-center gap-2">
            <Link href="/chat">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-4 transition-all duration-300 ease-out hover:scale-105 hover:bg-accent/80 active:scale-95 relative overflow-hidden group"
              >
                <span className="relative z-10">Ask</span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Button>
            </Link>
            <Link href="/image">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-4 transition-all duration-300 ease-out hover:scale-105 hover:bg-accent/80 active:scale-95 relative overflow-hidden group"
              >
                <span className="relative z-10">Imagine</span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {locationPermission === "prompt" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={requestLocation}
              aria-label="Enable location"
              title="Enable location for weather and time"
              className="rounded-lg flex-shrink-0 transition-all duration-300 ease-out hover:scale-105 hover:bg-accent/80 active:scale-95"
            >
              <MapPin className="w-5 h-5 transition-transform duration-200 hover:animate-pulse" />
            </Button>
          )}
          {locationPermission === "granted" && userLocation && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Location enabled"
              title={`Location: ${userLocation}`}
              className="rounded-lg flex-shrink-0 text-primary transition-all duration-300 ease-out hover:scale-105 active:scale-95"
            >
              <MapPin className="w-5 h-5 fill-current transition-transform duration-200" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={startNewChat}
            aria-label="Start new chat"
            className="rounded-lg flex-shrink-0 transition-all duration-300 ease-out hover:scale-105 hover:bg-accent/80 hover:rotate-90 active:scale-95"
          >
            <Plus className="w-5 h-5 transition-transform duration-300" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="More options"
                className="rounded-lg flex-shrink-0 transition-all duration-300 ease-out hover:scale-105 hover:bg-accent/80 active:scale-95"
              >
                <MoreVertical className="w-5 h-5 transition-transform duration-200" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 animate-scale-in">
              <DropdownMenuItem
                onClick={() => router.push("/")}
                className="transition-all duration-200 ease-out hover:translate-x-1 cursor-pointer"
              >
                <Home className="w-4 h-4 mr-2 transition-transform duration-200" /> Home
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowHistory(true)}
                className="transition-all duration-200 ease-out hover:translate-x-1 cursor-pointer"
              >
                <History className="w-4 h-4 mr-2 transition-transform duration-200" /> History
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (currentSessionId) {
                    const session = sessions.find((s) => s.id === currentSessionId)
                    if (session?.is_public && session?.short_id) {
                      const shareUrl = `${window.location.origin}/share/${session.short_id}`
                      navigator.clipboard.writeText(shareUrl)
                      setToastMessage("Share link copied!")
                      setShowToast(true)
                    } else {
                      setToastMessage("Please make this chat public first from history")
                      setShowToast(true)
                    }
                  }
                }}
                className="transition-all duration-200 ease-out hover:translate-x-1 cursor-pointer"
              >
                <Share2 className="w-4 h-4 mr-2 transition-transform duration-200" /> Share
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="transition-all duration-200 ease-out hover:translate-x-1 cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2 transition-transform duration-200 hover:rotate-90" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/memory")}
                className="transition-all duration-200 ease-out hover:translate-x-1 cursor-pointer"
              >
                <Brain className="w-4 h-4 mr-2 transition-transform duration-200" /> Memories
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/avatar")}
                className="transition-all duration-200 ease-out hover:translate-x-1 cursor-pointer"
              >
                <Users className="w-4 h-4 mr-2 transition-transform duration-200" /> Avatars
              </DropdownMenuItem>
              {locationPermission !== "granted" && (
                <DropdownMenuItem
                  onClick={requestLocation}
                  className="transition-all duration-200 ease-out hover:translate-x-1 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 mr-2 transition-transform duration-200" /> Enable Location
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {searchError && (
          <div className="mx-auto px-4 pt-4 max-w-3xl">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 flex items-start gap-3">
              <span className="text-destructive text-sm flex-1 break-words">{searchError}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchError(null)}
                className="h-6 w-6 p-0 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="mx-auto px-4 py-6 space-y-6 max-w-3xl">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <img
                src={selectedAvatar?.image_url || "/logo-black.png"}
                alt={selectedAvatar?.name || "Noxy AI"}
                className="w-16 h-16 mb-6 dark:invert rounded-full object-cover"
              />
              <h2 className="text-2xl font-semibold mb-2">
                {selectedAvatar ? `Hi, I'm ${selectedAvatar.name}.` : "Hi, I'm Noxy."}
              </h2>
              <p className="text-muted-foreground text-base mb-8">
                {selectedAvatar ? "How can I help you today?" : "How can I help you today?"}
              </p>
            </div>
          )}

          {showTermsNotice && !user && messages.length === 0 && (
            <div className="mx-auto px-4 pt-4 max-w-3xl">
              <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 flex items-start gap-3">
                <span className="text-sm flex-1">
                  By messaging Noxy, you accept our{" "}
                  <Link href="/terms" className="underline hover:text-primary">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline hover:text-primary">
                    Privacy Policy
                  </Link>
                  .
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowTermsNotice(false)
                    localStorage.setItem("hasSeenTermsNotice", "true")
                  }}
                  className="h-6 w-6 p-0 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {messages.map((message, idx) => (
            <div key={message.id} className="space-y-3">
              {message.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-muted rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-[80%] text-sm break-words">
                    {message.content}
                    {message.attachment && message.attachment.length > 0 && (
                      <div className="mt-2">
                        {message.attachment.length === 1 ? (
                          <img
                            src={message.attachment[0].storageUrl || message.attachment[0].previewUrl}
                            alt={message.attachment[0].name}
                            className="rounded-lg max-h-[50vh] w-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setPopupImages([message.attachment![0].storageUrl || message.attachment![0].previewUrl])
                              setPopupImageIndex(0)
                              setShowImagePopup(true)
                            }}
                          />
                        ) : (
                          <div className="relative">
                            <img
                              src={message.attachment[0].storageUrl || message.attachment[0].previewUrl}
                              alt={message.attachment[0].name}
                              className="rounded-lg w-24 h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity border-2 border-border"
                              onClick={() => {
                                setPopupImages(message.attachment!.map((a) => a.storageUrl || a.previewUrl))
                                setPopupImageIndex(0)
                                setShowImagePopup(true)
                              }}
                            />
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                              +{message.attachment.length - 1}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                      <AvatarImage
                        src={selectedAvatar?.image_url || "/logo-black.png"}
                        alt={selectedAvatar?.name || "Noxy"}
                        className={selectedAvatar ? "" : "dark:invert dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {selectedAvatar ? selectedAvatar.name.substring(0, 2).toUpperCase() : "AI"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-sm leading-relaxed break-words min-w-0">
                      {message.isStreaming && streamingMessageId === message.id ? (
                        <MessageContent content={message.content} />
                      ) : (
                        <MessageContent content={message.content} />
                      )}

                      {messageThinking[message.id] && (
                        <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setShowReasoningForMessage((prev) => ({
                                ...prev,
                                [message.id]: !prev[message.id],
                              }))
                            }
                            className="h-9 px-3 text-xs font-medium hover:bg-muted/50 transition-colors gap-2 text-muted-foreground hover:text-foreground"
                          >
                            <Brain className="w-4 h-4" />
                            {showReasoningForMessage[message.id] ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" />
                                Hide Reasoning
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" />
                                Show Reasoning
                              </>
                            )}
                          </Button>
                          {showReasoningForMessage[message.id] && (
                            <div className="mt-3 p-4 bg-muted/40 rounded-lg border border-border/60 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-primary" />
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  AI Reasoning
                                </div>
                              </div>
                              <div className="text-sm text-foreground/75 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto scrollbar-thin">
                                {messageThinking[message.id]}
                                {message.isStreaming && streamingMessageId === message.id && (
                                  <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary animate-pulse align-middle" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {message.searchResults && message.searchResults.length > 0 && (
                        <SearchSources sources={message.searchResults} />
                      )}
                      {!message.isStreaming && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleRegenerate(idx)} className="h-8">
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Regenerate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(message.content)}
                            className="h-8"
                          >
                            <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveToMemory(message.content)}
                            className="h-8"
                            aria-label="Save to memory"
                            title="Save to memory"
                          >
                            <Brain className="w-3.5 h-3.5 mr-1.5" /> Remember
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && !showThinkingStatus && messages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                  <AvatarImage
                    src={selectedAvatar?.image_url || "/logo-black.png"}
                    alt={selectedAvatar?.name || "Noxy"}
                    className={selectedAvatar ? "" : "dark:invert"}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {selectedAvatar ? selectedAvatar.name.substring(0, 2).toUpperCase() : "AI"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {selectedAvatar ? (
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  ) : (
                    <div className="flex items-center gap-1">
                      <img
                        src="/logo-black.png"
                        alt="Noxy"
                        className="w-6 h-6 dark:invert dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] animate-spin"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showThinkingStatus && (
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                  <AvatarImage
                    src={selectedAvatar?.image_url || "/logo-black.png"}
                    alt={selectedAvatar?.name || "Noxy"}
                    className={selectedAvatar ? "" : "dark:invert"}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {selectedAvatar ? selectedAvatar.name.substring(0, 2).toUpperCase() : "AI"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <ThinkingStatus
                    isVisible={showThinkingStatus}
                    currentAction={thinkingAction}
                    searchQuery={currentSearchQuery}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] bg-background flex-shrink-0">
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl space-y-3">
          {isUploadingImage && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2 bg-muted/50 rounded-lg">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Uploading image...</span>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-2 flex-1">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {attachments.length} {attachments.length === 1 ? "image" : "images"} attached
                </span>
              </div>
              <div className="flex items-center gap-1">
                {attachments.map((a, idx) => (
                  <Button
                    key={a.name}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => removeAttachment(a.name)}
                  >
                    {idx + 1}
                    <X className="w-3 h-3 ml-1" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setDeepSearch(!deepSearch)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                deepSearch
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "bg-white dark:bg-black text-black dark:text-white border border-border hover:bg-muted"
              }`}
              aria-label="Toggle Think Harder mode"
              title="Think Harder: Get more comprehensive responses with multiple AI passes"
            >
              <Brain className="w-4 h-4" />
              <span>Think Harder</span>
              {isLoading && deepSearch && thinkingTimer > 0 && (
                <span className="ml-2 text-xs opacity-75">{thinkingTimer}s</span>
              )}
            </button>
          </div>

          <div className="relative">
            <div className="flex items-end gap-2 rounded-3xl border border-muted bg-muted/30 focus-within:bg-background focus-within:border-primary/50 transition-all px-4 py-3">
              {input.trim() === "" && attachments.length === 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={handleVoiceInput}
                  title="Talk with AI"
                >
                  <Mic className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 flex-shrink-0 transition-transform ${
                    isRecording ? "text-red-500 animate-[pulse_1s_ease-in-out_infinite] scale-110" : ""
                  }`}
                  onClick={handleVoiceInput}
                  disabled={isLoading}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 flex-shrink-0"
                onClick={() => setShowImageUploadDialog(true)}
                disabled={isLoading}
              >
                <Paperclip className="w-5 h-5" />
              </Button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e as any)
                  }
                }}
                placeholder="Ask anything"
                disabled={isLoading}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground resize-none max-h-32 overflow-y-auto scrollbar-thin py-2"
                style={{
                  minHeight: "24px",
                  height: "auto",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "auto"
                  target.style.height = Math.min(target.scrollHeight, 128) + "px"
                }}
                autoFocus
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    disabled={isLoading}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => setVibeCoding(!vibeCoding)}
                    className={vibeCoding ? "bg-primary/10" : ""}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="checkbox"
                        checked={vibeCoding}
                        onChange={() => {}}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span>Vibe Coding</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {!isLoading ? (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() && attachments.length === 0}
                  className="h-10 w-10 rounded-full bg-black hover:bg-gray-800 flex-shrink-0 disabled:opacity-50 mb-0.5 text-white"
                >
                  <ChevronUp className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  onClick={handlePause}
                  className="h-10 w-10 rounded-full bg-black hover:bg-gray-800 flex-shrink-0 mb-0.5 text-white"
                >
                  <Pause className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            {/* Pass isPro prop to ModelPicker */}
            <ModelPicker
              value={selectedModel}
              onChange={setSelectedModel}
              isPro={isPro}
              subscriptionLoaded={subscriptionLoaded}
            />
          </div>
        </form>
      </div>

      <HistoryMenu
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectSession={loadSession}
        currentSessionId={currentSessionId}
      />

      <FeedbackNotification />

      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}

      <CodeWidget
        isOpen={codeWidgetOpen}
        onClose={() => setCodeWidgetOpen(false)}
        code={codeWidgetData.code}
        language={codeWidgetData.language}
        appId={codeWidgetData.appId}
      />

      <ImageUploadDialog
        isOpen={showImageUploadDialog}
        onClose={() => setShowImageUploadDialog(false)}
        onImageSelected={handleImageUploadDialogSelect}
        isLoading={isUploadingImage}
      />

      <AgeVerificationDialog
        isOpen={showAgeVerification}
        onSubmit={handleAgeSubmit}
        onClose={() => {
          if (user) {
            supabase.auth.signOut()
            router.push("/")
          }
        }}
      />

      {/* Removed ElevenLabsVoiceModal */}

      {showImagePopup && popupImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setShowImagePopup(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-10 w-10 bg-white/10 hover:bg-white/20 text-white rounded-full z-10"
              onClick={(e) => {
                e.stopPropagation()
                setShowImagePopup(false)
              }}
            >
              <X className="w-5 h-5" />
            </Button>

            {popupImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/10 hover:bg-white/20 text-white rounded-full z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPopupImageIndex((prev) => (prev > 0 ? prev - 1 : popupImages.length - 1))
                  }}
                >
                  <ChevronUp className="w-5 h-5 -rotate-90" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/10 hover:bg-white/20 text-white rounded-full z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPopupImageIndex((prev) => (prev < popupImages.length - 1 ? prev + 1 : 0))
                  }}
                >
                  <ChevronUp className="w-5 h-5 rotate-90" />
                </Button>
              </>
            )}

            <div className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center">
              <img
                src={popupImages[popupImageIndex] || "/placeholder.svg"}
                alt={`Image ${popupImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              {popupImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm">
                  {popupImageIndex + 1} / {popupImages.length}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
