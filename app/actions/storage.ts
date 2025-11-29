'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function getSignedUploadParams(fileName: string, fileType: string) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('Unauthorized')

  // Create a unique path: user_id/timestamp_filename
  const filePath = `${user.id}/${Date.now()}_${fileName}`

  // We don't strictly need a "signed URL" for Supabase if RLS is set right, 
  // but returning the valid path ensures data consistency.
  return { filePath, userId: user.id }
}