import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/auth'
import { getBotActivityLogs } from '@/lib/github-db'

export async function GET(request: Request) {
  try {
    const isAdmin = await isCurrentUserAdmin()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')

    const logs = await getBotActivityLogs(limit)

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Bot logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
