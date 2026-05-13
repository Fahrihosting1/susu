import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPaymentSettings, updatePaymentByOrderId, updateOrder, getOrderById, getProductById, updateProduct, getBotSettingsByToken } from '@/lib/github-db'

interface MidtransNotification {
  transaction_status: string
  order_id: string
  gross_amount: string
  signature_key: string
  status_code: string
  payment_type: string
  transaction_id: string
  fraud_status?: string
}

export async function POST(request: Request) {
  try {
    const notification: MidtransNotification = await request.json()

    // Get payment settings for verification
    const settings = await getPaymentSettings()
    if (!settings?.midtransServerKey) {
      console.error('Midtrans server key not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Verify signature
    const signatureString = notification.order_id + notification.status_code + notification.gross_amount + settings.midtransServerKey
    const expectedSignature = crypto
      .createHash('sha512')
      .update(signatureString)
      .digest('hex')

    if (notification.signature_key !== expectedSignature) {
      console.error('Invalid Midtrans signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // Extract original order ID (format: MIDTRANS-{orderId}-{timestamp})
    const orderIdMatch = notification.order_id.match(/^MIDTRANS-(.+)-\d+$/)
    const originalOrderId = orderIdMatch ? orderIdMatch[1] : notification.order_id

    // Update payment status based on transaction status
    const transactionStatus = notification.transaction_status
    const fraudStatus = notification.fraud_status

    let paymentStatus: 'pending' | 'paid' | 'expired' | 'failed' = 'pending'
    let orderStatus: 'pending' | 'processing' | 'completed' | 'cancelled' = 'pending'

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        paymentStatus = 'paid'
        orderStatus = 'processing'
      } else {
        paymentStatus = 'failed'
        orderStatus = 'cancelled'
      }
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'pending'
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel') {
      paymentStatus = 'failed'
      orderStatus = 'cancelled'
    } else if (transactionStatus === 'expire') {
      paymentStatus = 'expired'
      orderStatus = 'cancelled'
    }

    // Update payment and order
    await updatePaymentByOrderId(originalOrderId, {
      status: paymentStatus,
      midtransTransactionId: notification.transaction_id,
    })

    const order = await getOrderById(originalOrderId)
    if (order) {
      await updateOrder(originalOrderId, {
        paymentStatus,
        status: orderStatus,
      })

      // If payment successful, send notification via Telegram (if bot is configured)
      if (paymentStatus === 'paid') {
        // Get product for stock item delivery
        const product = await getProductById(order.productId)
        
        if (product && product.items && product.items.length > 0) {
          // Get stock item to deliver
          const stockItem = product.items[0]
          
          // Remove delivered item from stock
          await updateProduct(product.id, {
            items: product.items.slice(1),
            stock: product.stock - 1,
          })

          // Try to notify buyer via Telegram
          if (order.buyerId) {
            try {
              // Get bot settings to send message
              const botSettings = await getBotSettingsByToken(process.env.BOT_TOKEN || '')
              if (botSettings?.botToken) {
                const message = `🎉 *Pembayaran Berhasil!*\n\n` +
                  `📦 Produk: ${order.productName}\n` +
                  `💰 Total: Rp ${order.totalPrice.toLocaleString('id-ID')}\n` +
                  `💳 Metode: Midtrans QRIS\n\n` +
                  `📋 *Detail Produk:*\n` +
                  `\`\`\`\n${stockItem}\n\`\`\`\n\n` +
                  `Terima kasih telah berbelanja! 🙏`

                await fetch(`https://api.telegram.org/bot${botSettings.botToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: order.buyerId,
                    text: message,
                    parse_mode: 'Markdown',
                  }),
                })
              }
            } catch (telegramError) {
              console.error('Failed to send Telegram notification:', telegramError)
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Midtrans webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
