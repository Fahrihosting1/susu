import { NextResponse } from 'next/server'
import { getSession, isCurrentUserAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const isAdmin = await isCurrentUserAdmin()

    return NextResponse.json({
      user: session,
      isAdmin,
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
