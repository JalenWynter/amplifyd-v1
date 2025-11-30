'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface PromoCode {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_uses: number | null
  current_uses: number
  expires_at: string
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PromoCodeUsage {
  id: string
  promo_code_id: string
  order_id: string | null
  user_id: string
  used_at: string
  discount_amount: number
}

/**
 * Validate a promo code and return discount info
 */
export async function validatePromoCode(code: string): Promise<{
  valid: boolean
  discount?: {
    type: 'percentage' | 'fixed'
    value: number
  }
  error?: string
}> {
  const supabase = await createClient()
  
  const { data: promoCode, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single()

  if (error || !promoCode) {
    return { valid: false, error: 'Invalid promo code' }
  }

  const promoCodeData = promoCode as any
  const now = new Date()
  const expiresAt = new Date(promoCodeData.expires_at)

  // Check if code has expired
  if (now > expiresAt) {
    return { valid: false, error: 'Promo code has expired' }
  }

  // Check if max uses reached
  if (promoCodeData.max_uses !== null && promoCodeData.current_uses >= promoCodeData.max_uses) {
    return { valid: false, error: 'Promo code has reached maximum uses' }
  }

  return {
    valid: true,
    discount: {
      type: promoCodeData.discount_type,
      value: promoCodeData.discount_value,
    },
  }
}

/**
 * Apply promo code to an order and track usage
 */
export async function applyPromoCode(
  code: string,
  orderId: string,
  originalPrice: number
): Promise<{
  success: boolean
  discountedPrice?: number
  discountAmount?: number
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Validate promo code
  const validation = await validatePromoCode(code)
  if (!validation.valid || !validation.discount) {
    return { success: false, error: validation.error || 'Invalid promo code' }
  }

  const { data: promoCode } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .single()

  const promoCodeData = promoCode as any
  if (!promoCodeData) {
    return { success: false, error: 'Promo code not found' }
  }

  // Calculate discount
  let discountAmount = 0
  if (validation.discount.type === 'percentage') {
    discountAmount = (originalPrice * validation.discount.value) / 100
  } else {
    discountAmount = validation.discount.value
  }

  // Ensure discount doesn't exceed original price
  discountAmount = Math.min(discountAmount, originalPrice)
  const discountedPrice = originalPrice - discountAmount

  // Record usage
  const { error: usageError } = await supabase
    .from('promo_code_usage')
    .insert({
      promo_code_id: promoCodeData.id,
      order_id: orderId,
      user_id: user.id,
      discount_amount: discountAmount,
    } as any)

  if (usageError) {
    console.error('Error recording promo code usage:', usageError)
    // Continue anyway - usage tracking is not critical
  }

  // Update current_uses count
  try {
    const updateQuery = supabase
      .from('promo_codes')
      .update({ current_uses: promoCodeData.current_uses + 1 } as any)
      .eq('id', promoCodeData.id)
    await (updateQuery as any)
  } catch (error) {
    console.error('Error updating promo code usage count:', error)
  }

  return {
    success: true,
    discountedPrice,
    discountAmount,
  }
}

/**
 * Get all promo codes (admin only)
 */
export async function getPromoCodes(): Promise<PromoCode[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profileData = profile as any
  if (profileData?.role !== 'admin') return []

  const { data: promoCodes } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })

  return promoCodes || []
}

/**
 * Get promo code usage stats (admin only)
 */
export async function getPromoCodeUsage(promoCodeId: string): Promise<PromoCodeUsage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profileData = profile as any
  if (profileData?.role !== 'admin') return []

  const { data: usage } = await supabase
    .from('promo_code_usage')
    .select('*')
    .eq('promo_code_id', promoCodeId)
    .order('used_at', { ascending: false })

  return usage || []
}

/**
 * Create a new promo code (admin only)
 */
export async function createPromoCode(data: {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_uses: number | null
  expires_at: string
}): Promise<{ success: boolean; error?: string; promoCode?: PromoCode }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profileData = profile as any
  if (profileData?.role !== 'admin') {
    return { success: false, error: 'Admin access required' }
  }

  // Validate discount value
  if (data.discount_type === 'percentage' && data.discount_value > 100) {
    return { success: false, error: 'Percentage discount cannot exceed 100%' }
  }

  const { data: promoCode, error } = await supabase
    .from('promo_codes')
    .insert({
      code: data.code.toUpperCase().trim(),
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      max_uses: data.max_uses,
      expires_at: data.expires_at,
      created_by: user.id,
    } as any)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Promo code already exists' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin')
  return { success: true, promoCode }
}

/**
 * Update promo code (admin only)
 */
export async function updatePromoCode(
  id: string,
  data: Partial<{
    is_active: boolean
    max_uses: number | null
    expires_at: string
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profileData = profile as any
  if (profileData?.role !== 'admin') {
    return { success: false, error: 'Admin access required' }
  }

  const updateQuery = supabase
    .from('promo_codes')
    .update(data as any)
    .eq('id', id) as any
  
  const { error } = await updateQuery

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin')
  return { success: true }
}

/**
 * Delete promo code (admin only)
 */
export async function deletePromoCode(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profileData = profile as any
  if (profileData?.role !== 'admin') {
    return { success: false, error: 'Admin access required' }
  }

  const { error } = await supabase
    .from('promo_codes')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/admin')
  return { success: true }
}

