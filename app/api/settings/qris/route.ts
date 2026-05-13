import { NextRequest, NextResponse } from 'next/server'
import { createOrUpdateQrisSettings, getQrisSettings, deleteQrisSettings } from '@/lib/github-db'
import { getSession } from '@/lib/auth'

// GET - Retrieve QRIS settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'admin' | 'user' || 'admin'
    let userId = searchParams.get('userId')

    // Handle 'me' as current user
    if (userId === 'me') {
      const user = await getSession()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    }

    const qrisSettings = await getQrisSettings(type, userId || undefined)

    return NextResponse.json({
      success: true,
      qrisSettings: qrisSettings ? {
        ...qrisSettings,
        apiKey: qrisSettings.apiKey ? '***' : '', // Hide sensitive data
        token: qrisSettings.token ? '***' : '',
      } : null,
    })
  } catch (error) {
    console.error('[QRIS Settings GET Error]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST/PUT - Create or update QRIS settings
export async function POST(request: NextRequest) {
  try {
    let { type, username, apiKey, token, merchantId, codeQr, userId } = await request.json()

    // Handle 'me' as current user
    if (userId === 'me') {
      const user = await getSession()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    }

    // Validate type
    if (!type || (type !== 'admin' && type !== 'user')) {
      return NextResponse.json(
        { error: 'Invalid type. Must be admin or user' },
        { status: 400 }
      )
    }

    // Validate for user QRIS - needs merchantId and codeQr at minimum
    if (type === 'user') {
      if (!userId) {
        return NextResponse.json(
          { error: 'userId required for user type' },
          { status: 400 }
        )
      }
      if (!merchantId || !codeQr) {
        return NextResponse.json(
          { error: 'Missing required fields for user QRIS: merchantId, codeQr' },
          { status: 400 }
        )
      }
      
      // For update, check if existing settings and use those values if not provided
      const existing = await getQrisSettings('user', userId)
      if (existing) {
        username = username || existing.username
        apiKey = apiKey || existing.apiKey
        token = token || existing.token
      }
    }

    // Validate for admin QRIS - needs all fields including username and apiKey
    if (type === 'admin') {
      if (!username || !apiKey || !token || !merchantId || !codeQr) {
        return NextResponse.json(
          { error: 'Missing required fields for admin QRIS: username, apiKey, token, merchantId, codeQr' },
          { status: 400 }
        )
      }
    }

    const qrisSettings = await createOrUpdateQrisSettings(
      type,
      {
        username: username || '',
        apiKey: apiKey || '',
        token: token || '',
        merchantId,
        codeQr,
        isActive: true,
      },
      type === 'user' ? userId : undefined
    )

    if (!qrisSettings) {
      return NextResponse.json(
        { error: 'Failed to save QRIS settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      qrisSettings: {
        ...qrisSettings,
        apiKey: '***', // Hide sensitive data
        token: '***',
      },
    })
  } catch (error) {
    console.error('[QRIS Settings POST Error]', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  return POST(request)
}

// DELETE - Remove user QRIS settings
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'admin' | 'user' || 'user'
    let userId = searchParams.get('userId')

    // Handle 'me' as current user
    if (userId === 'me') {
      const user = await getSession()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    }

    if (type === 'user' && !userId) {
      return NextResponse.json(
        { error: 'userId required for user type' },
        { status: 400 }
      )
    }

    const success = await deleteQrisSettings(type, userId || undefined)

    if (!success) {
      return NextResponse.json(
        { error: 'QRIS settings not found or failed to delete' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: 'QRIS settings deleted' })
  } catch (error) {
    console.error('[QRIS Settings DELETE Error]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
