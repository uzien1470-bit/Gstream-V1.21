'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Search, Loader2, Star, Server, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { TagInput, ServerNameCombo } from '@/components/admin/tag-input'

type ContentType = 'movie' | 'series' | 'anime'

interface ServerRow { id?: string; serverId: string; embedUrl: string; quality: string; priority: number; status: string }
interface AdminServer { id: string; name: string; slug: string }
interface Genre { id: string; name: string; slug: string }
interface Category { id: string; name: string; slug: string }

interface ContentItem {
  id: string
  title: string
  slug: string
  posterUrl: string
  releaseYear: number
  rating: number
  status: string
  featured: boolean
  trending: boolean
  popular: boolean
  topRated: boolean
  genres?: { name: string }[]
  servers?: { id: string; server: AdminServer; embedUrl: string; quality: string; status: string }[]
  seasons?: { id: string; _count?: { episodes: number } }[]
}

const EMPTY_FORM = {
  title: '', slug: '', synopsis: '', posterUrl: '', backdropUrl: '', logoUrl: '',
  releaseYear: new Date().getFullYear(), rating: 7, voteCount: 0, trailerUrl: '',
  runtime: 120, featured: false, trending: false, popular: false, topRated: false,
  status: 'published', genreIds: [] as string[], categoryIds: [] as string[],
  servers: [] as ServerRow[], cast: '[]',
}

export function ContentManager({ type }: { type: ContentType }) {
  const label = type === 'movie' ? 'Movie' : type === 'anime' ? 'Anime' : 'TV Series'
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<any>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [genres, setGenres] = useState<Genre[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [servers, setServers] = useState<AdminServer[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/content?type=${type}${q ? `&q=${encodeURIComponent(q)}` : ''}`)
    const data = await res.json()
    setItems(data.items ?? [])
    setLoading(false)
  }, [type, q])

  useEffect(() => {
    Promise.all([
      fetch('/api/genres').then((r) => r.json()),
      fetch('/api/admin/categories').then((r) => r.json()),
      fetch('/api/admin/servers').then((r) => r.json()),
    ]).then(([g, c, s]) => {
      setGenres(g.genres ?? [])
      setCategories(c.items ?? [])
      setServers(s.items ?? [])
    })
  }, [])

  useEffect(() => { load() }, [load])

  // Create a new genre on-the-fly (returns its id)
  async function createGenre(name: string): Promise<string | null> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const res = await fetch('/api/admin/genres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Failed to create genre')
      return null
    }
    const newGenre = { id: data.item.id, name: data.item.name, slug: data.item.slug }
    setGenres((prev) => [...prev, newGenre])
    return newGenre.id
  }

  // Create a new category on-the-fly (returns its id)
  async function createCategory(name: string): Promise<string | null> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Failed to create category')
      return null
    }
    const newCat = { id: data.item.id, name: data.item.name, slug: data.item.slug }
    setCategories((prev) => [...prev, newCat])
    return newCat.id
  }

  // Create a new streaming server on-the-fly (returns its id)
  async function createServer(name: string): Promise<string | null> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const res = await fetch('/api/admin/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, priority: 0, status: 'active' }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Failed to create server')
      return null
    }
    const newSrv = { id: data.item.id, name: data.item.name, slug: data.item.slug }
    setServers((prev) => [...prev, newSrv])
    return newSrv.id
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setDialogOpen(true)
  }

  async function openEdit(item: ContentItem) {
    setEditingId(item.id)
    const res = await fetch(`/api/admin/content/${item.id}?type=${type}`)
    const data = await res.json()
    const it = data.item
    setForm({
      title: it.title, slug: it.slug, synopsis: it.synopsis,
      posterUrl: it.posterUrl, backdropUrl: it.backdropUrl, logoUrl: it.logoUrl ?? '',
      releaseYear: it.releaseYear, rating: it.rating, voteCount: it.voteCount,
      trailerUrl: it.trailerUrl ?? '', runtime: it.runtime ?? 0,
      featured: it.featured, trending: it.trending, popular: it.popular, topRated: it.topRated,
      status: it.status,
      genreIds: (it.genres ?? []).map((g: any) => g.id),
      categoryIds: (it.categories ?? []).map((c: any) => c.id),
      servers: type === 'movie'
        ? (it.servers ?? []).map((s: any) => ({ id: s.id, serverId: s.server.id, embedUrl: s.embedUrl, quality: s.quality, priority: 0, status: s.status }))
        : [],
      cast: it.cast ?? '[]',
    })
    setDialogOpen(true)
  }

  async function save() {
    if (!form.title.trim() || !form.posterUrl.trim()) {
      toast.error('Title and poster URL are required')
      return
    }
    setSaving(true)
    try {
      const url = editingId
        ? `/api/admin/content/${editingId}?type=${type}`
        : `/api/admin/content`
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Save failed')
        return
      }
      toast.success(editingId ? `${label} updated` : `${label} created`)
      setDialogOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    const res = await fetch(`/api/admin/content/${deleteId}?type=${type}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success(`${label} deleted`)
      setDeleteId(null)
      load()
    } else {
      toast.error('Delete failed')
    }
  }

  function addServerRow() {
    setForm((f: any) => ({
      ...f,
      servers: [...f.servers, { serverId: servers[0]?.id ?? '', embedUrl: '', quality: 'Auto', priority: 0, status: 'active' }],
    }))
  }

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Manage {label}s
          </h1>
          <p className="text-sm text-muted-foreground">{items.length} {label.toLowerCase()}s in the library</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="w-48 pl-9" />
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add {label}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-card/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Year</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">Genres</th>
                {type === 'movie' && <th className="px-4 py-3 font-semibold">Servers</th>}
                {type !== 'movie' && <th className="px-4 py-3 font-semibold">Seasons</th>}
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Flags</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No {label.toLowerCase()}s found.</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      { }
                      <img src={item.posterUrl} alt="" className="h-12 w-8 shrink-0 rounded object-cover" />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{item.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{item.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{item.releaseYear}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 font-semibold text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400" />{item.rating.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[200px] flex-wrap gap-1">
                      {(item.genres ?? []).slice(0, 3).map((g) => (
                        <Badge key={g.name} variant="secondary" className="text-[10px]">{g.name}</Badge>
                      ))}
                    </div>
                  </td>
                  {type === 'movie' && (
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="gap-1"><Server className="h-3 w-3" />{item.servers?.length ?? 0}</Badge>
                    </td>
                  )}
                  {type !== 'movie' && (
                    <td className="px-4 py-3">
                      <Badge variant="outline">{item.seasons?.length ?? 0}</Badge>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>{item.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.featured && <Badge className="bg-primary text-[10px]">Featured</Badge>}
                      {item.trending && <Badge className="bg-amber-500/80 text-[10px] text-amber-950">Trending</Badge>}
                      {item.topRated && <Badge className="bg-emerald-500/80 text-[10px] text-emerald-950">Top</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? `Edit ${label}` : `Add ${label}`}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug (leave empty to auto-generate)</Label>
              <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto-from-title" />
            </div>
            <div className="space-y-2">
              <Label>Release Year</Label>
              <Input type="number" value={form.releaseYear} onChange={(e) => set('releaseYear', Number(e.target.value))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Synopsis</Label>
              <Textarea rows={3} value={form.synopsis} onChange={(e) => set('synopsis', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Poster URL *</Label>
              <Input value={form.posterUrl} onChange={(e) => set('posterUrl', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Backdrop URL</Label>
              <Input value={form.backdropUrl} onChange={(e) => set('backdropUrl', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Trailer URL</Label>
              <Input value={form.trailerUrl} onChange={(e) => set('trailerUrl', e.target.value)} placeholder="https://..." />
            </div>
            {type === 'movie' && (
              <div className="space-y-2">
                <Label>Runtime (minutes)</Label>
                <Input type="number" value={form.runtime} onChange={(e) => set('runtime', Number(e.target.value))} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Rating (0-10)</Label>
              <Input type="number" step="0.1" min="0" max="10" value={form.rating} onChange={(e) => set('rating', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Vote Count</Label>
              <Input type="number" value={form.voteCount} onChange={(e) => set('voteCount', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Genres — tag input with custom creation */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Genres</Label>
              <TagInput
                available={genres}
                selectedIds={form.genreIds}
                onChange={(ids) => set('genreIds', ids)}
                onCreate={createGenre}
                placeholder="Type a genre name and press Enter to create..."
              />
            </div>

            {/* Categories — tag input with custom creation */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Categories</Label>
              <TagInput
                available={categories}
                selectedIds={form.categoryIds}
                onChange={(ids) => set('categoryIds', ids)}
                onCreate={createCategory}
                placeholder="Type a category name and press Enter to create..."
              />
            </div>

            {/* Flags */}
            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
              {[
                ['featured', 'Featured'],
                ['trending', 'Trending'],
                ['popular', 'Popular'],
                ['topRated', 'Top Rated'],
              ].map(([key, label2]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <Label className="cursor-pointer">{label2}</Label>
                  <Switch checked={form[key]} onCheckedChange={(v) => set(key, v)} />
                </div>
              ))}
            </div>

            {/* Cast JSON */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Cast (JSON array, e.g. [{`{"name":"Actor","role":"Character"}`}])</Label>
              <Textarea rows={3} value={form.cast} onChange={(e) => set('cast', e.target.value)} className="font-mono text-xs" />
            </div>

            {/* Servers (movies only) — with custom server name creation */}
            {type === 'movie' && (
              <div className="space-y-3 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>Streaming Servers</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addServerRow} className="gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add Server
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.servers.map((s: ServerRow, i: number) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                      {/* Server name — combobox: existing servers OR type a custom name */}
                      <ServerNameCombo
                        servers={servers}
                        value={s.serverId}
                        onChange={async (serverId, name) => {
                          const next = [...form.servers]
                          next[i] = { ...next[i], serverId }
                          set('servers', next)
                          // If a new name was provided and no serverId, create it
                          if (!serverId && name) {
                            const newId = await createServer(name)
                            if (newId) {
                              const next2 = [...form.servers]
                              next2[i] = { ...next2[i], serverId: newId }
                              set('servers', next2)
                            }
                          }
                        }}
                      />
                      <Input className="min-w-[200px] flex-1" placeholder="Embed URL" value={s.embedUrl} onChange={(e) => {
                        const next = [...form.servers]; next[i] = { ...next[i], embedUrl: e.target.value }; set('servers', next)
                      }} />
                      <Input className="w-24" placeholder="Quality" value={s.quality} onChange={(e) => {
                        const next = [...form.servers]; next[i] = { ...next[i], quality: e.target.value }; set('servers', next)
                      }} />
                      <Select value={s.status} onValueChange={(v) => {
                        const next = [...form.servers]; next[i] = { ...next[i], status: v }; set('servers', next)
                      }}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => set('servers', form.servers.filter((_: any, j: number) => j !== i))}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {form.servers.length === 0 && (
                    <p className="text-xs text-muted-foreground">No servers added. Add at least one embed URL.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {label.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the {label.toLowerCase()} and all related data (servers, seasons, episodes). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
