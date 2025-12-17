"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Moon, Sun, Save, Loader2, Monitor, Globe, Type } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Toast } from "@/components/ui/toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SUPPORTED_LANGUAGES, type LanguageCode, getTranslation } from "@/lib/i18n/translations"
import { FONT_OPTIONS, type FontOption, getFontClassName } from "@/lib/fonts/font-options"

export default function SettingsPage() {
  const router = useRouter()
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system")
  const [language, setLanguage] = useState<LanguageCode>("en")
  const [selectedFont, setSelectedFont] = useState<FontOption>("geist")
  const [instructions, setInstructions] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const supabase = createClient()

  const t = getTranslation(language)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null
    if (savedTheme === "dark" || savedTheme === "light") {
      setThemeMode(savedTheme)
      applyTheme(savedTheme)
    } else if (savedTheme === "system" || !savedTheme) {
      setThemeMode("system")
      applySystemTheme()
    }

    const savedLanguage = localStorage.getItem("language") as LanguageCode | null
    if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
      setLanguage(savedLanguage)
      document.documentElement.lang = savedLanguage
    }

    const savedFont = localStorage.getItem("font") as FontOption | null
    if (savedFont && FONT_OPTIONS[savedFont]) {
      setSelectedFont(savedFont)
      applyFont(savedFont)
    }
  }, [])

  const applySystemTheme = () => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    if (mediaQuery.matches) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const applyTheme = (theme: "light" | "dark" | "system") => {
    if (theme === "system") {
      applySystemTheme()
    } else if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const applyFont = (font: FontOption) => {
    const fontClass = getFontClassName(font)
    Object.values(FONT_OPTIONS).forEach((option) => {
      document.documentElement.classList.remove(option.className)
      document.body.classList.remove(option.className)
    })
    document.documentElement.classList.add(fontClass)
    document.body.classList.add(fontClass)
  }

  useEffect(() => {
    loadUserAndInstructions()
  }, [])

  const loadUserAndInstructions = async () => {
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data, error } = await supabase
          .from("user_instructions")
          .select("instructions")
          .eq("user_id", user.id)
          .single()

        if (data && !error) {
          setInstructions(data.instructions)
        }
      }
    } catch (error) {
      console.error("Error loading instructions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) {
      setToastMessage(t.settings.signInToSave)
      setShowToast(true)
      return
    }

    setIsSaving(true)
    try {
      const { data: existing } = await supabase.from("user_instructions").select("id").eq("user_id", user.id).single()

      if (existing) {
        const { error } = await supabase
          .from("user_instructions")
          .update({
            instructions: instructions,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("user_instructions").insert({
          user_id: user.id,
          instructions: instructions,
        })

        if (error) throw error
      }

      window.dispatchEvent(
        new CustomEvent("custom-instructions-updated", {
          detail: { instructions },
        }),
      )

      setToastMessage(t.settings.instructionsSaved)
      setShowToast(true)
    } catch (error: any) {
      console.error("Error saving instructions:", error)
      setToastMessage(t.settings.instructionsFailed)
      setShowToast(true)
    } finally {
      setIsSaving(false)
    }
  }

  const handleThemeChange = (mode: "light" | "dark" | "system") => {
    setThemeMode(mode)
    localStorage.setItem("theme", mode)
    applyTheme(mode)
    window.dispatchEvent(new Event("theme-changed"))
  }

  const handleLanguageChange = (newLanguage: LanguageCode) => {
    setLanguage(newLanguage)
    localStorage.setItem("language", newLanguage)
    document.documentElement.lang = newLanguage
    window.dispatchEvent(new CustomEvent("language-changed", { detail: { language: newLanguage } }))
  }

  const handleFontChange = (newFont: FontOption) => {
    setSelectedFont(newFont)
    localStorage.setItem("font", newFont)
    applyFont(newFont)
    window.dispatchEvent(new CustomEvent("font-changed", { detail: { font: newFont } }))
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-base font-medium">{t.settings.title}</h1>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-8">
          {/* Theme Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">{t.settings.appearance}</h2>
              <p className="text-sm text-muted-foreground">{t.settings.appearanceDesc}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={themeMode === "light" ? "default" : "outline"}
                onClick={() => handleThemeChange("light")}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Sun className="w-4 h-4" />
                {t.settings.light}
              </Button>
              <Button
                variant={themeMode === "dark" ? "default" : "outline"}
                onClick={() => handleThemeChange("dark")}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Moon className="w-4 h-4" />
                {t.settings.dark}
              </Button>
              <Button
                variant={themeMode === "system" ? "default" : "outline"}
                onClick={() => handleThemeChange("system")}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                {t.settings.system}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">{t.settings.language}</h2>
              <p className="text-sm text-muted-foreground">{t.settings.languageDesc}</p>
            </div>
            <Select value={language} onValueChange={(value) => handleLanguageChange(value as LanguageCode)}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                  <SelectItem key={code} value={code}>
                    {lang.nativeName} ({lang.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">{t.settings.font}</h2>
              <p className="text-sm text-muted-foreground">{t.settings.fontDesc}</p>
            </div>
            <Select value={selectedFont} onValueChange={(value) => handleFontChange(value as FontOption)}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FONT_OPTIONS).map(([key, font]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{font.name}</span>
                      <span className={`text-xs text-muted-foreground ${font.className}`}>{font.preview}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="p-4 border border-border rounded-lg bg-muted/30">
              <p className={`text-sm ${getFontClassName(selectedFont)}`}>{FONT_OPTIONS[selectedFont].preview}</p>
            </div>
          </div>

          {/* Custom Instructions Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">{t.settings.aiMemory}</h2>
              <p className="text-sm text-muted-foreground">{t.settings.aiMemoryDesc}</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instructions" className="text-base">
                    {t.settings.customInstructions}
                  </Label>
                  <Textarea
                    id="instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder={t.settings.instructionsPlaceholder}
                    className="min-h-[200px] resize-none border-green-500/50 focus-visible:ring-green-500"
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-green-600 dark:text-green-400">{t.settings.aiMemoryDesc}</p>
                    <p className="text-muted-foreground">{instructions.length}/1000</p>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving || !user}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.settings.saving}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {t.settings.saveInstructions}
                    </>
                  )}
                </Button>

                {!user && <p className="text-sm text-center text-muted-foreground">{t.settings.signInToSave}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}
    </div>
  )
}
