import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/auth'
import { getAllSubscriptions } from '@/lib/github-db'

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const subscriptions = await getAllSubscriptions()

    // Sort by createdAt descending (newest first)
    const sortedSubscriptions = subscriptions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Calculate stats
    const now = new Date()
    const totalSubscriptions = subscriptions.length
    const activeSubscriptions = subscriptions.filter(s => 
      s.status === 'active' && s.endDate && new Date(s.endDate) > now
    ).length
    const pendingSubscriptions = subscriptions.filter(s => s.status === 'pending').length
    const expiredSubscriptions = subscriptions.filter(s => 
      s.status === 'expired' || (s.status === 'active' && s.endDate && new Date(s.endDate) <= now)
    ).length
    
    // Total revenue from subscriptions
    const totalRevenue = subscriptions
      .filter(s => s.status === 'active' || s.status === 'expired')
      .reduce((sum, s) => sum + s.price, 0)

    // Chart data - subscriptions per month (last 6 months)
    const monthlyStats: { month: string; count: number; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
      const monthName = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      
      const monthSubs = subscriptions.filter(s => s.createdAt.startsWith(monthKey))
      const activeSubs = monthSubs.filter(s => s.status === 'active' || s.status === 'expired')
      
      monthlyStats.push({
        month: monthName,
        count: monthSubs.length,
        revenue: activeSubs.reduce((sum, s) => sum + s.price, 0)
      })
    }

    // Payment method breakdown
    const paymentMethods = {
      saldo: subscriptions.filter(s => s.paymentMethod === 'saldo' && s.status !== 'pending').length,
      qris: subscriptions.filter(s => s.paymentMethod === 'qris' && s.status !== 'pending').length
    }

    return NextResponse.json({
      subscriptions: sortedSubscriptions,
      stats: {
        totalSubscriptions,
        activeSubscriptions,
        pendingSubscriptions,
        expiredSubscriptions,
        totalRevenue,
        monthlyStats,
        paymentMethods
      }
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
