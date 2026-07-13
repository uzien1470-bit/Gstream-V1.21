import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData().catch(() => null)
  const file = formData?.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  }
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 4MB' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const ext = file.name.split('.').pop() || 'png'
  const path = `${user.id}/avatar-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    console.error('[profile/avatar] upload failed:', uploadError.message)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const publicUrl = data.publicUrl

  // Persist the new avatar URL to the user's profile row so the UI can
  // render it without a separate /profile/update call.
  const { error: updateErr } = await supabase
    .from('User')
    .update({ avatarUrl: publicUrl })
    .eq('id', user.id)
  if (updateErr) {
    console.error('[profile/avatar] profile update failed:', updateErr.message)
    // Non-fatal — the URL is in storage; the client can still use it
  }

  return NextResponse.json({ url: publicUrl, path })
}
