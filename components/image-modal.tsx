'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  src: string
  alt: string
}

export function ImageModal({ open, onOpenChange, src, alt }: ImageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 border border-white/10 bg-[#080808]/95 backdrop-blur-md">
        <DialogTitle className="sr-only">{alt} - Full Size Image</DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="relative w-full h-full max-w-3xl max-h-[80vh]">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 90vw, 800px"
              unoptimized
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

