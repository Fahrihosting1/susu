'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const neoButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-wide transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 rounded-2xl active:scale-[0.97]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-ios hover:shadow-ios-lg',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-ios',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-ios',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-ios',
        success: 'bg-success text-success-foreground hover:bg-success/90 shadow-ios',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/90 shadow-ios',
        outline: 'liquid-glass-light border border-border/50 text-foreground hover:bg-muted/50',
        ghost: 'bg-transparent border-transparent shadow-none hover:bg-muted/50 rounded-2xl text-foreground',
      },
      size: {
        default: 'h-12 px-6 py-2 text-sm',
        sm: 'h-10 px-4 text-xs',
        lg: 'h-14 px-8 text-base',
        icon: 'h-12 w-12 rounded-2xl',
        'icon-sm': 'h-10 w-10 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface NeoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neoButtonVariants> {
  asChild?: boolean
}

const NeoButton = React.forwardRef<HTMLButtonElement, NeoButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(neoButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
NeoButton.displayName = 'NeoButton'

export { NeoButton, neoButtonVariants }
