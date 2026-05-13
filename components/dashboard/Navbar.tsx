'use client'

import { Menu, Bell, Crown } from 'lucide-react'
import { NeoButton } from '@/components/ui/neo-button'
import type { SessionUser } from '@/types'

interface NavbarProps {
  user: SessionUser
  onMenuClick: () => void
}

export function Navbar({ user, onMenuClick }: NavbarProps) {
  return (
    <header className="liquid-glass-heavy border-b border-border/30 p-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-muted rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        
        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg text-foreground">Selamat Datang!</h2>
            {user.hasActiveSubscription && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30 animate-pulse">
                <Crown className="w-3 h-3" />
                Sewa VIP
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{user.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* VIP Badge for mobile */}
        {user.hasActiveSubscription && (
          <span className="sm:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30">
            <Crown className="w-3 h-3" />
            VIP
          </span>
        )}
        
        <button className="p-2 hover:bg-muted rounded-xl transition-colors relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/30" />
        </button>
        
        <div className="relative">
          {user.profilePhotoUrl ? (
            <img 
              src={user.profilePhotoUrl} 
              alt={user.name}
              className="w-10 h-10 rounded-2xl object-cover shadow-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center font-semibold text-white shadow-md ${user.profilePhotoUrl ? 'hidden' : ''}`}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          {/* VIP ring indicator */}
          {user.hasActiveSubscription && (
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 -z-10 animate-pulse" />
          )}
        </div>
      </div>
    </header>
  )
}
