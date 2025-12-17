"use client"

import type React from "react"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/i18n/translations"
import { FONT_OPTIONS, type FontOption, getFontClassName } from "@/lib/fonts/font-options"

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlLanguage = searchParams.get("language") as LanguageCode | null
    if (urlLanguage && SUPPORTED_LANGUAGES[urlLanguage]) {
      localStorage.setItem("language", urlLanguage)
      document.documentElement.lang = urlLanguage
    }

    const savedLanguage = localStorage.getItem("language") as LanguageCode | null
    if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
      document.documentElement.lang = savedLanguage
    }

    const savedFont = localStorage.getItem("font") as FontOption | null
    if (savedFont && FONT_OPTIONS[savedFont]) {
      const fontClass = getFontClassName(savedFont)

      // Remove all font classes from html and body
      Object.values(FONT_OPTIONS).forEach((option) => {
        document.documentElement.classList.remove(option.className)
        document.body.classList.remove(option.className)
      })

      // Add selected font class to both html and body
      document.documentElement.classList.add(fontClass)
      document.body.classList.add(fontClass)
    }

    const handleLanguageChange = (e: CustomEvent<{ language: LanguageCode }>) => {
      document.documentElement.lang = e.detail.language
    }

    const handleFontChange = (e: CustomEvent<{ font: FontOption }>) => {
      const fontClass = getFontClassName(e.detail.font)

      // Remove all font classes
      Object.values(FONT_OPTIONS).forEach((option) => {
        document.documentElement.classList.remove(option.className)
        document.body.classList.remove(option.className)
      })

      // Add new font class
      document.documentElement.classList.add(fontClass)
      document.body.classList.add(fontClass)
    }

    window.addEventListener("language-changed", handleLanguageChange as EventListener)
    window.addEventListener("font-changed", handleFontChange as EventListener)

    return () => {
      window.removeEventListener("language-changed", handleLanguageChange as EventListener)
      window.removeEventListener("font-changed", handleFontChange as EventListener)
    }
  }, [searchParams])

  return <>{children}</>
}
