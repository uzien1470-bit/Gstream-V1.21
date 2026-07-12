'use client'

import { useState, useEffect, useMemo } from 'react'
import { Server, Check, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ServerOption } from '@/lib/types'

interface EmbedPlayerProps {
  servers: ServerOption[]
  /** Key used to force iframe reload when content changes */
  playerKey: string
  onServerChange?: (server: ServerOption) => void
}

export function EmbedPlayer({ servers, playerKey, onServerChange }: EmbedPlayerProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [prevKey, setPrevKey] = useState(playerKey)

  // Reset state when playerKey or servers change (recommended render-time reset)
  if (playerKey !== prevKey) {
    setPrevKey(playerKey)
    setActiveIndex(0)
    setLoaded(false)
    setHasError(false)
  }

  const active = useMemo(() => {
    const activeServers = servers.filter((s) => s.status === 'active')
    return activeServers[Math.min(activeIndex, activeServers.length - 1)] ?? servers[0]
  }, [servers, activeIndex])

  // Notify parent of server change
  useEffect(() => {
    if (active && onServerChange) onServerChange(active)
  }, [active, onServerChange])

  const activeServers = servers.filter((s) => s.status === 'active')

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-black card-shadow">
      {/* Player area */}
      <div className="relative aspect-video w-full bg-black">
        {!active ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <AlertCircle className="mb-2 h-10 w-10" />
            <p className="text-sm">No streaming servers available for this title.</p>
          </div>
        ) : (
          <>
            {!loaded && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Loading {active.name}...</p>
              </div>
            )}
            <iframe
              key={`${playerKey}-${active.id}`}
              src={active.embedUrl}
              title="Gstream Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
              className="h-full w-full border-0"
              onLoad={() => setLoaded(true)}
              onError={() => setHasError(true)}
            />
          </>
        )}
      </div>

      {/* Server selector */}
      {activeServers.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Server className="h-4 w-4" />
            <span>Streaming Server</span>
            <Badge variant="outline" className="border-primary/40 text-primary">
              {active.name}
            </Badge>
            {active.quality && (
              <span className="text-xs text-muted-foreground">· {active.quality}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeServers.map((s, i) => (
              <Button
                key={s.id}
                size="sm"
                variant={i === activeIndex ? 'default' : 'secondary'}
                onClick={() => {
                  setActiveIndex(i)
                  setLoaded(false)
                }}
                className={cn(
                  'h-8 gap-1.5',
                  i === activeIndex && 'bg-primary text-primary-foreground',
                )}
              >
                {i === activeIndex && <Check className="h-3.5 w-3.5" />}
                {s.name}
                {s.quality && (
                  <span className="ml-1 text-[10px] opacity-70">{s.quality}</span>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
