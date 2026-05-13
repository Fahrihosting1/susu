import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { 
  getWithdrawals, 
  createWithdrawal, 
  canUserWithdrawToday,
  getUserBalance
} from '@/lib/github-db'
import { WITHDRAWAL_FEES } from '@/types'

const MIN_WITHDRAWAL = 10000 // Minimum Rp 10.000

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const withdrawals = await getWithdrawals(session.id)
    const canWithdraw = await canUserWithdrawToday(session.id)
    
    // Use getUserBalance which includes adjustments
    const balance = await getUserBalance(session.id)

    return NextResponse.json({
      withdrawals,
      canWithdraw,
      balance: balance.availableBalance,
      totalRevenue: balance.totalRevenue,
      totalWithdrawn: balance.totalWithdrawn,
      totalAdjustments: balance.totalAdjustments,
    })
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, bankType, bankAccount, bankAccountName } = body

    // Validation
    if (!amount || !bankType || !bankAccount || !bankAccountName) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
    }

    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json({ error: `Minimal penarikan Rp ${MIN_WITHDRAWAL.toLocaleString('id-ID')}` }, { status: 400 })
    }

    // Check if user can withdraw today
    const canWithdraw = await canUserWithdrawToday(session.id)
    if (!canWithdraw) {
      return NextResponse.json({ error: 'Anda sudah melakukan penarikan hari ini. Coba lagi besok.' }, { status: 400 })
    }

    // Check user balance (includes adjustments)
    const balance = await getUserBalance(session.id)
    
    const fee = WITHDRAWAL_FEES[bankType] || 0
    const netAmount = amount - fee

    if (amount > balance.availableBalance) {
      return NextResponse.json({ error: 'Saldo tidak mencukupi' }, { status: 400 })
    }

    if (netAmount <= 0) {
      return NextResponse.json({ error: 'Jumlah penarikan harus lebih besar dari biaya admin' }, { status: 400 })
    }

    // Create withdrawal request
    const withdrawal = await createWithdrawal({
      userId: session.id,
      userName: session.name,
      userEmail: session.email,
      amount,
      fee,
      netAmount,
      bankType,
      bankAccount,
      bankAccountName,
      status: 'pending',
    })

    if (!withdrawal) {
      return NextResponse.json({ error: 'Gagal membuat permintaan penarikan' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      withdrawal,
      message: 'Permintaan penarikan berhasil dibuat' 
    })
  } catch (error) {
    console.error('Error creating withdrawal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
