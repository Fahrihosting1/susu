'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, LayoutDashboard, Package, ShoppingCart, Settings, User, LogOut, X, Wallet, Crown, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NeoButton } from '@/components/ui/neo-button'
import { logoutAction } from '@/actions/auth.actions'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/subscription', label: 'Sewa Bot', icon: Crown },
  { href: '/dashboard/products', label: 'Produk', icon: Package },
  { href: '/dashboard/orders', label: 'Pesanan', icon: ShoppingCart },
  { href: '/dashboard/withdraw', label: 'Pencairan Dana', icon: Wallet },
  { href: '/dashboard/console', label: 'Console', icon: Terminal },
  { href: '/dashboard/profile', label: 'Profil', icon: User },
  { href: '/dashboard/settings', label: 'Pengaturan Bot', icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xl z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-72 liquid-glass border-r border-border/50 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">SewaBot</span>
          </Link>
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-muted rounded-xl transition-colors">
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 font-medium text-sm tracking-wide transition-all duration-300 rounded-2xl',
                      isActive
                        ? 'liquid-glass-light bg-primary/90 text-white shadow-ios'
                        : 'text-muted-foreground hover:liquid-glass-light hover:text-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <form action={logoutAction}>
            <NeoButton type="submit" variant="destructive" className="w-full rounded-2xl">
              <LogOut className="w-4 h-4" />
              Keluar
            </NeoButton>
          </form>
        </div>
      </aside>
    </>
  )
}
