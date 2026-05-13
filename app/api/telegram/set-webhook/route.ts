import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getBotSettings } from '@/lib/github-db'

const TELEGRAM_API = 'https://api.telegram.org/bot'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getBotSettings(session.id)
    if (!settings || !settings.botToken) {
      return NextResponse.json({ error: 'Bot token belum dikonfigurasi' }, { status: 400 })
    }

    // Get the webhook URL from request body or generate from host
    const body = await request.json().catch(() => ({}))
    let webhookUrl = body.webhookUrl

    if (!webhookUrl) {
      // Check for VERCEL_URL or NEXT_PUBLIC_APP_URL environment variables first
      const vercelUrl = process.env.VERCEL_URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL
      
      let host: string
      
      if (appUrl) {
        // Use configured app URL (without protocol)
        host = appUrl.replace(/^https?:\/\//, '')
      } else if (vercelUrl) {
        // Use Vercel deployment URL
        host = vercelUrl
      } else {
        // Fallback to request host
        host = request.headers.get('host') || 'localhost:3000'
      }
      
      // Always use HTTPS for production (Telegram requires HTTPS)
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
      if (isLocalhost) {
        return NextResponse.json({ 
          error: 'Webhook tidak bisa dipasang dari localhost. Deploy aplikasi ke Vercel terlebih dahulu, atau set NEXT_PUBLIC_APP_URL dengan domain production.' 
        }, { status: 400 })
      }
      
      webhookUrl = `https://${host}/api/telegram/webhook?token=${settings.botToken}`
    }
    
    console.log('[v0] Setting webhook URL:', webhookUrl)

    // Set webhook on Telegram
    const response = await fetch(`${TELEGRAM_API}${settings.botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      }),
    })

    const result = await response.json()

    if (!result.ok) {
      return NextResponse.json({ 
        error: `Telegram API error: ${result.description}` 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook berhasil dipasang!',
      webhookUrl 
    })
  } catch (error) {
    console.error('[v0] Set webhook error:', error)
    return NextResponse.json({ error: 'Gagal memasang webhook' }, { status: 500 })
  }
}

// GET to check current webhook status
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getBotSettings(session.id)
    if (!settings || !settings.botToken) {
      return NextResponse.json({ error: 'Bot token belum dikonfigurasi' }, { status: 400 })
    }

    // Get webhook info from Telegram
    const response = await fetch(`${TELEGRAM_API}${settings.botToken}/getWebhookInfo`)
    const result = await response.json()

    if (!result.ok) {
      return NextResponse.json({ 
        error: `Telegram API error: ${result.description}` 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      webhookInfo: result.result
    })
  } catch (error) {
    console.error('[v0] Get webhook info error:', error)
    return NextResponse.json({ error: 'Gagal mengambil info webhook' }, { status: 500 })
  }
}

// DELETE to remove webhook
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getBotSettings(session.id)
    if (!settings || !settings.botToken) {
      return NextResponse.json({ error: 'Bot token belum dikonfigurasi' }, { status: 400 })
    }

    // Delete webhook on Telegram
    const response = await fetch(`${TELEGRAM_API}${settings.botToken}/deleteWebhook`)
    const result = await response.json()

    if (!result.ok) {
      return NextResponse.json({ 
        error: `Telegram API error: ${result.description}` 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook berhasil dihapus!'
    })
  } catch (error) {
    console.error('[v0] Delete webhook error:', error)
    return NextResponse.json({ error: 'Gagal menghapus webhook' }, { status: 500 })
  }
}
