'use client'

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

export const SCORECARD_METRICS = [
  'Sub Energy',
  'Kick Clarity',
  'Snare Cut',
  'Stereo Spread',
  'Vocal Presence',
  'Dynamics',
  'Automation',
  'FX Cohesion',
  'Reference Match',
  'Headroom',
  'Phase Alignment',
  'Low-Mid Balance',
  'High Air',
  'Translation',
  'Creative Direction',
  'Overall Polish',
]

interface ScorecardGridProps {
  value: { metric: string; score: number }[]
  onChange: (value: { metric: string; score: number }[]) => void
}

export function ScorecardGrid({ value, onChange }: ScorecardGridProps) {
  const handleMetricChange = (metric: string, score: number) => {
    const updated = value.map((item) =>
      item.metric === metric ? { ...item, score } : item
    )
    
    // If metric doesn't exist, add it
    if (!updated.some((item) => item.metric === metric)) {
      updated.push({ metric, score })
    }
    
    onChange(updated)
  }

  const getScore = (metric: string): number => {
    const item = value.find((item) => item.metric === metric)
    return item?.score ?? 5
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {SCORECARD_METRICS.map((metric) => {
        const currentScore = getScore(metric)
        return (
          <div key={metric} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white text-sm">{metric}</Label>
              <span className="text-xs text-white/70">{currentScore} / 10</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={0.1}
              value={[currentScore]}
              onValueChange={(vals) => handleMetricChange(metric, vals[0])}
              className="w-full"
            />
          </div>
        )
      })}
    </div>
  )
}

