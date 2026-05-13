'use server'

import { getQrisSettings as getQrisSettingsFromDB } from '@/lib/github-db'

export async function createQrisPayment(orderId: string, userId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL || 'localhost:3000'}`
    const response = await fetch(`${baseUrl}/api/payments/create-qris`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, userId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create QRIS payment')
    }

    return data
  } catch (error) {
    console.error('[v0] Create QRIS Payment Error:', error)
    throw error
  }
}

export async function checkPaymentStatus(orderId: string, transactionId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL || 'localhost:3000'}`
    const response = await fetch(`${baseUrl}/api/payments/check-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, transactionId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to check payment status')
    }

    return data
  } catch (error) {
    console.error('[v0] Check Payment Status Error:', error)
    throw error
  }
}

export async function saveQrisSettings(
  type: 'admin' | 'user',
  username: string,
  apiKey: string,
  token: string,
  userId?: string,
  merchantId?: string,
  codeQr?: string
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL || 'localhost:3000'}`
    const response = await fetch(`${baseUrl}/api/settings/qris`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        username,
        apiKey,
        token,
        userId,
        merchantId: merchantId || '',
        codeQr: codeQr || '',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save QRIS settings')
    }

    return data
  } catch (error) {
    console.error('[v0] Save QRIS Settings Error:', error)
    throw error
  }
}

export async function getQrisSettings(type: 'admin' | 'user' = 'admin', userId?: string) {
  try {
    // Call the database function directly instead of making an HTTP request
    const qrisSettings = await getQrisSettingsFromDB(type, userId)
    
    if (qrisSettings) {
      // Hide sensitive data just like the API does
      return {
        ...qrisSettings,
        apiKey: qrisSettings.apiKey ? '***' : '',
        token: qrisSettings.token ? '***' : '',
      }
    }
    
    return null
  } catch (error) {
    console.error('[v0] Get QRIS Settings Error:', error)
    return null
  }
}
