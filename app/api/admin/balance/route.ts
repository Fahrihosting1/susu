import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { 
  isUserAdmin, 
  getAllUsers,
  getUserById,
  getBalanceAdjustments,
  createBalanceAdjustment,
  getUserBalance,
  getOrdersByUserId,
  getWithdrawals
} from '@/lib/github-db'

interface UserBalanceInfo {
  id: string
  name: string
  email: string
  totalRevenue: number
  totalWithdrawn: number
  totalAdjustments: number
  availableBalance: number
  adjustments: Array<{
    id: string
    amount: number
    type: 'add' | 'deduct'
    reason: string
    adminName: string
    createdAt: string
  }>
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

    const allUsers = await getAllUsers()
    const allAdjustments = await getBalanceAdjustments()
    
    const usersWithBalance: UserBalanceInfo[] = []
    
    for (const user of allUsers) {
      if (user.role === 'admin') continue
      
      const balance = await getUserBalance(user.id)
      const userAdjustments = allAdjustments
        .filter(a => a.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      usersWithBalance.push({
        id: user.id,
        name: user.name,
        email: user.email,
        totalRevenue: balance.totalRevenue,
        totalWithdrawn: balance.totalWithdrawn,
        totalAdjustments: balance.totalAdjustments,
        availableBalance: balance.availableBalance,
        adjustments: userAdjustments.map(a => ({
          id: a.id,
          amount: a.amount,
          type: a.type,
          reason: a.reason,
          adminName: a.adminName,
          createdAt: a.createdAt,
        })),
      })
    }

    // Sort by available balance descending
    usersWithBalance.sort((a, b) => b.availableBalance - a.availableBalance)

    return NextResponse.json({
      users: usersWithBalance,
    })
  } catch (error) {
    console.error('Error fetching balance data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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
    const { userId, amount, type, reason } = body

    if (!userId || !amount || !type || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    }

    if (!['add', 'deduct'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const targetUser = await getUserById(userId)
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If deducting, check if user has enough balance
    if (type === 'deduct') {
      const balance = await getUserBalance(userId)
      if (amount > balance.availableBalance) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
      }
    }

    const admin = await getUserById(session.id)
    
    const adjustment = await createBalanceAdjustment({
      userId,
      userName: targetUser.name,
      userEmail: targetUser.email,
      amount,
      type,
      reason,
      adminId: session.id,
      adminName: admin?.name || 'Admin',
    })

    if (!adjustment) {
      return NextResponse.json({ error: 'Failed to create adjustment' }, { status: 500 })
    }

    const newBalance = await getUserBalance(userId)

    return NextResponse.json({
      success: true,
      adjustment,
      newBalance: newBalance.availableBalance,
    })
  } catch (error) {
    console.error('Error creating balance adjustment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
