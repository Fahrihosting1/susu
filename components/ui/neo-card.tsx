import * as React from 'react'
import { cn } from '@/lib/utils'

const NeoCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'liquid-glass text-card-foreground p-6 rounded-3xl transition-all duration-300 hover:shadow-ios-lg',
      className
    )}
    {...props}
  />
))
NeoCard.displayName = 'NeoCard'

const NeoCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-2 pb-4', className)}
    {...props}
  />
))
NeoCardHeader.displayName = 'NeoCardHeader'

const NeoCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold tracking-tight text-foreground', className)}
    {...props}
  />
))
NeoCardTitle.displayName = 'NeoCardTitle'

const NeoCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
NeoCardDescription.displayName = 'NeoCardDescription'

const NeoCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
NeoCardContent.displayName = 'NeoCardContent'

const NeoCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  />
))
NeoCardFooter.displayName = 'NeoCardFooter'

export {
  NeoCard,
  NeoCardHeader,
  NeoCardTitle,
  NeoCardDescription,
  NeoCardContent,
  NeoCardFooter,
}
