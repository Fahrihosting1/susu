import * as React from 'react'
import { cn } from '@/lib/utils'

export interface NeoTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const NeoTextarea = React.forwardRef<HTMLTextAreaElement, NeoTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full bg-muted border border-border px-4 py-3 text-sm text-foreground rounded-xl transition-all duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
NeoTextarea.displayName = 'NeoTextarea'

export { NeoTextarea }
