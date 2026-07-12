'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Image as ImageIcon, Pencil, Trash2, Loader2, Film, Tv } from 'lucide-react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Banner {
  id: string
  title: string
  description: string
  imageUrl: string
  logoUrl: string | null
  order: number
  active: boolean
  movieId: string | null
  seriesId: string | null
  movie?: { id: string; title: string } | null
  series?: { id: string; title: string } | null
  createdAt: string
}

interface ContentRef { id: string; title: string }

type LinkType = 'none' | 'movie' | 'series'

export default function AdminBannersPage() {
  const [items, setItems] = useState<Banner[]>([])
  const [movies, setMovies] = useState<ContentRef[]>([])
  const [series, setSeries] = useState<ContentRef[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null)
  const [deleting, setDeleting] = useState(false)

  // form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [order, setOrder] = useState('0')
  const [active, setActive] = useState(true)
  const [linkType, setLinkType] = useState<LinkType>('none')
  const [movieId, setMovieId] = useState<string>('')
  const [seriesId, setSeriesId] = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [bRes, mRes, sRes, aRes] = await Promise.all([
        fetch('/api/admin/banners'),
        fetch('/api/admin/content?type=movie&limit=500'),
        fetch('/api/admin/content?type=series&limit=500'),
        fetch('/api/admin/content?type=anime&limit=500'),
      ])
      const bData = await bRes.json()
      if (!bRes.ok) throw new Error(bData.error || 'Failed to load')
      setItems(bData.items)
      const mData = await mRes.json()
      const sData = await sRes.json()
      const aData = await aRes.json()
      setMovies((mData.items ?? []).map((m: any) => ({ id: m.id, title: m.title })))
      setSeries([
        ...((sData.items ?? []) as any[]).map((s) => ({ id: s.id, title: s.title })),
        ...((aData.items ?? []) as any[]).map((s) => ({ id: s.id, title: `${s.title} (Anime)` })),
      ])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load banners')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function resetForm() {
    setTitle(''); setDescription(''); setImageUrl(''); setLogoUrl('')
    setOrder('0'); setActive(true); setLinkType('none')
    setMovieId(''); setSeriesId('')
  }

  function openCreate() {
    setEditing(null)
    resetForm()
    setDialogOpen(true)
  }

  function openEdit(b: Banner) {
    setEditing(b)
    setTitle(b.title)
    setDescription(b.description)
    setImageUrl(b.imageUrl)
    setLogoUrl(b.logoUrl ?? '')
    setOrder(String(b.order))
    setActive(b.active)
    if (b.movieId) { setLinkType('movie'); setMovieId(b.movieId); setSeriesId('') }
    else if (b.seriesId) { setLinkType('series'); setSeriesId(b.seriesId); setMovieId('') }
    else { setLinkType('none'); setMovieId(''); setSeriesId('') }
    setDialogOpen(true)
  }

  async function save() {
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!imageUrl.trim()) { toast.error('Image URL is required'); return }
    if (!Number.isFinite(Number(order))) { toast.error('Order must be a number'); return }
    setSaving(true)
    try {
      const payload: any = {
        title: title.trim(),
        description,
        imageUrl: imageUrl.trim(),
        logoUrl: logoUrl.trim(),
        order: Number(order),
        active,
        movieId: linkType === 'movie' && movieId ? movieId : null,
        seriesId: linkType === 'series' && seriesId ? seriesId : null,
      }
      const res = await fetch(
        editing ? `/api/admin/banners/${editing.id}` : '/api/admin/banners',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success(editing ? 'Banner updated' : 'Banner created')
      setDialogOpen(false)
      await load()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/banners/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      toast.success('Banner deleted')
      setDeleteTarget(null)
      await load()
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete banner')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            <ImageIcon className="h-6 w-6 text-indigo-400" /> Featured Banners
          </h1>
          <p className="text-sm text-muted-foreground">Manage hero carousel banners on the homepage.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add New
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">All Banners ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No banners yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Linked Content</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        { }
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="h-10 w-20 rounded object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3' }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{b.title}</TableCell>
                      <TableCell>{b.order}</TableCell>
                      <TableCell>
                        <Badge variant={b.active ? 'default' : 'secondary'}>
                          {b.active ? 'active' : 'inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {b.movie ? (
                          <span className="inline-flex items-center gap-1"><Film className="h-3.5 w-3.5" /> {b.movie.title}</span>
                        ) : b.series ? (
                          <span className="inline-flex items-center gap-1"><Tv className="h-3.5 w-3.5" /> {b.series.title}</span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(b)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Banner' : 'New Banner'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="b-title">Title</Label>
              <Input id="b-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Banner title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-desc">Description</Label>
              <Textarea id="b-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description shown on the banner" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="b-img">Image URL</Label>
                <Input id="b-img" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-logo">Logo URL (optional)</Label>
                <Input id="b-logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="b-order">Order</Label>
                <Input id="b-order" type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch id="b-active" checked={active} onCheckedChange={setActive} />
                <Label htmlFor="b-active">Active</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Linked Content</Label>
              <Select
                value={linkType}
                onValueChange={(v) => {
                  setLinkType(v as LinkType)
                  if (v !== 'movie') setMovieId('')
                  if (v !== 'series') setSeriesId('')
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select link type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="series">Series / Anime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {linkType === 'movie' && (
              <div className="space-y-2">
                <Label>Select Movie</Label>
                <Select value={movieId} onValueChange={setMovieId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a movie" />
                  </SelectTrigger>
                  <SelectContent>
                    {movies.length === 0 ? (
                      <SelectItem value="_none" disabled>No movies available</SelectItem>
                    ) : (
                      movies.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            {linkType === 'series' && (
              <div className="space-y-2">
                <Label>Select Series / Anime</Label>
                <Select value={seriesId} onValueChange={setSeriesId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a series" />
                  </SelectTrigger>
                  <SelectContent>
                    {series.length === 0 ? (
                      <SelectItem value="_none" disabled>No series available</SelectItem>
                    ) : (
                      series.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete banner?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.title}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  )
}
