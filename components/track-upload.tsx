"use client"

import { useState, useRef } from "react"
import { Upload, Music, Loader2, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"

interface TrackUploadProps {
  onUploadComplete: (url: string, fileName: string) => void
  existingUrl?: string
  existingTitle?: string
}

export function TrackUpload({ onUploadComplete, existingUrl, existingTitle }: TrackUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(existingUrl || null)
  const [uploadedTitle, setUploadedTitle] = useState<string | null>(existingTitle || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sanitizeFileName = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf(".")
    const extension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex) : ""
    const nameWithoutExt = lastDotIndex !== -1 ? fileName.slice(0, lastDotIndex) : fileName

    const sanitized = nameWithoutExt
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_+|_+$/g, "")

    return sanitized + extension
  }

  const handleUpload = async (file: File) => {
    // Validate file type
    const isValidAudio = 
      file.type === "audio/mpeg" ||
      file.type === "audio/wav" ||
      file.type === "audio/mp3" ||
      file.type === "audio/x-m4a" ||
      file.type === "audio/mp4" ||
      file.type === "audio/m4a" ||
      file.name.endsWith(".mp3") ||
      file.name.endsWith(".wav") ||
      file.name.endsWith(".m4a")

    if (!isValidAudio) {
      setError("Please upload a valid audio file (MP3, WAV, or M4A)")
      return
    }

    setIsUploading(true)
    setError(null)
    const supabase = createClient()

    try {
      const fileName = file.name
      const sanitizedFileName = sanitizeFileName(fileName)
      const filePath = `public/${Date.now()}-${sanitizedFileName}`

      // Normalize MIME type for Supabase Storage compatibility
      let contentType = file.type
      if (file.type === "audio/x-m4a" || file.type === "audio/m4a" || file.name.endsWith(".m4a")) {
        contentType = "audio/mp4" // M4A files use audio/mp4 MIME type
      } else if (file.type === "audio/mp3" || file.name.endsWith(".mp3")) {
        contentType = "audio/mpeg" // Standardize MP3 MIME type
      } else if (!file.type || file.type === "") {
        // Fallback: determine from file extension
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

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("submissions")
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      setUploadedUrl(publicUrl)
      setUploadedTitle(fileName)
      onUploadComplete(publicUrl, fileName)
      setIsUploading(false)
    } catch (err: any) {
      console.error("Error uploading file:", err)
      setError(err.message || "Failed to upload track. Please try again.")
      setIsUploading(false)
    }
  }

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
        file.type.startsWith("audio/") ||
        file.name.endsWith(".mp3") ||
        file.name.endsWith(".wav") ||
        file.name.endsWith(".m4a")
      )
    })

    if (files.length > 0) {
      handleUpload(files[0])
    } else {
      setError("Please drop a valid audio file")
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleUpload(files[0])
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemove = () => {
    setUploadedUrl(null)
    setUploadedTitle(null)
    setError(null)
    onUploadComplete("", "")
  }

  if (uploadedUrl && uploadedTitle) {
    return (
      <div className="border border-green-500/50 bg-green-500/10 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-white font-medium">{uploadedTitle}</p>
              <p className="text-green-400/70 text-xs">Track uploaded successfully</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragging 
            ? "border-primary bg-primary/10" 
            : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70"
          }
          ${isUploading ? "opacity-50 pointer-events-none cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a"
          onChange={handleFileInput}
          className="hidden"
          id="track-upload-input"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-gray-400">Uploading track...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className="p-3 rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-white font-medium mb-1">
                {isDragging ? "Drop your track here" : "Upload your track"}
              </p>
              <p className="text-gray-400 text-sm">
                Drag and drop or click to browse
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Supports MP3, WAV, M4A files
              </p>
            </div>
            <div className="mt-2 px-4 py-2 rounded-md border border-slate-600 bg-slate-700/50 text-white text-sm font-medium">
              <Music className="h-4 w-4 inline-block mr-2" />
              Choose File
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}

