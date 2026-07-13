'use client'

import { createBrowserClient } from '@supabase/ssr'
import { supabaseUrl, supabaseAnonKey } from './configured'

/**
 * Supabase client for client components.
 * Singleton — reuse the same instance across the browser session.
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createBrowserSupabaseClient() {
  if (browserClient) return browserClient
  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return browserClient
}
