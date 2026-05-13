'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/dashboard/Navbar'
import type { SessionUser } from '@/types'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen dev-bg flex items-center justify-center">
        <div className="w-16 h-16 liquid-glass rounded-3xl flex items-center justify-center shadow-ios-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary animate-spin" style={{ animationDuration: '1s' }} />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen dev-bg">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-72 relative">
        <Navbar user={user} onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
