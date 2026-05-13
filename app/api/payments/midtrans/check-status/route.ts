import { NextResponse } from 'next/server'
import { checkMidtransPaymentStatus } from '@/lib/midtrans'
import { getPaymentByOrderId, updatePaymentByOrderId, updateOrder } from '@/lib/github-db'

export async function POST(request: Request) {
  try {
    const { orderId, transactionId } = await request.json()

    if (!transactionId && !orderId) {
      return NextResponse.json({ error: 'Transaction ID or Order ID is required' }, { status: 400 })
    }

    let txId = transactionId

    // If only orderId is provided, get transactionId from payment record
    if (!txId && orderId) {
      const payment = await getPaymentByOrderId(orderId)
      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }
      txId = payment.midtransTransactionId || payment.transactionId
    }

    if (!txId) {
      return NextResponse.json({ error: 'Transaction ID not found' }, { status: 400 })
    }

    const status = await checkMidtransPaymentStatus(txId)

    if (!status.success) {
      return NextResponse.json({ error: status.error }, { status: 500 })
    }

    // Update local payment status
    let paymentStatus: 'pending' | 'paid' | 'expired' | 'failed' = 'pending'
    let isPaid = false

    if (status.transactionStatus === 'settlement' || status.transactionStatus === 'capture') {
      paymentStatus = 'paid'
      isPaid = true
    } else if (status.transactionStatus === 'expire') {
      paymentStatus = 'expired'
    } else if (status.transactionStatus === 'deny' || status.transactionStatus === 'cancel') {
      paymentStatus = 'failed'
    }

    // Update payment and order if orderId is known
    if (orderId) {
      await updatePaymentByOrderId(orderId, { status: paymentStatus })
      await updateOrder(orderId, { 
        paymentStatus,
        status: isPaid ? 'processing' : undefined,
      })
    }

    return NextResponse.json({
      success: true,
      isPaid,
      transactionStatus: status.transactionStatus,
      orderId: status.orderId,
      grossAmount: status.grossAmount,
      paymentType: status.paymentType,
    })
  } catch (error) {
    console.error('Check Midtrans status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
