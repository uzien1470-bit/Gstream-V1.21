'use client'

import { useState } from 'react'
import { ChevronDown, Play, Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { SmartImage } from '@/components/content/smart-image'
import type { SeasonData, EpisodeData } from '@/lib/types'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'

interface EpisodeSelectorProps {
  seasons: SeasonData[]
  activeEpisodeId?: string
  onSelectEpisode: (season: SeasonData, episode: EpisodeData) => void
}

export function EpisodeSelector({ seasons, activeEpisodeId, onSelectEpisode }: EpisodeSelectorProps) {
  // Find which season contains the active episode
  const initialSeason = seasons.find((s) => s.episodes.some((e) => e.id === activeEpisodeId)) ?? seasons[0]
  const [openSeasons, setOpenSeasons] = useState<string[]>(
    initialSeason ? [initialSeason.id] : [],
  )

  if (!seasons.length) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
      <div className="border-b border-border bg-card/60 px-5 py-4">
        <h3 className="text-lg font-bold">Episodes</h3>
        <p className="text-sm text-muted-foreground">
          {seasons.length} season{seasons.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <Accordion
        type="multiple"
        value={openSeasons}
        onValueChange={setOpenSeasons}
        className="divide-y divide-border"
      >
        {seasons.map((season) => (
          <AccordionItem key={season.id} value={season.id} className="border-0">
            <AccordionTrigger className="px-5 py-4 hover:no-underline">
              <div className="flex flex-1 items-center justify-between pr-3 text-left">
                <div>
                  <div className="font-semibold text-foreground">{season.title}</div>
                  {season.description && (
                    <div className="text-xs text-muted-foreground line-clamp-1">{season.description}</div>
                  )}
                </div>
                <Badge variant="secondary" className="mr-2">
                  {season.episodes.length} ep
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-2">
                {season.episodes.map((ep) => {
                  const active = ep.id === activeEpisodeId
                  return (
                    <button
                      key={ep.id}
                      onClick={() => onSelectEpisode(season, ep)}
                      className={cn(
                        'group/ep flex w-full gap-3 rounded-xl p-2 text-left transition-colors',
                        active ? 'bg-primary/15 ring-1 ring-primary/40' : 'hover:bg-white/5',
                      )}
                    >
                      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-secondary sm:w-40">
                        <SmartImage
                          src={ep.thumbnailUrl ?? ''}
                          alt={ep.title}
                          className="h-full w-full"
                          imgClassName="object-cover"
                        />
                        <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition-opacity group-hover/ep:opacity-100">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
                            <Play className="h-4 w-4 fill-current" />
                          </span>
                        </div>
                        <div className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          E{ep.episodeNumber}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 py-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-foreground">{ep.title}</span>
                          {active && <Badge className="bg-primary text-primary-foreground">Playing</Badge>}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {ep.description || 'No description available.'}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                          {ep.runtime > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {ep.runtime}m
                            </span>
                          )}
                          {ep.airDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {ep.airDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
