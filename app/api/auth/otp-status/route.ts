import { NextResponse } from 'next/server'
import { getOtpSettings } from '@/lib/github-db'

export async function GET() {
  try {
    const settings = await getOtpSettings()
    
    return NextResponse.json({
      enabled: settings?.isActive || false,
    })
  } catch (error) {
    console.error('Error checking OTP status:', error)
    return NextResponse.json({ enabled: false })
  }
}
