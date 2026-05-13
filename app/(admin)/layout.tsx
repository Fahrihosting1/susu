'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Shield,
  ChevronRight,
  Wallet,
  Terminal,
  Crown
} from 'lucide-react'
import { NeoButton } from '@/components/ui/neo-button'
import type { SessionUser } from '@/types'

const adminNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/subscriptions', icon: Crown, label: 'Bot VIP History' },
  { href: '/admin/error-logs', icon: Terminal, label: 'Error Logs' },
  { href: '/admin/withdrawals', icon: Wallet, label: 'Pencairan Dana' },
  { href: '/admin/payments', icon: CreditCard, label: 'Payment Settings' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/admin/check')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          setIsAdmin(data.isAdmin)
          if (!data.isAdmin) {
            router.push('/dashboard')
          }
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    checkAdmin()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary animate-pulse flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-border shadow-lg z-50 transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <Link href="/admin" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-foreground font-bold text-lg tracking-tight">Admin Panel</h1>
                  <p className="text-muted-foreground text-xs">Payment Management</p>
                </div>
              </Link>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-white" />}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-medium truncate">{user.name}</p>
                <p className="text-muted-foreground text-xs truncate">{user.email}</p>
              </div>
            </div>
            <NeoButton
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </NeoButton>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72 relative">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3 ml-auto">
              <Link href="/dashboard">
                <NeoButton variant="outline" size="sm">
                  Back to Dashboard
                </NeoButton>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
