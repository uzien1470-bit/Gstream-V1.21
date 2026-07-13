import Link from 'next/link'
import { Home, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, oklch(0.54 0.24 295 / 0.3), transparent 45%), radial-gradient(circle at 70% 80%, oklch(0.6 0.22 315 / 0.22), transparent 45%)',
        }}
      />
      <div className="relative z-10 text-center">
        <div
          className="text-[10rem] font-extrabold leading-none text-primary text-glow sm:text-[14rem]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          404
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Lost in the stream
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          The page you&apos;re looking for has drifted off-screen. Let&apos;s get you back to the show.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/"><Home className="mr-2 h-4 w-4" /> Back Home</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/movies"><Film className="mr-2 h-4 w-4" /> Browse Movies</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
