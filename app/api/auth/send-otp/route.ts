import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, getOtpSettings } from '@/lib/github-db'
import { generateOTP, setOtp } from '@/lib/otp-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
    }

    // Check if email already registered
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 })
    }

    // Get OTP settings from database
    const otpSettings = await getOtpSettings()
    
    if (!otpSettings || !otpSettings.isActive) {
      return NextResponse.json({ error: 'Fitur verifikasi OTP belum diaktifkan oleh admin' }, { status: 503 })
    }

    if (!otpSettings.fromEmail || !otpSettings.fromPass) {
      return NextResponse.json({ error: 'Konfigurasi email OTP belum lengkap' }, { status: 503 })
    }

    // Generate OTP
    const otp = generateOTP()

    // Store OTP with user data
    setOtp(email, otp, { name, email, password })

    // Send OTP via email API
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Verifikasi Email Anda</h2>
          <p style="color: #666;">Halo <strong>${name}</strong>,</p>
          <p style="color: #666;">Gunakan kode OTP berikut untuk menyelesaikan pendaftaran akun Anda:</p>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0;">
            <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 10px;">${otp}</span>
          </div>
          <p style="color: #666; text-align: center;">Kode ini berlaku selama <strong>5 menit</strong>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">Jika Anda tidak meminta kode ini, abaikan email ini.</p>
          <p style="color: #999; font-size: 12px; text-align: center;">Bot Rental Platform</p>
        </div>
      </div>
    `

    const emailUrl = new URL('https://otp-app-coral.vercel.app/api/send-email')
    emailUrl.searchParams.set('to', email)
    emailUrl.searchParams.set('from_email', otpSettings.fromEmail)
    emailUrl.searchParams.set('from_pass', otpSettings.fromPass)
    emailUrl.searchParams.set('subject', `Kode OTP Pendaftaran: ${otp}`)
    emailUrl.searchParams.set('html', htmlContent)

    const emailResponse = await fetch(emailUrl.toString())
    
    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Email API error:', errorText)
      return NextResponse.json({ error: 'Gagal mengirim OTP. Pastikan email valid dan coba lagi.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Kode OTP telah dikirim ke email Anda',
      expiresIn: 300 // 5 minutes in seconds
    })

  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan. Silakan coba lagi.' }, { status: 500 })
  }
}
