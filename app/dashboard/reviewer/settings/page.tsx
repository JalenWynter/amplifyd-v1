'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { NavbarAuth } from '@/components/navbar-auth'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  X,
  Loader2,
  User,
  DollarSign,
  Settings as SettingsIcon,
  Upload,
  Image as ImageIcon
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { RealtimeOrdersListener } from '@/components/realtime-orders-listener'

type PricingPackage = {
  id: string
  title: string
  price: number
  description: string
  deliveryTime: string
  revisions: number
  features: string[]
  reviewTypes?: string[] // Array of review types: 'scorecard', 'audio', 'video', 'written'
}

type ProfileData = {
  full_name: string
  bio: string
  tags: string[]
  avatar_url: string
  pricing_packages: PricingPackage[]
}

const COMMON_TAGS = [
  'Trap', 'House', 'EDM', 'Pop', 'Indie', 'Rock', 'Hip-Hop', 'R&B',
  'Mixing', 'Mastering', 'Songwriting', 'Production', 'Vocals',
  'Sound Design', 'Arrangement', 'Vocal Production'
]

export default function ReviewerSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null)

  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    bio: '',
    tags: [],
    avatar_url: '',
    pricing_packages: []
  })

  const [newTag, setNewTag] = useState('')
  const [editingPackageIndex, setEditingPackageIndex] = useState<number | null>(null)
  const [newPackage, setNewPackage] = useState<Partial<PricingPackage>>({
    title: '',
    price: 0,
    description: '',
    deliveryTime: '',
    revisions: 0,
    features: [],
    reviewTypes: []
  })
  const [newFeature, setNewFeature] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentUser) {
          router.push('/login')
          return
        }

        setUser(currentUser)

        // Get user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, bio, tags, avatar_url, pricing_packages, role')
          .eq('id', currentUser.id)
          .single()

        if (error) {
          console.error('Error loading profile:', error)
          setMessage({ type: 'error', text: 'Failed to load profile' })
          return
        }

        if (profile?.role !== 'reviewer') {
          router.push('/dashboard')
          return
        }

        // Parse tags (handle both array and string formats)
        let tags: string[] = []
        if (profile.tags) {
          if (Array.isArray(profile.tags)) {
            tags = profile.tags
          } else if (typeof profile.tags === 'string') {
            try {
              tags = JSON.parse(profile.tags)
            } catch {
              tags = [profile.tags]
            }
          }
        }

        // Parse pricing packages
        const packages = Array.isArray(profile.pricing_packages) 
          ? profile.pricing_packages 
          : []

        // Ensure reviewTypes exists for each package
        const packagesWithReviewTypes = packages.map((pkg: any) => ({
          ...pkg,
          reviewTypes: pkg.reviewTypes || []
        }))

        setProfileData({
          full_name: profile.full_name || '',
          bio: profile.bio || '',
          tags: tags,
          avatar_url: profile.avatar_url || '',
          pricing_packages: packagesWithReviewTypes
        })
      } catch (error) {
        console.error('Error loading profile:', error)
        setMessage({ type: 'error', text: 'Failed to load profile' })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldownSeconds])

  const handleSaveProfile = async () => {
    // Check cooldown
    if (cooldownSeconds > 0) {
      setMessage({ 
        type: 'error', 
        text: `Please wait ${cooldownSeconds} second${cooldownSeconds > 1 ? 's' : ''} before saving again` 
      })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        setMessage({ type: 'error', text: 'Not authenticated' })
        setSaving(false)
        return
      }

      // Validate required fields
      if (!profileData.full_name.trim()) {
        setMessage({ type: 'error', text: 'Full name is required' })
        setSaving(false)
        return
      }

      if (profileData.pricing_packages.length === 0) {
        setMessage({ type: 'error', text: 'At least one pricing package is required' })
        setSaving(false)
        return
      }

      // Validate packages
      for (const pkg of profileData.pricing_packages) {
        if (!pkg.title.trim() || !pkg.price || pkg.price <= 0) {
          setMessage({ type: 'error', text: 'All packages must have a title and valid price' })
          setSaving(false)
          return
        }
      }

      // Update only the current reviewer's profile (enforced by RLS and .eq('id', currentUser.id))
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name.trim(),
          bio: profileData.bio.trim(),
          tags: profileData.tags,
          avatar_url: profileData.avatar_url.trim() || null,
          pricing_packages: profileData.pricing_packages,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id) // Ensure only updating own profile

      if (error) {
        console.error('Error saving profile:', error)
        setMessage({ type: 'error', text: `Failed to save: ${error.message}` })
        setSaving(false)
        return
      }

      // Set cooldown (5 seconds)
      setCooldownSeconds(5)
      setLastSaveTime(Date.now())

      setMessage({ type: 'success', text: 'Profile updated successfully! Changes are now live.' })
      setTimeout(() => setMessage(null), 5000)

      // Refresh the page data to ensure consistency
      router.refresh()
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save profile' })
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !profileData.tags.includes(newTag.trim())) {
      setProfileData({
        ...profileData,
        tags: [...profileData.tags, newTag.trim()]
      })
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setProfileData({
      ...profileData,
      tags: profileData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const addPackage = () => {
    // Limit to 4 packages
    if (profileData.pricing_packages.length >= 4) {
      setMessage({ type: 'error', text: 'Maximum of 4 pricing packages allowed' })
      return
    }

    if (!newPackage.title || !newPackage.price) {
      setMessage({ type: 'error', text: 'Please fill in title and price' })
      return
    }

    const packageToAdd: PricingPackage = {
      id: `pkg-${Date.now()}`,
      title: newPackage.title,
      price: Number(newPackage.price),
      description: newPackage.description || '',
      deliveryTime: newPackage.deliveryTime || '',
      revisions: Number(newPackage.revisions) || 0,
      features: newPackage.features || []
    }

    setProfileData({
      ...profileData,
      pricing_packages: [...profileData.pricing_packages, packageToAdd]
    })

    setNewPackage({
      title: '',
      price: 0,
      description: '',
      deliveryTime: '',
      revisions: 0,
      features: [],
      reviewTypes: []
    })
    setNewFeature('')
  }

  const updatePackage = (index: number, updates: Partial<PricingPackage>) => {
    const updated = [...profileData.pricing_packages]
    updated[index] = { ...updated[index], ...updates }
    setProfileData({
      ...profileData,
      pricing_packages: updated
    })
  }

  const deletePackage = (index: number) => {
    setProfileData({
      ...profileData,
      pricing_packages: profileData.pricing_packages.filter((_, i) => i !== index)
    })
  }

  const addFeatureToPackage = (packageIndex: number) => {
    if (!newFeature.trim()) return

    const packageFeatures = profileData.pricing_packages[packageIndex].features || []
    
    // Limit to 4 features per package
    if (packageFeatures.length >= 4) {
      setMessage({ type: 'error', text: 'Maximum of 4 features per package' })
      return
    }

    const updated = [...profileData.pricing_packages]
    updated[packageIndex].features = [...updated[packageIndex].features, newFeature.trim()]
    setProfileData({
      ...profileData,
      pricing_packages: updated
    })
    setNewFeature('')
  }

  const removeFeatureFromPackage = (packageIndex: number, featureIndex: number) => {
    const updated = [...profileData.pricing_packages]
    updated[packageIndex].features = updated[packageIndex].features.filter((_, i) => i !== featureIndex)
    setProfileData({
      ...profileData,
      pricing_packages: updated
    })
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please upload a JPG, PNG, or WebP image' })
      return
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'Image must be smaller than 2MB' })
      return
    }

    setUploadingAvatar(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        setMessage({ type: 'error', text: 'Not authenticated' })
        setUploadingAvatar(false)
        return
      }

      // Create a unique filename: user_id/timestamp_filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to avatars bucket (or avatars folder in public bucket)
      const bucketName = 'avatars'
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Allow overwriting
          contentType: file.type,
        })

      // Fallback to public bucket if avatars doesn't exist
      let finalBucket = bucketName
      if (uploadError && uploadError.message.includes('not found')) {
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('public')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type,
          })

        if (fallbackError) {
          throw fallbackError
        }
        finalBucket = 'public'
      } else if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(finalBucket)
        .getPublicUrl(filePath)

      // Update profile data with new avatar URL
      setProfileData({
        ...profileData,
        avatar_url: urlData.publicUrl
      })

      setMessage({ type: 'success', text: 'Profile picture uploaded successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to upload image' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6] mx-auto mb-4" />
          <p className="text-white/70">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <RealtimeOrdersListener />
      <header className="border-b border-white/10 bg-[#0A0A0A]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold text-white">
            Amplifyd Studio
          </Link>
          <div className="flex items-center gap-4">
            <NavbarAuth isAuthenticated={!!user} />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 lg:p-12 max-w-5xl">
        <div className="mb-8">
          <Button 
            asChild 
            variant="ghost" 
            className="mb-4 text-white/70 hover:text-white"
          >
            <Link href="/dashboard/reviewer">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2">Reviewer Settings</h1>
          <p className="text-white/70">Manage your public profile and pricing packages</p>
        </div>

        {message && (
          <Alert className={`mb-6 ${
            message.type === 'success' 
              ? 'border-green-500/50 bg-green-500/10 text-green-400' 
              : 'border-red-500/50 bg-red-500/10 text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{message.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription className={
              message.type === 'success' ? 'text-green-300/80' : 'text-red-300/80'
            }>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Information */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription className="text-white/60">
              This information is displayed publicly on your reviewer profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-white">Full Name</Label>
              <Input
                id="full_name"
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                className="bg-white/5 border-white/20 text-white"
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio" className="text-white">Bio</Label>
                <span className={`text-xs ${
                  (profileData.bio?.length || 0) > 200 
                    ? 'text-red-400' 
                    : (profileData.bio?.length || 0) > 180
                    ? 'text-yellow-400'
                    : 'text-white/50'
                }`}>
                  {profileData.bio?.length || 0} / 200 characters
                </span>
              </div>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= 200) {
                    setProfileData({ ...profileData, bio: value })
                  }
                }}
                className="bg-white/5 border-white/20 text-white min-h-[120px]"
                placeholder="Tell artists about your expertise and experience..."
                maxLength={200}
              />
              {(profileData.bio?.length || 0) > 200 && (
                <p className="text-red-400 text-xs mt-1">
                  Bio cannot exceed 200 characters
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-white">Profile Picture</Label>
              <div className="flex items-center gap-4">
                {profileData.avatar_url && (
                  <div className="relative">
                    <img
                      src={profileData.avatar_url}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-user.jpg'
                      }}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                    disabled={uploadingAvatar}
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                      disabled={uploadingAvatar}
                      asChild
                    >
                      <span>
                        {uploadingAvatar ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {profileData.avatar_url ? 'Change Picture' : 'Upload Picture'}
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  <p className="text-white/50 text-xs mt-1">
                    JPG, PNG, or WebP (max 2MB, recommended: 200x200px)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Tags / Specialties</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {profileData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="bg-[#8B5CF6]/20 text-[#C4B5FD] border-[#8B5CF6]/40"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="bg-white/5 border-white/20 text-white"
                  placeholder="Add a tag"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-white/50 text-xs mt-1">
                Common tags: {COMMON_TAGS.slice(0, 8).join(', ')}...
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Packages */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Packages
            </CardTitle>
            <CardDescription className="text-white/60">
              Manage the packages that artists can purchase from you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing Packages */}
            {profileData.pricing_packages.map((pkg, index) => (
              <div
                key={pkg.id}
                className="p-4 rounded-lg border border-white/10 bg-white/5 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white text-sm">Package Title</Label>
                        <Input
                          value={pkg.title}
                          onChange={(e) => updatePackage(index, { title: e.target.value })}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white text-sm">Price ($)</Label>
                        <Input
                          type="number"
                          value={pkg.price}
                          onChange={(e) => updatePackage(index, { price: Number(e.target.value) })}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white text-sm">Delivery Time</Label>
                        <Input
                          value={pkg.deliveryTime}
                          onChange={(e) => updatePackage(index, { deliveryTime: e.target.value })}
                          className="bg-white/5 border-white/20 text-white"
                          placeholder="e.g., 3 days"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white text-sm">Revisions</Label>
                        <Input
                          type="number"
                          value={pkg.revisions}
                          onChange={(e) => updatePackage(index, { revisions: Number(e.target.value) })}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-white text-sm">Description</Label>
                        <span className={`text-xs ${
                          (pkg.description?.length || 0) > 300 
                            ? 'text-red-400' 
                            : (pkg.description?.length || 0) > 250
                            ? 'text-yellow-400'
                            : 'text-white/50'
                        }`}>
                          {pkg.description?.length || 0} / 300 characters
                        </span>
                      </div>
                      <Textarea
                        value={pkg.description}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value.length <= 300) {
                            updatePackage(index, { description: value })
                          }
                        }}
                        className="bg-white/5 border-white/20 text-white min-h-[80px]"
                        maxLength={300}
                      />
                      {(pkg.description?.length || 0) > 300 && (
                        <p className="text-red-400 text-xs mt-1">
                          Description cannot exceed 300 characters
                        </p>
                      )}
                    </div>
                    {/* Review Types */}
                    <div className="space-y-2">
                      <Label className="text-white text-sm">Review Types Included</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'scorecard', label: '16 Card Scorecard', icon: '📊' },
                          { value: 'audio', label: 'Audio Review', icon: '🎵' },
                          { value: 'video', label: 'Video Review', icon: '🎥' },
                          { value: 'written', label: 'Written Review', icon: '✍️' },
                        ].map((type) => {
                          const isChecked = pkg.reviewTypes?.includes(type.value) || false
                          return (
                            <label
                              key={type.value}
                              className={`
                                flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                                ${
                                  isChecked
                                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-white'
                                    : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                                }
                              `}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  const currentTypes = pkg.reviewTypes || []
                                  const updatedTypes = checked
                                    ? [...currentTypes, type.value]
                                    : currentTypes.filter((t) => t !== type.value)
                                  updatePackage(index, { reviewTypes: updatedTypes })
                                }}
                                className="data-[state=checked]:bg-[#8B5CF6] data-[state=checked]:border-[#8B5CF6]"
                              />
                              <span className="text-lg">{type.icon}</span>
                              <span className="text-sm font-medium">{type.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-white text-sm">Features</Label>
                        <span className="text-white/50 text-xs">
                          {pkg.features?.length || 0} / 4 features
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {pkg.features?.map((feature, featureIndex) => (
                          <Badge
                            key={featureIndex}
                            className="bg-[#8B5CF6]/20 text-[#C4B5FD] border-[#8B5CF6]/40"
                          >
                            {feature}
                            <button
                              onClick={() => removeFeatureFromPackage(index, featureIndex)}
                              className="ml-2 hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      {(pkg.features?.length || 0) >= 4 && (
                        <p className="text-yellow-400 text-xs mb-2">
                          Maximum of 4 features reached. Remove one to add another.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Input
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addFeatureToPackage(index)
                            }
                          }}
                          className="bg-white/5 border-white/20 text-white"
                          placeholder="Add a feature"
                          disabled={(pkg.features?.length || 0) >= 4}
                        />
                        <Button
                          type="button"
                          onClick={() => addFeatureToPackage(index)}
                          variant="outline"
                          size="sm"
                          className="border-white/20 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={(pkg.features?.length || 0) >= 4}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => deletePackage(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-4"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Add New Package */}
            <div className="p-4 rounded-lg border-2 border-dashed border-white/20 bg-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Add New Package</h3>
                <span className="text-white/50 text-sm">
                  {profileData.pricing_packages.length} / 4 packages
                </span>
              </div>
              {profileData.pricing_packages.length >= 4 && (
                <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Maximum Reached</AlertTitle>
                  <AlertDescription className="text-yellow-300/80">
                    You can only have 4 pricing packages. Delete one to add another.
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white text-sm">Package Title</Label>
                  <Input
                    value={newPackage.title || ''}
                    onChange={(e) => setNewPackage({ ...newPackage, title: e.target.value })}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="e.g., Quick Feedback"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white text-sm">Price ($)</Label>
                  <Input
                    type="number"
                    value={newPackage.price || ''}
                    onChange={(e) => setNewPackage({ ...newPackage, price: Number(e.target.value) })}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="95"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white text-sm">Delivery Time</Label>
                  <Input
                    value={newPackage.deliveryTime || ''}
                    onChange={(e) => setNewPackage({ ...newPackage, deliveryTime: e.target.value })}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="e.g., 3 days"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white text-sm">Revisions</Label>
                  <Input
                    type="number"
                    value={newPackage.revisions || ''}
                    onChange={(e) => setNewPackage({ ...newPackage, revisions: Number(e.target.value) })}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white text-sm">Description</Label>
                  <span className={`text-xs ${
                    (newPackage.description?.length || 0) > 300 
                      ? 'text-red-400' 
                      : (newPackage.description?.length || 0) > 250
                      ? 'text-yellow-400'
                      : 'text-white/50'
                  }`}>
                    {newPackage.description?.length || 0} / 300 characters
                  </span>
                </div>
                <Textarea
                  value={newPackage.description || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 300) {
                      setNewPackage({ ...newPackage, description: value })
                    }
                  }}
                  className="bg-white/5 border-white/20 text-white min-h-[80px]"
                  placeholder="Describe what artists will receive..."
                  maxLength={300}
                />
                {(newPackage.description?.length || 0) > 300 && (
                  <p className="text-red-400 text-xs mt-1">
                    Description cannot exceed 300 characters
                  </p>
                )}
              </div>
              {/* Review Types for New Package */}
              <div className="space-y-2">
                <Label className="text-white text-sm">Review Types Included</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'scorecard', label: '16 Card Scorecard', icon: '📊' },
                    { value: 'audio', label: 'Audio Review', icon: '🎵' },
                    { value: 'video', label: 'Video Review', icon: '🎥' },
                    { value: 'written', label: 'Written Review', icon: '✍️' },
                  ].map((type) => {
                    const isChecked = newPackage.reviewTypes?.includes(type.value) || false
                    return (
                      <label
                        key={type.value}
                        className={`
                          flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                          ${
                            isChecked
                              ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-white'
                              : 'border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                          }
                        `}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const currentTypes = newPackage.reviewTypes || []
                            const updatedTypes = checked
                              ? [...currentTypes, type.value]
                              : currentTypes.filter((t) => t !== type.value)
                            setNewPackage({ ...newPackage, reviewTypes: updatedTypes })
                          }}
                          className="data-[state=checked]:bg-[#8B5CF6] data-[state=checked]:border-[#8B5CF6]"
                        />
                        <span className="text-lg">{type.icon}</span>
                        <span className="text-sm font-medium">{type.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              <Button
                type="button"
                onClick={addPackage}
                disabled={profileData.pricing_packages.length >= 4}
                className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Package
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex flex-col items-end gap-2">
          {cooldownSeconds > 0 && (
            <p className="text-yellow-400 text-sm">
              Cooldown: {cooldownSeconds} second{cooldownSeconds > 1 ? 's' : ''} remaining
            </p>
          )}
          <Button
            onClick={handleSaveProfile}
            disabled={saving || cooldownSeconds > 0}
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : cooldownSeconds > 0 ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Changes
              </>
            )}
          </Button>
          <p className="text-white/50 text-xs">
            Changes update globally and are visible to all users immediately
          </p>
        </div>
      </main>
    </div>
  )
}

