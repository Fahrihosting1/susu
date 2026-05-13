'use client'

import { useEffect, useState } from 'react'
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card'
import { NeoBadge } from '@/components/ui/neo-badge'
import { 
  Crown, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Wallet,
  CreditCard,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  Search
} from 'lucide-react'
import { NeoInput } from '@/components/ui/neo-input'
import { NeoButton } from '@/components/ui/neo-button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import type { BotSubscription } from '@/types'

interface SubscriptionStats {
  totalSubscriptions: number
  activeSubscriptions: number
  pendingSubscriptions: number
  expiredSubscriptions: number
  totalRevenue: number
  monthlyStats: { month: string; count: number; revenue: number }[]
  paymentMethods: { saldo: number; qris: number }
}

const toRupiah = (num: number) => num.toLocaleString('id-ID')

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatShortDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const PIE_COLORS = ['#10b981', '#3b82f6']

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<BotSubscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'expired'>('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/subscriptions')
      if (res.ok) {
        const data = await res.json()
        setSubscriptions(data.subscriptions || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Check if subscription is actually expired
  const getActualStatus = (sub: BotSubscription): 'active' | 'pending' | 'expired' => {
    if (sub.status === 'pending') return 'pending'
    if (sub.status === 'active' && sub.endDate && new Date(sub.endDate) <= new Date()) {
      return 'expired'
    }
    return sub.status as 'active' | 'expired'
  }

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    
    const actualStatus = getActualStatus(sub)
    const matchesStatus = filterStatus === 'all' || actualStatus === filterStatus
    
    return matchesSearch && matchesStatus
  })

  // Prepare pie chart data
  const pieData = stats ? [
    { name: 'Saldo', value: stats.paymentMethods.saldo },
    { name: 'QRIS', value: stats.paymentMethods.qris }
  ].filter(d => d.value > 0) : []

  const statsCards = [
    {
      title: 'Total Langganan',
      value: stats?.totalSubscriptions || 0,
      icon: Crown,
      gradient: 'from-violet-500 to-purple-600',
      trend: null
    },
    {
      title: 'Aktif',
      value: stats?.activeSubscriptions || 0,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-green-600',
      trend: 'up'
    },
    {
      title: 'Pending',
      value: stats?.pendingSubscriptions || 0,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      trend: null
    },
    {
      title: 'Total Pendapatan',
      value: `Rp ${toRupiah(stats?.totalRevenue || 0)}`,
      icon: Wallet,
      gradient: 'from-cyan-500 to-blue-600',
      trend: 'up'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-500" />
            Bot VIP Subscriptions
          </h1>
          <p className="text-muted-foreground mt-1">Riwayat pembelian langganan bot VIP</p>
        </div>
        <NeoButton
          variant="outline"
          onClick={fetchData}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </NeoButton>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div key={stat.title} className="relative group">
            <NeoCard className="bg-card backdrop-blur-xl border border-border hover:border-border/80 transition-all duration-300">
              <NeoCardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  {stat.trend && (
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-muted-foreground text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {loading ? (
                      <span className="inline-block w-20 h-7 bg-muted rounded animate-pulse" />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
              </NeoCardContent>
            </NeoCard>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <NeoCard className="lg:col-span-2 bg-card backdrop-blur-xl border border-border">
          <NeoCardHeader>
            <NeoCardTitle className="text-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              Pendapatan Langganan (6 Bulan)
            </NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            <div className="h-[250px]">
              {loading ? (
                <div className="w-full h-full bg-muted rounded animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.monthlyStats || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      labelStyle={{ color: '#111827' }}
                      itemStyle={{ color: '#10b981' }}
                      formatter={(value: number) => [`Rp ${toRupiah(value)}`, 'Pendapatan']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </NeoCardContent>
        </NeoCard>

        {/* Payment Methods Pie Chart */}
        <NeoCard className="bg-card backdrop-blur-xl border border-border">
          <NeoCardHeader>
            <NeoCardTitle className="text-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              Metode Pembayaran
            </NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            <div className="h-[200px]">
              {loading ? (
                <div className="w-full h-full bg-muted rounded animate-pulse" />
              ) : pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      formatter={(value: number, name: string) => [`${value} transaksi`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Belum ada data
                </div>
              )}
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-muted-foreground">Saldo ({stats?.paymentMethods.saldo || 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-muted-foreground">QRIS ({stats?.paymentMethods.qris || 0})</span>
              </div>
            </div>
          </NeoCardContent>
        </NeoCard>
      </div>

      {/* Subscriptions per Month Bar Chart */}
      <NeoCard className="bg-card backdrop-blur-xl border border-border">
        <NeoCardHeader>
          <NeoCardTitle className="text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            Jumlah Langganan per Bulan
          </NeoCardTitle>
        </NeoCardHeader>
        <NeoCardContent>
          <div className="h-[200px]">
            {loading ? (
              <div className="w-full h-full bg-muted rounded animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.monthlyStats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    labelStyle={{ color: '#111827' }}
                    itemStyle={{ color: '#8b5cf6' }}
                    formatter={(value: number) => [`${value} langganan`, 'Jumlah']}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </NeoCardContent>
      </NeoCard>

      {/* Subscription History Table */}
      <NeoCard className="bg-card backdrop-blur-xl border border-border">
        <NeoCardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <NeoCardTitle className="text-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              Riwayat Langganan
            </NeoCardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <NeoInput
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-[250px]"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'active', 'pending', 'expired'] as const).map((status) => (
                  <NeoButton
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                    className={filterStatus === status ? '' : 'text-muted-foreground'}
                  >
                    {status === 'all' ? 'Semua' : status === 'active' ? 'Aktif' : status === 'pending' ? 'Pending' : 'Expired'}
                  </NeoButton>
                ))}
              </div>
            </div>
          </div>
        </NeoCardHeader>
        <NeoCardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <Crown className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Tidak ada langganan yang cocok dengan filter'
                  : 'Belum ada riwayat langganan'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredSubscriptions.map((sub) => {
                  const actualStatus = getActualStatus(sub)
                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl bg-muted border border-border hover:border-border/80 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg">
                            <Crown className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-foreground font-semibold">{sub.userName}</p>
                            <p className="text-muted-foreground text-sm">{sub.userEmail}</p>
                            <p className="text-muted-foreground text-xs mt-1">
                              Dibuat: {formatDate(sub.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                          <div className="flex flex-col items-start lg:items-end">
                            <span className="text-muted-foreground text-xs">Harga</span>
                            <span className="text-emerald-600 font-bold">Rp {toRupiah(sub.price)}</span>
                          </div>
                          <div className="flex flex-col items-start lg:items-end">
                            <span className="text-muted-foreground text-xs">Metode</span>
                            <NeoBadge variant={sub.paymentMethod === 'saldo' ? 'success' : 'info'} className="capitalize">
                              {sub.paymentMethod === 'saldo' ? (
                                <><Wallet className="w-3 h-3 mr-1" /> Saldo</>
                              ) : (
                                <><CreditCard className="w-3 h-3 mr-1" /> QRIS</>
                              )}
                            </NeoBadge>
                          </div>
                          <div className="flex flex-col items-start lg:items-end">
                            <span className="text-muted-foreground text-xs">Status</span>
                            <NeoBadge 
                              variant={
                                actualStatus === 'active' ? 'success' : 
                                actualStatus === 'pending' ? 'warning' : 
                                'destructive'
                              }
                            >
                              {actualStatus === 'active' ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Aktif</>
                              ) : actualStatus === 'pending' ? (
                                <><Clock className="w-3 h-3 mr-1" /> Pending</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" /> Expired</>
                              )}
                            </NeoBadge>
                          </div>
                        </div>
                      </div>
                      {(sub.startDate || sub.endDate) && (
                        <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-4 text-sm">
                          {sub.startDate && (
                            <div>
                              <p className="text-muted-foreground text-xs">Mulai</p>
                              <p className="text-foreground font-medium">{formatShortDate(sub.startDate)}</p>
                            </div>
                          )}
                          {sub.endDate && (
                            <div>
                              <p className="text-muted-foreground text-xs">Berakhir</p>
                              <p className={`font-medium ${new Date(sub.endDate) <= new Date() ? 'text-red-600' : 'text-foreground'}`}>
                                {formatShortDate(sub.endDate)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </NeoCardContent>
      </NeoCard>
    </div>
  )
}
