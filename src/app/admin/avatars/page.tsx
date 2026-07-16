'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Loader2, ImageIcon, GripVertical, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AvatarRow {
  id: string
  name: string
  imageUrl: string
  displayOrder: number
  enabled: boolean
}

export default function AdminAvatarsPage() {
  const [items, setItems] = useState<AvatarRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', imageUrl: '', displayOrder: 0, enabled: true })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/avatars')
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {
      toast.error('Failed to load avatars')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({ name: '', imageUrl: '', displayOrder: items.length, enabled: true })
    setEditingId(null)
    setDialogOpen(true)
  }

  function openEdit(a: AvatarRow) {
    setForm({ name: a.name, imageUrl: a.imageUrl, displayOrder: a.displayOrder, enabled: a.enabled })
    setEditingId(a.id)
    setDialogOpen(true)
  }

  async function save() {
    if (!form.name.trim() || !form.imageUrl.trim()) {
      toast.error('Name and Image URL are required')
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/avatars/${editingId}` : '/api/admin/avatars'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Save failed'); return }
      toast.success(editingId ? 'Avatar updated' : 'Avatar created')
      setDialogOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function toggleEnabled(a: AvatarRow) {
    const res = await fetch(`/api/admin/avatars/${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !a.enabled }),
    })
    if (res.ok) {
      toast.success(a.enabled ? 'Avatar disabled' : 'Avatar enabled')
      load()
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    const res = await fetch(`/api/admin/avatars/${deleteId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Avatar deleted')
      setDeleteId(null)
      load()
    } else {
      toast.error('Delete failed')
    }
  }

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            <ImageIcon className="h-6 w-6 text-purple-400" /> Profile Avatars
          </h1>
          <p className="text-sm text-muted-foreground">Manage the site-wide avatar library available to all users.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Avatar
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-card/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Avatar</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No avatars yet. Add one to get started.</td></tr>
              ) : items.map((a) => (
                <tr key={a.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-secondary">
                      {a.imageUrl ? (
                        <img src={a.imageUrl} alt={a.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-muted-foreground">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <GripVertical className="h-3 w-3 text-muted-foreground" />
                      {a.displayOrder}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {a.enabled ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400">Enabled</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => toggleEnabled(a)} title={a.enabled ? 'Disable' : 'Enable'}>
                        {a.enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Avatar' : 'Add Avatar'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Cinematic Purple" />
            </div>
            <div className="space-y-2">
              <Label>Image URL *</Label>
              <Input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." />
            </div>
            {form.imageUrl && (
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-secondary">
                  <img src={form.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <span className="text-sm text-muted-foreground">Preview</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', Number(e.target.value))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <Label className="cursor-pointer">Enabled</Label>
                <Switch checked={form.enabled} onCheckedChange={(v) => set('enabled', v)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this avatar?</AlertDialogTitle>
            <AlertDialogDescription>
              Users using this avatar will fall back to the default. This cannot be undone.
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
    </AdminShell>
  )
}
