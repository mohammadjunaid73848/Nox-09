"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Sparkles, Download, RefreshCw, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type AspectRatio = "square" | "16:9" | "9:16"

interface GeneratedImage {
  id: string
  prompt: string
  image_url: string
  aspect_ratio: AspectRatio
  created_at: string
}

function LogoSpinner() {
  return (
    <div className="flex items-center justify-center">
      <Image
        src="/logo-black.png"
        alt="Loading"
        width={48}
        height={48}
        className="animate-spin dark:invert"
        style={{ animationDuration: "1.5s" }}
      />
    </div>
  )
}

export default function ImagePage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("square")
  const [isGenerating, setIsGenerating] = useState(false)
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const [isDark, setIsDark] = useState(false)

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
    fetchImages(1)
  }, [])

  useEffect(() => {
    if (isLoading || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1 },
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [isLoading, hasMore])

  useEffect(() => {
    if (page > 1) {
      fetchImages(page)
    }
  }, [page])

  const fetchImages = async (pageNum: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(`/api/images?page=${pageNum}&limit=20`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status}`)
      }

      const data = await response.json()

      if (pageNum === 1) {
        setImages(data.images || [])
      } else {
        setImages((prev) => [...prev, ...(data.images || [])])
      }

      setHasMore(data.images && data.images.length === 20)
    } catch (error) {
      console.error("[v0] Failed to fetch images:", error)
      setError("Failed to load images. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const generateImage = async () => {
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    setError(null)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), aspectRatio }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to generate image")
      }

      const data = await response.json()

      const newImage: GeneratedImage = {
        id: data.id,
        prompt: data.prompt,
        image_url: data.imageUrl,
        aspect_ratio: data.aspectRatio,
        created_at: data.createdAt || new Date().toISOString(),
      }

      setImages((prev) => [newImage, ...prev])
      setPrompt("")
    } catch (error) {
      console.error("[v0] Generation error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate image. Please try again."
      setError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      // Use server-side proxy to avoid CORS issues
      const proxyUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}`

      const a = document.createElement("a")
      a.href = proxyUrl
      a.download = `noxyai_${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] Download error:", error)
      // Fallback: open in new tab
      window.open(imageUrl, "_blank")
    }
  }

  const handleRemix = (prompt: string) => {
    setPrompt(prompt)
    setSelectedImage(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleImageError = (imageId: string) => {
    setImageErrors((prev) => new Set(prev).add(imageId))
  }

  const getAspectRatioClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case "16:9":
        return "aspect-[16/9]"
      case "9:16":
        return "aspect-[9/16]"
      default:
        return "aspect-square"
    }
  }

  const truncatePrompt = (text: string, maxLength = 30) => {
    if (text.length <= maxLength) return text
    const half = Math.floor(maxLength / 2)
    return `${text.slice(0, half)}...${text.slice(-half)}`
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-medium">Imagine</h1>
          <span className="px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
            FREE
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setPage(1)
            setError(null)
            setImageErrors(new Set())
            fetchImages(1)
          }}
          className="rounded-lg"
        >
          <RefreshCw className="w-5 h-5" />
        </Button>
      </header>

      {/* Generation Input */}
      <div className="sticky top-[57px] z-10 px-4 py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex gap-2 mb-3">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="type to imagine"
            className="flex-1 rounded-full"
            onKeyDown={(e) => e.key === "Enter" && generateImage()}
            disabled={isGenerating}
          />
          <Button
            onClick={generateImage}
            disabled={!prompt.trim() || isGenerating}
            size="icon"
            className="rounded-full shrink-0"
          >
            {isGenerating ? <LogoSpinner /> : <Sparkles className="w-5 h-5" />}
          </Button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex gap-2 justify-center">
          <Button
            variant={aspectRatio === "square" ? "default" : "outline"}
            size="sm"
            onClick={() => setAspectRatio("square")}
            className="rounded-full"
            disabled={isGenerating}
          >
            Square
          </Button>
          <Button
            variant={aspectRatio === "16:9" ? "default" : "outline"}
            size="sm"
            onClick={() => setAspectRatio("16:9")}
            className="rounded-full"
            disabled={isGenerating}
          >
            16:9
          </Button>
          <Button
            variant={aspectRatio === "9:16" ? "default" : "outline"}
            size="sm"
            onClick={() => setAspectRatio("9:16")}
            className="rounded-full"
            disabled={isGenerating}
          >
            9:16
          </Button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>

      {/* Image Gallery */}
      <div className="flex-1 px-4 py-4">
        {isLoading && page === 1 ? (
          <div className="flex items-center justify-center h-64">
            <LogoSpinner />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No images yet. Start creating!</p>
          </div>
        ) : (
          <>
            <div className="columns-2 gap-3 md:columns-3 lg:columns-4 space-y-3">
              {images
                .filter((image) => !imageErrors.has(image.id))
                .map((image) => (
                  <div
                    key={image.id}
                    className="relative group cursor-pointer rounded-lg overflow-hidden bg-muted break-inside-avoid mb-3"
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className={getAspectRatioClass(image.aspect_ratio)}>
                      <Image
                        src={image.image_url || "/placeholder.svg"}
                        alt={image.prompt}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        loading="lazy"
                        onError={() => handleImageError(image.id)}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  </div>
                ))}
            </div>

            {hasMore && (
              <div ref={loadMoreRef} className="flex items-center justify-center py-8">
                {isLoading && <LogoSpinner />}
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Detail Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-md p-0 gap-0 max-h-[85vh] overflow-hidden">
          {selectedImage && (
            <div className="flex flex-col">
              <div className="relative w-full max-h-[50vh] bg-muted overflow-hidden">
                <div className={`relative w-full ${getAspectRatioClass(selectedImage.aspect_ratio)}`}>
                  <Image
                    src={selectedImage.image_url || "/placeholder.svg"}
                    alt={selectedImage.prompt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 90vw, 448px"
                    onError={() => handleImageError(selectedImage.id)}
                  />
                </div>
              </div>

              <div className="p-3 sm:p-4 space-y-2">
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-1">Prompt</h3>
                  <p className="text-sm leading-relaxed" title={selectedImage.prompt}>
                    {truncatePrompt(selectedImage.prompt, 60)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(selectedImage.image_url, selectedImage.prompt)}
                    className="flex-1 rounded-full text-xs h-8"
                    size="sm"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download
                  </Button>
                  <Button
                    onClick={() => handleRemix(selectedImage.prompt)}
                    variant="outline"
                    className="flex-1 rounded-full text-xs h-8"
                    size="sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Remix
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
