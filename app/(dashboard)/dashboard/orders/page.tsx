import { redirect } from 'next/navigation'
import { ShoppingCart, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { getOrders } from '@/lib/github-db'
import { NeoCard, NeoCardContent } from '@/components/ui/neo-card'
import { OrderTable } from '@/components/orders/OrderTable'
import { StatsCard } from '@/components/dashboard/StatsCard'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default async function OrdersPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const orders = await getOrders(session.id)
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalPrice, 0),
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">Pesanan</h1>
        <p className="text-muted-foreground">Kelola pesanan dari pelanggan</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Pesanan"
          value={stats.total}
          icon={ShoppingCart}
          variant="primary"
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Selesai"
          value={stats.completed}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="Pendapatan"
          value={formatCurrency(stats.revenue)}
          icon={CheckCircle}
          variant="accent"
        />
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <NeoCard className="bg-muted">
          <NeoCardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-secondary neo-border flex items-center justify-center mb-4">
              <ShoppingCart className="w-10 h-10 text-secondary-foreground" />
            </div>
            <h3 className="font-black text-lg uppercase mb-2">Belum Ada Pesanan</h3>
            <p className="text-muted-foreground">
              Pesanan akan muncul di sini ketika pelanggan memesan melalui bot
            </p>
          </NeoCardContent>
        </NeoCard>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan <span className="font-bold">{orders.length}</span> pesanan
            </p>
          </div>
          
          <OrderTable orders={sortedOrders} />
        </div>
      )}
    </div>
  )
}
