'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setDefaultLocation(loc: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  const { error } = await supabase.from('profiles').update({ default_location: loc.trim() || null }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}
