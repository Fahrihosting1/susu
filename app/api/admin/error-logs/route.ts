import { NextResponse } from 'next/server'
import { isCurrentUserAdmin, getSession } from '@/lib/auth'
import { getErrorLogs, updateErrorLog, getErrorStats, createErrorLog } from '@/lib/github-db'
import type { ErrorLog } from '@/types'

// GET - Get all error logs (admin only)
export async function GET(request: Request) {
  try {
    const isAdmin = await isCurrentUserAdmin()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const status = searchParams.get('status') as ErrorLog['status'] | null
    const type = searchParams.get('type') as ErrorLog['type'] | null
    const severity = searchParams.get('severity') as ErrorLog['severity'] | null
    const userId = searchParams.get('userId')
    const getStats = searchParams.get('stats') === 'true'

    if (getStats) {
      const stats = await getErrorStats()
      return NextResponse.json({ stats })
    }

    const logs = await getErrorLogs({
      limit,
      status: status || undefined,
      type: type || undefined,
      severity: severity || undefined,
      userId: userId || undefined,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching error logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update error log status (admin only)
export async function PATCH(request: Request) {
  try {
    const isAdmin = await isCurrentUserAdmin()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, resolvedNote } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const updateData: Partial<Pick<ErrorLog, 'status' | 'resolvedAt' | 'resolvedBy' | 'resolvedNote'>> = {
      status,
    }

    if (status === 'resolved') {
      updateData.resolvedAt = new Date().toISOString()
      updateData.resolvedBy = user.name
      updateData.resolvedNote = resolvedNote
    }

    const updated = await updateErrorLog(id, updateData)

    if (!updated) {
      return NextResponse.json({ error: 'Error log not found' }, { status: 404 })
    }

    return NextResponse.json({ log: updated })
  } catch (error) {
    console.error('Error updating error log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new error log (can be called from anywhere)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      userId, 
      userName, 
      userEmail, 
      type, 
      severity, 
      source, 
      message, 
      stackTrace, 
      metadata,
      isSensitive = false 
    } = body

    if (!type || !severity || !source || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const log = await createErrorLog({
      userId,
      userName,
      userEmail,
      type,
      severity,
      source,
      message,
      stackTrace,
      metadata,
      isSensitive,
    })

    if (!log) {
      return NextResponse.json({ error: 'Failed to create error log' }, { status: 500 })
    }

    return NextResponse.json({ log })
  } catch (error) {
    console.error('Error creating error log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
