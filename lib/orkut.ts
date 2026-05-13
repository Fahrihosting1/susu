import { getQrisSettings } from '@/lib/github-db'
import type { QrisSettings } from '@/types'

const ORKUT_API_BASE = 'https://api-orkut-delta.vercel.app/api/qris'

// Default Admin credentials (set this with environment variables or .env.local)
const ORKUT_ADMIN_USERNAME = process.env.ORKUT_ADMIN_USERNAME || 'comot4zie'
const ORKUT_ADMIN_API_KEY = process.env.ORKUT_ADMIN_API_KEY || 'new2025'
const ORKUT_ADMIN_AUTH_TOKEN = process.env.ORKUT_ADMIN_AUTH_TOKEN || '2008874:buGS6koVX4aATv8pZR1znsQrBDi5tgc0'
const ORKUT_ADMIN_MERCHANT_ID = process.env.ORKUT_ADMIN_MERCHANT_ID || '2008874'
const ORKUT_ADMIN_CODE_QR = process.env.ORKUT_ADMIN_CODE_QR || '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214057526533688570303UMI51440014ID.CO.QRIS.WWW0215ID20243395197280303UMI5204541153033605802ID5923GUNAWAN STORE OK20088746009PONTIANAK61057811162070703A01630477D2'

// Fee random antara 100-200
function generateRandomFee(): number {
  return Math.floor(Math.random() * 101) + 100
}

interface OrkutCreatePaymentResponse {
  success: boolean
  transactionId: string
  qrisUrl: string
  qrsImageUrl: string
  qrString: string
  amount: number
  originalAmount: number
  fee: number
  expiresAt: string
  error?: string
}

interface OrkutCheckPaymentResponse {
  success: boolean
  status: 'pending' | 'paid' | 'expired' | 'failed'
  transactionId: string
  amount?: string
  paidAt?: string
  brand?: string
  description?: string
  error?: string
}

export async function createOrkutQrisPayment(
  amount: number,
  description: string,
  qrisType: 'admin' | 'user',
  userId?: string
): Promise<OrkutCreatePaymentResponse> {
  try {
    const fee = generateRandomFee()
    const totalAmount = amount + fee

    // Set default admin credentials
    let username = ORKUT_ADMIN_USERNAME
    let apiKey = ORKUT_ADMIN_API_KEY
    let authToken = ORKUT_ADMIN_AUTH_TOKEN
    let merchantId = ORKUT_ADMIN_MERCHANT_ID
    let codeQr = ORKUT_ADMIN_CODE_QR

    // Try to override with user QRIS if requested
    if (qrisType === 'user' && userId) {
      const qrisSettings = await getQrisSettings('user', userId)
      if (qrisSettings && qrisSettings.isActive && qrisSettings.username && qrisSettings.apiKey && qrisSettings.token) {
        username = qrisSettings.username
        apiKey = qrisSettings.apiKey
        authToken = qrisSettings.token
        // Extract merchant ID from settings if available
        merchantId = qrisSettings.merchantId || qrisSettings.username
        codeQr = qrisSettings.codeQr || codeQr
      }
      // If user QRIS not found, just use admin QRIS (no error)
    }

    if (!username || !apiKey || !authToken || !codeQr) {
      return {
        success: false,
        error: `QRIS credentials tidak lengkap. Hubungi admin.`,
        transactionId: '',
        qrisUrl: '',
        qrsImageUrl: '',
        qrString: '',
        amount: totalAmount,
        originalAmount: amount,
        fee,
        expiresAt: '',
      }
    }

    // Build URL dengan parameters
    const params = new URLSearchParams({
      apikey: apiKey,
      amount: String(totalAmount),
      codeqr: codeQr,
      username,
      authToken,
      merchantid: merchantId,
    })

    const response = await fetch(`${ORKUT_API_BASE}/orderkuota?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!data.status || !data.result) {
      return {
        success: false,
        error: data.error || 'Gagal membuat QRIS payment',
        transactionId: '',
        qrisUrl: '',
        qrsImageUrl: '',
        qrString: '',
        amount: totalAmount,
        originalAmount: amount,
        fee,
        expiresAt: '',
      }
    }

    return {
      success: true,
      transactionId: data.result.transactionId,
      qrisUrl: data.result.qrString,
      qrsImageUrl: data.result.qrImageUrl,
      qrString: data.result.qrString,
      amount: totalAmount,
      originalAmount: amount,
      fee,
      expiresAt: data.result.expirationTime,
    }
  } catch (error) {
    console.error('[v0] Orkut Payment Error:', error)
    return {
      success: false,
      error: 'Gagal membuat QRIS payment: ' + String(error),
      transactionId: '',
      qrisUrl: '',
      qrsImageUrl: '',
      qrString: '',
      amount: 0,
      originalAmount: 0,
      fee: 0,
      expiresAt: '',
    }
  }
}

export async function checkOrkutPaymentStatus(
  transactionId: string,
  qrisType: 'admin' | 'user',
  userId?: string,
  amount?: number,
  codeQr?: string
): Promise<OrkutCheckPaymentResponse> {
  try {
    // Set default admin credentials
    let username = ORKUT_ADMIN_USERNAME
    let apiKey = ORKUT_ADMIN_API_KEY
    let authToken = ORKUT_ADMIN_AUTH_TOKEN
    let merchantId = ORKUT_ADMIN_MERCHANT_ID
    let qrCode = codeQr || ORKUT_ADMIN_CODE_QR

    // Try to override with user QRIS if requested
    if (qrisType === 'user' && userId) {
      const qrisSettings = await getQrisSettings('user', userId)
      if (qrisSettings && qrisSettings.isActive && qrisSettings.username && qrisSettings.apiKey && qrisSettings.token) {
        username = qrisSettings.username
        apiKey = qrisSettings.apiKey
        authToken = qrisSettings.token
        merchantId = qrisSettings.merchantId || qrisSettings.username
        qrCode = qrisSettings.codeQr || qrCode
      }
      // If user QRIS not found, just use admin QRIS (no error)
    }

    if (!username || !apiKey || !authToken || !qrCode) {
      return {
        success: false,
        status: 'failed',
        transactionId,
        error: `QRIS credentials tidak lengkap. Hubungi admin.`,
      }
    }

    // Check status with Orkut API - use same endpoint with transactionId, amount and codeqr
    const params = new URLSearchParams({
      apikey: apiKey,
      username,
      authToken,
      merchantid: merchantId,
      transactionId,
      codeqr: qrCode,
    })
    
    // Add amount if provided (required by Orkut API for status check)
    if (amount) {
      params.append('amount', String(amount))
    }

    const response = await fetch(`${ORKUT_API_BASE}/orderkuota?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    // Get payment status - handle different response structures
    const paymentStatus = data.paymentStatus || data.result?.paymentStatus
    const transaction = paymentStatus?.transaction || data.result?.paymentStatus?.transaction

    // Check payment status - handle both 'success' and 'paid' status
    if (paymentStatus?.status === 'success' || paymentStatus?.status === 'paid') {
      return {
        success: true,
        status: 'paid',
        transactionId,
        amount: transaction?.amount,
        brand: transaction?.brand_name,
        description: transaction?.keterangan,
      }
    } else if (paymentStatus?.status === 'pending' || !paymentStatus) {
      return {
        success: true,
        status: 'pending',
        transactionId,
        error: paymentStatus?.message || 'Menunggu konfirmasi pembayaran',
      }
    } else {
      return {
        success: false,
        status: 'failed',
        transactionId,
        error: data.error || 'Pembayaran gagal atau sudah expired',
      }
    }
  } catch (error) {
    console.error('[v0] Check Payment Status Error:', error)
    return {
      success: false,
      status: 'failed',
      transactionId,
      error: 'Gagal check status payment: ' + String(error),
    }
  }
}
