import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
  breadcrumb?: React.ReactNode
}

export function PageHeader({ title, subtitle, children, className, breadcrumb }: PageHeaderProps) {
  return (
    <div className={cn('pt-28 pb-8 sm:pt-32', className)}>
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        {breadcrumb && <div className="mb-4">{breadcrumb}</div>}
        <h1
          className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}
