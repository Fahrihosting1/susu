import { redirect } from 'next/navigation'
import { Package, ShoppingCart, DollarSign, Bot, TrendingUp, Clock, CreditCard, Database } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { getDashboardStats, getOrders } from '@/lib/github-db'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card'
import { NeoBadge } from '@/components/ui/neo-badge'
import { ORDER_STATUS } from '@/lib/constants'
import Link from 'next/link'
import { NeoButton } from '@/components/ui/neo-button'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const PAYMENT_STATUS = {
  unpaid: { label: 'Belum Dibayar', variant: 'warning' as const },
  pending: { label: 'Pending', variant: 'warning' as const },
  paid: { label: 'Terbayar', variant: 'success' as const },
  expired: { label: 'Expired', variant: 'destructive' as const },
  failed: { label: 'Gagal', variant: 'destructive' as const },
}

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const stats = await getDashboardStats(session.id)
  const orders = await getOrders(session.id)
  const recentOrders = orders.slice(-5).reverse()

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="animate-slide-down">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Ringkasan aktivitas bot Anda</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Produk"
          value={stats.totalProducts}
          icon={Package}
          variant="primary"
          description={`${stats.activeProducts} produk aktif`}
          animationDelay={50}
        />
        <StatsCard
          title="Total Stok"
          value={stats.totalStock}
          icon={Database}
          variant="accent"
          description="Akun tersedia"
          animationDelay={75}
        />
        <StatsCard
          title="Total Pesanan"
          value={stats.totalOrders}
          icon={ShoppingCart}
          variant="secondary"
          description={`${stats.pendingOrders} menunggu proses`}
          animationDelay={100}
        />
        <StatsCard
          title="Pendapatan"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          variant="success"
          description={`${stats.completedOrders} pesanan selesai`}
          animationDelay={150}
        />
        <StatsCard
          title="Status Bot"
          value={stats.isBotActive ? 'Aktif' : 'Nonaktif'}
          icon={Bot}
          variant={stats.isBotActive ? 'accent' : 'warning'}
          description={stats.isBotActive ? 'Bot berjalan normal' : 'Konfigurasi diperlukan'}
          animationDelay={200}
        />
      </div>

      {/* Quick Actions */}
      <NeoCard className="animate-slide-up" style={{ animationDelay: '250ms' }}>
        <NeoCardHeader>
          <NeoCardTitle>Aksi Cepat</NeoCardTitle>
        </NeoCardHeader>
        <NeoCardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/products/new">
              <NeoButton variant="default" className="hover:scale-105 active:scale-95 transition-transform">
                <Package className="w-5 h-5" />
                Tambah Produk
              </NeoButton>
            </Link>
            <Link href="/dashboard/orders">
              <NeoButton variant="secondary" className="hover:scale-105 active:scale-95 transition-transform">
                <ShoppingCart className="w-5 h-5" />
                Lihat Pesanan
              </NeoButton>
            </Link>
            <Link href="/dashboard/settings">
              <NeoButton variant="outline" className="hover:scale-105 active:scale-95 transition-transform">
                <Bot className="w-5 h-5" />
                Pengaturan Bot
              </NeoButton>
            </Link>
          </div>
        </NeoCardContent>
      </NeoCard>

      {/* Recent Orders & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NeoCard>
          <NeoCardHeader>
            <NeoCardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pesanan Terbaru
            </NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada pesanan</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentOrders.map((order) => (
                  <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/70 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{order.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.buyerName} - {formatDate(order.createdAt)}
                        </p>
                        {order.paymentStatus && (
                          <div className="flex items-center gap-2 mt-2">
                            <CreditCard className="w-3 h-3 text-muted-foreground" />
                            <NeoBadge
                              variant={
                                PAYMENT_STATUS[order.paymentStatus as keyof typeof PAYMENT_STATUS]
                                  ?.variant || 'default'
                              }
                              className="text-xs"
                            >
                              {
                                PAYMENT_STATUS[order.paymentStatus as keyof typeof PAYMENT_STATUS]
                                  ?.label || order.paymentStatus
                              }
                            </NeoBadge>
                          </div>
                        )}
                      </div>
                      <NeoBadge
                        variant={
                          order.status === 'completed'
                            ? 'success'
                            : order.status === 'pending'
                            ? 'warning'
                            : order.status === 'cancelled'
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {ORDER_STATUS[order.status].label}
                      </NeoBadge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </NeoCardContent>
        </NeoCard>

        <NeoCard>
          <NeoCardHeader>
            <NeoCardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Statistik
            </NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Total Stok Akun</span>
                  <span className="text-sm font-semibold text-accent">{stats.totalStock} akun</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all" style={{ width: stats.totalStock > 0 ? '100%' : '0%', minWidth: stats.totalStock > 0 ? '8px' : '0px' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Produk Aktif</span>
                  <span className="text-sm font-semibold text-primary">{stats.activeProducts}/{stats.totalProducts}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all" style={{ width: `${Math.min((stats.activeProducts / Math.max(stats.totalProducts, 1)) * 100, 100)}%`, minWidth: '8px' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Pesanan Selesai</span>
                  <span className="text-sm font-semibold text-success">{stats.completedOrders}/{stats.totalOrders}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-success to-success/70 rounded-full transition-all" style={{ width: `${Math.min((stats.completedOrders / Math.max(stats.totalOrders, 1)) * 100, 100)}%`, minWidth: '8px' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Pesanan Pending</span>
                  <span className="text-sm font-semibold text-warning">{stats.pendingOrders}/{stats.totalOrders}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-warning to-warning/70 rounded-full transition-all" style={{ width: `${Math.min((stats.pendingOrders / Math.max(stats.totalOrders, 1)) * 100, 100)}%`, minWidth: '8px' }} />
                </div>
              </div>
            </div>
          </NeoCardContent>
        </NeoCard>
      </div>
    </div>
  )
}
