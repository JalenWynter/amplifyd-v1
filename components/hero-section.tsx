"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Upload, Music, Zap, CheckCircle2, ArrowRight } from "lucide-react"
import { useState } from "react"
import PricingCards from "@/components/pricing-cards"

export function HeroSection() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [showPricing, setShowPricing] = useState(false)

  const promotionalMessages = [
    "🎉 LIMITED TIME: 50% OFF FIRST MONTH",
    "⚡ NEW: AI-POWERED MASTERING NOW AVAILABLE",
    "🎵 PROCESS UNLIMITED TRACKS WITH PRO PLAN",
    "🔥 JOIN 10,000+ ARTISTS WORLDWIDE",
  ]

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
      setUploadedFiles((prev) => [...prev, ...files])
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
        setUploadedFiles((prev) => [...prev, ...audioFiles])
      }
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleContinueToPricing = () => {
    setShowPricing(true)
    setTimeout(() => {
      document.getElementById("pricing-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 100)
  }

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center px-6 lg:px-8 overflow-hidden pt-32">
        {/* Subtle tech grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

        {/* Spotlight effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        <div className="absolute top-2 left-0 right-0 z-20 overflow-hidden pointer-events-none">
          <div className="bg-primary/95 backdrop-blur-sm border-y border-primary/30 py-3 shadow-lg shadow-primary/20">
            <div className="flex whitespace-nowrap animate-marquee">
              {[...Array(3)].map((_, setIndex) => (
                <div key={setIndex} className="flex items-center">
                  {promotionalMessages.map((message, msgIndex) => (
                    <span
                      key={`${setIndex}-${msgIndex}`}
                      className="inline-block mx-8 text-sm font-bold tracking-wider text-white"
                    >
                      {message}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

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
                multiple
                onChange={handleFileInput}
                className="hidden"
              />

              <label htmlFor="file-upload" className="cursor-pointer block">
                <div className="flex flex-col items-center gap-6">
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

                  <Button
                    size="lg"
                    className="mt-4 text-base font-semibold px-8 py-6 rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Select Files
                  </Button>
                </div>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    Ready to Process
                  </h3>
                  <span className="text-sm font-bold text-primary">
                    {uploadedFiles.length} {uploadedFiles.length === 1 ? "File" : "Files"}
                  </span>
                </div>
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="glass-card flex items-center justify-between gap-4 p-5 rounded-xl border-border hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                          <Music className="w-5 h-5 text-primary" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-foreground truncate">{file.name}</p>
                          <p className="text-sm text-muted-foreground font-medium">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleContinueToPricing}
                  size="lg"
                  className="w-full mt-6 text-base font-semibold px-8 py-6 rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
                >
                  Continue to Pricing
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
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

      {showPricing && uploadedFiles.length > 0 && (
        <section id="pricing-section" className="relative py-24 px-6 lg:px-8 bg-slate-950">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                <Zap className="w-4 h-4 text-primary" fill="currentColor" />
                <span className="text-sm font-semibold tracking-wide text-primary uppercase">Choose Your Plan</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 text-balance">Select Your Package</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Professional mastering at transparent pricing. No subscriptions, pay per package.
              </p>
            </div>

            <PricingCards uploadedFiles={uploadedFiles.map((f) => f.name)} />
          </div>
        </section>
      )}
    </>
  )
}
