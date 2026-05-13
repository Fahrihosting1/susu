import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME } from './constants'
import { getUserById } from './github-db'
import type { SessionUser } from '@/types'

// Simple session management using cookies
// In production, use a proper session library with encryption

export async function hashPassword(password: string): Promise<string> {
  // Simple hash for demo - in production use bcrypt
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'sewa-bot-salt-key')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hashed = await hashPassword(password)
  return hashed === hashedPassword
}

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies()
  // Simple session token - in production use JWT or encrypted session
  const sessionToken = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64')
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionToken) return null

  try {
    const session = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf-8'))
    
    if (session.exp < Date.now()) {
      await destroySession()
      return null
    }

    const user = await getUserById(session.userId)
    if (!user) return null

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...sessionUser } = user
    return sessionUser
  } catch {
    return null
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await getSession()
  if (!session) return false
  
  // Check if user has admin role
  if (session.role === 'admin') return true
  
  // Check if user email is in ADMIN_EMAILS env var
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  if (adminEmails.includes(session.email.toLowerCase())) return true
  
  return false
}
