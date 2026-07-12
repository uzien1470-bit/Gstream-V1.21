import { AdminShell } from '@/components/admin/admin-shell'
import { ContentManager } from '@/components/admin/content-manager'

export default function AdminMoviesPage() {
  return (
    <AdminShell>
      <ContentManager type="movie" />
    </AdminShell>
  )
}
