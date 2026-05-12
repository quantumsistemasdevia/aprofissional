'use client'

import { useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function useUpload() {
  const upload = useCallback(async (file: File, bucket: string, path?: string): Promise<string> => {
    const supabase = getSupabase()
    const ext = file.name.split('.').pop()
    const key = path ?? `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage.from(bucket).upload(key, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (error) throw new Error(error.message)

    const { data } = supabase.storage.from(bucket).getPublicUrl(key)
    return data.publicUrl
  }, [])

  const removeFile = useCallback(async (bucket: string, url: string): Promise<void> => {
    const supabase = getSupabase()
    const marker = `/object/public/${bucket}/`
    const idx = url.indexOf(marker)
    if (idx === -1) return
    const filePath = url.slice(idx + marker.length)
    await supabase.storage.from(bucket).remove([filePath])
  }, [])

  return { upload, removeFile }
}
