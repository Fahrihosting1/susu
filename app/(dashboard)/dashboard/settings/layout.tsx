import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock, Bot, Sparkles } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { getUserSubscription } from '@/lib/github-db'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoCard, NeoCardContent } from '@/components/ui/neo-card'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Check subscription
  const subscription = await getUserSubscription(session.id)
  const isSubscribed = subscription && subscription.status === 'active' && 
    subscription.endDate && new Date(subscription.endDate) > new Date()

  if (!isSubscribed) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <NeoCard className="max-w-md w-full bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30">
          <NeoCardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Fitur Premium</h2>
            <p className="text-muted-foreground mb-6">
              Untuk mengakses fitur Settings Bot, Anda perlu berlangganan Auto Bot Order terlebih dahulu.
            </p>
            <div className="p-4 rounded-xl bg-background/50 border border-border mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-primary" />
                <span className="font-semibold">Sewa Auto Bot Order</span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-bold text-primary">Rp 25.000</span>
                <span className="text-muted-foreground text-sm">/ 3 bulan</span>
              </div>
            </div>
            <Link href="/dashboard/subscription">
              <NeoButton className="w-full" size="lg">
                <Sparkles className="w-4 h-4" />
                Berlangganan Sekarang
              </NeoButton>
            </Link>
          </NeoCardContent>
        </NeoCard>
      </div>
    )
  }

  return <>{children}</>
}
