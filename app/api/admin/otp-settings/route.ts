import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isUserAdmin, getOtpSettings, saveOtpSettings } from '@/lib/github-db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(session.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = await getOtpSettings()
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error getting OTP settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(session.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { fromEmail, fromPass, isActive } = body

    if (!fromEmail || !fromPass) {
      return NextResponse.json({ error: 'Email dan App Password harus diisi' }, { status: 400 })
    }

    const settings = await saveOtpSettings({
      fromEmail,
      fromPass,
      isActive: isActive || false,
    })

    if (!settings) {
      return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error saving OTP settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
