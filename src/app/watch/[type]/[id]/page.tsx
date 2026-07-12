import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getDetail, getRecommendations } from '@/lib/content'
import { WatchClient } from '@/components/watch/watch-client'
import type { ContentType } from '@/lib/types'

export const metadata = { title: 'Watch — Gstream' }

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>
  searchParams: Promise<{ s?: string; e?: string }>
}) {
  const { type: typeParam, id } = await params
  const { s, e } = await searchParams

  const validTypes: ContentType[] = ['movie', 'series', 'anime']
  if (!validTypes.includes(typeParam as ContentType)) notFound()

  const type = typeParam as ContentType
  const detail = await getDetail(type, id)
  if (!detail) notFound()

  const recommendations = await getRecommendations(type, id, 12)

  // Determine initial episode from query params
  let initialEpisodeId: string | undefined
  if (type !== 'movie' && detail.seasons.length > 0) {
    const seasonNum = s ? Number(s) : 1
    const epNum = e ? Number(e) : 1
    const season = detail.seasons.find((x) => x.seasonNumber === seasonNum) ?? detail.seasons[0]
    const ep = season?.episodes.find((x) => x.episodeNumber === epNum) ?? season?.episodes[0]
    initialEpisodeId = ep?.id
  }

  return (
    <WatchClient
      type={type}
      id={id}
      initialEpisodeId={initialEpisodeId}
      detail={detail}
      recommendations={recommendations}
    />
  )
}
