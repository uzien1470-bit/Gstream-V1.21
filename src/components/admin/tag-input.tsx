'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Plus, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface TagInputProps {
  /** Existing tags the user can pick from */
  available: { id: string; name: string }[]
  /** Currently selected tag IDs */
  selectedIds: string[]
  /** Called when selection changes (add or remove) */
  onChange: (ids: string[]) => void
  /** Called when a new tag is typed — should create it and return its id */
  onCreate?: (name: string) => Promise<string | null>
  placeholder?: string
  className?: string
}

/**
 * Tag input that combines a clickable chip list (existing tags) with a
 * text input for creating custom tags. Behaves like YouTube Studio's tag
 * picker: click chips to toggle, type to create new ones.
 */
export function TagInput({
  available,
  selectedIds,
  onChange,
  onCreate,
  placeholder = 'Type a name and press Enter to create...',
  className,
}: TagInputProps) {
  const [input, setInput] = useState('')
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  async function handleCreate() {
    const name = input.trim()
    if (!name || !onCreate) return
    // Check if it already exists (case-insensitive)
    const existing = available.find(
      (a) => a.name.toLowerCase() === name.toLowerCase(),
    )
    if (existing) {
      if (!selectedIds.includes(existing.id)) toggle(existing.id)
      setInput('')
      return
    }
    setCreating(true)
    const newId = await onCreate(name)
    setCreating(false)
    if (newId) {
      onChange([...selectedIds, newId])
    }
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreate()
    } else if (e.key === 'Backspace' && !input && selectedIds.length > 0) {
      // Remove last selected tag on backspace
      onChange(selectedIds.slice(0, -1))
    }
  }

  const selected = available.filter((a) => selectedIds.includes(a.id))

  return (
    <div className={cn('rounded-lg border border-border p-2', className)}>
      {/* Selected + available chips */}
      <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
        {available.map((a) => {
          const checked = selectedIds.includes(a.id)
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                checked
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {a.name}
            </button>
          )
        })}
      </div>
      {/* Custom tag input */}
      {onCreate && (
        <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={creating}
            className="h-8 text-sm"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !input.trim()}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            aria-label="Add new"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ───────────────────────────── ServerNameCombo ─────────────────────────────

interface ServerNameComboProps {
  servers: { id: string; name: string; slug: string }[]
  value: string
  onChange: (serverId: string, customName?: string) => void
}

/**
 * Combobox for selecting an existing streaming server OR typing a custom
 * name. When a custom name is typed and the user presses Enter (or blurs),
 * the parent creates the server and receives its id.
 */
export function ServerNameCombo({ servers, value, onChange }: ServerNameComboProps) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [prevSelectedId, setPrevSelectedId] = useState(value)
  const wrapRef = useRef<HTMLDivElement>(null)
  const selectedServer = servers.find((s) => s.id === value)

  // Keep the text input in sync with the selected server (render-time reset)
  if (value !== prevSelectedId) {
    setPrevSelectedId(value)
    if (selectedServer) setText(selectedServer.name)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectServer(id: string) {
    onChange(id)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const match = servers.find(
        (s) => s.name.toLowerCase() === text.trim().toLowerCase(),
      )
      if (match) {
        selectServer(match.id)
      } else if (text.trim()) {
        // Custom name — parent will create it
        onChange('', text.trim())
        setOpen(false)
      }
    }
  }

  const filtered = text
    ? servers.filter((s) => s.name.toLowerCase().includes(text.toLowerCase()))
    : servers

  return (
    <div ref={wrapRef} className="relative w-40 shrink-0">
      <input
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          // If the text matches a server, select it; otherwise clear selection
          const match = servers.find(
            (s) => s.name.toLowerCase() === e.target.value.toLowerCase(),
          )
          onChange(match?.id ?? '', match ? undefined : e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Server name"
        className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
      />
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectServer(s.id)}
              className={cn(
                'block w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-primary/10',
                s.id === value && 'bg-primary/10 font-medium',
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

