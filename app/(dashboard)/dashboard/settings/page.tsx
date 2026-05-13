'use client'

import { useState, useEffect } from 'react'
import { Bot, Key, Power, Save, Eye, EyeOff, AlertCircle, CheckCircle, Webhook, Trash2, RefreshCw, CreditCard, User, Image, QrCode, Wallet, Info, Smartphone, Copy, Link2 } from 'lucide-react'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoInput } from '@/components/ui/neo-input'
import { NeoBadge } from '@/components/ui/neo-badge'
import { NeoTextarea } from '@/components/ui/neo-textarea'
import { saveBotSettingsAction, toggleBotStatusAction } from '@/actions/settings.actions'
import type { BotSettings, PaymentSettings, QrisSettings } from '@/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<BotSettings | null>(null)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [webhookInfo, setWebhookInfo] = useState<{ url: string; pending_update_count: number } | null>(null)
  const [settingWebhook, setSettingWebhook] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)
  
  // User QRIS states
  const [userQris, setUserQris] = useState<QrisSettings | null>(null)
  const [savingQris, setSavingQris] = useState(false)
  const [showQrisToken, setShowQrisToken] = useState(false)
  const [showQrisApiKey, setShowQrisApiKey] = useState(false)
  const [qrisForm, setQrisForm] = useState({
    username: '',
    apiKey: 'new2025',
    token: '',
    merchantId: '',
    codeQr: '',
  })
  
  // WhatsApp Bot states
  const [waSettings, setWaSettings] = useState<{
    waNumber?: string
    waApiKey?: string
    waConnected?: boolean
    waLastConnected?: string
  } | null>(null)
  const [savingWa, setSavingWa] = useState(false)
  const [showWaApiKey, setShowWaApiKey] = useState(false)
  const [waNumber, setWaNumber] = useState('')
  const [copiedApiKey, setCopiedApiKey] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchWebhookInfo()
    fetchPaymentSettings()
    fetchUserQris()
    fetchWhatsAppSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchWebhookInfo() {
    try {
      const res = await fetch('/api/telegram/set-webhook')
      if (res.ok) {
        const data = await res.json()
        setWebhookInfo(data.webhookInfo)
      }
    } catch (error) {
      console.error('Error fetching webhook info:', error)
    }
  }

  async function fetchPaymentSettings() {
    try {
      // Use internal flag to bypass admin check - this is read-only for display
      const res = await fetch('/api/admin/payment-settings?internal=true')
      if (res.ok) {
        const data = await res.json()
        setPaymentSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error)
    }
  }

  async function fetchUserQris() {
    try {
      // Fetch user's own QRIS settings
      const res = await fetch('/api/settings/qris?type=user&userId=me')
      if (res.ok) {
        const data = await res.json()
        if (data.qrisSettings) {
          setUserQris(data.qrisSettings)
          setQrisForm({
            username: data.qrisSettings.username || '',
            apiKey: 'new2025', // Hidden, don't populate
            token: '', // Hidden, don't populate
            merchantId: data.qrisSettings.merchantId || '',
            codeQr: data.qrisSettings.codeQr || '',
          })
        }
      }
    } catch (error) {
      console.error('Error fetching user QRIS:', error)
    }
  }

  async function fetchWhatsAppSettings() {
    try {
      const res = await fetch('/api/whatsapp/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.whatsapp) {
          setWaSettings(data.whatsapp)
          setWaNumber(data.whatsapp.waNumber || '')
        }
      }
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error)
    }
  }

  async function handleGenerateWaApiKey() {
    setSavingWa(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_api_key', waNumber }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'API Key WhatsApp berhasil dibuat!' })
        fetchWhatsAppSettings()
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal membuat API Key' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal membuat API Key' })
    } finally {
      setSavingWa(false)
    }
  }

  async function handleUpdateWaNumber() {
    setSavingWa(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_number', waNumber }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Nomor WhatsApp berhasil disimpan!' })
        fetchWhatsAppSettings()
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan nomor' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan nomor' })
    } finally {
      setSavingWa(false)
    }
  }

  async function handleDeleteWaSettings() {
    if (!confirm('Hapus pengaturan WhatsApp Bot? Bot WhatsApp akan terputus.')) return
    
    setSavingWa(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Pengaturan WhatsApp berhasil dihapus!' })
        setWaSettings(null)
        setWaNumber('')
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Gagal menghapus pengaturan' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menghapus pengaturan' })
    } finally {
      setSavingWa(false)
    }
  }

  function copyApiKey() {
    if (waSettings?.waApiKey) {
      navigator.clipboard.writeText(waSettings.waApiKey)
      setCopiedApiKey(true)
      setTimeout(() => setCopiedApiKey(false), 2000)
    }
  }

  async function handleSaveQris() {
    setSavingQris(true)
    setMessage(null)

    try {
      const res = await fetch('/api/settings/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user',
          userId: 'me', // API will resolve to current user
          username: qrisForm.username,
          apiKey: "new2025" || undefined, // Don't send if empty (keep existing)
          token: qrisForm.token || undefined, // Don't send if empty (keep existing)
          merchantId: qrisForm.merchantId,
          codeQr: qrisForm.codeQr,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Pengaturan QRIS berhasil disimpan!' })
        fetchUserQris()
        // Clear sensitive fields after save
        setQrisForm(prev => ({ ...prev, apiKey: 'new2025', token: '' }))
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan pengaturan QRIS' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan QRIS' })
    } finally {
      setSavingQris(false)
    }
  }

  async function handleDeleteQris() {
    if (!confirm('Hapus pengaturan QRIS Anda? Pembayaran akan menggunakan QRIS admin.')) return
    
    setSavingQris(true)
    setMessage(null)

    try {
      const res = await fetch('/api/settings/qris?type=user&userId=me', {
        method: 'DELETE',
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Pengaturan QRIS berhasil dihapus!' })
        setUserQris(null)
        setQrisForm({ username: '', apiKey: 'new2025', token: '', merchantId: '', codeQr: '' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Gagal menghapus pengaturan QRIS' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menghapus pengaturan QRIS' })
    } finally {
      setSavingQris(false)
    }
  }

  async function handleSetWebhook() {
    setSettingWebhook(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/telegram/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        fetchWebhookInfo()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memasang webhook' })
    } finally {
      setSettingWebhook(false)
    }
  }

  async function handleDeleteWebhook() {
    setSettingWebhook(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/telegram/set-webhook', {
        method: 'DELETE',
      })
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        setWebhookInfo(null)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menghapus webhook' })
    } finally {
      setSettingWebhook(false)
    }
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    setMessage(null)
    
    const result = await saveBotSettingsAction(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' })
      fetchSettings()
    }
    
    setSaving(false)
  }

  async function handleToggle() {
    setToggling(true)
    setMessage(null)
    
    const result = await toggleBotStatusAction()
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: `Bot ${result.isActive ? 'diaktifkan' : 'dinonaktifkan'}!` })
      fetchSettings()
    }
    
    setToggling(false)
  }

  async function handlePaymentMethodChange(method: 'orkut' | 'midtrans') {
    setSavingPayment(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/settings/payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method }),
      })
      
      if (res.ok) {
        setMessage({ type: 'success', text: `Metode pembayaran diubah ke ${method === 'orkut' ? 'Orkut QRIS' : 'Midtrans QRIS'}` })
        fetchSettings()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Gagal mengubah metode pembayaran' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mengubah metode pembayaran' })
    } finally {
      setSavingPayment(false)
    }
  }

  // Determine active payment method
  const getActivePaymentMethod = () => {
    if (!paymentSettings) return null
    
    const methods: string[] = []
    if (paymentSettings.orkutEnabled) methods.push('Orkut QRIS')
    if (paymentSettings.midtransEnabled) methods.push('Midtrans QRIS')
    
    if (methods.length === 0) return null
    
    const defaultMethod = paymentSettings.defaultPaymentMethod === 'midtrans' ? 'Midtrans QRIS' : 'Orkut QRIS'
    
    return {
      methods,
      defaultMethod,
      isMultiple: methods.length > 1
    }
  }

  const paymentInfo = getActivePaymentMethod()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 bg-primary/20 rounded-xl animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 rounded-full bg-primary animate-ping" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Bot</h1>
        <p className="text-muted-foreground text-sm">Konfigurasi token dan Owner ID untuk menjalankan bot Anda</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-success/10 text-success border border-success/20' 
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="font-medium text-sm">{message.text}</span>
        </div>
      )}

      {/* Bot Status Card */}
      <div className={`p-5 rounded-xl border ${
        settings?.isActive 
          ? 'bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30' 
          : 'bg-gradient-to-br from-warning/20 to-warning/5 border-warning/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              settings?.isActive ? 'bg-accent/20 text-accent' : 'bg-warning/20 text-warning'
            }`}>
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold">Status Bot</p>
              <div className="flex items-center gap-2 mt-1">
                <NeoBadge variant={settings?.isActive ? 'success' : 'warning'}>
                  {settings?.isActive ? 'Aktif' : 'Nonaktif'}
                </NeoBadge>
                {settings?.botName && (
                  <span className="text-sm text-muted-foreground">@{settings.botName}</span>
                )}
              </div>
            </div>
          </div>
          
          <NeoButton
            variant={settings?.isActive ? 'destructive' : 'success'}
            onClick={handleToggle}
            disabled={toggling || !settings}
            className="w-full sm:w-auto"
          >
            <Power className="w-4 h-4" />
            {toggling ? 'Memproses...' : settings?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </NeoButton>
        </div>
      </div>

      {/* Payment Method Selection Card */}
      <div className={`p-5 rounded-xl border ${
        paymentInfo 
          ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-emerald-500/30' 
          : 'bg-card border-border'
      }`}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              paymentInfo ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted text-muted-foreground'
            }`}>
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Metode Pembayaran QRIS</p>
              {paymentInfo ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Pilih metode pembayaran yang akan digunakan di bot Anda
                </p>
              ) : (
                <div className="mt-1">
                  <NeoBadge variant="warning">Belum Dikonfigurasi</NeoBadge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Hubungi admin untuk mengaktifkan metode pembayaran QRIS.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {paymentInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paymentSettings?.orkutEnabled && (
                <label 
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    settings?.preferredPaymentMethod === 'orkut' || (!settings?.preferredPaymentMethod && paymentSettings?.defaultPaymentMethod === 'orkut')
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-border hover:border-muted-foreground/50 bg-card'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="orkut"
                    checked={settings?.preferredPaymentMethod === 'orkut' || (!settings?.preferredPaymentMethod && paymentSettings?.defaultPaymentMethod === 'orkut')}
                    onChange={() => handlePaymentMethodChange('orkut')}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Orkut QRIS</span>
                      {(settings?.preferredPaymentMethod === 'orkut' || (!settings?.preferredPaymentMethod && paymentSettings?.defaultPaymentMethod === 'orkut')) && (
                        <NeoBadge variant="success" className="text-xs">Aktif</NeoBadge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Fee: Rp 100-200 (random)</p>
                  </div>
                </label>
              )}
              
              {paymentSettings?.midtransEnabled && (
                <label 
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    settings?.preferredPaymentMethod === 'midtrans'
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-border hover:border-muted-foreground/50 bg-card'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="midtrans"
                    checked={settings?.preferredPaymentMethod === 'midtrans'}
                    onChange={() => handlePaymentMethodChange('midtrans')}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Midtrans QRIS</span>
                      {settings?.preferredPaymentMethod === 'midtrans' && (
                        <NeoBadge variant="success" className="text-xs">Aktif</NeoBadge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Fee: 0.7% | Support: GoPay, OVO, DANA</p>
                  </div>
                </label>
              )}
            </div>
          )}
          
          {paymentInfo && savingPayment && (
            <p className="text-xs text-muted-foreground text-center">Menyimpan pilihan...</p>
          )}
        </div>
      </div>

      {/* Webhook Status Card */}
      <div className={`p-5 rounded-xl border ${
        webhookInfo?.url 
          ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30' 
          : 'bg-card border-border'
      }`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                webhookInfo?.url ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                <Webhook className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Webhook Telegram</p>
                <div className="flex items-center gap-2 mt-1">
                  <NeoBadge variant={webhookInfo?.url ? 'success' : 'destructive'}>
                    {webhookInfo?.url ? 'Terpasang' : 'Belum Dipasang'}
                  </NeoBadge>
                  {webhookInfo?.pending_update_count !== undefined && webhookInfo.pending_update_count > 0 && (
                    <span className="text-xs text-muted-foreground">({webhookInfo.pending_update_count} pending)</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <NeoButton
                variant="default"
                onClick={handleSetWebhook}
                disabled={settingWebhook || !settings?.botToken}
                className="flex-1 sm:flex-none"
              >
                {webhookInfo?.url ? <RefreshCw className="w-4 h-4" /> : <Webhook className="w-4 h-4" />}
                {settingWebhook ? 'Memproses...' : webhookInfo?.url ? 'Perbarui' : 'Pasang Webhook'}
              </NeoButton>
              {webhookInfo?.url && (
                <NeoButton
                  variant="destructive"
                  size="icon"
                  onClick={handleDeleteWebhook}
                  disabled={settingWebhook}
                >
                  <Trash2 className="w-4 h-4" />
                </NeoButton>
              )}
            </div>
          </div>
          
          {webhookInfo?.url && (
            <div className="bg-muted/50 p-3 rounded-lg text-xs font-mono break-all text-muted-foreground border border-border/50">
              {webhookInfo.url}
            </div>
          )}
          
          {!settings?.botToken && (
            <p className="text-sm text-muted-foreground">
              Simpan pengaturan bot terlebih dahulu sebelum memasang webhook.
            </p>
          )}
          
          {/* Troubleshooting Info */}
          <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Bot tidak merespon /start?</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Pastikan Bot Token sudah benar</li>
                  <li>Pastikan Status Bot dalam keadaan <strong>Aktif</strong></li>
                  <li>Klik tombol <strong>Pasang Webhook</strong> di atas</li>
                  <li>Tunggu beberapa detik lalu coba /start lagi</li>
                </ol>
                <p className="mt-2 text-amber-500 font-medium">
                  Penting: Webhook harus dipasang dari URL production (bukan localhost). 
                  Pastikan aplikasi sudah di-deploy ke Vercel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User QRIS Settings Card */}
      <div className={`p-5 rounded-xl border ${
        userQris?.isActive 
          ? 'bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-orange-500/30' 
          : 'bg-card border-border'
      }`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                userQris?.isActive ? 'bg-orange-500/20 text-orange-500' : 'bg-muted text-muted-foreground'
              }`}>
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">QRIS Pribadi (Opsional)</p>
                <div className="flex items-center gap-2 mt-1">
                  <NeoBadge variant={userQris?.isActive ? 'success' : 'secondary'}>
                    {userQris?.isActive ? 'Aktif' : 'Tidak Aktif'}
                  </NeoBadge>
                  {userQris?.merchantId && (
                    <span className="text-xs text-muted-foreground">ID: {userQris.merchantId}</span>
                  )}
                </div>
              </div>
            </div>
            {userQris?.isActive && (
              <NeoButton
                variant="destructive"
                size="sm"
                onClick={handleDeleteQris}
                disabled={savingQris}
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </NeoButton>
            )}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-300">
              <p className="font-medium mb-1">Apa itu QRIS Pribadi?</p>
              <p className="text-blue-300/80">
                Jika Anda memiliki akun Orkut QRIS sendiri, Anda bisa menggunakannya untuk menerima pembayaran langsung ke rekening Anda. Jika tidak diatur, pembayaran akan menggunakan QRIS admin.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Username Orkut
              </label>
              <NeoInput
                type="text"
                placeholder="username_orkut"
                value={qrisForm.username}
                onChange={(e) => setQrisForm(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Auth Token
              </label>
              <div className="relative">
                <NeoInput
                  type={showQrisToken ? 'text' : 'password'}
                  placeholder={userQris ? '••••••• (tersimpan)' : 'format: merchantId:token'}
                  value={qrisForm.token}
                  onChange={(e) => setQrisForm(prev => ({ ...prev, token: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowQrisToken(!showQrisToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showQrisToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Merchant ID
              </label>
              <NeoInput
                type="text"
                placeholder="1234567"
                value={qrisForm.merchantId}
                onChange={(e) => setQrisForm(prev => ({ ...prev, merchantId: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Code QR (QRIS String)
              </label>
              <NeoTextarea
                placeholder="00020101021126670016COM.NOBUBANK.WWW..."
                value={qrisForm.codeQr}
                onChange={(e) => setQrisForm(prev => ({ ...prev, codeQr: e.target.value }))}
                rows={3}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                String QRIS dari akun Anda. Bisa didapat dari dashboard Orkut.
              </p>
            </div>
          </div>

          <NeoButton
            onClick={handleSaveQris}
            disabled={savingQris || !qrisForm.merchantId || !qrisForm.codeQr}
            className="w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            {savingQris ? 'Menyimpan...' : userQris ? 'Update QRIS' : 'Simpan QRIS'}
          </NeoButton>
        </div>
      </div>

      {/* WhatsApp Bot Settings Card */}
      <div className={`p-5 rounded-xl border ${
        waSettings?.waConnected 
          ? 'bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30' 
          : waSettings?.waApiKey 
            ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30'
            : 'bg-card border-border'
      }`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                waSettings?.waConnected 
                  ? 'bg-green-500/20 text-green-500' 
                  : waSettings?.waApiKey 
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : 'bg-muted text-muted-foreground'
              }`}>
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">WhatsApp Bot</p>
                <div className="flex items-center gap-2 mt-1">
                  <NeoBadge variant={waSettings?.waConnected ? 'success' : waSettings?.waApiKey ? 'warning' : 'secondary'}>
                    {waSettings?.waConnected ? 'Terhubung' : waSettings?.waApiKey ? 'Belum Terhubung' : 'Belum Dikonfigurasi'}
                  </NeoBadge>
                  {waSettings?.waNumber && (
                    <span className="text-xs text-muted-foreground">+{waSettings.waNumber}</span>
                  )}
                </div>
              </div>
            </div>
            {waSettings?.waApiKey && (
              <NeoButton
                variant="destructive"
                size="sm"
                onClick={handleDeleteWaSettings}
                disabled={savingWa}
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </NeoButton>
            )}
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-2">
            <Smartphone className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div className="text-xs text-green-300">
              <p className="font-medium mb-1">WhatsApp Bot</p>
              <p className="text-green-300/80">
                Jalankan bot WhatsApp di cPanel/VPS Anda menggunakan API Key di bawah. Bot WhatsApp akan terhubung dengan data produk dan order yang sama dengan bot Telegram.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Nomor WhatsApp
              </label>
              <div className="flex gap-2">
                <NeoInput
                  type="text"
                  placeholder="628123456789"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 font-mono"
                />
                <NeoButton
                  onClick={handleUpdateWaNumber}
                  disabled={savingWa || !waNumber}
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                </NeoButton>
              </div>
              <p className="text-xs text-muted-foreground">
                Nomor WhatsApp tanpa + atau spasi. Contoh: 628123456789
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                API Key
              </label>
              {waSettings?.waApiKey ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <NeoInput
                      type={showWaApiKey ? 'text' : 'password'}
                      value={waSettings.waApiKey}
                      readOnly
                      className="pr-10 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWaApiKey(!showWaApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showWaApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <NeoButton
                    onClick={copyApiKey}
                    size="sm"
                    variant={copiedApiKey ? 'success' : 'outline'}
                  >
                    {copiedApiKey ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </NeoButton>
                  <NeoButton
                    onClick={handleGenerateWaApiKey}
                    disabled={savingWa}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </NeoButton>
                </div>
              ) : (
                <NeoButton
                  onClick={handleGenerateWaApiKey}
                  disabled={savingWa}
                  className="w-full sm:w-auto"
                >
                  <Key className="w-4 h-4" />
                  {savingWa ? 'Membuat...' : 'Generate API Key'}
                </NeoButton>
              )}
              <p className="text-xs text-muted-foreground">
                API Key digunakan untuk autentikasi bot WhatsApp ke server.
              </p>
            </div>

            {waSettings?.waApiKey && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">
                  User ID
                </label>
                <div className="flex gap-2">
                  <NeoInput
                    type="text"
                    value={settings?.userId || ''}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <NeoButton
                    onClick={() => {
                      if (settings?.userId) {
                        navigator.clipboard.writeText(settings.userId)
                        setMessage({ type: 'success', text: 'User ID disalin!' })
                      }
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4" />
                  </NeoButton>
                </div>
                <p className="text-xs text-muted-foreground">
                  User ID Anda untuk konfigurasi bot WhatsApp.
                </p>
              </div>
            )}

            {waSettings?.waLastConnected && (
              <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground border border-border/50">
                <p>Terakhir terhubung: {new Date(waSettings.waLastConnected).toLocaleString('id-ID')}</p>
              </div>
            )}
          </div>

          {/* Setup Instructions */}
          <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Cara Setup WhatsApp Bot:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Generate API Key di atas</li>
                  <li>Download folder <code className="bg-muted px-1 rounded">whatsapp-bot</code> dari project</li>
                  <li>Upload ke cPanel/VPS Anda</li>
                  <li>Edit file <code className="bg-muted px-1 rounded">config.json</code> dengan API Key & User ID</li>
                  <li>Jalankan <code className="bg-muted px-1 rounded">npm start</code> dan scan pairing code</li>
                </ol>
                <p className="mt-2">
                  <a href="/api/whatsapp/download-bot" className="text-primary hover:underline inline-flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    Download WhatsApp Bot Files
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Configuration */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <div className="mb-5">
          <h3 className="font-semibold">Konfigurasi Bot</h3>
          <p className="text-sm text-muted-foreground">
            Masukkan token bot dari BotFather dan ID Telegram Anda
          </p>
        </div>
        
        <form action={handleSubmit}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="botToken" className="text-sm font-medium text-muted-foreground">
                Bot Token
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="botToken"
                  name="botToken"
                  type={showToken ? 'text' : 'password'}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="pl-11 pr-12 font-mono text-sm"
                  defaultValue={settings?.botToken || ''}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Dapatkan token dari @BotFather di Telegram
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="ownerId" className="text-sm font-medium text-muted-foreground">
                Owner ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="ownerId"
                  name="ownerId"
                  type="text"
                  placeholder="123456789"
                  className="pl-11 font-mono"
                  defaultValue={settings?.ownerId || ''}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                ID Telegram Anda. Dapatkan dari @userinfobot
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="botName" className="text-sm font-medium text-muted-foreground">
                Nama Bot (Opsional)
              </label>
              <div className="relative">
                <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="botName"
                  name="botName"
                  type="text"
                  placeholder="mybot"
                  className="pl-11"
                  defaultValue={settings?.botName || ''}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Username bot tanpa @ (untuk referensi)
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="botPhotoUrl" className="text-sm font-medium text-muted-foreground">
                URL Foto Bot (Opsional)
              </label>
              <div className="relative">
                <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="botPhotoUrl"
                  name="botPhotoUrl"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  className="pl-11"
                  defaultValue={settings?.botPhotoUrl || ''}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                URL gambar untuk tampilan bot (menu utama, list produk, dll). Gunakan link dari Catbox, Imgur, atau hosting lainnya.
              </p>
              {settings?.botPhotoUrl && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <img 
                    src={settings.botPhotoUrl} 
                    alt="Bot photo preview" 
                    className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                defaultChecked={settings?.isActive || false}
                className="w-5 h-5 rounded border-border accent-primary cursor-pointer"
              />
              <span className="font-medium text-sm">
                Aktifkan bot setelah menyimpan
              </span>
            </label>

            <NeoButton type="submit" disabled={saving} className="w-full sm:w-auto">
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </NeoButton>
          </div>
        </form>
      </div>

      {/* Help Card */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
        <h3 className="font-semibold mb-3">Cara Mendapatkan Token Bot</h3>
        <ol className="list-decimal list-inside flex flex-col gap-2 text-sm text-muted-foreground">
          <li>Buka Telegram dan cari @BotFather</li>
          <li>Kirim perintah /newbot untuk membuat bot baru</li>
          <li>Ikuti instruksi dan beri nama bot Anda</li>
          <li>Salin token yang diberikan ke field di atas</li>
          <li>Untuk Owner ID, cari @userinfobot dan kirim pesan apapun</li>
        </ol>
      </div>
    </div>
  )
}
