import { AdminShell } from '@/components/admin/admin-shell'
import { ContentManager } from '@/components/admin/content-manager'

export default function AdminTvSeriesPage() {
  return (
    <AdminShell>
      <ContentManager type="series" />
    </AdminShell>
  )
}
