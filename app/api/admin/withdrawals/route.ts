import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { 
  isUserAdmin, 
  getAllWithdrawals, 
  getWithdrawalStats,
  updateWithdrawal,
  getWithdrawalById,
  getAllUsers,
  getOrdersByUserId
} from '@/lib/github-db'

interface UserInfo {
  id: string
  name: string
  email: string
  totalOrders: number
  completedOrders: number
  totalRevenue: number
  totalWithdrawn: number
  availableBalance: number
  withdrawalCount: number
  lastWithdrawal?: string
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(session.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const withdrawals = await getAllWithdrawals()
    const stats = await getWithdrawalStats()
    const allUsers = await getAllUsers()

    // Sort by createdAt descending (newest first)
    const sortedWithdrawals = withdrawals.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Calculate user info for each user with withdrawals or balance
    const userInfos: Record<string, UserInfo> = {}
    
    for (const user of allUsers) {
      if (user.role === 'admin') continue // Skip admins
      
      const userOrders = await getOrdersByUserId(user.id)
      const completedOrders = userOrders.filter(o => o.status === 'completed' && !o.isSandbox)
      const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0)
      
      const userWithdrawals = withdrawals.filter(w => w.userId === user.id)
      const completedWithdrawals = userWithdrawals.filter(w => w.status === 'completed')
      const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + w.amount, 0)
      
      const availableBalance = totalRevenue - totalWithdrawn
      
      // Only include users who have some activity
      if (totalRevenue > 0 || userWithdrawals.length > 0) {
        const sortedUserWithdrawals = userWithdrawals.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        
        userInfos[user.id] = {
          id: user.id,
          name: user.name,
          email: user.email,
          totalOrders: userOrders.length,
          completedOrders: completedOrders.length,
          totalRevenue,
          totalWithdrawn,
          availableBalance,
          withdrawalCount: userWithdrawals.length,
          lastWithdrawal: sortedUserWithdrawals[0]?.createdAt,
        }
      }
    }

    return NextResponse.json({
      withdrawals: sortedWithdrawals,
      stats,
      userInfos,
    })
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(session.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, adminNotes } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 })
    }

    const withdrawal = await getWithdrawalById(id)
    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      status,
      adminNotes,
    }

    if (status === 'completed' || status === 'rejected') {
      updateData.processedAt = new Date().toISOString()
      updateData.processedBy = session.email
    }

    const updated = await updateWithdrawal(id, updateData)
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update withdrawal' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      withdrawal: updated 
    })
  } catch (error) {
    console.error('Error updating withdrawal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
