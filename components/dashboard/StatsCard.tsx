import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning'
  description?: string
  className?: string
  animationDelay?: number
}

export function StatsCard({ title, value, icon: Icon, variant = 'default', description, className, animationDelay = 0 }: StatsCardProps) {
  const styles = {
    default: {
      bg: 'liquid-glass',
      text: 'text-foreground',
      icon: 'bg-muted/50 text-muted-foreground',
    },
    primary: {
      bg: 'liquid-glass',
      text: 'text-foreground',
      icon: 'bg-primary/15 text-primary',
    },
    secondary: {
      bg: 'liquid-glass',
      text: 'text-foreground',
      icon: 'bg-secondary/15 text-secondary',
    },
    accent: {
      bg: 'liquid-glass',
      text: 'text-foreground',
      icon: 'bg-accent/15 text-accent',
    },
    success: {
      bg: 'liquid-glass',
      text: 'text-foreground',
      icon: 'bg-success/15 text-success',
    },
    warning: {
      bg: 'liquid-glass',
      text: 'text-foreground',
      icon: 'bg-warning/15 text-warning',
    },
  }

  const style = styles[variant]

  return (
    <div 
      className={cn(
        'p-5 rounded-3xl hover:shadow-ios-lg transition-all duration-300 animate-slide-up group',
        style.bg, 
        style.text,
        className
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {description && (
            <p className="text-xs mt-2 text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300', style.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
