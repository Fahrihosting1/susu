'use client'

import { forwardRef } from 'react'
import { Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NeoButton, type NeoButtonProps } from './neo-button'

interface LoadingButtonProps extends NeoButtonProps {
  loading?: boolean
  loadingText?: string
  success?: boolean
  successText?: string
  error?: boolean
  errorText?: string
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    children, 
    loading, 
    loadingText,
    success,
    successText,
    error,
    errorText,
    disabled,
    className,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading || success || error

    // Determine content to show
    let content = children
    let icon = null

    if (loading) {
      icon = <Loader2 className="w-4 h-4 animate-spin" />
      content = loadingText || 'Memproses...'
    } else if (success) {
      icon = <Check className="w-4 h-4 animate-scale-up" />
      content = successText || 'Berhasil!'
    } else if (error) {
      icon = <X className="w-4 h-4 animate-shake" />
      content = errorText || 'Gagal'
    }

    return (
      <NeoButton
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          loading && "cursor-wait",
          success && "bg-success hover:bg-success text-success-foreground",
          error && "bg-destructive hover:bg-destructive text-destructive-foreground animate-shake",
          className
        )}
        {...props}
      >
        <span className={cn(
          "flex items-center gap-2 transition-all duration-200",
          (loading || success || error) && "opacity-0 scale-95"
        )}>
          {children}
        </span>
        
        {(loading || success || error) && (
          <span className="absolute inset-0 flex items-center justify-center gap-2 animate-fade-in">
            {icon}
            <span>{content}</span>
          </span>
        )}
        
        {/* Ripple effect on success */}
        {success && (
          <span className="absolute inset-0 bg-success/20 animate-ripple rounded-lg" />
        )}
      </NeoButton>
    )
  }
)

LoadingButton.displayName = 'LoadingButton'
