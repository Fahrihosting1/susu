import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, createUser, createAccountActivity } from '@/lib/github-db'
import { hashPassword, createSession } from '@/lib/auth'

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

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const newUser = await createUser({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    })

    if (!newUser) {
      return NextResponse.json({ error: 'Gagal membuat akun' }, { status: 500 })
    }

    // Log registration activity
    await createAccountActivity({
      userId: newUser.id,
      action: 'register',
      details: `Pendaftaran akun baru: ${email}`,
    })

    // Create session
    await createSession(newUser.id)

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil dibuat',
      redirectUrl: '/dashboard',
    })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan. Silakan coba lagi.' }, { status: 500 })
  }
}
