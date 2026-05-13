import { NextRequest, NextResponse } from 'next/server'
import { updatePaymentByOrderId, getOrderById, updateOrder } from '@/lib/github-db'
import { logPaymentError } from '@/lib/error-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('[v0] Orkut Webhook Received:', body)

    const { transactionId, orderId, status, paidAmount, paidAt } = body

    if (!transactionId || !orderId) {
      return NextResponse.json(
        { error: 'Invalid webhook data' },
        { status: 400 }
      )
    }

    // Verify signature if provided
    const signature = request.headers.get('x-orkut-signature')
    if (signature) {
      // TODO: Verify signature with Orkut API key
      // This would prevent unauthorized updates
    }

    // Update payment status
    const paymentStatuses: { [key: string]: 'pending' | 'paid' | 'expired' | 'failed' } = {
      'success': 'paid',
      'paid': 'paid',
      'completed': 'paid',
      'failed': 'failed',
      'expired': 'expired',
      'pending': 'pending'
    }

    const newStatus = paymentStatuses[status?.toLowerCase()] || 'pending'

    const updateResult = await updatePaymentByOrderId(orderId, {
      status: newStatus,
      transactionId,
    })

    if (!updateResult) {
      console.log('[v0] Payment not found for orderId:', orderId)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    console.log('[v0] Payment status updated:', {
      orderId,
      transactionId,
      status: newStatus,
    })

    // If payment is successful, update order status to completed
    if (newStatus === 'paid') {
      const order = await getOrderById(orderId)
      if (order) {
        await updateOrder(orderId, { 
          paymentStatus: 'paid', 
          status: 'completed' 
        })
        console.log('[v0] Order status updated to completed:', orderId)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
      status: newStatus,
    })
  } catch (error) {
    console.error('[v0] Orkut Webhook Error:', error)
    
    // Log error
    await logPaymentError(
      'orkut-webhook',
      error instanceof Error ? error.message : String(error),
      {
        severity: 'error',
        stackTrace: error instanceof Error ? error.stack : undefined,
        isSensitive: true,
      }
    )
    
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}
