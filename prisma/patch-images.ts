/* Patch broken TMDB image URLs for 3 anime titles.
 * Run: bun run prisma/patch-images.ts
 */
import { db } from '@/lib/db'

const fixes = [
  {
    slug: 'jujutsu-kaisen',
    posterUrl: 'https://image.tmdb.org/t/p/original/fHpKWq9ayzSk8nSwqRuaAUemRKh.jpg',
    backdropUrl: 'https://sfile.chatglm.cn/images-ppt/6154bba301a4.jpg',
  },
  {
    slug: 'death-note',
    posterUrl: 'https://sfile.chatglm.cn/images-ppt/950b8f43da41.jpg',
    backdropUrl: 'https://sfile.chatglm.cn/images-ppt/8f07f22d876b.jpg',
  },
  {
    slug: 'one-piece',
    posterUrl: 'https://image.tmdb.org/t/p/original/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg',
    backdropUrl: 'https://sfile.chatglm.cn/images-ppt/1a0f2a90f66e.jpg',
  },
]

async function main() {
  for (const f of fixes) {
    const updated = await db.series.updateMany({
      where: { slug: f.slug },
      data: { posterUrl: f.posterUrl, backdropUrl: f.backdropUrl, recentlyUpdated: true },
    })
    // Also patch episode thumbnails that referenced the series backdrop
    const series = await db.series.findUnique({ where: { slug: f.slug }, select: { id: true } })
    if (series) {
      await db.season.updateMany({
        where: { seriesId: series.id },
        data: { posterUrl: f.backdropUrl },
      })
    }
    console.log(`Patched ${f.slug}: ${updated.count} series updated`)
  }
  console.log('Done.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
