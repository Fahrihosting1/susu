import * as React from 'react'
import { cn } from '@/lib/utils'

export interface NeoInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const NeoInput = React.forwardRef<HTMLInputElement, NeoInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full glass-input backdrop-blur-xl border border-border/50 px-4 py-2 text-sm text-foreground rounded-2xl transition-all duration-300 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 focus:shadow-ios disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
NeoInput.displayName = 'NeoInput'

export { NeoInput }
