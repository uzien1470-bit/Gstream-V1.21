import Link from 'next/link'
import { Database, Key, Terminal, ExternalLink, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STEPS = [
  {
    icon: Database,
    title: '1. Create a Supabase project',
    desc: 'Go to supabase.com and create a new project. Note your Project URL, anon key, and service-role key from Settings → API.',
  },
  {
    icon: Terminal,
    title: '2. Set environment variables',
    desc: 'Copy .env.example to .env.local and fill in your Supabase URL, anon key, service-role key, and the Postgres DATABASE_URL (from Supabase → Settings → Database → Connection string).',
  },
  {
    icon: Database,
    title: '3. Run the database migration',
    desc: 'Run: bunx prisma db push   (this creates all tables in your Supabase Postgres from the Prisma schema).',
  },
  {
    icon: Terminal,
    title: '4. Run the Supabase setup SQL',
    desc: 'Open supabase/setup.sql in the Supabase SQL Editor and run it. This creates storage buckets, the auth→profile trigger, and RLS policies.',
  },
  {
    icon: Key,
    title: '5. Seed content & create admin',
    desc: 'Run: bun run db:seed   then register an account in the app, and run the SQL in supabase/setup.sql (bottom) to promote yourself to admin.',
  },
]

export function SupabaseSetupScreen() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-12">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, oklch(0.54 0.24 295 / 0.3), transparent 45%), radial-gradient(circle at 70% 80%, oklch(0.6 0.22 315 / 0.22), transparent 45%)',
        }}
      />
      <div className="relative z-10 w-full max-w-2xl">
        <div className="rounded-3xl border border-border bg-card/60 p-8 backdrop-blur-xl sm:p-10">
          <div className="mb-6 flex items-center gap-3">
            { }
            <img src="/logo.png" alt="Gstream" className="h-12 w-12 rounded-xl shadow-lg shadow-primary/30" />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Connect Supabase to continue
              </h1>
              <p className="text-sm text-muted-foreground">
                Gstream needs a Supabase backend for database, auth, and storage.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {STEPS.map((step) => (
              <div key={step.title} className="flex gap-3 rounded-xl border border-border bg-background/40 p-4">
                <step.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">{step.title}</div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Open Supabase Dashboard
              </a>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/DEPLOYMENT.md">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Read deployment guide
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            After setting your environment variables, restart the dev server.
          </p>
        </div>
      </div>
    </div>
  )
}
