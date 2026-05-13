'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoInput } from '@/components/ui/neo-input'
import { NeoBadge } from '@/components/ui/neo-badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusModal, useStatusModal } from '@/components/ui/status-modal'
import { LoadingButton } from '@/components/ui/loading-button'
import { 
  Wallet, 
  ArrowDownToLine, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  AlertCircle,
  Building2,
  Smartphone,
  Info,
  Calendar,
  TrendingDown,
  TrendingUp,
  Shield,
  Gift,
  Sparkles,
  Send
} from 'lucide-react'
import { WITHDRAWAL_FEES, BANK_LABELS, type Withdrawal } from '@/types'
import { PaymentLogo } from '@/components/ui/payment-logos'

const MIN_WITHDRAWAL = 10000

const BANK_OPTIONS = [
  { value: 'bca', label: 'BCA', type: 'bank' },
  { value: 'bni', label: 'BNI', type: 'bank' },
  { value: 'bri', label: 'BRI', type: 'bank' },
  { value: 'mandiri', label: 'Mandiri', type: 'bank' },
]

const EWALLET_OPTIONS = [
  { value: 'dana', label: 'DANA', type: 'ewallet' },
  { value: 'ovo', label: 'OVO', type: 'ewallet' },
  { value: 'gopay', label: 'GoPay', type: 'ewallet' },
  { value: 'shopeepay', label: 'ShopeePay', type: 'ewallet' },
]

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

export default function WithdrawPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [balance, setBalance] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalWithdrawn, setTotalWithdrawn] = useState(0)
  const [totalAdjustments, setTotalAdjustments] = useState(0)
  const [canWithdraw, setCanWithdraw] = useState(true)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { showSuccess: showSuccessModal, showError: showErrorModal, StatusModalComponent } = useStatusModal()

  // Form state
  const [amount, setAmount] = useState('')
  const [bankType, setBankType] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')

  const fee = bankType ? WITHDRAWAL_FEES[bankType] || 0 : 0
  const netAmount = Number(amount) - fee

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/withdrawals')
      if (res.ok) {
        const data = await res.json()
        setWithdrawals(data.withdrawals || [])
        setBalance(data.balance || 0)
        setTotalRevenue(data.totalRevenue || 0)
        setTotalWithdrawn(data.totalWithdrawn || 0)
        setTotalAdjustments(data.totalAdjustments || 0)
        setCanWithdraw(data.canWithdraw)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    setSubmitState('loading')

    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          bankType,
          bankAccount,
          bankAccountName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal membuat permintaan penarikan')
        setSubmitState('error')
        showErrorModal(
          'Penarikan Gagal',
          data.error || 'Gagal membuat permintaan penarikan. Silakan periksa kembali data Anda.',
          { actionLabel: 'Coba Lagi' }
        )
        toast.error(data.error || 'Gagal membuat permintaan penarikan', {
          icon: <XCircle className="w-5 h-5" />,
          description: 'Silakan periksa kembali data penarikan Anda',
        })
        setTimeout(() => setSubmitState('idle'), 2000)
        return
      }

      setSubmitState('success')
      setSuccess('Permintaan penarikan berhasil dibuat!')
      showSuccessModal(
        'Penarikan Berhasil Diajukan!',
        `${formatCurrency(Number(amount))} akan segera diproses ke ${BANK_LABELS[bankType] || bankType}. Estimasi 1x24 jam.`,
        { 
          actionLabel: 'Lihat Riwayat',
          showConfetti: true,
          autoClose: 5000
        }
      )
      toast.success('Permintaan penarikan berhasil!', {
        icon: <CheckCircle2 className="w-5 h-5" />,
        description: `${formatCurrency(Number(amount))} akan segera diproses ke ${BANK_LABELS[bankType] || bankType}`,
        duration: 5000,
      })
      setAmount('')
      setBankType('')
      setBankAccount('')
      setBankAccountName('')
      fetchData()
      setTimeout(() => setSubmitState('idle'), 3000)
    } catch (err) {
      setError('Terjadi kesalahan')
      setSubmitState('error')
      showErrorModal(
        'Terjadi Kesalahan',
        'Silakan coba lagi nanti',
        { actionLabel: 'Tutup' }
      )
      toast.error('Terjadi kesalahan', {
        icon: <XCircle className="w-5 h-5" />,
        description: 'Silakan coba lagi nanti',
      })
      setTimeout(() => setSubmitState('idle'), 2000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {StatusModalComponent}
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="animate-slide-down">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Pencairan Dana
            <Sparkles className="w-5 h-5 text-primary animate-float" />
          </h1>
          <p className="text-muted-foreground text-sm">Tarik saldo pendapatan Anda</p>
        </div>

      {/* Balance Cards */}
      <div className={`grid grid-cols-1 gap-4 ${totalAdjustments !== 0 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
        <NeoCard className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover-lift animate-slide-up stagger-1">
          <NeoCardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Saldo Tersedia</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {loading ? '...' : formatCurrency(balance)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
            </div>
          </NeoCardContent>
        </NeoCard>
        
        <NeoCard className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover-lift animate-slide-up stagger-2">
          <NeoCardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Total Pendapatan</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {loading ? '...' : formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </NeoCardContent>
        </NeoCard>
        
        <NeoCard className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 hover-lift animate-slide-up stagger-3">
          <NeoCardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Sudah Dicairkan</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {loading ? '...' : formatCurrency(totalWithdrawn)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <ArrowDownToLine className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </NeoCardContent>
        </NeoCard>

        {totalAdjustments !== 0 && (
          <NeoCard className={`bg-gradient-to-br hover-lift animate-slide-up stagger-4 ${totalAdjustments > 0 ? 'from-violet-500/10 to-violet-500/5 border-violet-500/20' : 'from-red-500/10 to-red-500/5 border-red-500/20'}`}>
            <NeoCardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs">Bonus/Penyesuaian</p>
                  <p className={`text-2xl font-bold mt-1 ${totalAdjustments > 0 ? 'text-violet-600' : 'text-red-600'}`}>
                    {loading ? '...' : `${totalAdjustments > 0 ? '+' : ''}${formatCurrency(totalAdjustments)}`}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${totalAdjustments > 0 ? 'bg-violet-500/20' : 'bg-red-500/20'}`}>
                  <Gift className={`w-6 h-6 ${totalAdjustments > 0 ? 'text-violet-500' : 'text-red-500'}`} />
                </div>
              </div>
            </NeoCardContent>
          </NeoCard>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
        <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-start gap-3 hover-scale transition-all">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="font-medium text-sm">Minimum Tarik</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Minimal penarikan {formatCurrency(MIN_WITHDRAWAL)}
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-start gap-3 hover-scale transition-all">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="font-medium text-sm">Limit Harian</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Maksimal 1x penarikan per hari
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="font-medium text-sm">Keamanan</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Limit untuk menghindari spam
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdrawal Form */}
        <NeoCard>
          <NeoCardHeader>
            <NeoCardTitle className="flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5" />
              Form Penarikan
            </NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            {!canWithdraw && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20 mb-4">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Batas Penarikan Harian</p>
                  <p className="text-sm text-muted-foreground">
                    Anda sudah melakukan penarikan hari ini. Silakan coba lagi besok.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
                <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-success/10 border border-success/20 mb-4">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <p className="text-sm text-success">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Jumlah Penarikan</Label>
                <NeoInput
                  type="number"
                  placeholder="Minimal Rp 10.000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={MIN_WITHDRAWAL}
                  max={balance}
                  disabled={!canWithdraw || submitting}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimal penarikan: {formatCurrency(MIN_WITHDRAWAL)}
                </p>
              </div>

              <div className="space-y-3">
                <Label>Pilih Metode Pencairan</Label>
                <Tabs defaultValue="ewallet" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="ewallet" className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      E-Wallet
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Bank Transfer
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="ewallet" className="mt-3">
                    <div className="grid grid-cols-2 gap-2">
                      {EWALLET_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setBankType(option.value)}
                            disabled={!canWithdraw || submitting}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                              bankType === option.value
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                                : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <div className="w-12 h-12 rounded-xl shadow-md overflow-hidden">
                              <PaymentLogo type={option.value} className="w-full h-full" />
                            </div>
                            <span className="text-sm font-semibold">{option.label}</span>
                            <span className="text-xs text-emerald-600 font-medium">
                              Fee: {formatCurrency(WITHDRAWAL_FEES[option.value])}
                            </span>
                          </button>
                        )
                      )}
                    </div>
                    <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-xs text-emerald-600 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        E-Wallet lebih murah! Hanya {formatCurrency(1000)} per transaksi
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="bank" className="mt-3">
                    <div className="grid grid-cols-2 gap-2">
                      {BANK_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setBankType(option.value)}
                            disabled={!canWithdraw || submitting}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                              bankType === option.value
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                                : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <div className="w-12 h-12 rounded-xl shadow-md overflow-hidden">
                              <PaymentLogo type={option.value} className="w-full h-full" />
                            </div>
                            <span className="text-sm font-semibold">{option.label}</span>
                            <span className="text-xs text-amber-600 font-medium">
                              Fee: {formatCurrency(WITHDRAWAL_FEES[option.value])}
                            </span>
                          </button>
                        )
                      )}
                    </div>
                    <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-amber-600 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Transfer bank dikenakan biaya {formatCurrency(6500)} per transaksi
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label>{EWALLET_OPTIONS.find(b => b.value === bankType) ? 'Nomor HP' : 'Nomor Rekening'}</Label>
                <NeoInput
                  type="text"
                  placeholder={EWALLET_OPTIONS.find(b => b.value === bankType) ? '08xxxxxxxxxx' : 'Nomor rekening'}
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  disabled={!canWithdraw || submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Nama Pemilik</Label>
                <NeoInput
                  type="text"
                  placeholder="Nama sesuai rekening/akun"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  disabled={!canWithdraw || submitting}
                  required
                />
              </div>

              {/* Summary */}
              {amount && bankType && Number(amount) >= MIN_WITHDRAWAL && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Jumlah Penarikan</span>
                    <span>{formatCurrency(Number(amount))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Biaya Admin ({BANK_LABELS[bankType]})</span>
                    <span className="text-destructive">-{formatCurrency(fee)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-medium">
                    <span>Yang Diterima</span>
                    <span className="text-primary">{formatCurrency(netAmount > 0 ? netAmount : 0)}</span>
                  </div>
                  {Number(amount) > balance && (
                    <div className="flex items-center gap-2 text-destructive text-xs pt-2">
                      <AlertCircle className="w-4 h-4" />
                      Saldo tidak mencukupi! Maksimal: {formatCurrency(balance)}
                    </div>
                  )}
                </div>
              )}

              <LoadingButton
                type="submit"
                className="w-full"
                disabled={!canWithdraw || submitting || !amount || !bankType || !bankAccount || !bankAccountName || Number(amount) < MIN_WITHDRAWAL || Number(amount) > balance}
                loading={submitState === 'loading'}
                loadingText="Memproses Penarikan..."
                success={submitState === 'success'}
                successText="Penarikan Berhasil!"
                error={submitState === 'error'}
                errorText="Penarikan Gagal"
              >
                <Send className="w-4 h-4" />
                Ajukan Penarikan
              </LoadingButton>
            </form>
          </NeoCardContent>
        </NeoCard>

        {/* Withdrawal History */}
        <NeoCard>
          <NeoCardHeader>
            <NeoCardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Riwayat Penarikan
            </NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : withdrawals.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Belum ada riwayat penarikan
              </p>
            ) : (
              <div className="space-y-3">
                {withdrawals.slice().reverse().map((w) => {
                  const StatusIcon = STATUS_CONFIG[w.status].icon
                  return (
                    <div
                      key={w.id}
                      className="p-4 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg shadow-sm shrink-0 overflow-hidden">
                          <PaymentLogo type={w.bankType} className="w-full h-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">{formatCurrency(w.netAmount)}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {BANK_LABELS[w.bankType]} - {w.bankAccount}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(w.createdAt)}
                              </p>
                            </div>
                            <NeoBadge variant={STATUS_CONFIG[w.status].variant} className="shrink-0">
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {STATUS_CONFIG[w.status].label}
                            </NeoBadge>
                          </div>
                        </div>
                      </div>
                      {w.adminNotes && (
                        <p className="text-xs text-muted-foreground mt-2 p-2 bg-background rounded ml-13">
                          Catatan: {w.adminNotes}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </NeoCardContent>
        </NeoCard>
      </div>
      </div>
    </>
  )
}
