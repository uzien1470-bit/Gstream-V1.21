import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseServiceRoleKey } from './configured'

/**
 * Supabase admin client using the service-role key.
 * Bypasses RLS. Use ONLY on the server (API routes) for admin operations
 * such as deleting auth.users, uploading to Storage, or seeding.
 *
 * NEVER expose this client to the browser.
 */
export function createAdminSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
