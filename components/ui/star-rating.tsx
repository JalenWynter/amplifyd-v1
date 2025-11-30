'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  max?: number
  className?: string
  disabled?: boolean
}

export function StarRating({ value, onChange, max = 5, className, disabled = false }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
          className={cn(
            'transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:ring-offset-2 rounded',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          aria-label={`Rate ${star} out of ${max}`}
        >
          <Star
            className={cn(
              'h-6 w-6 transition-colors',
              star <= value
                ? 'fill-[#FACC15] text-[#FACC15]'
                : 'fill-transparent text-white/30 hover:text-white/50'
            )}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-white/70">{value} / {max}</span>
      )}
    </div>
  )
}

