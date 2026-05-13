import { NextRequest, NextResponse } from 'next/server'
import { getBotSettings, createOrUpdateBotSettings } from '@/lib/github-db'

// POST /api/whatsapp/verify - Verify API key and get user info (called by WhatsApp bot)
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    const userId = request.headers.get('x-user-id')

    if (!apiKey || !userId) {
      return NextResponse.json(
        { error: 'Missing API key or user ID' },
        { status: 401 }
      )
    }

    // Find bot settings with this API key
    const botSettings = await getBotSettings(userId)
    
    if (!botSettings || botSettings.waApiKey !== apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key', valid: false },
        { status: 401 }
      )
    }

    // Update connection status
    await createOrUpdateBotSettings(userId, {
      ...botSettings,
      waConnected: true,
      waLastConnected: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      valid: true,
      userId,
      botName: botSettings.botName,
      waNumber: botSettings.waNumber,
    })
  } catch (error) {
    console.error('WhatsApp verify API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', valid: false },
      { status: 500 }
    )
  }
}

// PUT /api/whatsapp/verify - Update connection status (heartbeat)
export async function PUT(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    const userId = request.headers.get('x-user-id')

    if (!apiKey || !userId) {
      return NextResponse.json(
        { error: 'Missing API key or user ID' },
        { status: 401 }
      )
    }

    const botSettings = await getBotSettings(userId)
    
    if (!botSettings || botSettings.waApiKey !== apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { connected, sessionId } = body

    await createOrUpdateBotSettings(userId, {
      ...botSettings,
      waConnected: connected !== undefined ? connected : botSettings.waConnected,
      waSessionId: sessionId || botSettings.waSessionId,
      waLastConnected: connected ? new Date().toISOString() : botSettings.waLastConnected,
    })

    return NextResponse.json({
      success: true,
      message: 'Status updated'
    })
  } catch (error) {
    console.error('WhatsApp heartbeat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
