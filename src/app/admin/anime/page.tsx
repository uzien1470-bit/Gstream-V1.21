import { AdminShell } from '@/components/admin/admin-shell'
import { ContentManager } from '@/components/admin/content-manager'

export default function AdminAnimePage() {
  return (
    <AdminShell>
      <ContentManager type="anime" />
    </AdminShell>
  )
}
