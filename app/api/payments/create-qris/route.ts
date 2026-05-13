import { NextRequest, NextResponse } from 'next/server'
import { getQrisSettings, getOrderById, createPayment, updateOrder } from '@/lib/github-db'

// API untuk create QRIS payment
export async function POST(request: NextRequest) {
  try {
    const { orderId, userId } = await request.json()

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: 'Missing orderId or userId' },
        { status: 400 }
      )
    }

    // Get order details
    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get user QRIS settings, fallback to admin QRIS
    let qrisSettings = await getQrisSettings('user', userId)
    if (!qrisSettings) {
      qrisSettings = await getQrisSettings('admin')
    }

    if (!qrisSettings) {
      return NextResponse.json(
        { error: 'QRIS settings not configured' },
        { status: 400 }
      )
    }

    // Call Orkut API to create payment
    const response = await fetch('https://orkut-mutasi.rakhashop.tech/api/v1/createpayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: qrisSettings.username,
        token: qrisSettings.token,
        apikey: qrisSettings.apiKey,
        amount: order.totalPrice,
        codeorder: orderId,
        type: 'dynamic',
      }),
    })

    if (!response.ok) {
      console.error('[QRIS Error] Orkut API error:', response.status, await response.text())
      return NextResponse.json(
        { error: 'Failed to create QRIS payment' },
        { status: 500 }
      )
    }

    const qrisData = await response.json()
    console.log('[QRIS] Create payment response:', qrisData)

    // Check if successful based on Orkut API response
    if (!qrisData.data?.qr_image || !qrisData.data?.response_code) {
      return NextResponse.json(
        { error: 'Invalid Orkut API response', details: qrisData },
        { status: 500 }
      )
    }

    // Update order with payment details
    const updatedOrder = await updateOrder(orderId, {
      paymentStatus: 'pending',
      paymentQrisUrl: qrisData.data.qr_image,
      paymentTransactionId: qrisData.data.response_code,
    })

    // Create payment record
    const payment = await createPayment({
      orderId,
      userId,
      amount: order.totalPrice,
      qrisUrl: qrisData.data.qr_image,
      transactionId: qrisData.data.response_code,
      status: 'pending',
      paymentMethod: 'qris',
    })

    return NextResponse.json({
      success: true,
      orderId,
      qrisUrl: qrisData.data.qr_image,
      transactionId: qrisData.data.response_code,
      payment,
    })
  } catch (error) {
    console.error('[QRIS Error]', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
