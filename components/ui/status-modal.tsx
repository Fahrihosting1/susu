'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NeoButton } from './neo-button'

interface StatusModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  autoClose?: number // ms to auto close
  showConfetti?: boolean
}

const STATUS_CONFIG = {
  success: {
    icon: CheckCircle2,
    bgGradient: 'from-success/20 to-success/5',
    iconBg: 'bg-success/20',
    iconColor: 'text-success',
    borderColor: 'border-success/30',
    titleColor: 'text-success',
    glowClass: 'animate-success-glow',
  },
  error: {
    icon: XCircle,
    bgGradient: 'from-destructive/20 to-destructive/5',
    iconBg: 'bg-destructive/20',
    iconColor: 'text-destructive',
    borderColor: 'border-destructive/30',
    titleColor: 'text-destructive',
    glowClass: 'animate-error-glow',
  },
  warning: {
    icon: AlertTriangle,
    bgGradient: 'from-warning/20 to-warning/5',
    iconBg: 'bg-warning/20',
    iconColor: 'text-warning',
    borderColor: 'border-warning/30',
    titleColor: 'text-warning',
    glowClass: 'animate-pulse-glow',
  },
  info: {
    icon: Info,
    bgGradient: 'from-primary/20 to-primary/5',
    iconBg: 'bg-primary/20',
    iconColor: 'text-primary',
    borderColor: 'border-primary/30',
    titleColor: 'text-primary',
    glowClass: 'animate-pulse-glow',
  },
}

export function StatusModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  autoClose,
  showConfetti = false,
}: StatusModalProps) {
  const [isClosing, setIsClosing] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const config = STATUS_CONFIG[type]
  const Icon = config.icon

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      // Delay content animation
      setTimeout(() => setShowContent(true), 100)
      
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose()
        }, autoClose)
        return () => clearTimeout(timer)
      }
    } else {
      setShowContent(false)
    }
  }, [isOpen, autoClose])

  const handleClose = () => {
    setIsClosing(true)
    setShowContent(false)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  const handleAction = () => {
    if (onAction) {
      onAction()
    }
    handleClose()
  }

  if (!isOpen && !isClosing) return null

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        isClosing ? "animate-fade-out" : "animate-backdrop-enter"
      )}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Confetti */}
      {showConfetti && type === 'success' && !isClosing && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-confetti-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                backgroundColor: ['#22c55e', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899'][i % 5],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Modal */}
      <div 
        className={cn(
          "relative z-10 w-full max-w-sm bg-card rounded-2xl border shadow-xl overflow-hidden",
          config.borderColor,
          isClosing ? "animate-modal-exit" : "animate-modal-enter"
        )}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Content */}
        <div className={cn("p-8 bg-gradient-to-b", config.bgGradient)}>
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div 
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mb-5",
                config.iconBg,
                config.glowClass,
                showContent ? "animate-scale-up" : "opacity-0"
              )}
            >
              <Icon className={cn("w-10 h-10", config.iconColor)} />
            </div>
            
            {/* Title */}
            <h3 
              className={cn(
                "text-xl font-bold mb-2",
                config.titleColor,
                showContent ? "animate-slide-up stagger-2" : "opacity-0"
              )}
            >
              {title}
            </h3>
            
            {/* Message */}
            {message && (
              <p 
                className={cn(
                  "text-muted-foreground text-sm leading-relaxed",
                  showContent ? "animate-slide-up stagger-3" : "opacity-0"
                )}
              >
                {message}
              </p>
            )}
            
            {/* Sparkles for success */}
            {type === 'success' && showContent && (
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <Sparkles className="absolute top-6 left-6 w-4 h-4 text-success/50 animate-float" style={{ animationDelay: '0s' }} />
                <Sparkles className="absolute top-10 right-8 w-3 h-3 text-primary/50 animate-float" style={{ animationDelay: '0.5s' }} />
                <Sparkles className="absolute bottom-20 left-10 w-3 h-3 text-warning/50 animate-float" style={{ animationDelay: '1s' }} />
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        {(actionLabel || secondaryLabel) && (
          <div 
            className={cn(
              "p-4 border-t border-border flex gap-3",
              showContent ? "animate-slide-up stagger-4" : "opacity-0"
            )}
          >
            {secondaryLabel && (
              <NeoButton
                variant="outline"
                onClick={onSecondary || handleClose}
                className="flex-1"
              >
                {secondaryLabel}
              </NeoButton>
            )}
            {actionLabel && (
              <NeoButton
                variant={type === 'success' ? 'default' : type === 'error' ? 'destructive' : 'default'}
                onClick={handleAction}
                className="flex-1"
              >
                {actionLabel}
              </NeoButton>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for easy modal management
export function useStatusModal() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    actionLabel?: string
    onAction?: () => void
    secondaryLabel?: string
    onSecondary?: () => void
    autoClose?: number
    showConfetti?: boolean
  }>({
    isOpen: false,
    type: 'info',
    title: '',
  })

  const showModal = (props: Omit<typeof modalState, 'isOpen'>) => {
    setModalState({ ...props, isOpen: true })
  }

  const hideModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  const showSuccess = (title: string, message?: string, options?: Partial<typeof modalState>) => {
    showModal({ type: 'success', title, message, showConfetti: true, autoClose: 3000, ...options })
  }

  const showError = (title: string, message?: string, options?: Partial<typeof modalState>) => {
    showModal({ type: 'error', title, message, actionLabel: 'Tutup', ...options })
  }

  const showWarning = (title: string, message?: string, options?: Partial<typeof modalState>) => {
    showModal({ type: 'warning', title, message, actionLabel: 'OK', ...options })
  }

  const showInfo = (title: string, message?: string, options?: Partial<typeof modalState>) => {
    showModal({ type: 'info', title, message, actionLabel: 'OK', autoClose: 4000, ...options })
  }

  return {
    modalState,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    StatusModalComponent: (
      <StatusModal
        {...modalState}
        onClose={hideModal}
      />
    ),
  }
}
