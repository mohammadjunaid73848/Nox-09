"use client"

import type React from "react"
import { useRef, useEffect } from "react"

interface ElevenLabsVoiceConversationProps {
  agentId: string
  onMessageReceived?: (message: string) => void
  onUserSpoke?: (text: string) => void
  onConnectionStatusChange?: (connected: boolean) => void
  onAudioFrequency?: (frequency: number) => void
  onConversationRef?: (ref: any) => void
  isActive?: boolean
}

export const ElevenLabsVoiceConversation: React.FC<ElevenLabsVoiceConversationProps> = ({
  agentId,
  onMessageReceived,
  onUserSpoke,
  onConnectionStatusChange,
  onAudioFrequency,
  onConversationRef,
  isActive = true,
}) => {
  const conversationRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    isMountedRef.current = true

    if (isActive) {
      startVoiceChat()
    }

    return () => {
      isMountedRef.current = false
      stopVoiceChat()
    }
  }, [isActive])

  useEffect(() => {
    onConversationRef?.(conversationRef.current)
  }, [onConversationRef])

  const startVoiceChat = async () => {
    try {
      if (!isMountedRef.current) return

      // Request microphone permission
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      if (!isMountedRef.current) return

      // Setup audio frequency monitoring
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      if (!analyserRef.current && streamRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(streamRef.current)
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        source.connect(analyserRef.current)

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        monitorIntervalRef.current = setInterval(() => {
          if (analyserRef.current && isMountedRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray)
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length / 255
            const newFrequency = Math.min(average, 1)
            onAudioFrequency?.(newFrequency)
          }
        }, 50)
      }

      if (!isMountedRef.current) return

      // Dynamically import and initialize ElevenLabs Conversation
      const { Conversation } = await import("@elevenlabs/client")

      if (!isMountedRef.current) return

      conversationRef.current = await Conversation.startSession({
        agentId: agentId,
        connectionType: "webrtc",
        onConnect: () => {
          if (isMountedRef.current) {
            console.log("[v0] Connected to ElevenLabs agent")
            onConnectionStatusChange?.(true)
          }
        },
        onDisconnect: () => {
          if (isMountedRef.current) {
            console.log("[v0] Disconnected from agent")
            onConnectionStatusChange?.(false)
          }
        },
        onMessage: (message: any) => {
          if (isMountedRef.current && message?.type === "assistant_message") {
            const text = message.content?.[0]?.text || message.message || ""
            if (text) {
              onMessageReceived?.(text)
            }
          }
        },
        onUserMessage: (message: any) => {
          if (isMountedRef.current && message?.type === "user_message") {
            const text = message.content?.[0]?.text || message.message || ""
            if (text) {
              onUserSpoke?.(text)
            }
          }
        },
        onError: (error: any) => {
          if (isMountedRef.current) {
            console.error("[v0] ElevenLabs error:", error)
            onConnectionStatusChange?.(false)
          }
        },
      })

      if (isMountedRef.current) {
        onConversationRef?.(conversationRef.current)
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error("[v0] Failed to start voice chat:", error)
        onConnectionStatusChange?.(false)
      }
    }
  }

  const stopVoiceChat = () => {
    isMountedRef.current = false

    if (conversationRef.current) {
      try {
        conversationRef.current.endSession?.()
      } catch (e) {
        console.error("[v0] Error ending session:", e)
      }
      conversationRef.current = null
    }

    onConnectionStatusChange?.(false)

    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current)
      monitorIntervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  return null
}
