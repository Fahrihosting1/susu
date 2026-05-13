import { NextRequest, NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/auth'
import { getAllUsers, getAllUsersWithActivity, deleteUser, getAllSubscriptions } from '@/lib/github-db'

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isCurrentUserAdmin()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const withActivity = searchParams.get('withActivity') === 'true'

    // Get all subscriptions to check VIP status
    const subscriptions = await getAllSubscriptions()
    const now = new Date()
    
    // Create a map of userId to active subscription
    const activeSubscriptionMap = new Map<string, { endDate: string }>()
    subscriptions.forEach(sub => {
      if (sub.status === 'active' && sub.endDate && new Date(sub.endDate) > now) {
        activeSubscriptionMap.set(sub.userId, { endDate: sub.endDate })
      }
    })

    if (withActivity) {
      const users = await getAllUsersWithActivity()
      // Remove passwords from response and add subscription info
      const safeUsers = users.map(({ password, ...user }) => ({
        ...user,
        hasActiveSubscription: activeSubscriptionMap.has(user.id),
        subscriptionEndDate: activeSubscriptionMap.get(user.id)?.endDate || null
      }))
      return NextResponse.json({ users: safeUsers })
    }

    const users = await getAllUsers()
    // Remove passwords from response and add subscription info
    const safeUsers = users.map(({ password, ...user }) => ({
      ...user,
      hasActiveSubscription: activeSubscriptionMap.has(user.id),
      subscriptionEndDate: activeSubscriptionMap.get(user.id)?.endDate || null
    }))

    return NextResponse.json({ users: safeUsers })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await isCurrentUserAdmin()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID diperlukan' }, { status: 400 })
    }

    const success = await deleteUser(userId)

    if (!success) {
      return NextResponse.json({ error: 'Gagal menghapus user atau user adalah admin' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'User berhasil dihapus' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
