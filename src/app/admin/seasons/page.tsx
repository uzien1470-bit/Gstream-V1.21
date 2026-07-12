'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Search, Loader2, FolderTree, ChevronRight } from 'lucide-react'
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
import Link from 'next/link'

interface SeriesOpt { id: string; title: string; type: string }
interface SeasonItem {
  id: string; seasonNumber: number; title: string; description: string | null
  posterUrl: string | null; _count: { episodes: number }
  series: { id: string; title: string; type: string; posterUrl: string }
}

export default function AdminSeasonsPage() {
  const [items, setItems] = useState<SeasonItem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [seriesList, setSeriesList] = useState<SeriesOpt[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    seriesId: '', seasonNumber: 1, title: '', description: '', posterUrl: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/seasons${q ? `?q=${encodeURIComponent(q)}` : ''}`)
    const data = await res.json()
    setItems(data.items ?? [])
    setLoading(false)
  }, [q])

  useEffect(() => {
    fetch('/api/admin/content?type=series&limit=100').then((r) => r.json()).then((d) => setSeriesList(d.items ?? []))
    fetch('/api/admin/content?type=anime&limit=100').then((r) => r.json()).then((d) => setSeriesList((prev) => [...prev, ...(d.items ?? [])]))
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({ seriesId: seriesList[0]?.id ?? '', seasonNumber: 1, title: '', description: '', posterUrl: '' })
    setEditingId(null)
    setDialogOpen(true)
  }
  function openEdit(item: SeasonItem) {
    setEditingId(item.id)
    setForm({
      seriesId: item.series.id, seasonNumber: item.seasonNumber,
      title: item.title, description: item.description ?? '', posterUrl: item.posterUrl ?? '',
    })
    setDialogOpen(true)
  }
  async function save() {
    if (!form.seriesId || !form.title.trim()) { toast.error('Series and title required'); return }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/seasons/${editingId}` : '/api/admin/seasons'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { toast.error('Save failed'); return }
      toast.success(editingId ? 'Season updated' : 'Season created')
      setDialogOpen(false); load()
    } finally { setSaving(false) }
  }
  async function confirmDelete() {
    if (!deleteId) return
    const res = await fetch(`/api/admin/seasons/${deleteId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Season deleted'); setDeleteId(null); load() }
  }

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Manage Seasons</h1>
          <p className="text-sm text-muted-foreground">{items.length} seasons across series & anime</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search series..." className="w-48 pl-9" />
          </div>
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Season</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-card/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Series</th>
                <th className="px-4 py-3 font-semibold">Season #</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Episodes</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No seasons found.</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.series.posterUrl && <img src={item.series.posterUrl} alt="" className="h-10 w-7 rounded object-cover" />}
                      <div>
                        <div className="font-medium">{item.series.title}</div>
                        <Badge variant="outline" className="text-[10px] capitalize">{item.series.type}</Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="secondary">S{item.seasonNumber}</Badge></td>
                  <td className="px-4 py-3">{item.title}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/episodes?seasonId=${item.id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                      {item._count.episodes} episodes <ChevronRight className="h-3 w-3" />
                    </Link>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Season' : 'Add Season'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Series / Anime *</Label>
              <Select value={form.seriesId} onValueChange={(v) => setForm({ ...form, seriesId: v })}>
                <SelectTrigger><SelectValue placeholder="Select series" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {seriesList.map((s) => <SelectItem key={s.id} value={s.id}>{s.title} ({s.type})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Season Number</Label>
                <Input type="number" value={form.seasonNumber} onChange={(e) => setForm({ ...form, seasonNumber: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Poster URL</Label>
                <Input value={form.posterUrl} onChange={(e) => setForm({ ...form, posterUrl: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
            <AlertDialogTitle>Delete this season?</AlertDialogTitle>
            <AlertDialogDescription>This removes the season and all its episodes. This cannot be undone.</AlertDialogDescription>
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
