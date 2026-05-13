import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getBotSettings, createOrUpdateBotSettings } from '@/lib/github-db'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethod } = await request.json()
    
    if (!paymentMethod || !['orkut', 'midtrans'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    // Get current bot settings
    const currentSettings = await getBotSettings(session.id)
    
    if (!currentSettings) {
      return NextResponse.json({ error: 'Bot settings not found. Please configure bot first.' }, { status: 400 })
    }

    // Update with new payment method
    const updatedSettings = await createOrUpdateBotSettings(session.id, {
      ...currentSettings,
      preferredPaymentMethod: paymentMethod,
    })

    if (!updatedSettings) {
      return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      paymentMethod: updatedSettings.preferredPaymentMethod 
    })
  } catch (error) {
    console.error('Error updating payment method:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getBotSettings(session.id)
    
    return NextResponse.json({ 
      paymentMethod: settings?.preferredPaymentMethod || null 
    })
  } catch (error) {
    console.error('Error getting payment method:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
