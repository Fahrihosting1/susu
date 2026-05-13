'use client'

import { useEffect, useState } from 'react'
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoInput } from '@/components/ui/neo-input'
import { NeoBadge } from '@/components/ui/neo-badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  Mail, 
  Calendar, 
  Shield, 
  Loader2, 
  Wallet, 
  Plus, 
  Minus, 
  TrendingUp,
  TrendingDown,
  History,
  Banknote,
  UserX,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Crown
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  createdAt: string
  lastActivity?: string | null
  lastActivityType?: string | null
  hasActiveSubscription?: boolean
  subscriptionEndDate?: string | null
}

interface UserBalanceInfo {
  id: string
  name: string
  email: string
  totalRevenue: number
  totalWithdrawn: number
  totalAdjustments: number
  availableBalance: number
  adjustments: Array<{
    id: string
    amount: number
    type: 'add' | 'deduct'
    reason: string
    adminName: string
    createdAt: string
  }>
}

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

function getInactiveDays(lastActivity: string | null, createdAt: string): number {
  const referenceDate = lastActivity ? new Date(lastActivity) : new Date(createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - referenceDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function getActivityLabel(activityType: string | null | undefined): string {
  switch (activityType) {
    case 'login': return 'Login terakhir'
    case 'logout': return 'Logout terakhir'
    case 'register': return 'Daftar'
    case 'profile_update': return 'Update profil'
    case 'product_create': return 'Buat produk'
    case 'product_update': return 'Update produk'
    case 'order_complete': return 'Order selesai'
    case 'withdrawal_request': return 'Request penarikan'
    default: return 'Aktivitas terakhir'
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [usersWithActivity, setUsersWithActivity] = useState<User[]>([])
  const [usersWithBalance, setUsersWithBalance] = useState<UserBalanceInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserBalanceInfo | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  // Delete user state
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [inactiveMonths, setInactiveMonths] = useState('3')
  
  // Form state
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add')

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  async function fetchUsersWithActivity() {
    try {
      const res = await fetch('/api/admin/users?withActivity=true')
      if (res.ok) {
        const data = await res.json()
        setUsersWithActivity(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users with activity:', error)
    }
  }

  async function fetchBalanceData() {
    try {
      const res = await fetch('/api/admin/balance')
      if (res.ok) {
        const data = await res.json()
        setUsersWithBalance(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch balance data:', error)
    }
  }

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      await Promise.all([fetchUsers(), fetchUsersWithActivity(), fetchBalanceData()])
      setLoading(false)
    }
    fetchAll()
  }, [])

  async function handleAddBalance() {
    if (!selectedUser || !amount || !reason) return
    
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: Number(amount),
          type: adjustType,
          reason,
        }),
      })

      if (res.ok) {
        await fetchBalanceData()
        setShowAddDialog(false)
        setAmount('')
        setReason('')
        setSelectedUser(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal menambah saldo')
      }
    } catch (error) {
      console.error('Error adding balance:', error)
      alert('Terjadi kesalahan')
    } finally {
      setProcessing(false)
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) return
    
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userToDelete.id }),
      })

      if (res.ok) {
        toast.success(`User ${userToDelete.name} berhasil dihapus`)
        await Promise.all([fetchUsers(), fetchUsersWithActivity(), fetchBalanceData()])
        setShowDeleteDialog(false)
        setUserToDelete(null)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Terjadi kesalahan saat menghapus user')
    } finally {
      setDeleting(false)
    }
  }

  function openAddDialog(user: UserBalanceInfo) {
    setSelectedUser(user)
    setAdjustType('add')
    setAmount('')
    setReason('')
    setShowAddDialog(true)
  }

  function openHistoryDialog(user: UserBalanceInfo) {
    setSelectedUser(user)
    setShowHistoryDialog(true)
  }

  function openDeleteDialog(user: User) {
    setUserToDelete(user)
    setShowDeleteDialog(true)
  }

  // Filter inactive users based on selected months
  const inactiveUsers = usersWithActivity.filter(user => {
    if (user.role === 'admin') return false // Don't show admins in inactive list
    const days = getInactiveDays(user.lastActivity || null, user.createdAt)
    const months = parseInt(inactiveMonths)
    return days >= months * 30
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-white/60 text-sm">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">View and manage registered users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <NeoCard className="bg-card backdrop-blur-xl border border-border">
          <NeoCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
              </div>
            </div>
          </NeoCardContent>
        </NeoCard>

        <NeoCard className="bg-card backdrop-blur-xl border border-amber-500/30">
          <NeoCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-amber-600 text-sm">Sewa VIP</p>
                <p className="text-2xl font-bold text-foreground">{users.filter(u => u.hasActiveSubscription).length}</p>
              </div>
            </div>
          </NeoCardContent>
        </NeoCard>

        <NeoCard className="bg-card backdrop-blur-xl border border-border">
          <NeoCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Admins</p>
                <p className="text-2xl font-bold text-foreground">{users.filter(u => u.role === 'admin').length}</p>
              </div>
            </div>
          </NeoCardContent>
        </NeoCard>

        <NeoCard className="bg-card backdrop-blur-xl border border-border">
          <NeoCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Regular Users</p>
                <p className="text-2xl font-bold text-foreground">{users.filter(u => u.role === 'user' || !u.role).length}</p>
              </div>
            </div>
          </NeoCardContent>
        </NeoCard>

        <NeoCard className="bg-card backdrop-blur-xl border border-border">
          <NeoCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <UserX className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Tidak Aktif</p>
                <p className="text-2xl font-bold text-foreground">{inactiveUsers.length}</p>
              </div>
            </div>
          </NeoCardContent>
        </NeoCard>

        <NeoCard className="bg-card backdrop-blur-xl border border-border">
          <NeoCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Saldo User</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(usersWithBalance.reduce((sum, u) => sum + u.availableBalance, 0))}
                </p>
              </div>
            </div>
          </NeoCardContent>
        </NeoCard>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="w-4 h-4 mr-2" />
            Daftar User
          </TabsTrigger>
          <TabsTrigger value="inactive" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <UserX className="w-4 h-4 mr-2" />
            Tidak Aktif
            {inactiveUsers.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                {inactiveUsers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="balance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Wallet className="w-4 h-4 mr-2" />
            Kelola Saldo
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <NeoCard className="bg-card backdrop-blur-xl border border-border">
            <NeoCardHeader>
              <NeoCardTitle className="text-foreground flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-cyan-600" />
                </div>
                Registered Users
              </NeoCardTitle>
            </NeoCardHeader>
            <NeoCardContent>
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No users registered yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-4 rounded-xl bg-muted border hover:bg-muted/80 transition-colors ${user.hasActiveSubscription ? 'border-amber-500/30' : 'border-border'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.hasActiveSubscription ? 'bg-gradient-to-br from-amber-500 to-yellow-500' : 'bg-gradient-to-br from-cyan-500 to-violet-600'}`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {user.hasActiveSubscription && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                              <Crown className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-foreground font-medium">{user.name}</p>
                            {user.hasActiveSubscription && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30">
                                <Crown className="w-3 h-3" />
                                Sewa VIP
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                          {user.hasActiveSubscription && user.subscriptionEndDate && (
                            <div className="flex items-center gap-1 text-amber-600 text-xs mt-0.5">
                              <Crown className="w-3 h-3" />
                              VIP sampai {new Date(user.subscriptionEndDate).toLocaleDateString('id-ID')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Calendar className="w-3 h-3" />
                            {new Date(user.createdAt).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                        <NeoBadge variant={user.role === 'admin' ? 'accent' : 'outline'}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </NeoBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </NeoCardContent>
          </NeoCard>
        </TabsContent>

        {/* Inactive Users Tab */}
        <TabsContent value="inactive">
          <NeoCard className="bg-card backdrop-blur-xl border border-border">
            <NeoCardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <NeoCardTitle className="text-foreground flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <UserX className="w-4 h-4 text-red-600" />
                  </div>
                  User Tidak Aktif
                </NeoCardTitle>
                <div className="flex items-center gap-3">
                  <Label className="text-muted-foreground text-sm whitespace-nowrap">Tidak login selama:</Label>
                  <Select value={inactiveMonths} onValueChange={setInactiveMonths}>
                    <SelectTrigger className="w-[140px] bg-muted border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="1">1 Bulan</SelectItem>
                      <SelectItem value="2">2 Bulan</SelectItem>
                      <SelectItem value="3">3 Bulan</SelectItem>
                      <SelectItem value="6">6 Bulan</SelectItem>
                      <SelectItem value="12">12 Bulan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </NeoCardHeader>
            <NeoCardContent>
              {inactiveUsers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">Tidak ada user yang tidak aktif selama {inactiveMonths} bulan</p>
                  <p className="text-muted-foreground/70 text-sm mt-1">Semua user aktif menggunakan platform</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-300 text-sm font-medium">Perhatian</p>
                        <p className="text-amber-200/70 text-sm">
                          Menghapus user akan menghapus semua data terkait termasuk produk, pesanan, dan saldo. Tindakan ini tidak dapat dibatalkan.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {inactiveUsers.map((user) => {
                    const inactiveDays = getInactiveDays(user.lastActivity || null, user.createdAt)
                    const inactiveMonthsCount = Math.floor(inactiveDays / 30)
                    
                    return (
                      <div
                        key={user.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-red-500/20 transition-colors gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white font-bold text-sm opacity-50">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.name}</p>
                            <div className="flex items-center gap-2 text-white/40 text-sm">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-red-400" />
                              <span className="text-red-400 text-sm font-medium">
                                {inactiveMonthsCount > 0 
                                  ? `${inactiveMonthsCount} bulan ${inactiveDays % 30} hari`
                                  : `${inactiveDays} hari`
                                } tidak aktif
                              </span>
                            </div>
                            <span className="text-white/40 text-xs">
                              {user.lastActivity 
                                ? `${getActivityLabel(user.lastActivityType)}: ${formatDate(user.lastActivity)}`
                                : `Belum ada aktivitas sejak daftar`
                              }
                            </span>
                          </div>
                          <NeoButton
                            size="sm"
                            variant="outline"
                            onClick={() => openDeleteDialog(user)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Hapus
                          </NeoButton>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </NeoCardContent>
          </NeoCard>
        </TabsContent>

        {/* Balance Tab */}
        <TabsContent value="balance">
          <NeoCard className="bg-card backdrop-blur-xl border border-border">
            <NeoCardHeader>
              <NeoCardTitle className="text-foreground flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-amber-600" />
                </div>
                Kelola Saldo User
              </NeoCardTitle>
            </NeoCardHeader>
            <NeoCardContent>
              {usersWithBalance.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Belum ada user dengan saldo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {usersWithBalance.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 rounded-xl bg-muted border border-border hover:border-border/80 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg">
                            <span className="text-white font-bold">{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-foreground font-semibold">{user.name}</p>
                            <p className="text-muted-foreground text-sm">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex flex-col items-end">
                            <span className="text-muted-foreground text-xs">Saldo</span>
                            <span className="text-emerald-600 font-bold">{formatCurrency(user.availableBalance)}</span>
                          </div>
                          <div className="flex gap-2">
                            <NeoButton
                              size="sm"
                              variant="default"
                              onClick={() => openAddDialog(user)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Tambah
                            </NeoButton>
                            {user.adjustments.length > 0 && (
                              <NeoButton
                                size="sm"
                                variant="outline"
                                onClick={() => openHistoryDialog(user)}
                              >
                                <History className="w-4 h-4 mr-1" />
                                Riwayat
                              </NeoButton>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-muted-foreground text-xs">Pendapatan</p>
                          <p className="text-foreground text-sm font-medium">{formatCurrency(user.totalRevenue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Dicairkan</p>
                          <p className="text-orange-600 text-sm font-medium">{formatCurrency(user.totalWithdrawn)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Penyesuaian</p>
                          <p className={`text-sm font-medium ${user.totalAdjustments >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {user.totalAdjustments >= 0 ? '+' : ''}{formatCurrency(user.totalAdjustments)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </NeoCardContent>
          </NeoCard>
        </TabsContent>
      </Tabs>

      {/* Add Balance Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Banknote className="w-5 h-5 text-emerald-600" />
              {adjustType === 'add' ? 'Tambah' : 'Kurangi'} Saldo
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedUser?.name} - {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2">
              <button
                onClick={() => setAdjustType('add')}
                className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                  adjustType === 'add'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600'
                    : 'border-border text-muted-foreground hover:border-border/80'
                }`}
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
              <button
                onClick={() => setAdjustType('deduct')}
                className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                  adjustType === 'deduct'
                    ? 'border-red-500 bg-red-500/20 text-red-600'
                    : 'border-border text-muted-foreground hover:border-border/80'
                }`}
              >
                <Minus className="w-4 h-4" />
                Kurangi
              </button>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Jumlah (Rp)</Label>
              <NeoInput
                type="number"
                placeholder="Contoh: 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Alasan</Label>
              <NeoInput
                type="text"
                placeholder="Contoh: Bonus, Refund, dll"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-muted border-border"
              />
            </div>
            {amount && (
              <div className="p-3 rounded-lg bg-muted border border-border">
                <p className="text-muted-foreground text-sm">Saldo setelah penyesuaian:</p>
                <p className={`text-lg font-bold ${adjustType === 'add' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(
                    (selectedUser?.availableBalance || 0) + 
                    (adjustType === 'add' ? Number(amount) : -Number(amount))
                  )}
                </p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <NeoButton
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1"
              >
                Batal
              </NeoButton>
              <NeoButton
                onClick={handleAddBalance}
                disabled={!amount || !reason || processing}
                className={`flex-1 ${adjustType === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {adjustType === 'add' ? 'Tambah' : 'Kurangi'} Saldo
              </NeoButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="bg-card border border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <History className="w-5 h-5 text-cyan-600" />
              Riwayat Penyesuaian Saldo
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4 max-h-[400px] overflow-y-auto">
            {selectedUser?.adjustments.map((adj) => (
              <div
                key={adj.id}
                className="p-3 rounded-lg bg-muted border border-border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {adj.type === 'add' ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`font-bold ${adj.type === 'add' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {adj.type === 'add' ? '+' : '-'}{formatCurrency(adj.amount)}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">{formatDate(adj.createdAt)}</span>
                </div>
                <p className="text-muted-foreground text-sm mt-1">{adj.reason}</p>
                <p className="text-muted-foreground/70 text-xs mt-1">oleh {adj.adminName}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Hapus User
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Apakah Anda yakin ingin menghapus user <span className="text-foreground font-medium">{userToDelete?.name}</span> ({userToDelete?.email})?
              <br /><br />
              <span className="text-red-600">Tindakan ini akan menghapus semua data terkait termasuk:</span>
              <ul className="list-disc list-inside mt-2 text-muted-foreground">
                <li>Pengaturan bot</li>
                <li>Semua produk dan kategori</li>
                <li>Semua pesanan</li>
                <li>Semua pembayaran</li>
                <li>Saldo dan riwayat pencairan</li>
                <li>Langganan bot</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-muted/80">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Hapus User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
