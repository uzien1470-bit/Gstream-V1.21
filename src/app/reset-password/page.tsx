import { Suspense } from 'react'
import { ResetClient } from './reset-client'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-muted-foreground">Loading...</div>}>
      <ResetClient />
    </Suspense>
  )
}
