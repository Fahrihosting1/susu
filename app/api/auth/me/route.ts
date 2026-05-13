import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserSubscription } from '@/lib/github-db'

export async function GET() {
  const user = await getSession()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has active subscription
  const subscription = await getUserSubscription(user.id)
  const hasActiveSubscription = !!subscription

  return NextResponse.json({ 
    user: {
      ...user,
      hasActiveSubscription,
      subscriptionEndDate: subscription?.endDate || null
    }
  })
}
