'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Loader2, Shield, LogOut } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useSession } from '@/hooks/use-session'
import { __setSessionUser } from '@/hooks/use-session'
import { toast } from 'sonner'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, signOut } = useSession()
  const [name, setName] = useState('')
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)
  const [avatars, setAvatars] = useState<{ id: string; name: string; imageUrl: string }[]>([])
  const [savingProfile, setSavingProfile] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
    if (user) {
      setName(user.name ?? '')
      setSelectedAvatarId((user as any).avatarId ?? null)
    }
  }, [user, loading, router])

  // Fetch the site avatar library
  useEffect(() => {
    fetch('/api/avatars')
      .then((r) => r.json())
      .then((d) => setAvatars(d.avatars ?? []))
      .catch(() => {})
  }, [])

  if (loading || !user) {
    return (
      <AppShell>
        <div className="grid min-h-[60vh] place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatarId: selectedAvatarId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to update')
        return
      }
      __setSessionUser(data.user)
      toast.success('Profile updated')
    } finally {
      setSavingProfile(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setSavingPassword(true)
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to change password')
        return
      }
      toast.success('Password changed. Please sign in again.')
      await signOut()
      router.push('/login')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <AppShell>
      <PageHeader title="Profile" subtitle="Manage your account and preferences." />
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-10">
        {/* Account card */}
        <div className="rounded-2xl border border-border bg-card/40 p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20 border-2 border-primary/40">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name || user.email} />
              <AvatarFallback className="bg-primary/20 text-xl text-primary">
                {(user.name || user.email)[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <h2 className="text-xl font-bold">{user.name || 'Viewer'}</h2>
                {user.role === 'admin' && (
                  <Badge className="bg-primary text-primary-foreground">
                    <Shield className="mr-1 h-3 w-3" /> Administrator
                  </Badge>
                )}
              </div>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
            </div>
          </div>

          {/* Avatar library picker */}
          <div className="mt-6">
            <Label className="mb-2 block text-sm">Choose an avatar</Label>
            {avatars.length === 0 ? (
              <p className="text-xs text-muted-foreground">No avatars available. An admin needs to add avatars first.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {avatars.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAvatarId(a.id)}
                    className={`relative h-14 w-14 overflow-hidden rounded-full border-2 transition-all ${
                      selectedAvatarId === a.id ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    title={a.name}
                  >
                    <img src={a.imageUrl} alt={a.name} className="h-full w-full object-cover" />
                  </button>
                ))}
                {/* "None" option to clear avatar */}
                <button
                  type="button"
                  onClick={() => setSelectedAvatarId(null)}
                  className={`grid h-14 w-14 place-items-center rounded-full border-2 text-xs text-muted-foreground transition-all ${
                    selectedAvatarId === null ? 'border-primary scale-110' : 'border-border opacity-70 hover:opacity-100'
                  }`}
                  title="Default"
                >
                  <User className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Edit profile */}
        <form onSubmit={saveProfile} className="mt-6 rounded-2xl border border-border bg-card/40 p-6">
          <h3 className="mb-4 text-lg font-bold">Edit Profile</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" value={user.email} disabled className="pl-9 opacity-60" />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <Button type="submit" disabled={savingProfile} className="gap-2">
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>

        {/* Change password */}
        <form onSubmit={changePassword} className="mt-6 rounded-2xl border border-border bg-card/40 p-6">
          <h3 className="mb-4 text-lg font-bold">Change Password</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button type="submit" disabled={savingPassword} className="gap-2">
              {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </div>
        </form>

        <Separator className="my-6" />

        <div className="flex justify-between">
          <Button
            variant="destructive"
            onClick={async () => { await signOut(); router.push('/login') }}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
