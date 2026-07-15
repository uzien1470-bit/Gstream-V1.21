'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Plus, Star, Pencil, Trash2, Loader2, Search,
  ChevronLeft, ChevronRight, User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

interface Actor {
  id: string
  name: string
  slug: string
  profilePhotoUrl: string | null
  heroPhotoUrl: string | null
  biography: string | null
  birthday: string | null
  birthPlace: string | null
  nationality: string | null
  status: string
  createdAt: string
}

const EMPTY_FORM = {
  name: '',
  profilePhotoUrl: '',
  heroPhotoUrl: '',
  biography: '',
  birthday: '',
  birthPlace: '',
  nationality: '',
  status: 'published' as 'published' | 'draft',
}

export default function AdminActorsPage() {
  const [items, setItems] = useState<Actor[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Actor | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Actor | null>(null)
  const [deleting, setDeleting] = useState(false)

  const LIMIT = 20

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true)
    try {
      const url = new URL('/api/admin/actors', window.location.origin)
      url.searchParams.set('page', String(p))
      url.searchParams.set('limit', String(LIMIT))
      if (q) url.searchParams.set('q', q)
      const res = await fetch(url.toString())
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
      setPage(data.page ?? p)
      setTotalPages(Math.max(1, Math.ceil((data.total ?? 0) / (data.limit ?? LIMIT))))
    } catch (e: any) {
      toast.error(e.message || 'Failed to load actors')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(1, '')
  }, [load])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput)
        load(1, searchInput)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput, search, load])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(a: Actor) {
    setEditing(a)
    setForm({
      name: a.name,
      profilePhotoUrl: a.profilePhotoUrl ?? '',
      heroPhotoUrl: a.heroPhotoUrl ?? '',
      biography: a.biography ?? '',
      birthday: a.birthday ?? '',
      birthPlace: a.birthPlace ?? '',
      nationality: a.nationality ?? '',
      status: a.status === 'draft' ? 'draft' : 'published',
    })
    setDialogOpen(true)
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        profilePhotoUrl: form.profilePhotoUrl.trim() || null,
        heroPhotoUrl: form.heroPhotoUrl.trim() || null,
        biography: form.biography.trim() || null,
        birthday: form.birthday || null,
        birthPlace: form.birthPlace.trim() || null,
        nationality: form.nationality.trim() || null,
        status: form.status,
      }
      const res = await fetch(
        editing ? `/api/admin/actors/${editing.id}` : '/api/admin/actors',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success(editing ? 'Actor updated' : 'Actor created')
      setDialogOpen(false)
      await load(page, search)
    } catch (e: any) {
      toast.error(e.message || 'Failed to save actor')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/actors/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      toast.success('Actor deleted')
      setDeleteTarget(null)
      // If we deleted the last item on a page, go back one page
      const nextPage = items.length === 1 && page > 1 ? page - 1 : page
      await load(nextPage, search)
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete actor')
    } finally {
      setDeleting(false)
    }
  }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            className="flex items-center gap-2 text-2xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Star className="h-6 w-6 text-amber-400" /> Manage Actors
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage cast &amp; crew profiles for movies and series.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Actor
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-sm">All Actors ({total})</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearch(searchInput)
                    load(1, searchInput)
                  }
                }}
                placeholder="Search by name…"
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No actors found. Click &ldquo;Add Actor&rdquo; to create one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actor</TableHead>
                    <TableHead>Nationality</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={a.profilePhotoUrl ?? undefined} alt={a.name} />
                            <AvatarFallback className="text-xs font-semibold uppercase">
                              {a.name?.charAt(0) || <UserIcon className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{a.name}</div>
                            <p className="truncate text-xs text-muted-foreground">/{a.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.nationality || '—'}
                      </TableCell>
                      <TableCell>
                        {a.status === 'published' ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400">published</Badge>
                        ) : (
                          <Badge variant="secondary">draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(a.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(a)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(a)}
                            title="Delete"
                          >
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => load(page - 1, search)}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => load(page + 1, search)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Actor' : 'New Actor'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="actor-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="actor-name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Leonardo DiCaprio"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Slug (auto-generated)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actor-profile">Profile Photo URL</Label>
              <Input
                id="actor-profile"
                value={form.profilePhotoUrl}
                onChange={(e) => update('profilePhotoUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actor-hero">Hero Banner URL</Label>
              <Input
                id="actor-hero"
                value={form.heroPhotoUrl}
                onChange={(e) => update('heroPhotoUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actor-bio">Biography</Label>
              <Textarea
                id="actor-bio"
                rows={4}
                value={form.biography}
                onChange={(e) => update('biography', e.target.value)}
                placeholder="Short biography…"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="actor-birthday">Birthday</Label>
                <Input
                  id="actor-birthday"
                  type="date"
                  value={form.birthday}
                  onChange={(e) => update('birthday', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actor-birthplace">Birth Place</Label>
                <Input
                  id="actor-birthplace"
                  value={form.birthPlace}
                  onChange={(e) => update('birthPlace', e.target.value)}
                  placeholder="e.g. Los Angeles, USA"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="actor-nationality">Nationality</Label>
                <Input
                  id="actor-nationality"
                  value={form.nationality}
                  onChange={(e) => update('nationality', e.target.value)}
                  placeholder="e.g. American"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => update('status', v as 'published' | 'draft')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete actor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>. If the actor is
              linked to movies or series, the relationship must be removed first.
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
