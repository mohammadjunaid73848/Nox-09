"use client"

import type React from "react"
import { useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, Camera } from "lucide-react"

interface ImageUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onImageSelected: (file: File) => void
  isLoading?: boolean
}

export function ImageUploadDialog({ isOpen, onClose, onImageSelected, isLoading }: ImageUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0] // Only take the first file
      if (file && file.type.startsWith("image/")) {
        onImageSelected(file)
        // Don't close the dialog - let user add more images manually
      }
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      onImageSelected(file)
      // Don't close the dialog - let user add more images manually
    }
    // Reset the input
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-center">Upload Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {/* Upload from device */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <Upload className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="text-left">
              <div className="font-medium text-sm">Photos</div>
              <div className="text-xs text-muted-foreground">Choose from your device</div>
            </div>
          </button>

          {/* Open camera */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <Camera className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="text-left">
              <div className="font-medium text-sm">Camera</div>
              <div className="text-xs text-muted-foreground">Take a photo</div>
            </div>
          </button>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
