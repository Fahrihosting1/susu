'use client'

import { useEffect, useState } from 'react'
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoBadge } from '@/components/ui/neo-badge'
import { NeoInput } from '@/components/ui/neo-input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowDownToLine, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Wallet,
  Users,
  TrendingDown,
  Eye,
  User,
  ShoppingBag,
  Banknote
} from 'lucide-react'
import { BANK_LABELS, type Withdrawal } from '@/types'
import { PaymentLogo } from '@/components/ui/payment-logos'

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
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_CONFIG = {
  pending: { label: 'Menunggu', variant: 'warning' as const, icon: Clock },
  processing: { label: 'Diproses', variant: 'default' as const, icon: Loader2 },
  completed: { label: 'Selesai', variant: 'success' as const, icon: CheckCircle2 },
  rejected: { label: 'Ditolak', variant: 'destructive' as const, icon: XCircle },
}

interface WithdrawalStats {
  pending: number
  processing: number
  completed: number
  rejected: number
  total: number
  totalDisbursed: number
}

interface UserInfo {
  id: string
  name: string
  email: string
  totalOrders: number
  completedOrders: number
  totalRevenue: number
  totalWithdrawn: number
  availableBalance: number
  withdrawalCount: number
  lastWithdrawal?: string
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [stats, setStats] = useState<WithdrawalStats | null>(null)
  const [userInfos, setUserInfos] = useState<Record<string, UserInfo>>({})
  const [loading, setLoading] = useState(true)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [processing, setProcessing] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/admin/withdrawals')
      if (res.ok) {
        const data = await res.json()
        setWithdrawals(data.withdrawals || [])
        setStats(data.stats)
        setUserInfos(data.userInfos || {})
      }
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err)
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedAccount(id)
    setTimeout(() => setCopiedAccount(null), 2000)
  }

  async function handleUpdateStatus(id: string, status: string) {
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, adminNotes }),
      })

      if (res.ok) {
        fetchData()
        setSelectedWithdrawal(null)
        setAdminNotes('')
      }
    } catch (err) {
      console.error('Failed to update withdrawal:', err)
    } finally {
      setProcessing(false)
    }
  }

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (filter === 'all') return true
    return w.status === filter
  })

  const statsCards = [
    {
      title: 'Pending',
      value: stats?.pending || 0,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Diproses',
      value: stats?.processing || 0,
      icon: Loader2,
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'Selesai',
      value: stats?.completed || 0,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-green-600',
    },
    {
      title: 'Total Dicairkan',
      value: formatCurrency(stats?.totalDisbursed || 0),
      icon: TrendingDown,
      gradient: 'from-violet-500 to-purple-600',
    },
  ]

  // Get unique users from withdrawals for user info tab
  const uniqueUsers = Object.values(userInfos)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Pencairan Dana</h1>
        <p className="text-muted-foreground mt-1">Kelola permintaan pencairan dana pengguna</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <NeoCard key={stat.title} className="bg-card backdrop-blur-xl border border-border">
            <NeoCardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
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
        ))}
      </div>

      {/* Tabs: Withdrawals & User Info */}
      <Tabs defaultValue="withdrawals" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="withdrawals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            Permintaan Pencairan
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="w-4 h-4 mr-2" />
            Info Dana User
          </TabsTrigger>
        </TabsList>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals">
          <NeoCard className="bg-card backdrop-blur-xl border border-border">
            <NeoCardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <NeoCardTitle className="text-foreground flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <ArrowDownToLine className="w-4 h-4 text-cyan-600" />
                  </div>
                  Daftar Permintaan
                </NeoCardTitle>
                <div className="flex flex-wrap gap-2">
                  {['all', 'pending', 'processing', 'completed', 'rejected'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filter === f
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                      }`}
                    >
                      {f === 'all' ? 'Semua' : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label}
                    </button>
                  ))}
                </div>
              </div>
            </NeoCardHeader>
            <NeoCardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Tidak ada permintaan pencairan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWithdrawals.map((w) => {
                const StatusIcon = STATUS_CONFIG[w.status].icon
                
                return (
                  <div
                    key={w.id}
                    className="p-4 rounded-xl bg-muted border border-border hover:border-border/80 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl shrink-0 shadow-lg overflow-hidden">
                          <PaymentLogo type={w.bankType} className="w-full h-full" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-foreground font-medium">{w.userName}</p>
                            <NeoBadge variant={STATUS_CONFIG[w.status].variant} className="text-xs">
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {STATUS_CONFIG[w.status].label}
                            </NeoBadge>
                          </div>
                          <p className="text-muted-foreground text-sm">{w.userEmail}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
                            <span className="text-muted-foreground">
                              {BANK_LABELS[w.bankType]}: <span className="text-foreground">{w.bankAccount}</span>
                            </span>
                            <span className="text-muted-foreground">
                              a/n <span className="text-foreground">{w.bankAccountName}</span>
                            </span>
                          </div>
                          <p className="text-muted-foreground text-xs mt-1">{formatDate(w.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-foreground font-bold text-lg">{formatCurrency(w.netAmount)}</p>
                          <p className="text-muted-foreground text-xs">
                            dari {formatCurrency(w.amount)} (fee: {formatCurrency(w.fee)})
                          </p>
                        </div>
                        <NeoButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedWithdrawal(w)
                            setAdminNotes(w.adminNotes || '')
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </NeoButton>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
            </NeoCardContent>
          </NeoCard>
        </TabsContent>

        {/* User Info Tab */}
        <TabsContent value="users">
          <NeoCard className="bg-card backdrop-blur-xl border border-border">
            <NeoCardHeader>
              <NeoCardTitle className="text-foreground flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-violet-600" />
                </div>
                Info Dana Pengguna
              </NeoCardTitle>
            </NeoCardHeader>
            <NeoCardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : uniqueUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Belum ada data pengguna</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {uniqueUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 rounded-xl bg-muted border border-border hover:border-border/80 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-foreground font-semibold text-lg">{user.name}</p>
                            <p className="text-muted-foreground text-sm">{user.email}</p>
                            {user.lastWithdrawal && (
                              <p className="text-muted-foreground/70 text-xs mt-1">
                                Terakhir tarik: {formatDate(user.lastWithdrawal)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-3 rounded-lg bg-background text-center">
                            <ShoppingBag className="w-4 h-4 mx-auto text-cyan-600 mb-1" />
                            <p className="text-foreground font-bold">{user.completedOrders}</p>
                            <p className="text-muted-foreground text-xs">Order Selesai</p>
                          </div>
                          <div className="p-3 rounded-lg bg-background text-center">
                            <Banknote className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                            <p className="text-foreground font-bold text-sm">{formatCurrency(user.totalRevenue)}</p>
                            <p className="text-muted-foreground text-xs">Total Pendapatan</p>
                          </div>
                          <div className="p-3 rounded-lg bg-background text-center">
                            <TrendingDown className="w-4 h-4 mx-auto text-orange-600 mb-1" />
                            <p className="text-foreground font-bold text-sm">{formatCurrency(user.totalWithdrawn)}</p>
                            <p className="text-muted-foreground text-xs">Sudah Dicairkan</p>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                            <Wallet className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                            <p className="text-emerald-600 font-bold text-sm">{formatCurrency(user.availableBalance)}</p>
                            <p className="text-emerald-600/60 text-xs">Saldo Tersedia</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Total {user.withdrawalCount} kali pencairan
                        </span>
                        <NeoBadge variant={user.availableBalance > 0 ? 'success' : 'secondary'}>
                          {user.availableBalance > 0 ? 'Ada Saldo' : 'Saldo Kosong'}
                        </NeoBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </NeoCardContent>
          </NeoCard>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent className="bg-[#111111] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Pencairan</DialogTitle>
            <DialogDescription className="text-white/60">
              Kelola permintaan pencairan dana
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Pengguna</span>
                  <span className="text-white font-medium">{selectedWithdrawal.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Email</span>
                  <span className="text-white">{selectedWithdrawal.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Bank/E-Wallet</span>
                  <span className="text-white">{BANK_LABELS[selectedWithdrawal.bankType]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Nomor</span>
                  <span className="text-white font-mono">{selectedWithdrawal.bankAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Nama Pemilik</span>
                  <span className="text-white">{selectedWithdrawal.bankAccountName}</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">Jumlah</span>
                    <span className="text-white">{formatCurrency(selectedWithdrawal.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Biaya Admin</span>
                    <span className="text-red-400">-{formatCurrency(selectedWithdrawal.fee)}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2">
                    <span className="text-white">Yang Ditransfer</span>
                    <span className="text-emerald-400">{formatCurrency(selectedWithdrawal.netAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Catatan Admin</Label>
                <NeoInput
                  placeholder="Catatan opsional..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              {selectedWithdrawal.status === 'pending' && (
                <div className="flex gap-2">
                  <NeoButton
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleUpdateStatus(selectedWithdrawal.id, 'rejected')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Tolak
                  </NeoButton>
                  <NeoButton
                    variant="default"
                    className="flex-1"
                    onClick={() => handleUpdateStatus(selectedWithdrawal.id, 'processing')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                    Proses
                  </NeoButton>
                </div>
              )}

              {selectedWithdrawal.status === 'processing' && (
                <div className="flex gap-2">
                  <NeoButton
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleUpdateStatus(selectedWithdrawal.id, 'rejected')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Tolak
                  </NeoButton>
                  <NeoButton
                    variant="success"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleUpdateStatus(selectedWithdrawal.id, 'completed')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Selesai
                  </NeoButton>
                </div>
              )}

              {(selectedWithdrawal.status === 'completed' || selectedWithdrawal.status === 'rejected') && (
                <div className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-white/60 text-sm">
                    {selectedWithdrawal.status === 'completed' ? 'Telah dicairkan' : 'Ditolak'} pada {selectedWithdrawal.processedAt ? formatDate(selectedWithdrawal.processedAt) : '-'}
                  </p>
                  {selectedWithdrawal.processedBy && (
                    <p className="text-white/40 text-xs mt-1">oleh {selectedWithdrawal.processedBy}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
