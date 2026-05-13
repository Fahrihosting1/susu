import midtransClient from 'midtrans-client'
import { getPaymentSettings } from './github-db'

export interface MidtransQrisResponse {
  success: boolean
  transactionId?: string
  qrCodeUrl?: string
  qrString?: string
  expiryTime?: string
  originalAmount?: number
  feeAmount?: number
  randomFee?: number
  totalAmount?: number
  error?: string
}

export interface MidtransStatusResponse {
  success: boolean
  transactionStatus?: string
  orderId?: string
  grossAmount?: string
  paymentType?: string
  transactionTime?: string
  settlementTime?: string
  error?: string
}

async function getMidtransClient() {
  const settings = await getPaymentSettings()
  
  if (!settings || !settings.midtransEnabled) {
    throw new Error('Midtrans is not enabled')
  }

  if (!settings.midtransServerKey) {
    throw new Error('Midtrans server key is not configured')
  }

  const coreApi = new midtransClient.CoreApi({
    isProduction: settings.midtransIsProduction,
    serverKey: settings.midtransServerKey,
    clientKey: settings.midtransClientKey,
  })

  return { coreApi, settings }
}

// Helper function to calculate fee
function calculateMidtransFee(
  amount: number,
  feeType: 'fixed' | 'percent',
  feeAmount: number,
  randomFeeMin: number,
  randomFeeMax: number
): { baseFee: number; randomFee: number; totalFee: number } {
  // Calculate base fee
  let baseFee = 0
  if (feeType === 'fixed') {
    baseFee = feeAmount
  } else if (feeType === 'percent') {
    baseFee = Math.round((amount * feeAmount) / 100)
  }

  // Calculate random fee (between min and max, default 1-100)
  const min = randomFeeMin || 1
  const max = randomFeeMax || 100
  const randomFee = Math.floor(Math.random() * (max - min + 1)) + min

  return {
    baseFee,
    randomFee,
    totalFee: baseFee + randomFee,
  }
}

export async function createMidtransQrisPayment(
  orderId: string,
  amount: number,
  customerName: string,
  customerEmail?: string
): Promise<MidtransQrisResponse> {
  try {
    const { coreApi, settings } = await getMidtransClient()

    // Calculate fee from settings
    const feeType = settings.midtransFeeType || 'fixed'
    const feeAmount = settings.midtransFeeAmount || 0
    const randomFeeMin = settings.midtransRandomFeeMin || 1
    const randomFeeMax = settings.midtransRandomFeeMax || 100

    const { baseFee, randomFee, totalFee } = calculateMidtransFee(
      amount,
      feeType,
      feeAmount,
      randomFeeMin,
      randomFeeMax
    )

    // Total amount = original amount + base fee + random fee
    const totalAmount = amount + totalFee

    const parameter = {
      payment_type: 'qris',
      transaction_details: {
        order_id: `MIDTRANS-${orderId}-${Date.now()}`,
        gross_amount: totalAmount,
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail || 'customer@example.com',
      },
      qris: {
        acquirer: 'gopay', // Can be 'gopay', 'airpay shopee', etc.
      },
    }

    const response = await coreApi.charge(parameter)

    if (response.status_code === '201' || response.status_code === '200') {
      // Find QRIS action
      const qrisAction = response.actions?.find(
        (action: { name: string; url: string }) => 
          action.name === 'generate-qr-code' || action.name === 'qr-code'
      )

      return {
        success: true,
        transactionId: response.transaction_id,
        qrCodeUrl: qrisAction?.url || response.actions?.[0]?.url,
        qrString: response.qr_string,
        expiryTime: response.expiry_time,
        originalAmount: amount,
        feeAmount: baseFee,
        randomFee: randomFee,
        totalAmount: totalAmount,
      }
    }

    return {
      success: false,
      error: response.status_message || 'Failed to create payment',
    }
  } catch (error) {
    console.error('Midtrans QRIS error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function checkMidtransPaymentStatus(
  transactionId: string
): Promise<MidtransStatusResponse> {
  try {
    const { coreApi } = await getMidtransClient()

    const response = await coreApi.transaction.status(transactionId)

    return {
      success: true,
      transactionStatus: response.transaction_status,
      orderId: response.order_id,
      grossAmount: response.gross_amount,
      paymentType: response.payment_type,
      transactionTime: response.transaction_time,
      settlementTime: response.settlement_time,
    }
  } catch (error) {
    console.error('Midtrans status check error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function isMidtransPaymentPaid(transactionId: string): Promise<boolean> {
  const status = await checkMidtransPaymentStatus(transactionId)
  
  if (!status.success) return false
  
  // settlement = paid, capture = paid (for credit card)
  return status.transactionStatus === 'settlement' || status.transactionStatus === 'capture'
}

export async function cancelMidtransPayment(transactionId: string): Promise<boolean> {
  try {
    const { coreApi } = await getMidtransClient()
    await coreApi.transaction.cancel(transactionId)
    return true
  } catch (error) {
    console.error('Midtrans cancel error:', error)
    return false
  }
}
