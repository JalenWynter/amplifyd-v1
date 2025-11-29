'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signUp({
    ...data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user account' }
  }

  // Try to create profile - but don't fail if table doesn't exist or trigger handles it
  // The database trigger should automatically create the profile, but we'll try as a fallback
  try {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        role: 'user',
      })

    // If profile already exists (trigger created it), that's fine
    // If table doesn't exist, that's also fine - user can still sign in
    if (profileError) {
      const errorMessage = profileError.message.toLowerCase()
      // Ignore these specific errors:
      // - Table doesn't exist (migration not run yet)
      // - Duplicate key (trigger already created it)
      // - RLS policy violation (trigger will handle it)
      if (
        !errorMessage.includes('relation') &&
        !errorMessage.includes('does not exist') &&
        !errorMessage.includes('duplicate key') &&
        !errorMessage.includes('violates row-level security')
      ) {
        // Only log unexpected errors
        console.error('Profile creation error (non-critical):', profileError.message)
      }
    }
  } catch (err) {
    // Silently catch any errors - profile creation is handled by trigger or can be done later
    console.error('Profile creation attempt failed (non-critical):', err)
  }

  revalidatePath('/', 'layout')
  
  // If email confirmation is required, show message instead of redirecting
  if (authData.user && !authData.session) {
    return { 
      success: true,
      message: 'Please check your email to confirm your account before signing in.',
      requiresConfirmation: true 
    }
  }
  
  redirect('/dashboard')
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    return { url: data.url }
  }

  return { error: 'Failed to generate OAuth URL' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role || 'user'
}

export async function isAdmin() {
  const role = await getUserRole()
  return role === 'admin'
}

