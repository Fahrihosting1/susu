import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/auth'
import { getPaymentSettings, savePaymentSettings } from '@/lib/github-db'

export async function GET(request: Request) {
  try {
    // Check if this is an internal request (from bot/server)
    const url = new URL(request.url)
    const isInternal = url.searchParams.get('internal') === 'true'
    
    // For non-internal requests, check admin auth
    if (!isInternal) {
      const isAdmin = await isCurrentUserAdmin()
      
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const settings = await getPaymentSettings()

    if (settings) {
      // For internal requests, return full settings (no masking)
      if (isInternal) {
        return NextResponse.json({ settings })
      }
      
      // Mask sensitive keys for display (admin UI)
      return NextResponse.json({
        settings: {
          ...settings,
          orkutApiKey: settings.orkutApiKey ? '***hidden***' : '',
          orkutToken: settings.orkutToken ? '***hidden***' : '',
          midtransServerKey: settings.midtransServerKey ? '***hidden***' : '',
          midtransClientKey: settings.midtransClientKey ? '***hidden***' : '',
        }
      })
    }

    return NextResponse.json({ settings: null })
  } catch (error) {
    console.error('Get payment settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await isCurrentUserAdmin()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()

    // Get existing settings to preserve hidden keys
    const existingSettings = await getPaymentSettings()

    // Prepare settings to save
    const settingsToSave = {
      orkutEnabled: body.orkutEnabled ?? false,
      orkutUsername: body.orkutUsername || '',
      orkutMerchantId: body.orkutMerchantId || '',
      orkutCodeQr: body.orkutCodeQr || '',
      // Only update keys if they're not the masked value
      orkutApiKey: body.orkutApiKey === '***hidden***' 
        ? existingSettings?.orkutApiKey || ''
        : body.orkutApiKey || '',
      orkutToken: body.orkutToken === '***hidden***'
        ? existingSettings?.orkutToken || ''
        : body.orkutToken || '',
      midtransEnabled: body.midtransEnabled ?? false,
      midtransMerchantId: body.midtransMerchantId || '',
      midtransIsProduction: body.midtransIsProduction ?? false,
      midtransServerKey: body.midtransServerKey === '***hidden***'
        ? existingSettings?.midtransServerKey || ''
        : body.midtransServerKey || '',
      midtransClientKey: body.midtransClientKey === '***hidden***'
        ? existingSettings?.midtransClientKey || ''
        : body.midtransClientKey || '',
      // Fee settings
      midtransFeeType: body.midtransFeeType || 'fixed',
      midtransFeeAmount: body.midtransFeeAmount ?? 0,
      midtransRandomFeeMin: body.midtransRandomFeeMin ?? 1,
      midtransRandomFeeMax: body.midtransRandomFeeMax ?? 100,
      defaultPaymentMethod: body.defaultPaymentMethod || 'orkut',
    }

    const savedSettings = await savePaymentSettings(settingsToSave)

    if (!savedSettings) {
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      settings: {
        ...savedSettings,
        orkutApiKey: savedSettings.orkutApiKey ? '***hidden***' : '',
        orkutToken: savedSettings.orkutToken ? '***hidden***' : '',
        midtransServerKey: savedSettings.midtransServerKey ? '***hidden***' : '',
        midtransClientKey: savedSettings.midtransClientKey ? '***hidden***' : '',
      }
    })
  } catch (error) {
    console.error('Save payment settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
