'use client'

import { useEffect, useState, useCallback } from 'react'

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: 'user' | 'admin'
  avatarUrl: string | null
}

let cachedUser: SessionUser | null = null
const listeners = new Set<(u: SessionUser | null) => void>()

function emit(u: SessionUser | null) {
  cachedUser = u
  listeners.forEach((l) => l(u))
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(cachedUser)
  const [loading, setLoading] = useState(cachedUser === null)

  useEffect(() => {
    const listener = (u: SessionUser | null) => {
      setUser(u)
      setLoading(false)
    }
    listeners.add(listener)
    if (cachedUser === null) {
      fetch('/api/auth/me')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => emit(data?.user ?? null))
        .catch(() => emit(null))
    }
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const refresh = useCallback(async () => {
    const res = await fetch('/api/auth/me')
    const data = await res.json().catch(() => ({ user: null }))
    emit(data.user ?? null)
    return data.user ?? null
  }, [])

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    emit(null)
  }, [])

  return { user, loading, refresh, signOut }
}

export function __setSessionUser(u: SessionUser | null) {
  emit(u)
}
