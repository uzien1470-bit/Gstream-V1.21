'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Users, Trash2, Loader2, Search, Shield, ShieldCheck, ShieldX,
  Ban, CheckCircle2, ChevronLeft, ChevronRight, User as UserIcon, ImagePlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface UserRow {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  role: string
  status: string
  createdAt: string
}

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [roleTarget, setRoleTarget] = useState<UserRow | null>(null)
  const [roleValue, setRoleValue] = useState<'user' | 'admin'>('user')
  const [savingRole, setSavingRole] = useState(false)
  const [profileTarget, setProfileTarget] = useState<UserRow | null>(null)
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true)
    try {
      const url = new URL('/api/admin/users', window.location.origin)
      url.searchParams.set('page', String(p))
      if (q) url.searchParams.set('q', q)
      const res = await fetch(url.toString())
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setItems(data.items)
      setTotal(data.total)
      setPage(data.page)
      setTotalPages(data.totalPages)
      setCurrentUserId(data.currentUserId ?? null)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load users')
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
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput, search, load])

  async function toggleStatus(u: UserRow) {
    const next = u.status === 'active' ? 'suspended' : 'active'
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      toast.success(next === 'suspended' ? 'User suspended' : 'User activated')
      await load(page, search)
    } catch (e: any) {
      toast.error(e.message || 'Failed to update user')
    }
  }

  function openRoleDialog(u: UserRow) {
    setRoleTarget(u)
    setRoleValue(u.role === 'admin' ? 'admin' : 'user')
  }

  function openProfileDialog(u: UserRow) {
    setProfileTarget(u)
    setProfileAvatarUrl(u.avatarUrl ?? '')
  }

  async function saveProfile() {
    if (!profileTarget) return
    setSavingProfile(true)
    try {
      const res = await fetch(`/api/admin/users/${profileTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: profileAvatarUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      toast.success('Profile image updated')
      setProfileTarget(null)
      await load(page, search)
    } catch (e: any) {
      toast.error(e.message || 'Failed to update profile image')
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveRole() {
    if (!roleTarget) return
    setSavingRole(true)
    try {
      const res = await fetch(`/api/admin/users/${roleTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleValue }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      toast.success(roleValue === 'admin' ? 'User promoted to admin' : 'User demoted to user')
      setRoleTarget(null)
      await load(page, search)
    } catch (e: any) {
      toast.error(e.message || 'Failed to update role')
    } finally {
      setSavingRole(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      toast.success('User deleted')
      setDeleteTarget(null)
      await load(page, search)
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            <Users className="h-6 w-6 text-lime-400" /> Users
          </h1>
          <p className="text-sm text-muted-foreground">Manage user accounts, roles, and status.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-sm">All Users ({total})</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email…"
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
            <p className="py-12 text-center text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((u) => {
                    const isSelf = currentUserId === u.id
                    const isAdmin = u.role === 'admin'
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.avatarUrl ?? undefined} />
                              <AvatarFallback>
                                <UserIcon className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-medium">{u.name || '—'}</span>
                                {isSelf && (
                                  <Badge variant="outline" className="text-[10px]">You</Badge>
                                )}
                              </div>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <Badge className="bg-primary/15 text-primary">
                              <ShieldCheck className="h-3 w-3" /> admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Shield className="h-3 w-3" /> user
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.status === 'active' ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> active
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-500/15 text-rose-400">
                              <ShieldX className="h-3 w-3" /> suspended
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openProfileDialog(u)}
                              title="Set profile image"
                            >
                              <ImagePlus className="h-4 w-4" /> Profile
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRoleDialog(u)}
                              disabled={isSelf && isAdmin}
                              title={isSelf && isAdmin ? "You can't change your own role" : 'Change role'}
                            >
                              <Shield className="h-4 w-4" /> Role
                            </Button>
                            {u.status === 'active' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStatus(u)}
                                disabled={isAdmin || isSelf}
                                title={isAdmin ? 'Admins cannot be suspended' : isSelf ? "You can't suspend yourself" : 'Suspend user'}
                                className="text-amber-400"
                              >
                                <Ban className="h-4 w-4" /> Suspend
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStatus(u)}
                                className="text-emerald-400"
                              >
                                <CheckCircle2 className="h-4 w-4" /> Activate
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(u)}
                              disabled={isAdmin || isSelf}
                              title={isAdmin ? 'Admins cannot be deleted' : isSelf ? "You can't delete yourself" : 'Delete user'}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
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

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name || deleteTarget?.email}</strong> and all their associated data (sessions, watch history, my list, etc.).
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

      {/* Change role dialog */}
      <Dialog open={!!roleTarget} onOpenChange={(o) => !o && setRoleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for <strong>{roleTarget?.name || roleTarget?.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={roleValue} onValueChange={(v) => setRoleValue(v as 'user' | 'admin')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The last remaining admin cannot be demoted. Admin users cannot be suspended or deleted.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleTarget(null)} disabled={savingRole}>Cancel</Button>
            <Button onClick={saveRole} disabled={savingRole}>
              {savingRole && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile image dialog */}
      <Dialog open={!!profileTarget} onOpenChange={(o) => !o && setProfileTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile Image</DialogTitle>
            <DialogDescription>
              Set a profile image URL for <strong>{profileTarget?.name || profileTarget?.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Profile Image URL</Label>
            <Input
              value={profileAvatarUrl}
              onChange={(e) => setProfileAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
            {profileAvatarUrl && (
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profileAvatarUrl} />
                  <AvatarFallback>
                    <UserIcon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">Preview</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Paste a direct image URL. Leave empty to use the default avatar.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileTarget(null)} disabled={savingProfile}>Cancel</Button>
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
