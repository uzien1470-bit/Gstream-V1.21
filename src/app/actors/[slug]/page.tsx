import { notFound } from 'next/navigation'
import { getActorDetail } from '@/lib/content'
import { ActorPage } from './actor-page'

export const metadata = { title: 'Actor — Gstream' }

export default async function ActorRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const actor = await getActorDetail(slug)
  if (!actor) notFound()
  return <ActorPage actor={actor} />
}
