'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Small, dismissible warning banner shown ONLY inside the Admin Dashboard
 * when Supabase environment variables are not configured. The public site
 * is never affected.
 */
export function AdminSupabaseBanner() {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(() => setConfigured(true))
      .catch(() => setConfigured(false))
    // Also check via a dedicated lightweight endpoint
    fetch('/api/health/supabase')
      .then((r) => r.json())
      .then((d) => setConfigured(Boolean(d.configured)))
      .catch(() => setConfigured(false))
  }, [])

  if (configured !== false || dismissed) return null

  return (
    <div
      className={cn(
        'mx-auto mb-6 flex items-center gap-3 rounded-xl border border-amber-500/30',
        'bg-amber-500/10 px-4 py-3 text-sm text-amber-200',
      )}
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
      <div className="flex-1">
        <strong className="font-semibold">Supabase is not configured.</strong>{' '}
        Set <code className="rounded bg-amber-500/20 px-1">NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
        <code className="rounded bg-amber-500/20 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and{' '}
        <code className="rounded bg-amber-500/20 px-1">SUPABASE_SERVICE_ROLE_KEY</code> in your
        environment variables. See <code className="rounded bg-amber-500/20 px-1">DEPLOYMENT.md</code> for setup.
      </div>
      <a
        href="https://supabase.com/dashboard"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-lg border border-amber-500/30 px-2 py-1 text-xs font-medium text-amber-200 hover:bg-amber-500/20"
      >
        <ExternalLink className="mr-1 inline h-3 w-3" /> Supabase
      </a>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-amber-400 hover:text-amber-200"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
