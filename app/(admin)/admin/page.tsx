'use client'

import { useEffect, useState, useRef } from 'react'
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card'
import { NeoBadge } from '@/components/ui/neo-badge'
import { CreditCard, Users, ShoppingCart, TrendingUp, ArrowUpRight, ArrowDownRight, Bot, Terminal, Wallet, Activity, RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface BotInfo {
  id: string
  userId: string
  botName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface BotActivityLog {
  id: string
  botToken: string
  botName: string
  userId: string
  userName: string
  action: 'start' | 'menu' | 'order' | 'payment' | 'complete' | 'error' | 'spam_detected'
  telegramUserId: string
  telegramUsername?: string
  message?: string
  createdAt: string
}

interface ChartData {
  date: string
  orders: number
  revenue: number
}

interface FeeChartData {
  date: string
  fees: number
  count: number
}

interface AdminStats {
  totalUsers: number
  totalOrders: number
  completedOrders: number
  totalRevenue: number
  activePaymentMethods: number
  orkutEnabled: boolean
  midtransEnabled: boolean
  adminFeeBalance: number
  totalBots: number
  activeBots: number
  botList: BotInfo[]
  orderStats: ChartData[]
  feeStats: FeeChartData[]
}

const toRupiah = (num: number) => num.toLocaleString('id-ID')

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'start':
      return <Activity className="w-3 h-3 text-cyan-400" />
    case 'complete':
      return <CheckCircle className="w-3 h-3 text-emerald-400" />
    case 'error':
      return <XCircle className="w-3 h-3 text-red-400" />
    case 'spam_detected':
      return <AlertTriangle className="w-3 h-3 text-amber-400" />
    case 'payment':
      return <CreditCard className="w-3 h-3 text-violet-400" />
    case 'order':
      return <ShoppingCart className="w-3 h-3 text-blue-400" />
    default:
      return <Clock className="w-3 h-3 text-white/40" />
  }
}

const getActionColor = (action: string) => {
  switch (action) {
    case 'start':
      return 'text-cyan-400'
    case 'complete':
      return 'text-emerald-400'
    case 'error':
      return 'text-red-400'
    case 'spam_detected':
      return 'text-amber-400'
    case 'payment':
      return 'text-violet-400'
    case 'order':
      return 'text-blue-400'
    default:
      return 'text-white/60'
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<BotActivityLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await fetch('/api/admin/bot-logs?limit=100')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchLogs()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLogs()
      }, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      change: '+12%',
      trend: 'up',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      title: 'Completed Orders',
      value: stats?.completedOrders || 0,
      icon: ShoppingCart,
      change: `${stats?.totalOrders || 0} total`,
      trend: 'neutral',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      title: 'Total Revenue',
      value: `Rp ${toRupiah(stats?.totalRevenue || 0)}`,
      icon: TrendingUp,
      change: '+23%',
      trend: 'up',
      gradient: 'from-emerald-500 to-green-600',
    },
    {
      title: 'Admin Fee Balance',
      value: `Rp ${toRupiah(stats?.adminFeeBalance || 0)}`,
      icon: Wallet,
      change: 'From Midtrans',
      trend: 'up',
      gradient: 'from-amber-500 to-orange-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your payment platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div
            key={stat.title}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl" 
              style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }} 
            />
            <NeoCard className="relative bg-card backdrop-blur-xl border border-border hover:border-border/80 transition-all duration-300">
              <NeoCardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    stat.trend === 'up' ? 'text-emerald-600' : stat.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {stat.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                    {stat.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <NeoCard className="bg-card backdrop-blur-xl border border-border">
          <NeoCardHeader>
            <NeoCardTitle className="text-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              Orders (7 Days)
            </NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            <div className="h-[200px]">
              {loading ? (
                <div className="w-full h-full bg-muted rounded animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.orderStats || []}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="date" tickFormatter={formatDate} stroke="#ffffff40" fontSize={12} />
                    <YAxis stroke="#ffffff40" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                      itemStyle={{ color: '#10b981' }}
                      formatter={(value: number) => [`${value} orders`, 'Orders']}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Area type="monotone" dataKey="orders" stroke="#10b981" fillOpacity={1} fill="url(#colorOrders)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </NeoCardContent>
        </NeoCard>

        {/* Fee Income Chart */}
        <NeoCard className="bg-card backdrop-blur-xl border border-border">
          <NeoCardHeader>
            <NeoCardTitle className="text-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-amber-600" />
              </div>
              Fee Income (7 Days)
            </NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            <div className="h-[200px]">
              {loading ? (
                <div className="w-full h-full bg-muted rounded animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.feeStats || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="date" tickFormatter={formatDate} stroke="#ffffff40" fontSize={12} />
                    <YAxis stroke="#ffffff40" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                      itemStyle={{ color: '#f59e0b' }}
                      formatter={(value: number) => [`Rp ${toRupiah(value)}`, 'Fee']}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Bar dataKey="fees" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </NeoCardContent>
        </NeoCard>
      </div>

      {/* Bot Terminal & Active Bots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Console */}
        <NeoCard className="lg:col-span-2 bg-card backdrop-blur-xl border border-border">
          <NeoCardHeader className="flex flex-row items-center justify-between">
            <NeoCardTitle className="text-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-violet-600" />
              </div>
              Bot Activity Terminal
            </NeoCardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-xs ${autoRefresh ? 'text-emerald-600' : 'text-muted-foreground'}`}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Live' : 'Auto'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchLogs}
                disabled={logsLoading}
                className="text-xs text-muted-foreground"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${logsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </NeoCardHeader>
          <NeoCardContent>
            <div className="bg-slate-900 rounded-lg border border-slate-700 font-mono text-xs">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700 bg-slate-800">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-slate-400">bot-monitor@admin ~ </span>
              </div>
              <ScrollArea className="h-[300px] p-3">
                {logs.length === 0 ? (
                  <div className="text-slate-400 text-center py-8">
                    No activity logs yet. Bot activities will appear here.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 text-[11px] leading-relaxed">
                        <span className="text-slate-500 shrink-0">[{formatTime(log.createdAt)}]</span>
                        <span className="shrink-0">{getActionIcon(log.action)}</span>
                        <span className={`shrink-0 uppercase font-semibold ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-cyan-400 shrink-0">{log.botName}</span>
                        <span className="text-slate-500">-</span>
                        <span className="text-slate-300 break-all">{log.message}</span>
                        {log.telegramUsername && (
                          <span className="text-violet-400">@{log.telegramUsername}</span>
                        )}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </ScrollArea>
            </div>
          </NeoCardContent>
        </NeoCard>

        {/* Active Bots */}
        <NeoCard className="bg-card backdrop-blur-xl border border-border">
          <NeoCardHeader>
            <NeoCardTitle className="text-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-cyan-600" />
              </div>
              Active Bots
            </NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted border border-border">
              <div>
                <p className="text-muted-foreground text-sm">Total Bots</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalBots || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Active</p>
                <p className="text-2xl font-bold text-emerald-600">{stats?.activeBots || 0}</p>
              </div>
            </div>
            <ScrollArea className="h-[240px]">
              <div className="space-y-2">
                {(stats?.botList || []).length === 0 ? (
                  <div className="text-muted-foreground text-center py-8 text-sm">
                    No bots registered yet.
                  </div>
                ) : (
                  (stats?.botList || []).map((bot) => (
                    <div
                      key={bot.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${bot.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                        <div>
                          <p className="text-foreground font-medium text-sm">{bot.botName}</p>
                          <p className="text-muted-foreground text-xs">ID: {bot.userId.slice(0, 8)}...</p>
                        </div>
                      </div>
                      <NeoBadge variant={bot.isActive ? 'success' : 'secondary'} className="text-xs">
                        {bot.isActive ? 'Active' : 'Inactive'}
                      </NeoBadge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </NeoCardContent>
        </NeoCard>
      </div>

      {/* Payment Methods Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NeoCard className="bg-card backdrop-blur-xl border border-border">
          <NeoCardHeader>
            <NeoCardTitle className="text-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-cyan-600" />
              </div>
              Payment Methods Status
            </NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OK</span>
                </div>
                <div>
                  <p className="text-foreground font-medium">Orkut QRIS</p>
                  <p className="text-muted-foreground text-sm">Order Kuota Payment</p>
                </div>
              </div>
              <NeoBadge variant={stats?.orkutEnabled ? 'success' : 'destructive'}>
                {loading ? '...' : stats?.orkutEnabled ? 'Active' : 'Inactive'}
              </NeoBadge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MT</span>
                </div>
                <div>
                  <p className="text-foreground font-medium">Midtrans QRIS</p>
                  <p className="text-muted-foreground text-sm">Midtrans Payment Gateway</p>
                </div>
              </div>
              <NeoBadge variant={stats?.midtransEnabled ? 'success' : 'destructive'}>
                {loading ? '...' : stats?.midtransEnabled ? 'Active' : 'Inactive'}
              </NeoBadge>
            </div>
          </NeoCardContent>
        </NeoCard>

        {/* Quick Actions */}
        <NeoCard className="bg-card backdrop-blur-xl border border-border">
          <NeoCardHeader>
            <NeoCardTitle className="text-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-violet-600" />
              </div>
              Quick Actions
            </NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent className="space-y-3">
            <a 
              href="/admin/payments"
              className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border hover:bg-muted/80 hover:border-border/80 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-cyan-600" />
                <span className="text-foreground font-medium">Configure Payment Methods</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>
            <a 
              href="/admin/users"
              className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border hover:bg-muted/80 hover:border-border/80 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-violet-600" />
                <span className="text-foreground font-medium">Manage Users</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>
            <a 
              href="/admin/withdrawals"
              className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border hover:bg-muted/80 hover:border-border/80 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-amber-600" />
                <span className="text-foreground font-medium">Manage Withdrawals</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>
          </NeoCardContent>
        </NeoCard>
      </div>
    </div>
  )
}
