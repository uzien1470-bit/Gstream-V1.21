'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Loader2, Shield, Calendar, LogOut, Camera } from 'lucide-react'
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

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Gstream1&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Gstream2&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Gstream3&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Gstream4&backgroundColor=d1f4c6',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Gstream5&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Gstream6&backgroundColor=ffdfbf',
]

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, signOut } = useSession()
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
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
      setAvatarUrl(user.avatarUrl)
    }
  }, [user, loading, router])

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
        body: JSON.stringify({ name, avatarUrl }),
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
              <AvatarImage src={avatarUrl ?? undefined} alt={user.name || user.email} />
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

          {/* Avatar picker */}
          <div className="mt-6">
            <Label className="mb-2 flex items-center gap-1.5 text-sm">
              <Camera className="h-3.5 w-3.5" /> Choose an avatar
            </Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_PRESETS.map((url) => (
                <button
                  key={url}
                  onClick={() => setAvatarUrl(url)}
                  className={`h-12 w-12 overflow-hidden rounded-full border-2 transition-all ${
                    avatarUrl === url ? 'border-primary scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  { }
                  <img src={url} alt="avatar" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
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
