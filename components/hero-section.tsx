"use client"

import type React from "react"

import { Upload, Music, Zap, CheckCircle2, Loader2 } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { ReviewerSelectionDialog } from "@/components/reviewer-selection-dialog"

export function HeroSection() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSelectionOpen, setIsSelectionOpen] = useState(false)
  const [uploadedTrackUrl, setUploadedTrackUrl] = useState<string | null>(null)
  const [uploadedTrackTitle, setUploadedTrackTitle] = useState<string | null>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter((file) => {
      return (
        file.type === "audio/mpeg" ||
        file.type === "audio/wav" ||
        file.name.endsWith(".mp3") ||
        file.name.endsWith(".wav")
      )
    })

    if (files.length > 0) {
      handleUpload(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const audioFiles = Array.from(files).filter((file) => {
        return (
          file.type === "audio/mpeg" ||
          file.type === "audio/wav" ||
          file.name.endsWith(".mp3") ||
          file.name.endsWith(".wav")
        )
      })
      if (audioFiles.length > 0) {
        handleUpload(audioFiles[0])
      }
    }
    // Reset input so same file can be selected again
    e.target.value = ""
  }

  const sanitizeFileName = (fileName: string): string => {
    // Get file extension
    const lastDotIndex = fileName.lastIndexOf(".")
    const extension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex) : ""
    const nameWithoutExt = lastDotIndex !== -1 ? fileName.slice(0, lastDotIndex) : fileName

    // Replace invalid characters with underscores
    // Keep only alphanumeric, dots, hyphens, and underscores
    const sanitized = nameWithoutExt
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_") // Replace multiple underscores with single
      .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores

    return sanitized + extension
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    const supabase = createClient()

    try {
      // Get current user (if authenticated) for consistent path structure
      const { data: { user } } = await supabase.auth.getUser()
      
      const fileName = file.name
      const sanitizedFileName = sanitizeFileName(fileName)
      
      // Use standardized path: userId/timestamp-filename (or public/timestamp-filename for guests)
      const userId = user?.id || 'public'
      const filePath = `${userId}/${Date.now()}-${sanitizedFileName}`

      // Normalize MIME type for Supabase Storage compatibility
      let contentType = file.type
      if (file.type === "audio/x-m4a" || file.type === "audio/m4a" || file.name.endsWith(".m4a")) {
        contentType = "audio/mp4"
      } else if (file.type === "audio/mp3" || file.name.endsWith(".mp3")) {
        contentType = "audio/mpeg"
      } else if (!file.type || file.type === "") {
        if (file.name.endsWith(".mp3")) {
          contentType = "audio/mpeg"
        } else if (file.name.endsWith(".wav")) {
          contentType = "audio/wav"
        } else if (file.name.endsWith(".m4a")) {
          contentType = "audio/mp4"
        }
      }

      // Upload file to submissions bucket with normalized content type
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("submissions")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: contentType,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw uploadError
      }

      // Get public URL (submissions bucket is public, so this URL will work across the site)
      const { data: urlData } = supabase.storage
        .from("submissions")
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // Wait 2 seconds as requested
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Set track info and open selection dialog
      // This URL will be saved to database when order is created via createOrder()
      setUploadedTrackUrl(publicUrl)
      setUploadedTrackTitle(fileName)
      setIsSelectionOpen(true)
      setIsUploading(false)
    } catch (error) {
      console.error("Error uploading file:", error)
      setIsUploading(false)
      // You might want to show an error toast here
    }
  }

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center px-6 lg:px-8 overflow-hidden pt-32">
        {/* Subtle tech grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

        {/* Spotlight effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        <div className="container mx-auto text-center max-w-5xl relative z-10 pt-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8 animate-fade-in-up">
            <Zap className="w-4 h-4 text-primary" fill="currentColor" />
            <span className="text-sm font-semibold tracking-wide text-primary uppercase">Studio-Grade Processing</span>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-8 animate-fade-in-up leading-[0.95]">
            <span className="block text-balance">Music Reviews </span>
            <span className="block text-balance text-7xl">By Professionals </span>
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground mb-16 max-w-2xl mx-auto animate-fade-in-up animate-delay-100 leading-relaxed font-medium">
            Upload MP3 or WAV files and experience professional criticism
          </p>

          <div className="max-w-3xl mx-auto animate-fade-in-up animate-delay-200 mb-16">
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`relative glass-card rounded-2xl p-16 transition-all duration-500 ${
                isDragging
                  ? "border-primary/80 bg-primary/5 scale-[1.02] shadow-2xl shadow-primary/30"
                  : "border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20"
              }`}
            >
              <input
                type="file"
                id="file-upload"
                accept=".mp3,.wav,audio/mpeg,audio/wav"
                onChange={handleFileInput}
                className="hidden"
              />

              <label htmlFor="file-upload" className="cursor-pointer block">
                <div className="flex flex-col items-center gap-6">
                  {isUploading ? (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse" />
                        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-8 rounded-2xl border border-primary/30 backdrop-blur-sm">
                          <Loader2 className="w-16 h-16 text-primary animate-spin" strokeWidth={1.5} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h2 className="text-4xl font-bold text-foreground tracking-tight">Uploading...</h2>
                        <p className="text-muted-foreground text-lg font-medium">
                          <span className="block">Processing your track</span>
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse" />
                        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-8 rounded-2xl border border-primary/30 backdrop-blur-sm">
                          <Music className="w-16 h-16 text-primary" strokeWidth={1.5} />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-4xl font-bold text-foreground tracking-tight">Drop Your Tracks</h2>
                        <p className="text-muted-foreground text-lg font-medium">
                          <span className="block">MP3 • WAV</span>
                          <span className="block">Instant Processing</span>
                        </p>
                      </div>

                      <div
                        className="mt-4 text-base font-semibold px-8 py-6 rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all pointer-events-none inline-flex items-center justify-center bg-primary text-primary-foreground"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        Select Files
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-12 animate-fade-in-up animate-delay-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary" strokeWidth={2} />
              <span className="text-sm font-semibold text-foreground">Lossless Quality</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary" strokeWidth={2} />
              <span className="text-sm font-semibold text-foreground">Instant Processing</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary" strokeWidth={2} />
              <span className="text-sm font-semibold text-foreground">Secure Upload</span>
            </div>
          </div>
        </div>
      </section>

      <ReviewerSelectionDialog
        open={isSelectionOpen}
        onOpenChange={setIsSelectionOpen}
        trackUrl={uploadedTrackUrl}
        trackTitle={uploadedTrackTitle}
      />
    </>
  )
}
