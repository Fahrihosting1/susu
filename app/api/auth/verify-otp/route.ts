import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createUser, getUserByEmail, createAccountActivity } from '@/lib/github-db'
import { hashPassword, createSession } from '@/lib/auth'
import { verifyOtp, deleteOtp } from '@/lib/otp-store'

// Helper function to parse user agent
function parseUserAgent(ua: string): string {
  if (!ua) return 'Unknown Device'
  
  let os = 'Unknown OS'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  
  let browser = 'Unknown Browser'
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'
  
  return `${browser} on ${os}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = body

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email dan OTP harus diisi' }, { status: 400 })
    }

    // Verify OTP
    const result = verifyOtp(email, otp)
    
    if (!result.valid || !result.userData) {
      return NextResponse.json({ error: result.error || 'Verifikasi gagal' }, { status: 400 })
    }

    const { name, password } = result.userData

    // Double check email not registered
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      deleteOtp(email)
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)
    const user = await createUser({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    })

    if (!user) {
      return NextResponse.json({ error: 'Gagal membuat akun. Silakan coba lagi.' }, { status: 500 })
    }

    // Clear OTP
    deleteOtp(email)

    // Get device info
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    const forwarded = headersList.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'Unknown'

    // Log register activity
    await createAccountActivity({
      userId: user.id,
      action: 'register',
      ipAddress,
      userAgent,
      deviceInfo: parseUserAgent(userAgent),
      details: 'Akun baru dibuat (verifikasi email)',
    })

    // Create session
    await createSession(user.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Akun berhasil dibuat',
      redirectUrl: '/dashboard'
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan. Silakan coba lagi.' }, { status: 500 })
  }
}
