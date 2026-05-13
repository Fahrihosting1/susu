import { NextRequest, NextResponse } from 'next/server'
import { getBotSettings, createOrUpdateBotSettings } from '@/lib/github-db'
import { getSession } from '@/lib/auth'
import crypto from 'crypto'

// Generate a secure API key
function generateApiKey(): string {
  return `wa_${crypto.randomBytes(32).toString('hex')}`
}

// GET /api/whatsapp/settings - Get WhatsApp bot settings
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const botSettings = await getBotSettings(session.id)

    return NextResponse.json({
      success: true,
      whatsapp: botSettings ? {
        waNumber: botSettings.waNumber,
        waApiKey: botSettings.waApiKey,
        waConnected: botSettings.waConnected,
        waSessionId: botSettings.waSessionId,
        waLastConnected: botSettings.waLastConnected,
      } : null
    })
  } catch (error) {
    console.error('Get WhatsApp settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/whatsapp/settings - Save WhatsApp bot settings
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { waNumber, action } = body

    const botSettings = await getBotSettings(session.id)

    if (action === 'generate_api_key') {
      // Generate new API key
      const newApiKey = generateApiKey()
      
      if (botSettings) {
        await createOrUpdateBotSettings(session.id, {
          ...botSettings,
          waApiKey: newApiKey,
        })
      } else {
        // Create new bot settings with WhatsApp
        await createOrUpdateBotSettings(session.id, {
          botToken: '',
          ownerId: '',
          isActive: false,
          waNumber: waNumber || '',
          waApiKey: newApiKey,
          waConnected: false,
        })
      }

      return NextResponse.json({
        success: true,
        waApiKey: newApiKey,
        message: 'API key generated successfully'
      })
    }

    if (action === 'update_number') {
      if (!waNumber) {
        return NextResponse.json(
          { error: 'WhatsApp number is required' },
          { status: 400 }
        )
      }

      // Format number (remove +, spaces, etc)
      const formattedNumber = waNumber.replace(/\D/g, '')

      if (botSettings) {
        await createOrUpdateBotSettings(session.id, {
          ...botSettings,
          waNumber: formattedNumber,
        })
      } else {
        await createOrUpdateBotSettings(session.id, {
          botToken: '',
          ownerId: '',
          isActive: false,
          waNumber: formattedNumber,
          waApiKey: generateApiKey(),
          waConnected: false,
        })
      }

      return NextResponse.json({
        success: true,
        message: 'WhatsApp number updated'
      })
    }

    if (action === 'update_connection') {
      // Called by WhatsApp bot to update connection status
      const { connected, sessionId } = body

      if (botSettings) {
        await createOrUpdateBotSettings(session.id, {
          ...botSettings,
          waConnected: connected,
          waSessionId: sessionId || botSettings.waSessionId,
          waLastConnected: connected ? new Date().toISOString() : botSettings.waLastConnected,
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Connection status updated'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Save WhatsApp settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/whatsapp/settings - Clear WhatsApp settings
export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const botSettings = await getBotSettings(session.id)

    if (botSettings) {
      await createOrUpdateBotSettings(session.id, {
        ...botSettings,
        waNumber: undefined,
        waApiKey: undefined,
        waConnected: false,
        waSessionId: undefined,
        waLastConnected: undefined,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp settings cleared'
    })
  } catch (error) {
    console.error('Delete WhatsApp settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
