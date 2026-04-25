import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({})
  const { data } = await supabase.from('profiles').select('church_name, logo_url, brand_color').eq('id', user.id).single()
  return NextResponse.json(data ?? {})
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json()
  const { error } = await supabase.from('profiles').update({
    church_name: body.church_name ?? null,
    logo_url: body.logo_url ?? null,
    brand_color: body.brand_color ?? null,
  }).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
