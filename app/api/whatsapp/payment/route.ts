import { NextRequest, NextResponse } from 'next/server'
import { getBotSettings, getOrderById, updateOrder, createPayment, getPaymentSettings, getQrisSettingsByUserId, getAdminQrisSettings } from '@/lib/github-db'
import { createOrkutQrisPayment, checkOrkutPaymentStatus } from '@/lib/orkut'
import { createMidtransQrisPayment, checkMidtransPaymentStatus } from '@/lib/midtrans'

// POST /api/whatsapp/payment - Create QRIS payment for order
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    const userId = request.headers.get('x-user-id')

    if (!apiKey || !userId) {
      return NextResponse.json(
        { error: 'Missing API key or user ID' },
        { status: 401 }
      )
    }

    // Verify API key
    const botSettings = await getBotSettings(userId)
    if (!botSettings || botSettings.waApiKey !== apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId, paymentMethod: requestedMethod } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order
    const order = await getOrderById(orderId)
    if (!order || order.userId !== userId) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 400 }
      )
    }

    // Get payment settings
    const paymentSettings = await getPaymentSettings()
    if (!paymentSettings) {
      return NextResponse.json(
        { error: 'Payment not configured. Contact admin.' },
        { status: 400 }
      )
    }

    // Determine payment method
    const paymentMethod = requestedMethod || 
      botSettings.preferredPaymentMethod || 
      paymentSettings.defaultPaymentMethod || 
      'orkut'

    let qrisUrl: string | null = null
    let qrString: string | null = null
    let transactionId: string | null = null
    let amount = order.totalPrice

    if (paymentMethod === 'orkut') {
      if (!paymentSettings.orkutEnabled) {
        return NextResponse.json(
          { error: 'Orkut QRIS not enabled' },
          { status: 400 }
        )
      }

      // Check for user's own QRIS or use admin's
      const userQris = await getQrisSettingsByUserId(userId)
      const qrisType = userQris ? 'user' : 'admin'

      // Create Orkut QRIS using the correct function
      const orkutResult = await createOrkutQrisPayment(
        amount,
        `Order ${order.id}`,
        qrisType,
        userId
      )

      if (!orkutResult.success) {
        return NextResponse.json(
          { error: orkutResult.error || 'Failed to create QRIS' },
          { status: 500 }
        )
      }

      qrisUrl = orkutResult.qrsImageUrl || null
      qrString = orkutResult.qrString || null
      transactionId = orkutResult.transactionId || null
      amount = orkutResult.amount // Include fee

    } else if (paymentMethod === 'midtrans') {
      if (!paymentSettings.midtransEnabled) {
        return NextResponse.json(
          { error: 'Midtrans QRIS not enabled' },
          { status: 400 }
        )
      }

      // Create Midtrans QRIS using the correct function
      const midtransResult = await createMidtransQrisPayment(
        order.id,
        amount,
        order.buyerName,
        order.buyerPhone ? `${order.buyerPhone}@email.com` : undefined
      )

      if (!midtransResult.success) {
        return NextResponse.json(
          { error: midtransResult.error || 'Failed to create QRIS' },
          { status: 500 }
        )
      }

      qrisUrl = midtransResult.qrCodeUrl || null
      qrString = midtransResult.qrString || null
      transactionId = midtransResult.transactionId || null
      amount = midtransResult.totalAmount || amount
    }

    // Create payment record
    await createPayment({
      orderId: order.id,
      userId,
      amount,
      qrisUrl: qrisUrl || undefined,
      qrString: qrString || undefined,
      transactionId: transactionId || undefined,
      status: 'pending',
      paymentMethod: paymentMethod as 'qris' | 'midtrans',
    })

    // Update order
    await updateOrder(orderId, {
      paymentStatus: 'pending',
      paymentMethod: paymentMethod as 'qris' | 'midtrans',
      paymentTransactionId: transactionId || undefined,
      paymentQrisUrl: qrisUrl || undefined,
    })

    return NextResponse.json({
      success: true,
      payment: {
        qrisUrl,
        qrString,
        transactionId,
        amount,
        paymentMethod,
        expiresIn: 300, // 5 minutes
      }
    })
  } catch (error) {
    console.error('WhatsApp payment API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/whatsapp/payment?orderId=xxx - Check payment status
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    const userId = request.headers.get('x-user-id')

    if (!apiKey || !userId) {
      return NextResponse.json(
        { error: 'Missing API key or user ID' },
        { status: 401 }
      )
    }

    // Verify API key
    const botSettings = await getBotSettings(userId)
    if (!botSettings || botSettings.waApiKey !== apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const transactionId = searchParams.get('transactionId')

    if (!orderId && !transactionId) {
      return NextResponse.json(
        { error: 'Order ID or transaction ID is required' },
        { status: 400 }
      )
    }

    // Get order
    const order = orderId ? await getOrderById(orderId) : null
    if (orderId && (!order || order.userId !== userId)) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check payment method and status
    const paymentSettings = await getPaymentSettings()
    if (!paymentSettings) {
      return NextResponse.json(
        { error: 'Payment not configured' },
        { status: 400 }
      )
    }

    const txId = transactionId || order?.paymentTransactionId
    const method = order?.paymentMethod || 'orkut'

    if (!txId) {
      return NextResponse.json({
        success: true,
        status: 'no_payment',
        isPaid: false,
      })
    }

    let isPaid = false
    let status = 'pending'

    if (method === 'midtrans') {
      const result = await checkMidtransPaymentStatus(txId)
      isPaid = result.transactionStatus === 'settlement' || result.transactionStatus === 'capture'
      status = result.transactionStatus || 'pending'
    } else {
      // Orkut - check if user has their own QRIS
      const userQris = await getQrisSettingsByUserId(userId)
      const qrisType = userQris ? 'user' : 'admin'
      
      const result = await checkOrkutPaymentStatus(
        txId,
        qrisType,
        userId,
        order?.totalPrice
      )
      isPaid = result.status === 'paid'
      status = result.status
    }

    return NextResponse.json({
      success: true,
      status,
      isPaid,
      transactionId: txId,
    })
  } catch (error) {
    console.error('WhatsApp check payment API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
