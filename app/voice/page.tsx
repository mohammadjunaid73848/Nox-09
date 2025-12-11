"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { X, Settings, Mic, Square, MessageSquare } from "lucide-react"
import { VoiceParticleOrb } from "@/components/voice-particle-orb"
import { ElevenLabsVoiceConversation } from "@/components/elevenlabs-voice-conversation"

interface CurrentMessage {
  type: "user" | "assistant"
  content: string
}

export default function VoicePage() {
  const router = useRouter()
  const [currentMessage, setCurrentMessage] = useState<CurrentMessage | null>(null)
  const [audioFrequency, setAudioFrequency] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [showTextDisplay, setShowTextDisplay] = useState(true)
  const conversationRef = useRef<any>(null)
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadTheme = () => {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null

      if (savedTheme === "dark") {
        setTheme("dark")
      } else if (savedTheme === "light") {
        setTheme("light")
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setTheme(prefersDark ? "dark" : "light")
      }
    }

    loadTheme()
    const handleThemeChange = () => loadTheme()
    window.addEventListener("theme-changed", handleThemeChange)

    return () => {
      window.removeEventListener("theme-changed", handleThemeChange)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isConnected && navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "VOICE_CHAT_ACTIVE",
        data: { isRunning: true },
      })

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Noxyai Voice Chat", {
          body: "Voice chat is running in the background",
          icon: "/icon-192x192.png",
          tag: "voice-chat",
          requireInteraction: false,
        })
      }

      return () => {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "VOICE_CHAT_ACTIVE",
            data: { isRunning: false },
          })
        }
      }
    }
  }, [isConnected])

  const handleAddMessage = (type: "user" | "assistant", content: string) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
    }

    if (showTextDisplay) {
      setCurrentMessage({ type, content })

      if (type === "assistant") {
        messageTimeoutRef.current = setTimeout(() => {
          setCurrentMessage(null)
        }, 4000)
      }
    }
  }

  const handleStopChat = () => {
    setIsStarted(false)
    setIsConnected(false)
    setIsConnecting(false)
    if (conversationRef.current) {
      conversationRef.current.endSession?.()
    }
  }

  const handleClose = () => {
    handleStopChat()
    router.push("/chat")
  }

  const handleSettings = () => {
    router.push("/settings")
  }

  const handleStartChat = () => {
    setIsStarted(true)
    setIsConnecting(true)
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
    }
  }

  const bgClass =
    theme === "dark" ? "bg-gradient-to-b from-slate-950 to-slate-900" : "bg-gradient-to-b from-slate-50 to-white"

  const textClass = theme === "dark" ? "text-white" : "text-gray-900"

  return (
    <div className={`fixed inset-0 flex flex-col ${bgClass} ${textClass}`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 border-b ${theme === "dark" ? "border-white/10" : "border-gray-200"}`}
      >
        <h1 className="text-lg font-semibold">Voice Chat</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTextDisplay(!showTextDisplay)}
            className={`${theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-200"} ${
              !showTextDisplay ? (theme === "dark" ? "bg-white/20" : "bg-gray-300") : ""
            }`}
            title={showTextDisplay ? "Hide text responses" : "Show text responses"}
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSettings}
            className={theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-200"}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className={theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-200"}
            title="Close voice chat"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* AI Response Display */}
        {currentMessage && showTextDisplay && (
          <div className="flex-1 flex items-center justify-center p-4 mb-8">
            <div
              className={`max-w-sm px-6 py-8 rounded-2xl text-center animate-in fade-in duration-300 ${
                currentMessage.type === "assistant"
                  ? theme === "dark"
                    ? "bg-blue-600/20 text-blue-100 border border-blue-500/30"
                    : "bg-blue-100 text-blue-900 border border-blue-300"
                  : theme === "dark"
                    ? "bg-gray-700/20 text-gray-100 border border-gray-600/30"
                    : "bg-gray-200 text-gray-900 border border-gray-300"
              }`}
            >
              <p className="text-base font-medium leading-relaxed">{currentMessage.content}</p>
            </div>
          </div>
        )}

        {/* Particle Orb */}
        {!currentMessage && (
          <div className="w-full max-w-sm h-72 mb-8 flex items-center justify-center">
            <VoiceParticleOrb isActive={isConnected} audioFrequency={audioFrequency} isDarkMode={theme === "dark"} />
          </div>
        )}

        {/* Connecting/Calling Status */}
        {isConnecting && !isConnected && (
          <div className="mb-8 text-center">
            <p className={`text-sm font-medium ${theme === "dark" ? "text-yellow-400" : "text-yellow-600"}`}>
              Calling...
            </p>
            <div className="mt-2 flex justify-center gap-1">
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-current rounded-full animate-pulse delay-100" />
              <div className="w-1 h-1 bg-current rounded-full animate-pulse delay-200" />
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-4 mt-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={handleClose}
            className={`rounded-full ${
              theme === "dark"
                ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                : "bg-gray-200 border-gray-300 text-gray-900 hover:bg-gray-300"
            }`}
          >
            <X className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            onClick={() => (isStarted ? handleStopChat() : handleStartChat())}
            className={`rounded-full px-8 ${
              isConnected ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
          >
            {isConnected ? (
              <>
                <Square className="w-4 h-4 mr-2 fill-current" />
                Stop Chat
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                {isConnecting ? "Connecting..." : "Start Chat"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Voice Conversation Handler */}
      {isStarted && (
        <ElevenLabsVoiceConversation
          agentId="agent_4401k9q421w5fad81mfg4dvwvnbb"
          onMessageReceived={(message) => handleAddMessage("assistant", message)}
          onUserSpoke={(text) => handleAddMessage("user", text)}
          onConnectionStatusChange={(connected) => {
            setIsConnected(connected)
            if (connected) {
              setIsConnecting(false)
            }
          }}
          onAudioFrequency={setAudioFrequency}
          onConversationRef={(ref) => {
            conversationRef.current = ref
          }}
          isActive={isStarted}
        />
      )}
    </div>
  )
}
