import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { 
  updatePaymentByOrderId,
  activateSubscription,
  getPaymentByOrderId
} from '@/lib/github-db'
import { checkOrkutPaymentStatus } from '@/lib/orkut'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subscriptionId, transactionId, amount, qrString } = body

    if (!subscriptionId || !transactionId) {
      return NextResponse.json({ error: 'Missing subscriptionId or transactionId' }, { status: 400 })
    }

    // Get payment details from payment record if not provided
    let paymentAmount = amount
    let paymentQrString = qrString
    if (!paymentAmount || !paymentQrString) {
      const paymentRecord = await getPaymentByOrderId(`subscription_${subscriptionId}`)
      paymentAmount = paymentAmount || paymentRecord?.amount
      paymentQrString = paymentQrString || paymentRecord?.qrString
    }

    // Check payment status from Orkut (with amount and codeqr)
    const paymentStatus = await checkOrkutPaymentStatus(transactionId, 'admin', undefined, paymentAmount, paymentQrString)

    console.log('[v0] Subscription check-payment result:', {
      subscriptionId,
      transactionId,
      paymentStatus: paymentStatus.status,
      success: paymentStatus.success,
    })

    if (paymentStatus.status === 'paid') {
      // Activate subscription
      const subscription = await activateSubscription(subscriptionId)
      
      if (!subscription) {
        return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 })
      }

      // Update payment record
      await updatePaymentByOrderId(`subscription_${subscriptionId}`, {
        status: 'paid',
      })

      return NextResponse.json({
        success: true,
        status: 'paid',
        subscription,
        message: 'Pembayaran berhasil! Langganan Anda sudah aktif.',
      })
    } else if (paymentStatus.status === 'pending') {
      return NextResponse.json({
        success: true,
        status: 'pending',
        message: 'Menunggu pembayaran...',
      })
    } else {
      return NextResponse.json({
        success: false,
        status: paymentStatus.status,
        message: paymentStatus.error || 'Pembayaran gagal atau expired',
      })
    }
  } catch (error) {
    console.error('Error checking subscription payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
