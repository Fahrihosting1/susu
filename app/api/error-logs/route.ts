import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserErrorLogs } from '@/lib/github-db'
import type { ErrorLog } from '@/types'

// GET - Get error logs for current user (non-sensitive only)
export async function GET(request: Request) {
  try {
    const user = await getSession()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') as ErrorLog['status'] | null

    const logs = await getUserErrorLogs(user.id, {
      limit,
      status: status || undefined,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching user error logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
