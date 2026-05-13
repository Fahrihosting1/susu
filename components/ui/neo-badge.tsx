import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const neoBadgeVariants = cva(
  'inline-flex items-center px-3 py-1.5 text-xs font-semibold tracking-wide rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/10 text-secondary',
        accent: 'bg-accent/10 text-accent',
        destructive: 'bg-destructive/10 text-destructive',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        outline: 'border border-border text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface NeoBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof neoBadgeVariants> {}

function NeoBadge({ className, variant, ...props }: NeoBadgeProps) {
  return (
    <div className={cn(neoBadgeVariants({ variant }), className)} {...props} />
  )
}

export { NeoBadge, neoBadgeVariants }
