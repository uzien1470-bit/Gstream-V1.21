
import { createAdminSupabaseClient } from '@/lib/supabase'

// TMDB image CDN base — publicly accessible
const IMG = (path: string) => `https://image.tmdb.org/t/p/original${path}`

// YouTube embed helper (real, working embeds for the demo streaming player)
const YT = (id: string) => `https://www.youtube.com/embed/${id}?autoplay=0&rel=0&modestbranding=1`

interface CastDef {
  name: string
  role: string
  image?: string
}

interface ServerDef {
  name: string
  embedUrl: string
  quality?: string
  priority?: number
}

interface MovieDef {
  title: string
  slug: string
  synopsis: string
  poster: string
  backdrop: string
  logo?: string
  year: number
  runtime: number
  rating: number
  votes: number
  trailer?: string
  genres: string[]
  categories: string[]
  cast: CastDef[]
  servers: ServerDef[]
  flags?: Partial<{ trending: boolean; popular: boolean; topRated: boolean; featured: boolean; recentlyAdded: boolean; recentlyUpdated: boolean }>
}

interface EpisodeDef {
  title: string
  description: string
  thumbnail?: string
  runtime: number
  airDate?: string
  servers: ServerDef[]
}

interface SeasonDef {
  seasonNumber: number
  title: string
  description?: string
  poster?: string
  episodes: EpisodeDef[]
}

interface SeriesDef {
  title: string
  slug: string
  synopsis: string
  poster: string
  backdrop: string
  logo?: string
  year: number
  rating: number
  votes: number
  trailer?: string
  genres: string[]
  categories: string[]
  cast: CastDef[]
  seasons: SeasonDef[]
  flags?: Partial<{ trending: boolean; popular: boolean; topRated: boolean; featured: boolean; recentlyAdded: boolean; recentlyUpdated: boolean }>
}

// ───────────────────────── Streaming servers ─────────────────────────
const SERVERS = [
  { name: 'VidFast', slug: 'vidfast', priority: 10, status: 'active' },
  { name: 'Filemoon', slug: 'filemoon', priority: 9, status: 'active' },
  { name: 'StreamWish', slug: 'streamwish', priority: 8, status: 'active' },
  { name: 'VidHide', slug: 'vidhide', priority: 7, status: 'active' },
  { name: 'MixDrop', slug: 'mixdrop', priority: 6, status: 'active' },
  { name: 'Voe', slug: 'voe', priority: 5, status: 'active' },
]

// helper to attach the same embed to multiple named servers
function ytServers(ids: Record<string, string>): ServerDef[] {
  return SERVERS.map((s, i) => {
    const yt = ids[s.slug] ?? ids['vidfast'] ?? Object.values(ids)[0]
    return {
      name: s.name,
      embedUrl: YT(yt),
      quality: ['1080p', '720p', 'Auto', '480p', '360p', 'HD'][i % 6],
      priority: s.priority,
    }
  })
}

// ───────────────────────── Genres ─────────────────────────
const GENRES = [
  'Action', 'Adventure', 'Drama', 'Sci-Fi', 'Thriller', 'Crime', 'Fantasy',
  'Animation', 'Comedy', 'Horror', 'Mystery', 'Romance', 'War', 'Western',
  'Documentary', 'Family', 'History', 'Music', 'Biography',
]

const CATEGORIES = [
  { name: 'Trending Now', slug: 'trending-now', icon: 'Flame' },
  { name: 'New Releases', slug: 'new-releases', icon: 'Sparkles' },
  { name: 'Top Rated', slug: 'top-rated', icon: 'Star' },
  { name: 'Action & Adventure', slug: 'action-adventure', icon: 'Swords' },
  { name: 'Sci-Fi Worlds', slug: 'sci-fi-worlds', icon: 'Rocket' },
  { name: 'Dark & Gritty', slug: 'dark-gritty', icon: 'Moon' },
  { name: 'Anime Universe', slug: 'anime-universe', icon: 'Sparkle' },
  { name: 'Critically Acclaimed', slug: 'critically-acclaimed', icon: 'Award' },
]

// ───────────────────────── Movies ─────────────────────────
const MOVIES: MovieDef[] = [
  {
    title: 'Dune: Part Two',
    slug: 'dune-part-two',
    synopsis: 'Paul Atreides unites with the Fremen and seeks revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he must prevent a terrible future only he can foresee.',
    poster: IMG('/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'),
    backdrop: IMG('/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg'),
    year: 2024, runtime: 166, rating: 8.3, votes: 6800,
    trailer: YT('Way9Dexny3w'),
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    categories: ['trending-now', 'new-releases', 'sci-fi-worlds'],
    cast: [
      { name: 'Timothée Chalamet', role: 'Paul Atreides' },
      { name: 'Zendaya', role: 'Chani' },
      { name: 'Rebecca Ferguson', role: 'Lady Jessica' },
      { name: 'Javier Bardem', role: 'Stilgar' },
    ],
    servers: ytServers({ vidfast: 'Way9Dexny3w', filemoon: 'n9x7gq3pVUc', streamwish: 'QmPP3JQqYiw' }),
    flags: { trending: true, popular: true, topRated: true, featured: true, recentlyAdded: true },
  },
  {
    title: 'Oppenheimer',
    slug: 'oppenheimer',
    synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, and the moral reckoning that followed.',
    poster: IMG('/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'),
    backdrop: IMG('/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg'),
    year: 2023, runtime: 180, rating: 8.4, votes: 9200,
    trailer: YT('uYPbbksJxIg'),
    genres: ['Biography', 'Drama', 'History'],
    categories: ['top-rated', 'critically-acclaimed'],
    cast: [
      { name: 'Cillian Murphy', role: 'J. Robert Oppenheimer' },
      { name: 'Emily Blunt', role: 'Katherine Oppenheimer' },
      { name: 'Robert Downey Jr.', role: 'Lewis Strauss' },
      { name: 'Matt Damon', role: 'Leslie Groves' },
    ],
    servers: ytServers({ vidfast: 'uYPbbksJxIg', filemoon: 'm4qKqJxJZvw' }),
    flags: { trending: true, popular: true, topRated: true, featured: true },
  },
  {
    title: 'The Batman',
    slug: 'the-batman',
    synopsis: 'When the Riddler, a sadistic serial killer, begins murdering key political figures in Gotham, Batman is forced to investigate the city\'s hidden corruption and question his family\'s involvement.',
    poster: IMG('/74xTEgt7R36Fpooo50r9T25onhq.jpg'),
    backdrop: IMG('/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg'),
    year: 2022, runtime: 176, rating: 7.8, votes: 8100,
    trailer: YT('mqqft2x_Aa4'),
    genres: ['Crime', 'Mystery', 'Action'],
    categories: ['dark-gritty', 'action-adventure'],
    cast: [
      { name: 'Robert Pattinson', role: 'Bruce Wayne' },
      { name: 'Zoë Kravitz', role: 'Selina Kyle' },
      { name: 'Paul Dano', role: 'The Riddler' },
      { name: 'Colin Farrell', role: 'Oswald Cobblepot' },
    ],
    servers: ytServers({ vidfast: 'mqqft2x_Aa4', filemoon: 'rFptlxtKt7I' }),
    flags: { popular: true, topRated: true, featured: true },
  },
  {
    title: 'Interstellar',
    slug: 'interstellar',
    synopsis: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
    poster: IMG('/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'),
    backdrop: IMG('/pbrkL804c8yAv3zBZR4QPEafpAR.jpg'),
    year: 2014, runtime: 169, rating: 8.4, votes: 35000,
    trailer: YT('zSWdZVtXT7E'),
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    categories: ['sci-fi-worlds', 'top-rated', 'critically-acclaimed'],
    cast: [
      { name: 'Matthew McConaughey', role: 'Cooper' },
      { name: 'Anne Hathaway', role: 'Brand' },
      { name: 'Jessica Chastain', role: 'Murph' },
      { name: 'Michael Caine', role: 'Professor Brand' },
    ],
    servers: ytServers({ vidfast: 'zSWdZVtXT7E', filemoon: 'Lm8p5rlrjAY' }),
    flags: { popular: true, topRated: true, recentlyAdded: true },
  },
  {
    title: 'Inception',
    slug: 'inception',
    synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project.',
    poster: IMG('/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg'),
    backdrop: IMG('/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg'),
    year: 2010, runtime: 148, rating: 8.4, votes: 37000,
    trailer: YT('YoHD9XEInc0'),
    genres: ['Action', 'Adventure', 'Sci-Fi', 'Thriller'],
    categories: ['action-adventure', 'sci-fi-worlds', 'critically-acclaimed'],
    cast: [
      { name: 'Leonardo DiCaprio', role: 'Cobb' },
      { name: 'Joseph Gordon-Levitt', role: 'Arthur' },
      { name: 'Elliot Page', role: 'Ariadne' },
      { name: 'Tom Hardy', role: 'Eames' },
    ],
    servers: ytServers({ vidfast: 'YoHD9XEInc0', filemoon: 'GibQbi5L0Y8' }),
    flags: { popular: true, topRated: true },
  },
  {
    title: 'The Dark Knight',
    slug: 'the-dark-knight',
    synopsis: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    poster: IMG('/qJ2tW6WMUDux911r6m7haRef0WH.jpg'),
    backdrop: IMG('/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg'),
    year: 2008, runtime: 152, rating: 9.0, votes: 30000,
    trailer: YT('EXeTwQWrcwY'),
    genres: ['Action', 'Crime', 'Drama', 'Thriller'],
    categories: ['dark-gritty', 'action-adventure', 'critically-acclaimed'],
    cast: [
      { name: 'Christian Bale', role: 'Bruce Wayne' },
      { name: 'Heath Ledger', role: 'Joker' },
      { name: 'Aaron Eckhart', role: 'Harvey Dent' },
      { name: 'Gary Oldman', role: 'Jim Gordon' },
    ],
    servers: ytServers({ vidfast: 'EXeTwQWrcwY', filemoon: 'PY6cArIyyE0' }),
    flags: { popular: true, topRated: true, featured: true },
  },
  {
    title: 'Blade Runner 2049',
    slug: 'blade-runner-2049',
    synopsis: 'Young Blade Runner K\'s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who has been missing for thirty years.',
    poster: IMG('/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg'),
    backdrop: IMG('/ilRyazdMJwN05exqhwK4tMKBYZs.jpg'),
    year: 2017, runtime: 164, rating: 8.0, votes: 16000,
    trailer: YT('gCcx85zbxz4'),
    genres: ['Sci-Fi', 'Drama', 'Mystery'],
    categories: ['sci-fi-worlds', 'dark-gritty'],
    cast: [
      { name: 'Ryan Gosling', role: 'K' },
      { name: 'Harrison Ford', role: 'Rick Deckard' },
      { name: 'Ana de Armas', role: 'Joi' },
      { name: 'Sylvia Hoeks', role: 'Luv' },
    ],
    servers: ytServers({ vidfast: 'gCcx85zbxz4', filemoon: 'gCcx85zbxz4' }),
    flags: { topRated: true, recentlyAdded: true },
  },
  {
    title: 'Mad Max: Fury Road',
    slug: 'mad-max-fury-road',
    synopsis: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners and a drifter named Max.',
    poster: IMG('/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg'),
    backdrop: IMG('/gqrnQA6Xppdl8vIb2eJc58VC1tW.jpg'),
    year: 2015, runtime: 120, rating: 8.1, votes: 18000,
    trailer: YT('hEJnMQG9ev8'),
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    categories: ['action-adventure', 'sci-fi-worlds'],
    cast: [
      { name: 'Tom Hardy', role: 'Max Rockatansky' },
      { name: 'Charlize Theron', role: 'Imperator Furiosa' },
      { name: 'Nicholas Hoult', role: 'Nux' },
    ],
    servers: ytServers({ vidfast: 'hEJnMQG9ev8' }),
    flags: { popular: true, topRated: true },
  },
  {
    title: 'Parasite',
    slug: 'parasite',
    synopsis: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    poster: IMG('/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'),
    backdrop: IMG('/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg'),
    year: 2019, runtime: 132, rating: 8.5, votes: 21000,
    trailer: YT('5xH0HfJHsaY'),
    genres: ['Drama', 'Thriller', 'Comedy'],
    categories: ['critically-acclaimed', 'top-rated'],
    cast: [
      { name: 'Song Kang-ho', role: 'Kim Ki-taek' },
      { name: 'Lee Sun-kyun', role: 'Park Dong-ik' },
      { name: 'Cho Yeo-jeong', role: 'Choi Yeon-gyo' },
    ],
    servers: ytServers({ vidfast: '5xH0HfJHsaY' }),
    flags: { topRated: true, recentlyAdded: true },
  },
  {
    title: 'Everything Everywhere All at Once',
    slug: 'everything-everywhere-all-at-once',
    synopsis: 'An aging Chinese immigrant is swept up in an insane adventure, where she alone can save existence by exploring other universes and connecting with the lives she could have led.',
    poster: IMG('/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg'),
    backdrop: IMG('/nGxUxi3PfXDRm7Vg95VBNgNM8NM.jpg'),
    year: 2022, runtime: 139, rating: 8.0, votes: 14000,
    trailer: YT('wxN1T1uxQ2g'),
    genres: ['Sci-Fi', 'Adventure', 'Comedy'],
    categories: ['sci-fi-worlds', 'critically-acclaimed'],
    cast: [
      { name: 'Michelle Yeoh', role: 'Evelyn Wang' },
      { name: 'Ke Huy Quan', role: 'Waymond Wang' },
      { name: 'Jamie Lee Curtis', role: 'Deirdre Beaubeirdre' },
    ],
    servers: ytServers({ vidfast: 'wxN1T1uxQ2g' }),
    flags: { popular: true, topRated: true },
  },
  {
    title: 'Tenet',
    slug: 'tenet',
    synopsis: 'A secret agent is tasked with preventing World War III through time inversion, a technology that allows objects to move backward through time.',
    poster: IMG('/k68nPLbIST6NP96JmTxmZijEvCA.jpg'),
    backdrop: IMG('/2RRlWyfA5DMcdLRTcRWMvIyhVoB.jpg'),
    year: 2020, runtime: 150, rating: 7.3, votes: 11000,
    trailer: YT('L3pk_TBkihU'),
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    categories: ['action-adventure', 'sci-fi-worlds'],
    cast: [
      { name: 'John David Washington', role: 'The Protagonist' },
      { name: 'Robert Pattinson', role: 'Neil' },
      { name: 'Elizabeth Debicki', role: 'Kat' },
    ],
    servers: ytServers({ vidfast: 'L3pk_TBkihU' }),
    flags: { trending: true, recentlyAdded: true },
  },
  {
    title: 'Joker',
    slug: 'joker',
    synopsis: 'A mentally troubled stand-up comedian embarks on a downward spiral that leads to the creation of an iconic villain.',
    poster: IMG('/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg'),
    backdrop: IMG('/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg'),
    year: 2019, runtime: 122, rating: 8.2, votes: 19000,
    trailer: YT('zAGVQLHvwOY'),
    genres: ['Crime', 'Drama', 'Thriller'],
    categories: ['dark-gritty', 'critically-acclaimed'],
    cast: [
      { name: 'Joaquin Phoenix', role: 'Arthur Fleck' },
      { name: 'Robert De Niro', role: 'Murray Franklin' },
      { name: 'Zazie Beetz', role: 'Sophie Dumond' },
    ],
    servers: ytServers({ vidfast: 'zAGVQLHvwOY' }),
    flags: { popular: true, topRated: true },
  },
  {
    title: 'Gladiator',
    slug: 'gladiator',
    synopsis: 'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.',
    poster: IMG('/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg'),
    backdrop: IMG('/hND7xAaxxBgaIspp9iMsaEXOSp5.jpg'),
    year: 2000, runtime: 155, rating: 8.5, votes: 17000,
    trailer: YT('owK1qxDselE'),
    genres: ['Action', 'Drama', 'Adventure'],
    categories: ['action-adventure', 'critically-acclaimed'],
    cast: [
      { name: 'Russell Crowe', role: 'Maximus' },
      { name: 'Joaquin Phoenix', role: 'Commodus' },
      { name: 'Connie Nielsen', role: 'Lucilla' },
    ],
    servers: ytServers({ vidfast: 'owK1qxDselE' }),
    flags: { topRated: true },
  },
  {
    title: 'The Matrix',
    slug: 'the-matrix',
    synopsis: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
    poster: IMG('/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg'),
    backdrop: IMG('/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg'),
    year: 1999, runtime: 136, rating: 8.7, votes: 26000,
    trailer: YT('vKQi3bBA1y8'),
    genres: ['Action', 'Sci-Fi'],
    categories: ['sci-fi-worlds', 'action-adventure', 'critically-acclaimed'],
    cast: [
      { name: 'Keanu Reeves', role: 'Neo' },
      { name: 'Laurence Fishburne', role: 'Morpheus' },
      { name: 'Carrie-Anne Moss', role: 'Trinity' },
    ],
    servers: ytServers({ vidfast: 'vKQi3bBA1y8' }),
    flags: { popular: true, topRated: true },
  },
  {
    title: 'Spider-Man: No Way Home',
    slug: 'spider-man-no-way-home',
    synopsis: 'With Spider-Man\'s identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds appear, forcing Peter to discover what it truly means to be Spider-Man.',
    poster: IMG('/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg'),
    backdrop: IMG('/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg'),
    year: 2021, runtime: 148, rating: 8.2, votes: 22000,
    trailer: YT('JfVOs4VSpmA'),
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    categories: ['action-adventure', 'trending-now'],
    cast: [
      { name: 'Tom Holland', role: 'Peter Parker' },
      { name: 'Zendaya', role: 'MJ' },
      { name: 'Benedict Cumberbatch', role: 'Doctor Strange' },
    ],
    servers: ytServers({ vidfast: 'JfVOs4VSpmA' }),
    flags: { trending: true, popular: true },
  },
  {
    title: 'Top Gun: Maverick',
    slug: 'top-gun-maverick',
    synopsis: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN\'s elite graduates on a mission that demands the ultimate sacrifice.',
    poster: IMG('/62HCnUTziyWcpDaBO2i1DX17ljH.jpg'),
    backdrop: IMG('/odJ4hx6g6vBt4lBWKFD1tI8WS4x.jpg'),
    year: 2022, runtime: 130, rating: 8.3, votes: 15000,
    trailer: YT('qSqVVswa420'),
    genres: ['Action', 'Drama'],
    categories: ['action-adventure', 'top-rated'],
    cast: [
      { name: 'Tom Cruise', role: 'Maverick' },
      { name: 'Miles Teller', role: 'Rooster' },
      { name: 'Jennifer Connelly', role: 'Penny' },
    ],
    servers: ytServers({ vidfast: 'qSqVVswa420' }),
    flags: { popular: true, topRated: true },
  },
  {
    title: 'John Wick: Chapter 4',
    slug: 'john-wick-chapter-4',
    synopsis: 'John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe.',
    poster: IMG('/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg'),
    backdrop: IMG('/7I6VUdPj6tQECNHdviJkUHD2u89.jpg'),
    year: 2023, runtime: 169, rating: 7.7, votes: 9000,
    trailer: YT('qEVUtrk8_B4'),
    genres: ['Action', 'Thriller', 'Crime'],
    categories: ['action-adventure', 'dark-gritty'],
    cast: [
      { name: 'Keanu Reeves', role: 'John Wick' },
      { name: 'Donnie Yen', role: 'Caine' },
      { name: 'Bill Skarsgård', role: 'Marquis' },
    ],
    servers: ytServers({ vidfast: 'qEVUtrk8_B4' }),
    flags: { trending: true, popular: true, recentlyAdded: true },
  },
  {
    title: 'Avatar: The Way of Water',
    slug: 'avatar-the-way-of-water',
    synopsis: 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri to protect their home.',
    poster: IMG('/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg'),
    backdrop: IMG('/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg'),
    year: 2022, runtime: 192, rating: 7.6, votes: 12000,
    trailer: YT('d9MyW72ELq0'),
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    categories: ['sci-fi-worlds', 'action-adventure'],
    cast: [
      { name: 'Sam Worthington', role: 'Jake Sully' },
      { name: 'Zoe Saldana', role: 'Neytiri' },
      { name: 'Sigourney Weaver', role: 'Kiri' },
    ],
    servers: ytServers({ vidfast: 'd9MyW72ELq0' }),
    flags: { popular: true },
  },
  {
    title: 'The Godfather',
    slug: 'the-godfather',
    synopsis: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
    poster: IMG('/3bhkrj58Vtu7enYsRolD1fZdja1.jpg'),
    backdrop: IMG('/tmU7GeKVybMWFButWEGl2M4GeiP.jpg'),
    year: 1972, runtime: 175, rating: 9.2, votes: 20000,
    trailer: YT('sY1S34973zA'),
    genres: ['Crime', 'Drama'],
    categories: ['critically-acclaimed', 'top-rated'],
    cast: [
      { name: 'Marlon Brando', role: 'Vito Corleone' },
      { name: 'Al Pacino', role: 'Michael Corleone' },
      { name: 'James Caan', role: 'Sonny Corleone' },
    ],
    servers: ytServers({ vidfast: 'sY1S34973zA' }),
    flags: { topRated: true },
  },
  {
    title: 'Pulp Fiction',
    slug: 'pulp-fiction',
    synopsis: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    poster: IMG('/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg'),
    backdrop: IMG('/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg'),
    year: 1994, runtime: 154, rating: 8.9, votes: 23000,
    trailer: YT('s7EdQ4FqbhY'),
    genres: ['Crime', 'Drama'],
    categories: ['critically-acclaimed', 'top-rated'],
    cast: [
      { name: 'John Travolta', role: 'Vincent Vega' },
      { name: 'Samuel L. Jackson', role: 'Jules Winnfield' },
      { name: 'Uma Thurman', role: 'Mia Wallace' },
    ],
    servers: ytServers({ vidfast: 's7EdQ4FqbhY' }),
    flags: { topRated: true },
  },
]

// ───────────────────────── TV Series ─────────────────────────
const SERIES: SeriesDef[] = [
  {
    title: 'Breaking Bad',
    slug: 'breaking-bad',
    synopsis: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family\'s future.',
    poster: IMG('/ggFHVNu6YYI5L9pCfOacjizRGt.jpg'),
    backdrop: IMG('/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg'),
    year: 2008, rating: 9.5, votes: 21000,
    trailer: YT('HhesaQXLuRY'),
    genres: ['Crime', 'Drama', 'Thriller'],
    categories: ['dark-gritty', 'critically-acclaimed', 'top-rated'],
    cast: [
      { name: 'Bryan Cranston', role: 'Walter White' },
      { name: 'Aaron Paul', role: 'Jesse Pinkman' },
      { name: 'Anna Gunn', role: 'Skyler White' },
    ],
    seasons: [
      {
        seasonNumber: 1, title: 'Season 1', description: 'Walter White begins his descent into the drug trade.',
        episodes: [
          { title: 'Pilot', description: 'Walter White, a mild-mannered chemistry teacher, discovers he has cancer and turns to a life of crime.', runtime: 58, airDate: '2008-01-20', servers: ytServers({ vidfast: 'HhesaQXLuRY' }) },
          { title: 'Cat\'s in the Bag...', description: 'Walt and Jesse attempt to cover their tracks after their first deal goes wrong.', runtime: 48, airDate: '2008-01-27', servers: ytServers({ vidfast: 'HhesaQXLuRY' }) },
          { title: '...And the Bag\'s in the River', description: 'Walt is faced with a difficult decision as he deals with their captive.', runtime: 48, airDate: '2008-02-10', servers: ytServers({ vidfast: 'HhesaQXLuRY' }) },
          { title: 'Cancer Man', description: 'Walt tells his family about his diagnosis while Jesse deals with his own demons.', runtime: 48, airDate: '2008-02-17', servers: ytServers({ vidfast: 'HhesaQXLuRY' }) },
        ],
      },
      {
        seasonNumber: 2, title: 'Season 2', description: 'The operation expands as Walt and Jesse face new threats.',
        episodes: [
          { title: 'Seven Thirty-Seven', description: 'Walt calculates how much money he needs before he dies.', runtime: 47, airDate: '2009-03-08', servers: ytServers({ vidfast: 'HhesaQXLuRY' }) },
          { title: 'Grilled', description: 'Walt and Jesse are held captive by Tuco.', runtime: 48, airDate: '2009-03-15', servers: ytServers({ vidfast: 'HhesaQXLuRY' }) },
          { title: 'Bit by a Dead Bee', description: 'Walt and Jesse struggle to cover their tracks after escaping Tuco.', runtime: 47, airDate: '2009-03-22', servers: ytServers({ vidfast: 'HhesaQXLuRY' }) },
        ],
      },
    ],
    flags: { trending: true, popular: true, topRated: true, featured: true },
  },
  {
    title: 'Stranger Things',
    slug: 'stranger-things',
    synopsis: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.',
    poster: IMG('/49WJfeN0moxb9IPfGn8AIqMGskD.jpg'),
    backdrop: IMG('/56v2KjBlU4XaOv9rVYEQypROD7P.jpg'),
    year: 2016, rating: 8.7, votes: 18000,
    trailer: YT('b9EkMc79ZSU'),
    genres: ['Drama', 'Fantasy', 'Horror', 'Mystery'],
    categories: ['trending-now', 'new-releases'],
    cast: [
      { name: 'Millie Bobby Brown', role: 'Eleven' },
      { name: 'Finn Wolfhard', role: 'Mike Wheeler' },
      { name: 'Winona Ryder', role: 'Joyce Byers' },
    ],
    seasons: [
      {
        seasonNumber: 1, title: 'Season 1', description: 'The disappearance of Will Byers.',
        episodes: [
          { title: 'The Vanishing of Will Byers', description: 'A young boy vanishes in a small town, and a girl with powers appears.', runtime: 48, airDate: '2016-07-15', servers: ytServers({ vidfast: 'b9EkMc79ZSU' }) },
          { title: 'The Weirdo on Maple Street', description: 'The boys hide Eleven while searching for Will.', runtime: 56, airDate: '2016-07-15', servers: ytServers({ vidfast: 'b9EkMc79ZSU' }) },
          { title: 'Holly, Jolly', description: 'Joyce begins to receive strange signals from Will.', runtime: 52, airDate: '2016-07-15', servers: ytServers({ vidfast: 'b9EkMc79ZSU' }) },
        ],
      },
      {
        seasonNumber: 2, title: 'Season 2', description: 'A new threat emerges from the Upside Down.',
        episodes: [
          { title: 'MADMAX', description: 'A new player arrives in Hawkins as the kids navigate life after the Upside Down.', runtime: 49, airDate: '2017-10-27', servers: ytServers({ vidfast: 'b9EkMc79ZSU' }) },
          { title: 'Trick or Treat, Freak', description: 'Halloween brings new horrors to Hawkins.', runtime: 56, airDate: '2017-10-27', servers: ytServers({ vidfast: 'b9EkMc79ZSU' }) },
        ],
      },
    ],
    flags: { trending: true, popular: true, featured: true, recentlyAdded: true },
  },
  {
    title: 'Game of Thrones',
    slug: 'game-of-thrones',
    synopsis: 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
    poster: IMG('/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg'),
    backdrop: IMG('/suopoADq0k8YZr4dQXcU6pToj6s.jpg'),
    year: 2011, rating: 9.2, votes: 24000,
    trailer: YT('KPLWWIOCOOQ'),
    genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
    categories: ['critically-acclaimed', 'top-rated'],
    cast: [
      { name: 'Emilia Clarke', role: 'Daenerys Targaryen' },
      { name: 'Kit Harington', role: 'Jon Snow' },
      { name: 'Peter Dinklage', role: 'Tyrion Lannister' },
    ],
    seasons: [
      {
        seasonNumber: 1, title: 'Season 1', description: 'The beginning of the struggle for the Iron Throne.',
        episodes: [
          { title: 'Winter Is Coming', description: 'Ned Stark is summoned to serve as the King\'s Hand.', runtime: 62, airDate: '2011-04-17', servers: ytServers({ vidfast: 'KPLWWIOCOOQ' }) },
          { title: 'The Kingsroad', description: 'The Starks travel to King\'s Landing while Daenerys adapts to her new life.', runtime: 56, airDate: '2011-04-24', servers: ytServers({ vidfast: 'KPLWWIOCOOQ' }) },
          { title: 'Lord Snow', description: 'Ned arrives at King\'s Landing and finds corruption.', runtime: 58, airDate: '2011-05-01', servers: ytServers({ vidfast: 'KPLWWIOCOOQ' }) },
        ],
      },
    ],
    flags: { popular: true, topRated: true, featured: true },
  },
  {
    title: 'The Last of Us',
    slug: 'the-last-of-us',
    synopsis: 'After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl who may be humanity\'s last hope.',
    poster: IMG('/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg'),
    backdrop: IMG('/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg'),
    year: 2023, rating: 8.7, votes: 13000,
    trailer: YT('uLtkt8BonwM'),
    genres: ['Action', 'Adventure', 'Drama', 'Horror'],
    categories: ['new-releases', 'dark-gritty'],
    cast: [
      { name: 'Pedro Pascal', role: 'Joel' },
      { name: 'Bella Ramsey', role: 'Ellie' },
      { name: 'Anna Torv', role: 'Tess' },
    ],
    seasons: [
      {
        seasonNumber: 1, title: 'Season 1', description: 'Joel and Ellie\'s journey across a post-apocalyptic America.',
        episodes: [
          { title: 'When You\'re Lost in the Darkness', description: 'Joel and Tess are tasked with smuggling a young girl out of the quarantine zone.', runtime: 81, airDate: '2023-01-15', servers: ytServers({ vidfast: 'uLtkt8BonwM' }) },
          { title: 'Infected', description: 'Joel and Tess continue their journey with Ellie, learning the truth about her immunity.', runtime: 53, airDate: '2023-01-22', servers: ytServers({ vidfast: 'uLtkt8BonwM' }) },
          { title: 'Long Long Time', description: 'A story of love and survival as Bill and Frank navigate the apocalypse.', runtime: 76, airDate: '2023-01-29', servers: ytServers({ vidfast: 'uLtkt8BonwM' }) },
        ],
      },
    ],
    flags: { trending: true, popular: true, recentlyAdded: true, featured: true },
  },
  {
    title: 'House of the Dragon',
    slug: 'house-of-the-dragon',
    synopsis: 'The Targaryen civil war, known as the Dance of the Dragons, set 200 years before the events of Game of Thrones.',
    poster: IMG('/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg'),
    backdrop: IMG('/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg'),
    year: 2022, rating: 8.4, votes: 11000,
    trailer: YT('DotnJ7tTA34'),
    genres: ['Action', 'Drama', 'Fantasy'],
    categories: ['new-releases', 'trending-now'],
    cast: [
      { name: 'Paddy Considine', role: 'King Viserys' },
      { name: 'Matt Smith', role: 'Daemon Targaryen' },
      { name: 'Emma D\'Arcy', role: 'Rhaenyra Targaryen' },
    ],
    seasons: [
      {
        seasonNumber: 1, title: 'Season 1', description: 'The seeds of the Targaryen civil war are sown.',
        episodes: [
          { title: 'The Heirs of the Dragon', description: 'King Viserys names his successor, setting off a chain of events.', runtime: 66, airDate: '2022-08-21', servers: ytServers({ vidfast: 'DotnJ7tTA34' }) },
          { title: 'The Rogue Prince', description: 'Daemon returns to King\'s Landing while Rhaenyra navigates her new role.', runtime: 61, airDate: '2022-08-28', servers: ytServers({ vidfast: 'DotnJ7tTA34' }) },
        ],
      },
    ],
    flags: { trending: true, popular: true, recentlyAdded: true },
  },
  {
    title: 'The Crown',
    slug: 'the-crown',
    synopsis: 'Follows the political rivalries and romance of Queen Elizabeth II\'s reign and the events that shaped the second half of the twentieth century.',
    poster: IMG('/1M876KPjulVwppEpldhdc8V4o68.jpg'),
    backdrop: IMG('/4QzgkBwXWelEoLp6XCm8tIcsZW9.jpg'),
    year: 2016, rating: 8.7, votes: 8000,
    trailer: YT('JWtnJjn6ng0'),
    genres: ['Drama', 'History', 'Biography'],
    categories: ['critically-acclaimed'],
    cast: [
      { name: 'Claire Foy', role: 'Queen Elizabeth II' },
      { name: 'Matt Smith', role: 'Prince Philip' },
      { name: 'Olivia Colman', role: 'Queen Elizabeth II' },
    ],
    seasons: [
      {
        seasonNumber: 1, title: 'Season 1', description: 'The early reign of Queen Elizabeth II.',
        episodes: [
          { title: 'Wolferton Splash', description: 'Princess Elizabeth marries Philip Mountbatten as King George\'s health declines.', runtime: 61, airDate: '2016-11-04', servers: ytServers({ vidfast: 'JWtnJjn6ng0' }) },
          { title: 'Hyde Park Corner', description: 'Elizabeth becomes queen while abroad in Kenya.', runtime: 57, airDate: '2016-11-04', servers: ytServers({ vidfast: 'JWtnJjn6ng0' }) },
        ],
      },
    ],
    flags: { topRated: true },
  },
  {
    title: 'Severance',
    slug: 'severance',
    synopsis: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives, until a mysterious colleague appears outside of work.',
    poster: IMG('/lFf6LLrQjYldcZItzOkGmMMigP7.jpg'),
    backdrop: IMG('/aE7K6oVI3jpzM0bCixrYxLEqfM.jpg'),
    year: 2022, rating: 8.7, votes: 7000,
    trailer: YT('xEQP4VVuyrY'),
    genres: ['Drama', 'Mystery', 'Sci-Fi'],
    categories: ['sci-fi-worlds', 'new-releases'],
    cast: [
      { name: 'Adam Scott', role: 'Mark' },
      { name: 'Zach Cherry', role: 'Dylan' },
      { name: 'Britt Lower', role: 'Helly' },
    ],
    seasons: [
      {
        seasonNumber: 1, title: 'Season 1', description: 'The mystery of Lumon Industries unfolds.',
        episodes: [
          { title: 'Good News About Hell', description: 'Mark leads a team whose memories are split between work and home.', runtime: 46, airDate: '2022-02-18', servers: ytServers({ vidfast: 'xEQP4VVuyrY' }) },
          { title: 'Half Loop', description: 'Helly wakes up in the office with no memory of who she is.', runtime: 41, airDate: '2022-02-18', servers: ytServers({ vidfast: 'xEQP4VVuyrY' }) },
        ],
      },
    ],
    flags: { trending: true, topRated: true, recentlyAdded: true },
  },
]

// ───────────────────────── Anime ─────────────────────────
const ANIME: SeriesDef[] = [
  {
    title: 'Attack on Titan',
    slug: 'attack-on-titan',
    synopsis: 'After his hometown is destroyed by the Titans, Eren Yeager vows to cleanse the earth of the giant humanoid creatures that threaten to destroy mankind.',
    poster: IMG('/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg'),
    backdrop: IMG('/8OVfcVf1OyUf0GqEvjivIaPp4bR.jpg'),
    year: 2013, rating: 9.1, votes: 16000,
    trailer: YT('MGRm4IzK1SQ'),
    genres: ['Animation', 'Action', 'Adventure', 'Drama', 'Fantasy'],
    categories: ['anime-universe', 'top-rated', 'trending-now'],
    cast: [
      { name: 'Yuki Kaji', role: 'Eren Yeager (voice)' },
      { name: 'Yui Ishikawa', role: 'Mikasa Ackerman (voice)' },
      { name: 'Marina Inoue', role: 'Armin Arlert (voice)' },
    ],
    seasons: [
      {
        seasonNumber: 1, title: 'Season 1', description: 'The fall of Shiganshina and the beginning of the fight against the Titans.',
        episodes: [
          { title: 'To You, 2000 Years From Now', description: 'The fall of Wall Maria begins as the Colossal Titan appears.', runtime: 24, airDate: '2013-04-07', servers: ytServers({ vidfast: 'MGRm4IzK1SQ' }) },
          { title: 'That Day', description: 'Eren witnesses a tragedy that sets him on his path of vengeance.', runtime: 24, airDate: '2013-04-14', servers: ytServers({ vidfast: 'MGRm4IzK1SQ' }) },
          { title: 'A Dim Light Amid Despair', description: 'The trainee cadets begin their military training.', runtime: 24, airDate: '2013-04-21', servers: ytServers({ vidfast: 'MGRm4IzK1SQ' }) },
        ],
      },
      {
        seasonNumber: 2, title: 'Season 2', description: 'The truth about the Titans within the walls begins to emerge.',
        episodes: [
          { title: 'Beast Titan', description: 'A strange new Titan appears as the Scouts face a new threat.', runtime: 24, airDate: '2017-04-01', servers: ytServers({ vidfast: 'MGRm4IzK1SQ' }) },
          { title: 'I\'m Home', description: 'Reiner and Bertholdt\'s secret is revealed.', runtime: 24, airDate: '2017-04-08', servers: ytServers({ vidfast: 'MGRm4IzK1SQ' }) },
        ],
      },
    ],
    flags: { trending: true, popular: true, topRated: true, featured: true, recentlyAdded: true },
  },
  {
    title: 'Demon Slayer',
    slug: 'demon-slayer',
    synopsis: 'A family is attacked by demons and only two members survive — Tanjiro and his sister Nezuko, who is turning into a demon slowly. Tanjiro sets out to become a demon slayer to avenge his family.',
    poster: IMG('/wrCVHdkBlBWdJUZPvnJWcBRuhSY.jpg'),
    backdrop: IMG('/nTvM4mhqNlHIvUkI1gVnW6XP7GG.jpg'),
    year: 2019, rating: 8.7, votes: 14000,
    trailer: YT('VQGCKyvzIM4'),
    genres: ['Animation', 'Action', 'Adventure', 'Fantasy'],
    categories: ['anime-universe', 'trending-now'],
    cast: [
      { name: 'Natsuki Hanae', role: 'Tanjiro Kamado (voice)' },
      { name: 'Akari Kitō', role: 'Nezuko Kamado (voice)' },
      { name: 'Hiro Shimono', role: 'Zenitsu Agatsuma (voice)' },
    ],
    seasons: [
      {
        seasonNumber: 1, title: 'Season 1', description: 'Tanjiro\'s journey to become a Demon Slayer.',
        episodes: [
          { title: 'Cruelty', description: 'Tanjiro returns home to find his family slaughtered by a demon.', runtime: 23, airDate: '2019-04-06', servers: ytServers({ vidfast: 'VQGCKyvzIM4' }) },
          { title: 'Trainer Sakonji Urokodaki', description: 'Tanjiro trains under Sakonji to become a demon slayer.', runtime: 23, airDate: '2019-04-13', servers: ytServers({ vidfast: 'VQGCKyvzIM4' }) },
          { title: 'Sabito and Makomo', description: 'Tanjiro meets two mysterious figures during his training.', runtime: 23, airDate: '2019-04-20', servers: ytServers({ vidfast: 'VQGCKyvzIM4' }) },
        ],
      },
      {
        seasonNumber: 2, title: 'Mugen Train Arc', description: 'The battle aboard the Mugen Train.',
        episodes: [
          { title: 'Flame Hashira Kyojuro Rengoku', description: 'Tanjiro joins Rengoku aboard the Mugen Train.', runtime: 23, airDate: '2021-10-10', servers: ytServers({ vidfast: 'VQGCKyvzIM4' }) },
          { title: 'Deep Sleep', description: 'The demon Enmu traps the slayers in their dreams.', runtime: 23, airDate: '2021-10-17', servers: ytServers({ vidfast: 'VQGCKyvzIM4' }) },
        ],
      },
    ],
    flags: { trending: true, popular: true, recentlyAdded: true, featured: true },
  },
  {
    title: 'Jujutsu Kaisen',
    slug: 'jujutsu-kaisen',
    synopsis: 'A boy swallows a cursed talisman — the finger of a demon — and becomes cursed himself. He enters a shaman school to be able to locate the demon\'s other body parts and exorcise himself.',
    poster: IMG('/fHpKWq9ayzSk8nSwqRuaAUemRKh.jpg'),
    backdrop: 'https://sfile.chatglm.cn/images-ppt/6154bba301a4.jpg',
    year: 2020, rating: 8.6, votes: 12000,
    trailer: YT('4A_X-Dvl0ws'),
    genres: ['Animation', 'Action', 'Adventure', 'Fantasy'],
    categories: ['anime-universe', 'new-releases'],
    cast: [
      { name: 'Junya Enoki', role: 'Yuji Itadori (voice)' },
      { name: 'Yūichi Nakamura', role: 'Satoru Gojo (voice)' },
      { name: 'Yuma Uchida', role: 'Megumi Fushiguro (voice)' },
    ],
    seasons: [
      {
        seasonNumber: 1, title: 'Season 1', description: 'Yuji Itadori enters the world of Jujutsu sorcery.',
        episodes: [
          { title: 'Ryomen Sukuna', description: 'Yuji swallows a cursed finger to save his friends.', runtime: 24, airDate: '2020-10-03', servers: ytServers({ vidfast: '4A_X-Dvl0ws' }) },
          { title: 'For Myself', description: 'Yuji begins his training at Jujutsu High.', runtime: 24, airDate: '2020-10-10', servers: ytServers({ vidfast: '4A_X-Dvl0ws' }) },
          { title: 'Girl of Steel', description: 'Nobara demonstrates her cursed technique in her first mission.', runtime: 23, airDate: '2020-10-17', servers: ytServers({ vidfast: '4A_X-Dvl0ws' }) },
        ],
      },
    ],
    flags: { trending: true, popular: true, recentlyAdded: true },
  },
  {
    title: 'One Piece',
    slug: 'one-piece',
    synopsis: 'Follows the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate, Gold Roger: the One Piece.',
    poster: IMG('/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg'),
    backdrop: 'https://sfile.chatglm.cn/images-ppt/1a0f2a90f66e.jpg',
    year: 1999, rating: 8.9, votes: 13000,
    trailer: YT('S8_YwFLCh4U'),
    genres: ['Animation', 'Action', 'Adventure', 'Comedy', 'Fantasy'],
    categories: ['anime-universe', 'top-rated'],
    cast: [
      { name: 'Mayumi Tanaka', role: 'Monkey D. Luffy (voice)' },
      { name: 'Kazuya Nakai', role: 'Roronoa Zoro (voice)' },
      { name: 'Akemi Ōkamura', role: 'Nami (voice)' },
    ],
    seasons: [
      {
        seasonNumber: 1, title: 'East Blue', description: 'Luffy gathers his crew in the East Blue.',
        episodes: [
          { title: 'I\'m Luffy! The Man Who\'s Gonna Be King of the Pirates!', description: 'Luffy sets out to find a crew and the One Piece.', runtime: 24, airDate: '1999-10-20', servers: ytServers({ vidfast: 'S8_YwFLCh4U' }) },
          { title: 'Enter the Great Swordsman! Pirate Hunter Roronoa Zoro', description: 'Luffy recruits the swordsman Zoro to his crew.', runtime: 24, airDate: '1999-11-17', servers: ytServers({ vidfast: 'S8_YwFLCh4U' }) },
        ],
      },
    ],
    flags: { popular: true, topRated: true, featured: true },
  },
  {
    title: 'Chainsaw Man',
    slug: 'chainsaw-man',
    synopsis: 'Following a betrayal, a young man left for dead is reborn as a powerful devil-human hybrid after merging with his pet devil and is soon enlisted by an organization to fight evil.',
    poster: IMG('/npdB6eFzizki0WaZ1OvKcJrWe97.jpg'),
    backdrop: IMG('/anr8KqjjjsP3jjjMgrYAyChDFmA.jpg'),
    year: 2022, rating: 8.5, votes: 9000,
    trailer: YT('q15CRdE5Bv0'),
    genres: ['Animation', 'Action', 'Adventure', 'Horror'],
    categories: ['anime-universe', 'new-releases'],
    cast: [
      { name: 'Kikunosuke Toya', role: 'Denji (voice)' },
      { name: 'Tomori Kusunoki', role: 'Makima (voice)' },
      { name: 'Shogo Sakata', role: 'Aki Hayakawa (voice)' },
    ],
    seasons: [
      {
        seasonNumber: 1, title: 'Season 1', description: 'Denji becomes Chainsaw Man.',
        episodes: [
          { title: 'Dog & Chainsaw', description: 'Denji merges with his devil dog Pochita to become Chainsaw Man.', runtime: 24, airDate: '2022-10-11', servers: ytServers({ vidfast: 'q15CRdE5Bv0' }) },
          { title: 'Arrival in Tokyo', description: 'Denji adjusts to his new life as a Devil Hunter.', runtime: 24, airDate: '2022-10-18', servers: ytServers({ vidfast: 'q15CRdE5Bv0' }) },
        ],
      },
    ],
    flags: { trending: true, recentlyAdded: true },
  },
  {
    title: 'Death Note',
    slug: 'death-note',
    synopsis: 'An intelligent high school student goes on a secret crusade to eliminate criminals from the world after discovering a notebook capable of killing anyone whose name is written into it.',
    poster: 'https://sfile.chatglm.cn/images-ppt/950b8f43da41.jpg',
    backdrop: 'https://sfile.chatglm.cn/images-ppt/8f07f22d876b.jpg',
    year: 2006, rating: 9.0, votes: 15000,
    trailer: YT('NlJZ-YgAt-c'),
    genres: ['Animation', 'Crime', 'Drama', 'Mystery', 'Thriller'],
    categories: ['anime-universe', 'critically-acclaimed', 'top-rated'],
    cast: [
      { name: 'Mamoru Miyano', role: 'Light Yagami (voice)' },
      { name: 'Kappei Yamaguchi', role: 'L (voice)' },
      { name: 'Aya Hirano', role: 'Misa Amane (voice)' },
    ],
    seasons: [
      {
        seasonNumber: 1, title: 'Season 1', description: 'Light Yagami vs L.',
        episodes: [
          { title: 'Rebirth', description: 'Light Yagami discovers the Death Note and begins his crusade.', runtime: 23, airDate: '2006-10-04', servers: ytServers({ vidfast: 'NlJZ-YgAt-c' }) },
          { title: 'Confrontation', description: 'L begins to close in on Kira\'s identity.', runtime: 23, airDate: '2006-10-11', servers: ytServers({ vidfast: 'NlJZ-YgAt-c' }) },
        ],
      },
    ],
    flags: { topRated: true, popular: true },
  },
]

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function main() {
  console.log('Seeding Gstream database (Supabase)...')
  const supabase = createAdminSupabaseClient()

  // Clean slate (order matters for FK constraints).
  // Uses a valid zero-UUID ('00000000-0000-0000-0000-000000000000') as the
  // sentinel — safe for both uuid columns (User.id) and text columns (all
  // other tables) since no real row ever matches it.
  const SENTINEL = '00000000-0000-0000-0000-000000000000'
  const tables = [
    'WatchProgress', 'WatchHistory', 'MyList', 'FeaturedBanner',
    'EpisodeServer', 'MovieServer', 'Episode', 'Season',
    'Movie_genres', 'Movie_categories', 'Series_genres', 'Series_categories',
    'Movie', 'Series', 'StreamingServer', 'Genre', 'Category',
  ]
  for (const t of tables) {
    await supabase.from(t).delete().neq('id', SENTINEL).then(() => {})
  }
  // User profiles (uuid id) — NOT auth.users (those are managed by Supabase Auth)
  await supabase.from('User').delete().neq('id', SENTINEL).then(() => {})

  // Genres
  const genreMap = new Map<string, string>()
  for (const name of GENRES) {
    const { data } = await supabase.from('Genre').insert({ name, slug: slugify(name) }).select('id').single()
    if (data) genreMap.set(name, data.id)
  }
  // Categories
  const catMap = new Map<string, string>()
  for (const c of CATEGORIES) {
    const { data } = await supabase.from('Category').insert({ name: c.name, slug: c.slug, icon: c.icon }).select('id').single()
    if (data) catMap.set(c.slug, data.id)
  }
  // Servers
  const serverMap = new Map<string, string>()
  for (const s of SERVERS) {
    const { data } = await supabase.from('StreamingServer').insert({ name: s.name, slug: s.slug, priority: s.priority, status: s.status }).select('id').single()
    if (data) serverMap.set(s.name, data.id)
  }

  // Admin + demo user — created via Supabase Auth (service-role).
  // The auth trigger auto-creates a public."User" profile row; we then promote admin.
  let adminUserId: string | null = null
  let demoUserId: string | null = null
  try {
    const { data: a } = await supabase.auth.admin.createUser({
      email: 'admin@gstream.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: { name: 'Administrator' },
    })
    adminUserId = a.user?.id ?? null
  } catch (e) { console.warn('admin create skipped:', (e as Error).message) }
  try {
    const { data: u } = await supabase.auth.admin.createUser({
      email: 'user@gstream.com',
      password: 'user123',
      email_confirm: true,
      user_metadata: { name: 'Demo Viewer' },
    })
    demoUserId = u.user?.id ?? null
  } catch (e) { console.warn('user create skipped:', (e as Error).message) }

  // Promote admin role in the profile table (trigger created it as 'user')
  if (adminUserId) {
    await supabase.from('User').update({ role: 'admin' }).eq('id', adminUserId)
  }
  console.log('Created admin:', adminUserId ? 'admin@gstream.com' : '(skipped)', '| demo user:', demoUserId ? 'user@gstream.com' : '(skipped)')

  // Movies
  for (const m of MOVIES) {
    const { data: created } = await supabase.from('Movie').insert({
      title: m.title, slug: m.slug, synopsis: m.synopsis,
      posterUrl: m.poster, backdropUrl: m.backdrop, logoUrl: m.logo ?? null,
      releaseYear: m.year, runtime: m.runtime, rating: m.rating, voteCount: m.votes,
      trailerUrl: m.trailer ?? null, type: 'movie',
      featured: m.flags?.featured ?? false, trending: m.flags?.trending ?? false,
      popular: m.flags?.popular ?? false, topRated: m.flags?.topRated ?? false,
      recentlyAdded: m.flags?.recentlyAdded ?? true, recentlyUpdated: true,
      status: 'published', cast: JSON.stringify(m.cast),
    }).select('id').single()
    if (!created) continue

    // Genre junction
    const gRows = m.genres.map((n) => genreMap.get(n)).filter(Boolean).map((gid) => ({ movieId: created.id, genreId: gid }))
    if (gRows.length) await supabase.from('Movie_genres').insert(gRows)
    // Category junction
    const cRows = m.categories.map((s) => catMap.get(s)).filter(Boolean).map((cid) => ({ movieId: created.id, categoryId: cid }))
    if (cRows.length) await supabase.from('Movie_categories').insert(cRows)
    // Servers
    for (const sv of m.servers) {
      const sid = serverMap.get(sv.name)
      if (!sid) continue
      await supabase.from('MovieServer').insert({
        movieId: created.id, serverId: sid, embedUrl: sv.embedUrl,
        quality: sv.quality ?? 'Auto', priority: sv.priority ?? 0, status: 'active',
      })
    }
  }
  console.log(`Seeded ${MOVIES.length} movies`)

  // Series + Anime
  let seriesCount = 0
  for (const s of [...SERIES, ...ANIME]) {
    const isAnime = ANIME.includes(s)
    const { data: created } = await supabase.from('Series').insert({
      title: s.title, slug: s.slug, synopsis: s.synopsis,
      posterUrl: s.poster, backdropUrl: s.backdrop, logoUrl: s.logo ?? null,
      releaseYear: s.year, rating: s.rating, voteCount: s.votes,
      trailerUrl: s.trailer ?? null, type: isAnime ? 'anime' : 'series',
      featured: s.flags?.featured ?? false, trending: s.flags?.trending ?? false,
      popular: s.flags?.popular ?? false, topRated: s.flags?.topRated ?? false,
      recentlyAdded: s.flags?.recentlyAdded ?? true, recentlyUpdated: true,
      status: 'published', cast: JSON.stringify(s.cast),
    }).select('id').single()
    if (!created) continue

    // Genre junction
    const gRows = s.genres.map((n) => genreMap.get(n)).filter(Boolean).map((gid) => ({ seriesId: created.id, genreId: gid }))
    if (gRows.length) await supabase.from('Series_genres').insert(gRows)
    // Category junction
    const cRows = s.categories.map((c) => catMap.get(c)).filter(Boolean).map((cid) => ({ seriesId: created.id, categoryId: cid }))
    if (cRows.length) await supabase.from('Series_categories').insert(cRows)

    for (const season of s.seasons) {
      const { data: createdSeason } = await supabase.from('Season').insert({
        seriesId: created.id, seasonNumber: season.seasonNumber, title: season.title,
        description: season.description ?? null, posterUrl: season.poster ?? null,
        episodeCount: season.episodes.length,
      }).select('id').single()
      if (!createdSeason) continue

      for (const [epIdx, ep] of season.episodes.entries()) {
        const { data: createdEp } = await supabase.from('Episode').insert({
          seasonId: createdSeason.id, episodeNumber: epIdx + 1, title: ep.title,
          description: ep.description, thumbnailUrl: ep.thumbnail ?? created.backdropUrl,
          runtime: ep.runtime, airDate: ep.airDate ?? null,
        }).select('id').single()
        if (!createdEp) continue

        for (const sv of ep.servers) {
          const sid = serverMap.get(sv.name)
          if (!sid) continue
          await supabase.from('EpisodeServer').insert({
            episodeId: createdEp.id, serverId: sid, embedUrl: sv.embedUrl,
            quality: sv.quality ?? 'Auto', priority: sv.priority ?? 0, status: 'active',
          })
        }
      }
    }
    seriesCount++
  }
  console.log(`Seeded ${seriesCount} series/anime`)

  // Featured banners — derive from featured content
  const { data: featuredMovies } = await supabase.from('Movie').select('id, title, synopsis, backdropUrl, logoUrl').eq('featured', true).limit(3)
  const { data: featuredSeries } = await supabase.from('Series').select('id, title, synopsis, backdropUrl, logoUrl').eq('featured', true).limit(3)
  let order = 0
  for (const fm of (featuredMovies ?? []).slice(0, 2)) {
    await supabase.from('FeaturedBanner').insert({
      title: fm.title, description: (fm.synopsis ?? '').slice(0, 180) + '...',
      imageUrl: fm.backdropUrl, logoUrl: fm.logoUrl, order: order++, active: true, movieId: fm.id,
    })
  }
  for (const fs of (featuredSeries ?? []).slice(0, 2)) {
    await supabase.from('FeaturedBanner').insert({
      title: fs.title, description: (fs.synopsis ?? '').slice(0, 180) + '...',
      imageUrl: fs.backdropUrl, logoUrl: fs.logoUrl, order: order++, active: true, seriesId: fs.id,
    })
  }

  console.log('Seed complete!')
  console.log('──────────────────────────────────────')
  console.log('Admin login:    admin@gstream.com / admin123')
  console.log('User login:     user@gstream.com / user123')
  console.log('──────────────────────────────────────')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
