// Shared content view-model types used across server + client

export type ContentType = 'movie' | 'series' | 'anime'

export interface CastMember {
  name: string
  role: string
  image?: string
}

export interface ContentCardData {
  id: string
  title: string
  slug: string
  type: ContentType
  posterUrl: string
  backdropUrl: string
  logoUrl?: string | null
  releaseYear: number
  rating: number
  runtime?: number
  synopsis: string
  genres: string[]
  trending?: boolean
  popular?: boolean
  topRated?: boolean
  recentlyAdded?: boolean
}

export interface ServerOption {
  id: string
  name: string
  embedUrl: string
  quality: string
  priority: number
  status: string
}

export interface EpisodeData {
  id: string
  episodeNumber: number
  title: string
  description: string | null
  thumbnailUrl: string | null
  runtime: number
  airDate: string | null
  servers: ServerOption[]
}

export interface SeasonData {
  id: string
  seasonNumber: number
  title: string
  description: string | null
  posterUrl: string | null
  episodes: EpisodeData[]
}

export interface ContentDetail {
  id: string
  title: string
  slug: string
  type: ContentType
  synopsis: string
  posterUrl: string
  backdropUrl: string
  logoUrl: string | null
  releaseYear: number
  rating: number
  voteCount: number
  runtime: number
  trailerUrl: string | null
  genres: string[]
  categories: string[]
  cast: CastMember[]
  servers: ServerOption[]
  seasons: SeasonData[]
  featured: boolean
  trending: boolean
  popular: boolean
  topRated: boolean
}
