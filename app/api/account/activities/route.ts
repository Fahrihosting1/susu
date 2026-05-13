import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAccountActivities } from '@/lib/github-db'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activities = await getAccountActivities(session.id, 50)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Account activities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
