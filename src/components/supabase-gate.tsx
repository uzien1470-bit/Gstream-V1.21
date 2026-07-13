import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { SupabaseSetupScreen } from '@/components/supabase-setup-screen'

/**
 * Server component that renders children when Supabase is configured,
 * or a setup screen when env vars are missing. Wrap any page that needs
 * Supabase (DB/Auth) so the app degrades gracefully.
 */
export function SupabaseGate({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return <SupabaseSetupScreen />
  }
  return <>{children}</>
}
