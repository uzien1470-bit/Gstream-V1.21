'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2, X, Server, Filter } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface ServerOpt { id: string; name: string; slug: string }
interface SeasonOpt { id: string; seasonNumber: number; title: string; series: { id: string; title: string; type: string } }
interface EpisodeItem {
  id: string; episodeNumber: number; title: string; description: string | null
  thumbnailUrl: string | null; runtime: number; airDate: string | null
  season: { id: string; seasonNumber: number; title: string; series: { id: string; title: string; type: string } }
  servers: { id: string; server: ServerOpt; embedUrl: string; quality: string; status: string }[]
}
interface ServerRow { id?: string; serverId: string; embedUrl: string; quality: string; priority: number; status: string }

export function EpisodesClient() {
  const params = useSearchParams()
  const [items, setItems] = useState<EpisodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [seasonFilter, setSeasonFilter] = useState(params.get('seasonId') ?? 'all')
  const [seasons, setSeasons] = useState<SeasonOpt[]>([])
  const [servers, setServers] = useState<ServerOpt[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    seasonId: '', episodeNumber: 1, title: '', description: '',
    thumbnailUrl: '', runtime: 45, airDate: '', servers: [] as ServerRow[],
  })

  const load = useCallback(async () => {
    setLoading(true)
    const url = seasonFilter !== 'all' ? `/api/admin/episodes?seasonId=${seasonFilter}` : '/api/admin/episodes'
    const res = await fetch(url)
    const data = await res.json()
    setItems(data.items ?? [])
    setLoading(false)
  }, [seasonFilter])

  useEffect(() => {
    fetch('/api/admin/seasons').then((r) => r.json()).then((d) => setSeasons(d.items ?? []))
    fetch('/api/admin/servers').then((r) => r.json()).then((d) => setServers(d.items ?? []))
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({
      seasonId: seasonFilter !== 'all' ? seasonFilter : (seasons[0]?.id ?? ''),
      episodeNumber: 1, title: '', description: '', thumbnailUrl: '',
      runtime: 45, airDate: '', servers: [],
    })
    setEditingId(null)
    setDialogOpen(true)
  }
  async function openEdit(item: EpisodeItem) {
    setEditingId(item.id)
    const res = await fetch(`/api/admin/episodes/${item.id}`)
    const data = await res.json()
    const it = data.item
    setForm({
      seasonId: it.seasonId, episodeNumber: it.episodeNumber, title: it.title,
      description: it.description ?? '', thumbnailUrl: it.thumbnailUrl ?? '',
      runtime: it.runtime, airDate: it.airDate ?? '',
      servers: (it.servers ?? []).map((s: any) => ({ id: s.id, serverId: s.server.id, embedUrl: s.embedUrl, quality: s.quality, priority: 0, status: s.status })),
    })
    setDialogOpen(true)
  }
  async function save() {
    if (!form.seasonId || !form.title.trim()) { toast.error('Season and title required'); return }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/episodes/${editingId}` : '/api/admin/episodes'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { toast.error('Save failed'); return }
      toast.success(editingId ? 'Episode updated' : 'Episode created')
      setDialogOpen(false); load()
    } finally { setSaving(false) }
  }
  async function confirmDelete() {
    if (!deleteId) return
    const res = await fetch(`/api/admin/episodes/${deleteId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Episode deleted'); setDeleteId(null); load() }
  }
  function addServerRow() {
    setForm((f: any) => ({ ...f, servers: [...f.servers, { serverId: servers[0]?.id ?? '', embedUrl: '', quality: 'Auto', priority: 0, status: 'active' }] }))
  }
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Manage Episodes</h1>
          <p className="text-sm text-muted-foreground">{items.length} episodes</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={seasonFilter} onValueChange={setSeasonFilter}>
            <SelectTrigger className="w-64"><Filter className="mr-1 h-3.5 w-3.5" /><SelectValue placeholder="Filter by season" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All Seasons</SelectItem>
              {seasons.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.series.title} · S{s.seasonNumber} — {s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Episode</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-card/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Series / Season</th>
                <th className="px-4 py-3 font-semibold">Ep #</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Runtime</th>
                <th className="px-4 py-3 font-semibold">Servers</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No episodes found.</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.season.series.title}</div>
                    <div className="text-xs text-muted-foreground">S{item.season.seasonNumber} · {item.season.title}</div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="secondary">E{item.episodeNumber}</Badge></td>
                  <td className="px-4 py-3">{item.title}</td>
                  <td className="px-4 py-3">{item.runtime}m</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="gap-1"><Server className="h-3 w-3" />{item.servers.length}</Badge></td>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Episode' : 'Add Episode'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Season *</Label>
              <Select value={form.seasonId} onValueChange={(v) => set('seasonId', v)}>
                <SelectTrigger><SelectValue placeholder="Select season" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {seasons.map((s) => <SelectItem key={s.id} value={s.id}>{s.series.title} · S{s.seasonNumber} — {s.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Episode Number</Label>
                <Input type="number" value={form.episodeNumber} onChange={(e) => set('episodeNumber', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Runtime (min)</Label>
                <Input type="number" value={form.runtime} onChange={(e) => set('runtime', Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Input value={form.thumbnailUrl} onChange={(e) => set('thumbnailUrl', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Air Date</Label>
                <Input type="date" value={form.airDate} onChange={(e) => set('airDate', e.target.value)} />
              </div>
            </div>

            {/* Servers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Streaming Servers</Label>
                <Button type="button" size="sm" variant="outline" onClick={addServerRow} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
              </div>
              <div className="space-y-2">
                {form.servers.map((s: ServerRow, i: number) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                    <Select value={s.serverId} onValueChange={(v) => { const n = [...form.servers]; n[i] = { ...n[i], serverId: v }; set('servers', n) }}>
                      <SelectTrigger className="w-32"><SelectValue placeholder="Server" /></SelectTrigger>
                      <SelectContent>{servers.map((srv) => <SelectItem key={srv.id} value={srv.id}>{srv.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input className="min-w-[180px] flex-1" placeholder="Embed URL" value={s.embedUrl} onChange={(e) => { const n = [...form.servers]; n[i] = { ...n[i], embedUrl: e.target.value }; set('servers', n) }} />
                    <Input className="w-24" placeholder="Quality" value={s.quality} onChange={(e) => { const n = [...form.servers]; n[i] = { ...n[i], quality: e.target.value }; set('servers', n) }} />
                    <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => set('servers', form.servers.filter((_: any, j: number) => j !== i))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                {form.servers.length === 0 && <p className="text-xs text-muted-foreground">No servers added.</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editingId ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this episode?</AlertDialogTitle>
            <AlertDialogDescription>This removes the episode and all its streaming servers. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  )
}
