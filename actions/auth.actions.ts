'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createUser, getUserByEmail, createAccountActivity } from '@/lib/github-db'
import { hashPassword, verifyPassword, createSession, destroySession, getSession } from '@/lib/auth'

export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!name || !email || !password) {
    return { error: 'Semua field harus diisi' }
  }

  if (password !== confirmPassword) {
    return { error: 'Password tidak cocok' }
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    return { error: 'Email sudah terdaftar' }
  }

  const hashedPassword = await hashPassword(password)
  const user = await createUser({
    name,
    email,
    password: hashedPassword,
  })

  if (!user) {
    return { error: 'Gagal membuat akun. Silakan coba lagi.' }
  }

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
    details: 'Akun baru dibuat',
  })

  await createSession(user.id)
  redirect('/dashboard')
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email dan password harus diisi' }
  }

  const user = await getUserByEmail(email)
  if (!user) {
    return { error: 'Email atau password salah' }
  }

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return { error: 'Email atau password salah' }
  }

  // Get device info
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || 'Unknown'
  const forwarded = headersList.get('x-forwarded-for')
  const ipAddress = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'Unknown'

  // Log login activity
  await createAccountActivity({
    userId: user.id,
    action: 'login',
    ipAddress,
    userAgent,
    deviceInfo: parseUserAgent(userAgent),
    details: 'Login berhasil',
  })

  await createSession(user.id)
  redirect('/dashboard')
}

export async function logoutAction() {
  const session = await getSession()
  
  if (session) {
    // Get device info
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    const forwarded = headersList.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'Unknown'

    // Log logout activity
    await createAccountActivity({
      userId: session.id,
      action: 'logout',
      ipAddress,
      userAgent,
      deviceInfo: parseUserAgent(userAgent),
      details: 'Logout dari akun',
    })
  }
  
  await destroySession()
  redirect('/login')
}

// Helper function to parse user agent
function parseUserAgent(ua: string): string {
  if (!ua) return 'Unknown Device'
  
  // Detect OS
  let os = 'Unknown OS'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  
  // Detect Browser
  let browser = 'Unknown Browser'
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'
  
  return `${browser} on ${os}`
}
