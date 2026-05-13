'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoBadge } from '@/components/ui/neo-badge'
import { 
  Bot, 
  Wallet, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Loader2,
  Sparkles,
  Package,
  Settings,
  ShieldCheck,
  AlertCircle,
  QrCode,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  Download,
  XCircle,
  Info
} from 'lucide-react'
import Image from 'next/image'
import type { BotSubscription } from '@/types'

const BOT_SUBSCRIPTION_PRICE = 25000

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
    month: 'long',
    year: 'numeric',
  })
}

export default function SubscriptionPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<BotSubscription | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // QRIS payment state
  const [showQrisPayment, setShowQrisPayment] = useState(false)
  const [qrisData, setQrisData] = useState<{
  qrisUrl: string
  transactionId: string
  subscriptionId: string
  amount: number
  originalAmount: number
  fee: number
  expiresAt: string
  qrString?: string
  merchantName?: string
  merchantId?: string
  qrisId?: string
  issuedBy?: string
  } | null>(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState({ minutes: 0, seconds: 0 })
  const [isExpired, setIsExpired] = useState(false)
  const [pendingPayment, setPendingPayment] = useState<typeof qrisData>(null)

  // Load pending payment from localStorage on mount
  useEffect(() => {
    const savedPayment = localStorage.getItem('pending_subscription_payment')
    if (savedPayment) {
      try {
        const parsed = JSON.parse(savedPayment)
        // Check if expired
        if (new Date(parsed.expiresAt).getTime() > Date.now()) {
          setPendingPayment(parsed)
        } else {
          localStorage.removeItem('pending_subscription_payment')
        }
      } catch (e) {
        localStorage.removeItem('pending_subscription_payment')
      }
    }
  }, [])

  // Save QRIS data to localStorage when created
  useEffect(() => {
    if (qrisData) {
      localStorage.setItem('pending_subscription_payment', JSON.stringify(qrisData))
      setPendingPayment(qrisData)
    }
  }, [qrisData])

  useEffect(() => {
    fetchSubscription()
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!showQrisPayment || !qrisData?.expiresAt) return

    const updateCountdown = () => {
      const now = new Date().getTime()
      const expiry = new Date(qrisData.expiresAt).getTime()
      const diff = expiry - now

      if (diff <= 0) {
        setIsExpired(true)
        setCountdown({ minutes: 0, seconds: 0 })
        return
      }

      const minutes = Math.floor(diff / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setCountdown({ minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [showQrisPayment, qrisData?.expiresAt])

  // Auto check payment status every 5 seconds when QRIS is shown
  useEffect(() => {
    if (!showQrisPayment || !qrisData || isExpired) return

    const interval = setInterval(() => {
      checkPaymentStatus()
    }, 5000)

    return () => clearInterval(interval)
  }, [showQrisPayment, qrisData, isExpired])

  async function fetchSubscription() {
    try {
      const res = await fetch('/api/subscription')
      if (res.ok) {
        const data = await res.json()
        setSubscription(data.subscription)
        setIsActive(data.isActive)
        setDaysRemaining(data.daysRemaining)
        setBalance(data.balance)
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handlePurchaseQris() {
    setPurchasing(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'qris' }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
setQrisData({
  qrisUrl: data.qrisUrl,
  transactionId: data.transactionId,
  subscriptionId: data.subscription.id,
  amount: data.amount,
  originalAmount: data.originalAmount,
  fee: data.fee,
  expiresAt: data.expiresAt,
  qrString: data.qrString,
  })
        setShowQrisPayment(true)
      } else {
        setError(data.error || 'Gagal membuat pembayaran QRIS')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setPurchasing(false)
    }
  }

  async function checkPaymentStatus() {
    if (!qrisData || checkingPayment) return

    setCheckingPayment(true)

    try {
      const res = await fetch('/api/subscription/check-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: qrisData.subscriptionId,
          transactionId: qrisData.transactionId,
          amount: qrisData.amount,
          qrString: qrisData.qrString,
        }),
      })

      const data = await res.json()

      if (data.status === 'paid') {
        // Clear pending payment
        localStorage.removeItem('pending_subscription_payment')
        setPendingPayment(null)
        setSuccess('Pembayaran berhasil! Langganan Anda sudah aktif.')
        setShowQrisPayment(false)
        setQrisData(null)
        await fetchSubscription()
        // Redirect to products after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/products')
        }, 2000)
      }
    } catch (err) {
      console.error('Error checking payment:', err)
    } finally {
      setCheckingPayment(false)
    }
  }

  async function copyTransactionId() {
    if (!qrisData) return
    try {
      await navigator.clipboard.writeText(qrisData.transactionId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  async function downloadQrCode() {
    if (!qrisData) return
    try {
      const response = await fetch(qrisData.qrisUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `QRIS-${qrisData.transactionId}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download:', err)
    }
  }

  function cancelPayment(clearPending = false) {
    setShowQrisPayment(false)
    setQrisData(null)
    setIsExpired(false)
    setCountdown({ minutes: 0, seconds: 0 })
    if (clearPending) {
      localStorage.removeItem('pending_subscription_payment')
      setPendingPayment(null)
    }
  }

  function continuePendingPayment() {
    if (pendingPayment) {
      setQrisData(pendingPayment)
      setShowQrisPayment(true)
      setIsExpired(false)
    }
  }

  async function checkPendingPaymentStatus() {
    if (!pendingPayment) return
    
    setCheckingPayment(true)
    try {
      const res = await fetch('/api/subscription/check-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: pendingPayment.subscriptionId,
          transactionId: pendingPayment.transactionId,
          amount: pendingPayment.amount,
          qrString: pendingPayment.qrString,
        }),
      })

      const data = await res.json()

      if (data.status === 'paid') {
        localStorage.removeItem('pending_subscription_payment')
        setPendingPayment(null)
        setSuccess('Pembayaran berhasil! Langganan Anda sudah aktif.')
        await fetchSubscription()
        setTimeout(() => {
          router.push('/dashboard/products')
        }, 2000)
      }
    } catch (err) {
      console.error('Error checking payment:', err)
    } finally {
      setCheckingPayment(false)
    }
  }

  function formatTime(num: number) {
    return num.toString().padStart(2, '0')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // QRIS Payment View
  if (showQrisPayment && qrisData) {
    return (
      <div className="flex flex-col min-h-screen -m-4 sm:-m-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a1628] to-[#0d1f3c] px-4 py-3 flex items-center gap-4">
          <button 
            onClick={() => cancelPayment(false)}
            className="text-primary flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
            Kembali
          </button>
          <h1 className="text-lg font-semibold text-white flex-1 text-center pr-16">Payment</h1>
        </div>

        <div className="flex-1 bg-gradient-to-b from-[#0a1628] to-[#0d1f3c] px-4 py-4 space-y-4">
          {/* Expiry Timer Section */}
          <div className="bg-[#0d2847] rounded-2xl p-4 border border-[#1a3a5c]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-gray-400 text-xs">Waktu Kadaluarsa</p>
                <p className="text-white font-medium text-sm">
                  {new Date(qrisData.expiresAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}, {new Date(qrisData.expiresAt).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} WIB
                </p>
              </div>
              {/* Countdown Timer */}
              <div className="flex items-center gap-1">
                <div className="bg-[#1a3a5c] rounded-lg px-2.5 py-1.5">
                  <span className="text-white font-mono font-bold text-lg">{formatTime(countdown.minutes)}</span>
                </div>
                <span className="text-gray-400 font-bold">:</span>
                <div className="bg-[#1a3a5c] rounded-lg px-2.5 py-1.5">
                  <span className="text-white font-mono font-bold text-lg">{formatTime(countdown.seconds)}</span>
                </div>
              </div>
            </div>
            
            {/* Warning Message */}
            <div className="flex items-start gap-2 bg-[#0a1628]/50 rounded-xl p-3 border border-[#1a3a5c]/50">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-gray-300">
                Harap membayar sebelum waktu kadaluarsa yang ditentukan agar saldo dapat di proses
              </p>
            </div>
          </div>

          {/* QRIS Card */}
          <div className="bg-gradient-to-br from-[#0066cc] to-[#004499] rounded-2xl p-5 relative overflow-hidden">
            {/* Logo Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-white rounded-md px-2 py-1">
                  <span className="font-bold text-[#0066cc] text-sm tracking-tight">QRIS</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span className="text-white/80 text-xs font-medium">GPN</span>
              </div>
            </div>

            {/* Merchant Info */}
            <div className="text-center mb-4">
              <h2 className="text-white font-bold text-lg">SEWA BOT AUTO ORDER</h2>
              <p className="text-white/70 text-xs">NMID: 9360050300000879140</p>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-2xl p-4 mb-4">
              <div className="relative w-full aspect-square max-w-[220px] mx-auto">
                <Image
                  src={qrisData.qrisUrl}
                  alt="QRIS Payment"
                  fill
                  className="object-contain"
                  unoptimized
                  crossOrigin="anonymous"
                />
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between text-white">
              <span className="font-medium">Total</span>
              <span className="font-bold text-lg">{formatCurrency(qrisData.amount).replace('Rp', '')} IDR</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => cancelPayment(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-transparent border-2 border-red-500 text-red-500 font-medium hover:bg-red-500/10 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              Batalkan
            </button>
            <button
              onClick={downloadQrCode}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
          </div>

          {/* Saya sudah membayar Button */}
          <button
            onClick={checkPaymentStatus}
            disabled={checkingPayment || isExpired}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#0d2847] border border-[#1a3a5c] text-primary font-medium hover:bg-[#1a3a5c] transition-colors disabled:opacity-50"
          >
            {checkingPayment ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mengecek...
              </>
            ) : (
              <>
                Saya sudah membayar
                <CheckCircle2 className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Warning Text */}
          <p className="text-xs text-gray-400 text-center px-4">
            Jangan membatalkan apabila telah membayar karena mengganggu proses pengecekan dan jangan di bayar apabila telah di batalkan atau expired
          </p>

          {/* Detail Pembayaran */}
          <div className="bg-[#0d2847] rounded-2xl p-4 border border-[#1a3a5c] space-y-4">
            <h3 className="text-white font-semibold">Detail Pembayaran</h3>
            
            <div className="space-y-3">
              {/* Payment ID */}
              <div>
                <p className="text-gray-400 text-xs">Payment ID</p>
                <div className="flex items-center justify-between">
                  <code className="text-white text-sm truncate flex-1 mr-2">{qrisData.transactionId}</code>
                  <button
                    onClick={copyTransactionId}
                    className="p-1.5 rounded-lg hover:bg-[#1a3a5c] transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="h-px bg-[#1a3a5c]" />

              {/* Merchant ID */}
              <div>
                <p className="text-gray-400 text-xs">Merchant ID</p>
                <p className="text-white text-sm">9360050300000879140</p>
              </div>

              <div className="h-px bg-[#1a3a5c]" />

              {/* Merchant Name */}
              <div>
                <p className="text-gray-400 text-xs">Merchant Name</p>
                <p className="text-white text-sm">SEWA BOT AUTO ORDER</p>
              </div>

              <div className="h-px bg-[#1a3a5c]" />

              {/* QRIS ID */}
              <div>
                <p className="text-gray-400 text-xs">QRIS ID</p>
                <p className="text-white text-sm">ID2025429755718</p>
              </div>

              <div className="h-px bg-[#1a3a5c]" />

              {/* Issued By */}
              <div>
                <p className="text-gray-400 text-xs">Diterbitkan Oleh</p>
                <p className="text-white text-sm font-medium">BANK NOBU</p>
              </div>

              <div className="h-px bg-[#1a3a5c]" />

              {/* Price Breakdown */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Nominal</span>
                <span className="text-white text-sm">{formatCurrency(qrisData.originalAmount).replace('Rp', '')} IDR</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Biaya Admin</span>
                <span className="text-white text-sm">{formatCurrency(qrisData.fee).replace('Rp', '')} IDR</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Total Pembayaran</span>
                <span className="text-primary font-bold">{formatCurrency(qrisData.amount).replace('Rp', '')} IDR</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-4">
            <p className="text-gray-500 text-xs">
              Gateway pembayaran oleh <span className="text-primary">Orkut</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Sewa Auto Bot Order</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Langganan untuk mengakses fitur Produk dan Settings Bot
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-success/10 text-success border border-success/20 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Current Status */}
      {isActive && subscription ? (
        <NeoCard className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-emerald-500/30">
          <NeoCardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-emerald-500">Langganan Aktif</h2>
                <p className="text-muted-foreground text-sm">Anda memiliki akses penuh ke semua fitur</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-background/50 border border-border">
                <p className="text-muted-foreground text-xs">Sisa Waktu</p>
                <p className="text-2xl font-bold text-emerald-500">{daysRemaining} Hari</p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border">
                <p className="text-muted-foreground text-xs">Berakhir Pada</p>
                <p className="font-semibold">{subscription.endDate ? formatDate(subscription.endDate) : '-'}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <NeoButton onClick={() => router.push('/dashboard/products')} className="flex-1">
                <Package className="w-4 h-4" />
                Kelola Produk
              </NeoButton>
              <NeoButton onClick={() => router.push('/dashboard/settings')} variant="outline" className="flex-1">
                <Settings className="w-4 h-4" />
                Settings Bot
              </NeoButton>
            </div>
          </NeoCardContent>
        </NeoCard>
      ) : (
        <>
          {/* Pending Payment Alert */}
          {pendingPayment && !showQrisPayment && (
            <NeoCard className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
              <NeoCardContent className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-yellow-500">Pembayaran Pending</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Anda memiliki pembayaran yang belum selesai
                    </p>
                  </div>
                </div>
                
                <div className="bg-background/50 rounded-xl p-3 border border-border mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{formatCurrency(pendingPayment.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <code className="text-xs truncate max-w-[150px]">{pendingPayment.transactionId}</code>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Kadaluarsa</span>
                    <span className={new Date(pendingPayment.expiresAt).getTime() < Date.now() ? 'text-red-500' : 'text-yellow-500'}>
                      {new Date(pendingPayment.expiresAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <NeoButton
                    onClick={continuePendingPayment}
                    className="flex-1"
                    size="sm"
                    disabled={new Date(pendingPayment.expiresAt).getTime() < Date.now()}
                  >
                    <QrCode className="w-4 h-4" />
                    Lihat QR Code
                  </NeoButton>
                  <NeoButton
                    onClick={checkPendingPaymentStatus}
                    variant="outline"
                    size="sm"
                    disabled={checkingPayment}
                  >
                    {checkingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Cek Status
                  </NeoButton>
                  <NeoButton
                    onClick={() => cancelPayment(true)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <XCircle className="w-4 h-4" />
                  </NeoButton>
                </div>

                {new Date(pendingPayment.expiresAt).getTime() < Date.now() && (
                  <p className="text-xs text-red-500 text-center mt-3">
                    Pembayaran ini sudah kadaluarsa. Silakan buat pembayaran baru.
                  </p>
                )}
              </NeoCardContent>
            </NeoCard>
          )}

          {/* Subscription Plan */}
          <NeoCard className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 overflow-hidden relative">
            <div className="absolute top-4 right-4">
              <NeoBadge variant="accent" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Recommended
              </NeoBadge>
            </div>
            <NeoCardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg">
                  <Bot className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Sewa Auto Bot Order</h2>
                  <p className="text-muted-foreground text-sm">Paket 3 Bulan</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">{formatCurrency(BOT_SUBSCRIPTION_PRICE)}</span>
                  <span className="text-muted-foreground">/ 3 bulan</span>
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  Hanya {formatCurrency(Math.round(BOT_SUBSCRIPTION_PRICE / 3))} per bulan
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">Akses fitur <strong>Kelola Produk</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">Akses fitur <strong>Settings Bot</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">Bot Telegram otomatis terima order</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">Pembayaran QRIS otomatis</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">Pengiriman produk otomatis</span>
                </div>
              </div>

              {/* Fee Info */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border mb-4">
                <div className="flex items-start gap-3">
                  <QrCode className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Pembayaran via QRIS</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Biaya admin Rp 100 - Rp 200 akan ditambahkan ke total pembayaran
                    </p>
                  </div>
                </div>
              </div>

              <NeoButton 
                onClick={handlePurchaseQris} 
                disabled={purchasing}
                className="w-full"
                size="lg"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    Bayar dengan QRIS
                  </>
                )}
              </NeoButton>

              <p className="text-xs text-muted-foreground text-center mt-3">
                Scan QRIS dan bayar dengan aplikasi e-wallet atau m-banking
              </p>
            </NeoCardContent>
          </NeoCard>

          {/* Saldo Option - Optional */}
          {balance >= BOT_SUBSCRIPTION_PRICE && (
            <NeoCard className="border-border">
              <NeoCardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Bayar dengan Saldo</p>
                      <p className="text-xs text-muted-foreground">Saldo: {formatCurrency(balance)}</p>
                    </div>
                  </div>
                  <NeoButton
                    onClick={async () => {
                      setPurchasing(true)
                      setError('')
                      try {
                        const res = await fetch('/api/subscription', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ paymentMethod: 'saldo' }),
                        })
                        const data = await res.json()
                        if (res.ok) {
                          setSuccess('Langganan berhasil diaktifkan!')
                          await fetchSubscription()
                          setTimeout(() => router.push('/dashboard/products'), 2000)
                        } else {
                          setError(data.error || 'Gagal membeli langganan')
                        }
                      } catch (err) {
                        setError('Terjadi kesalahan')
                      } finally {
                        setPurchasing(false)
                      }
                    }}
                    disabled={purchasing}
                    variant="outline"
                    size="sm"
                  >
                    {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gunakan Saldo'}
                  </NeoButton>
                </div>
              </NeoCardContent>
            </NeoCard>
          )}

          {/* Info */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Metode Pembayaran</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Pembayaran QRIS dapat dilakukan menggunakan OVO, GoPay, DANA, ShopeePay, 
                  LinkAja, atau m-banking yang mendukung QRIS.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
