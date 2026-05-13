import { getQrisSettings } from '@/lib/github-db'
import type { QrisSettings } from '@/types'

const ORKUT_API_BASE = 'https://api-orkut-delta.vercel.app/api/qris'

// Default Admin credentials (set this with environment variables or .env.local)
const ORKUT_ADMIN_USERNAME = process.env.ORKUT_ADMIN_USERNAME || ''
const ORKUT_ADMIN_API_KEY = process.env.ORKUT_ADMIN_API_KEY || ''
const ORKUT_ADMIN_AUTH_TOKEN = process.env.ORKUT_ADMIN_AUTH_TOKEN || ''
const ORKUT_ADMIN_MERCHANT_ID = process.env.ORKUT_ADMIN_MERCHANT_ID || ''
const ORKUT_ADMIN_CODE_QR = process.env.ORKUT_ADMIN_CODE_QR || ''

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

    let username = ''
    let apiKey = ORKUT_ADMIN_API_KEY
    let authToken = ORKUT_ADMIN_AUTH_TOKEN
    let merchantId = ORKUT_ADMIN_MERCHANT_ID
    let codeQr = ORKUT_ADMIN_CODE_QR

    if (qrisType === 'user' && userId) {
      const qrisSettings = await getQrisSettings('user', userId)
      if (qrisSettings && qrisSettings.isActive) {
        username = qrisSettings.username
        apiKey = qrisSettings.apiKey
        authToken = qrisSettings.token
        // Extract merchant ID from settings if available
        merchantId = qrisSettings.username // atau bisa dari field lain
        codeQr = qrisSettings.apiKey // Asumsi code QR disimpan di field apiKey untuk user
      }
    } else {
      username = ORKUT_ADMIN_USERNAME
    }

    if (!username || !apiKey || !authToken || !codeQr) {
      return {
        success: false,
        error: `QRIS ${qrisType} credentials tidak lengkap`,
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

    console.log('[v0] Orkut API Response:', {
      status: data.status,
      transactionId: data.result?.transactionId,
      hasQrImage: !!data.result?.qrImageUrl,
    })

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
  userId?: string
): Promise<OrkutCheckPaymentResponse> {
  try {
    let username = ORKUT_ADMIN_USERNAME
    let apiKey = ORKUT_ADMIN_API_KEY
    let authToken = ORKUT_ADMIN_AUTH_TOKEN
    let merchantId = ORKUT_ADMIN_MERCHANT_ID

    if (qrisType === 'user' && userId) {
      const qrisSettings = await getQrisSettings('user', userId)
      if (qrisSettings && qrisSettings.isActive) {
        username = qrisSettings.username
        apiKey = qrisSettings.apiKey
        authToken = qrisSettings.token
      }
    }

    if (!username || !apiKey || !authToken) {
      return {
        success: false,
        status: 'failed',
        transactionId,
        error: `QRIS ${qrisType} credentials tidak lengkap`,
      }
    }

    // Check status with Orkut API - use same endpoint with transactionId
    const params = new URLSearchParams({
      apikey: apiKey,
      username,
      authToken,
      merchantid: merchantId,
      transactionId,
    })

    const response = await fetch(`${ORKUT_API_BASE}/orderkuota?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    // Check payment status
    if (data.paymentStatus?.status === 'success') {
      return {
        success: true,
        status: 'paid',
        transactionId,
        amount: data.paymentStatus.transaction?.amount,
        brand: data.paymentStatus.transaction?.brand_name,
        description: data.paymentStatus.transaction?.keterangan,
      }
    } else if (data.paymentStatus?.status === 'pending' || !data.paymentStatus) {
      return {
        success: true,
        status: 'pending',
        transactionId,
        error: data.paymentStatus?.message || 'Menunggu konfirmasi pembayaran',
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
