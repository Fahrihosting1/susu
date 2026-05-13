import { NextResponse } from 'next/server'
import { createMidtransQrisPayment } from '@/lib/midtrans'
import { getOrderById, updateOrder, createPayment, getPaymentSettings } from '@/lib/github-db'

export async function POST(request: Request) {
  try {
    const { orderId, userId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Check if Midtrans is enabled
    const settings = await getPaymentSettings()
    if (!settings?.midtransEnabled) {
      return NextResponse.json({ error: 'Midtrans payment is not enabled' }, { status: 400 })
    }

    // Get order
    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Create Midtrans QRIS payment
    const result = await createMidtransQrisPayment(
      orderId,
      order.totalPrice,
      order.buyerName,
      order.buyerContact
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Update order with payment info
    await updateOrder(orderId, {
      paymentStatus: 'pending',
      paymentQrisUrl: result.qrCodeUrl,
      paymentTransactionId: result.transactionId,
    })

    // Create payment record
    await createPayment({
      orderId,
      userId: userId || order.userId,
      amount: order.totalPrice,
      qrisUrl: result.qrCodeUrl,
      transactionId: result.transactionId,
      status: 'pending',
      paymentMethod: 'midtrans',
    })

    return NextResponse.json({
      success: true,
      qrCodeUrl: result.qrCodeUrl,
      qrString: result.qrString,
      transactionId: result.transactionId,
      expiryTime: result.expiryTime,
    })
  } catch (error) {
    console.error('Create Midtrans payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
