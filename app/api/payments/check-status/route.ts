import { NextRequest, NextResponse } from 'next/server'
import { getQrisSettings, updatePaymentByOrderId, updateOrder } from '@/lib/github-db'

// API untuk cek status pembayaran dari Orkut Mutasi
export async function POST(request: NextRequest) {
  try {
    const { orderId, transactionId } = await request.json()

    if (!orderId || !transactionId) {
      return NextResponse.json(
        { error: 'Missing orderId or transactionId' },
        { status: 400 }
      )
    }

    // Get admin QRIS settings
    const adminQris = await getQrisSettings('admin')
    if (!adminQris) {
      return NextResponse.json(
        { error: 'QRIS settings not configured' },
        { status: 400 }
      )
    }

    // Call Orkut Mutasi API to check payment status
    const response = await fetch('https://orkut-mutasi.rakhashop.tech/api/v1/mutasi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: adminQris.username,
        token: adminQris.token,
        apikey: adminQris.apiKey,
        response_code: transactionId,
        codeorder: orderId,
      }),
    })

    if (!response.ok) {
      console.error('[QRIS Mutasi Error]', response.status, await response.text())
      return NextResponse.json(
        { error: 'Failed to check payment status' },
        { status: 500 }
      )
    }

    const mutasiData = await response.json()
    console.log('[QRIS Mutasi] Response:', mutasiData)

    // Parse status from Orkut response
    // Assume 'SUCCESS' atau '00' means payment received
    let paymentStatus: 'unpaid' | 'pending' | 'paid' | 'expired' | 'failed' = 'pending'
    let orderStatus: 'pending' | 'processing' | 'completed' | 'cancelled' = 'pending'

    if (mutasiData.data?.status === 'SUCCESS' || mutasiData.data?.status === '00') {
      paymentStatus = 'paid'
      orderStatus = 'processing'
    } else if (mutasiData.data?.status === 'EXPIRED' || mutasiData.data?.status === 'CANCEL') {
      paymentStatus = 'expired'
      orderStatus = 'cancelled'
    } else if (mutasiData.data?.status === 'PENDING') {
      paymentStatus = 'pending'
    } else if (mutasiData.data?.status === 'FAILED') {
      paymentStatus = 'failed'
      orderStatus = 'cancelled'
    }

    // Update payment status
    await updatePaymentByOrderId(orderId, {
      status: paymentStatus,
    })

    // Update order status if payment successful
    if (paymentStatus === 'paid') {
      await updateOrder(orderId, {
        paymentStatus: 'paid',
        status: 'processing',
      })
    }

    return NextResponse.json({
      success: true,
      orderId,
      paymentStatus,
      orderStatus,
      mutasiData: mutasiData.data,
    })
  } catch (error) {
    console.error('[QRIS Mutasi Error]', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

// Webhook from Orkut for payment notifications
export async function PUT(request: NextRequest) {
  try {
    // Orkut mengirim notifikasi saat pembayaran berhasil
    const body = await request.json()
    const { codeorder, response_code, status } = body

    if (!codeorder || !response_code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Determine payment status
    let paymentStatus: 'unpaid' | 'pending' | 'paid' | 'expired' | 'failed' = 'pending'

    if (status === 'SUCCESS' || status === '00') {
      paymentStatus = 'paid'
    } else if (status === 'EXPIRED' || status === 'CANCEL') {
      paymentStatus = 'expired'
    } else if (status === 'FAILED') {
      paymentStatus = 'failed'
    }

    // Update payment and order
    await updatePaymentByOrderId(codeorder, { status: paymentStatus })

    if (paymentStatus === 'paid') {
      await updateOrder(codeorder, {
        paymentStatus: 'paid',
        status: 'processing',
      })
    } else if (paymentStatus === 'expired' || paymentStatus === 'failed') {
      await updateOrder(codeorder, {
        paymentStatus,
        status: 'cancelled',
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[QRIS Webhook Error]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
