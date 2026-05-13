import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/auth'
import { 
  getAllUsers, 
  getAllOrders, 
  getPaymentSettings, 
  getAllBotSettings,
  getAdminTotalFeeBalance,
  getOrderStatsForChart,
  getFeeStatsForChart 
} from '@/lib/github-db'

export async function GET() {
  try {
    const isAdmin = await isCurrentUserAdmin()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const [users, orders, paymentSettings, botSettings, adminFeeBalance, orderStats, feeStats] = await Promise.all([
      getAllUsers(),
      getAllOrders(),
      getPaymentSettings(),
      getAllBotSettings(),
      getAdminTotalFeeBalance(),
      getOrderStatsForChart(7),
      getFeeStatsForChart(7),
    ])

    // Exclude sandbox orders from revenue calculation (sandbox = testing, not real money)
    const completedOrders = orders.filter((o) => o.status === 'completed' && !o.isSandbox)
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0)

    let activePaymentMethods = 0
    if (paymentSettings?.orkutEnabled) activePaymentMethods++
    if (paymentSettings?.midtransEnabled) activePaymentMethods++

    // Bot statistics
    const activeBots = botSettings.filter(b => b.isActive)
    const totalBots = botSettings.length

    return NextResponse.json({
      totalUsers: users.length,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      totalRevenue,
      activePaymentMethods,
      orkutEnabled: paymentSettings?.orkutEnabled || false,
      midtransEnabled: paymentSettings?.midtransEnabled || false,
      // Admin fee balance
      adminFeeBalance,
      // Bot stats
      totalBots,
      activeBots: activeBots.length,
      botList: botSettings.map(b => ({
        id: b.id,
        userId: b.userId,
        botName: b.botName || 'Unnamed Bot',
        isActive: b.isActive,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      // Chart data
      orderStats,
      feeStats,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
