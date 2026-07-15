'use client'

import Link from 'next/link'
import { Calendar, MapPin, Globe, ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { ContentCard } from '@/components/content/content-card'
import { SmartImage } from '@/components/content/smart-image'
import { Button } from '@/components/ui/button'
import type { ActorDetail } from '@/lib/types'

export function ActorPage({ actor }: { actor: ActorDetail }) {
  return (
    <AppShell>
      {/* Hero banner */}
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
        {actor.heroPhotoUrl ? (
          <SmartImage
            src={actor.heroPhotoUrl}
            alt={actor.name}
            className="h-full w-full"
            imgClassName="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 via-background to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        {/* Profile header */}
        <div className="-mt-24 flex flex-col gap-6 sm:flex-row sm:items-end">
          {/* Profile photo */}
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-background shadow-2xl sm:h-40 sm:w-40">
            {actor.profilePhotoUrl ? (
              <SmartImage
                src={actor.profilePhotoUrl}
                alt={actor.name}
                className="h-full w-full"
                imgClassName="object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-primary/20 text-4xl font-bold text-primary">
                {actor.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 pb-2">
            <h1
              className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {actor.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {actor.birthday && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {actor.birthday}
                </span>
              )}
              {actor.birthPlace && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {actor.birthPlace}
                </span>
              )}
              {actor.nationality && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" /> {actor.nationality}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Biography */}
        {actor.biography && (
          <div className="mt-8 max-w-3xl">
            <h2 className="mb-3 text-lg font-bold tracking-tight">Biography</h2>
            <p className="text-sm leading-relaxed text-foreground/80 sm:text-base">
              {actor.biography}
            </p>
          </div>
        )}

        {/* Filmography */}
        {actor.filmography.length > 0 ? (
          <section className="mt-12 pb-16">
            <h2
              className="mb-5 text-xl font-bold tracking-tight sm:text-2xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Filmography
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {actor.filmography.map((item) => (
                <ContentCard key={`${item.type}-${item.id}`} item={item} className="w-full" />
              ))}
            </div>
          </section>
        ) : (
          <div className="mt-12 pb-16 text-center text-muted-foreground">
            <p>No titles available yet.</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
