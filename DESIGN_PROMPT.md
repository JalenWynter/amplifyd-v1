# Design System Prompt for Amplifyd Studio Pages

## Theme & Visual Identity
Design pages for **Amplifyd Studio** - a modern, luxury tech platform for connecting artists with professional music reviewers. The brand combines **premium aesthetics with cutting-edge technology**.

## Color Palette

### Dark Mode (Primary - Most Pages Use This)
- **Background**: `bg-[#0A0A0A]` (Deep black/slate-950: `#0A0A0A`)
- **Cards/Surfaces**: `bg-white/5`, `bg-white/10`, `bg-slate-900/50` with `backdrop-blur-xl`
- **Borders**: `border-white/10`, `border-white/20`, `border-slate-800`
- **Primary Accent**: `#8B5CF6` (Purple) - used for buttons, highlights, badges
- **Primary Hover**: `#7C3AED` (Darker purple)
- **Text Primary**: `text-white`
- **Text Secondary**: `text-white/70`, `text-white/60`, `text-gray-400`
- **Text Muted**: `text-white/50`, `text-gray-500`

### Accent Colors
- **Success/Verified**: `text-[#C4B5FD]`, `bg-[#8B5CF6]/20`
- **Rating Stars**: `text-[#FACC15]` (Yellow/Gold)
- **Highlights**: `text-[#C4B5FD]` (Light purple)

## Typography
- **Headings**: Bold, large (`text-4xl`, `text-5xl` for hero sections)
- **Body**: Clean, readable (`text-base`, `text-lg`)
- **Font**: Inter (system default)

## Layout Patterns

### Page Structure
1. **Header/Navbar**: Sticky, glass-morphism effect when scrolled
2. **Main Content**: `min-h-screen` with `container mx-auto px-6 lg:px-8`
3. **Sections**: Spaced with `space-y-12` or `gap-8`
4. **Max Width**: `max-w-6xl` or `max-w-7xl` for content containers

### Card Design
- **Base**: `rounded-3xl` or `rounded-2xl` for cards
- **Background**: `bg-white/5 backdrop-blur-xl` with `border border-white/10`
- **Hover Effects**: `hover:border-[#8B5CF6]`, `hover:shadow-[0_0_30px_rgba(139,92,246,0.35)]`
- **Padding**: `p-6`, `p-8` for cards

### Grid Patterns
- **Responsive Grids**: `grid gap-6 md:grid-cols-2 lg:grid-cols-3`
- **Flex Layouts**: `flex flex-col gap-4` or `flex items-center gap-6`

## Component Patterns

### Buttons
- **Primary**: `bg-[#8B5CF6] text-white hover:bg-[#7C3AED]`
- **Secondary**: `border border-white/10 bg-white/5 hover:bg-white/10`
- **Ghost**: `bg-transparent hover:bg-white/10`
- **Rounded**: `rounded-full` or `rounded-lg`

### Badges
- **Default**: `border border-white/10 bg-white/10 text-white`
- **Accent**: `border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD]`
- **Verified**: `bg-[#8B5CF6]/20 text-[#C4B5FD]` with checkmark icon

### Icons
- Use **Lucide React** icons
- Common: `CheckCircle2`, `Star`, `Clock`, `Music`, `ArrowRight`, `Sparkles`
- Size: `h-4 w-4`, `h-5 w-5`, `h-6 w-6`
- Colors: Match text colors or use accent colors

## Visual Effects

### Background Patterns
- **Grid Overlay**: `bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20`
- **Gradient Overlays**: `bg-gradient-to-b from-transparent via-transparent to-background`
- **Glass Morphism**: `backdrop-blur-xl` with semi-transparent backgrounds

### Animations
- **Hover Transitions**: `transition-all duration-300`
- **Scale on Hover**: `hover:scale-[1.02]`
- **Fade In**: `animate-in fade-in slide-in-from-top-2 duration-300`

## Spacing System
- **Section Spacing**: `space-y-12`, `gap-8`, `gap-6`
- **Card Padding**: `p-6`, `p-8`
- **Element Gaps**: `gap-2`, `gap-4`, `gap-6`

## Content Patterns

### Hero Sections
- Large, centered text
- Gradient backgrounds
- CTA buttons prominently displayed
- Subtle animations

### Feature Cards
- Icon + Title + Description
- Hover effects with border glow
- Consistent spacing

### Stats/Data Display
- Large numbers with labels
- Grid layout
- Accent colors for emphasis

## Required Components (from @/components/ui)
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Button`
- `Badge`
- `Input`, `Select`, `Dialog`
- All from `@/components/ui/*`

## Navigation
- Use `NavbarAuth` component for auth state
- Links use Next.js `Link` component
- Navigation items: Marketplace, Reviews, About, Contact/Support

## Responsive Design
- Mobile-first approach
- Breakpoints: `md:` (768px), `lg:` (1024px)
- Hide/show elements: `hidden md:flex`, `lg:hidden`
- Grid columns: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

## Example Page Structure
```tsx
"use client"

import { NavbarAuth } from "@/components/navbar-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icons from lucide-react } from "lucide-react"
import Link from "next/link"

export default function PageName() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] py-12 px-6">
      <div className="container mx-auto max-w-6xl space-y-12">
        {/* Header Section */}
        <header className="text-center space-y-4">
          <Badge className="border border-white/20 bg-white/10 text-white">
            Section Badge
          </Badge>
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            Page Title
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Description text
          </p>
        </header>

        {/* Content Sections */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Cards with glass morphism */}
        </section>
      </div>
    </main>
  )
}
```

## Key Principles
1. **Dark, premium aesthetic** - Deep blacks with subtle transparency
2. **Purple accent** - #8B5CF6 for interactive elements
3. **Glass morphism** - Frosted glass effects on cards
4. **Smooth animations** - Subtle hover and transition effects
5. **Spacious layouts** - Generous whitespace and padding
6. **Consistent spacing** - Use the spacing system consistently
7. **Accessibility** - Proper contrast ratios, semantic HTML

