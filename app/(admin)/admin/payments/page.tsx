'use client'

import { useState, useEffect } from 'react'
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardDescription, NeoCardContent, NeoCardFooter } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoInput } from '@/components/ui/neo-input'
import { NeoBadge } from '@/components/ui/neo-badge'
import { Save, Eye, EyeOff, AlertCircle, CheckCircle, CreditCard, QrCode, Loader2, Percent, Hash } from 'lucide-react'
import type { PaymentSettings } from '@/types'

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<Partial<PaymentSettings>>({
    orkutEnabled: false,
    orkutUsername: '',
    orkutApiKey: '',
    orkutToken: '',
    orkutMerchantId: '',
    orkutCodeQr: '',
    midtransEnabled: false,
    midtransServerKey: '',
    midtransClientKey: '',
    midtransIsProduction: false,
    midtransMerchantId: '',
    midtransFeeType: 'fixed',
    midtransFeeAmount: 0,
    midtransRandomFeeMin: 1,
    midtransRandomFeeMax: 100,
    defaultPaymentMethod: 'orkut',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showOrkutKeys, setShowOrkutKeys] = useState(false)
  const [showMidtransKeys, setShowMidtransKeys] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/payment-settings')
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Payment settings saved successfully!' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-white/60 text-sm">Loading payment settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Payment Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your payment gateway integrations</p>
      </div>

      {/* Alert Message */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Default Payment Method */}
      <NeoCard className="bg-card backdrop-blur-xl border border-border">
        <NeoCardHeader>
          <NeoCardTitle className="text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-violet-600" />
            </div>
            Default Payment Method
          </NeoCardTitle>
          <NeoCardDescription className="text-muted-foreground">
            Select the default payment method when both are enabled
          </NeoCardDescription>
        </NeoCardHeader>
        <NeoCardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, defaultPaymentMethod: 'orkut' })}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                settings.defaultPaymentMethod === 'orkut'
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-border bg-muted hover:border-border/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OK</span>
                </div>
                <div className="text-left">
                  <p className="text-foreground font-medium">Orkut QRIS</p>
                  <p className="text-muted-foreground text-xs">Order Kuota Payment</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, defaultPaymentMethod: 'midtrans' })}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                settings.defaultPaymentMethod === 'midtrans'
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-border bg-muted hover:border-border/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MT</span>
                </div>
                <div className="text-left">
                  <p className="text-foreground font-medium">Midtrans QRIS</p>
                  <p className="text-muted-foreground text-xs">Midtrans Gateway</p>
                </div>
              </div>
            </button>
          </div>
        </NeoCardContent>
      </NeoCard>

      {/* Orkut QRIS Settings */}
      <NeoCard className="bg-card backdrop-blur-xl border border-border">
        <NeoCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <NeoCardTitle className="text-foreground">Orkut QRIS (Order Kuota)</NeoCardTitle>
                <NeoCardDescription className="text-muted-foreground">Configure your Orkut QRIS integration</NeoCardDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, orkutEnabled: !settings.orkutEnabled })}
              className={`relative w-14 h-7 rounded-full transition-all ${
                settings.orkutEnabled ? 'bg-cyan-500' : 'bg-white/20'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all ${
                settings.orkutEnabled ? 'left-8' : 'left-1'
              }`} />
            </button>
          </div>
        </NeoCardHeader>
        <NeoCardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Username</label>
              <NeoInput
                value={settings.orkutUsername || ''}
                onChange={(e) => setSettings({ ...settings, orkutUsername: e.target.value })}
                placeholder="Enter Orkut username"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Merchant ID</label>
              <NeoInput
                value={settings.orkutMerchantId || ''}
                onChange={(e) => setSettings({ ...settings, orkutMerchantId: e.target.value })}
                placeholder="Enter merchant ID"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">API Key</label>
              <button
                type="button"
                onClick={() => setShowOrkutKeys(!showOrkutKeys)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showOrkutKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <NeoInput
              type={showOrkutKeys ? 'text' : 'password'}
              value={settings.orkutApiKey || ''}
              onChange={(e) => setSettings({ ...settings, orkutApiKey: e.target.value })}
              placeholder="Enter API key"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Token</label>
            <NeoInput
              type={showOrkutKeys ? 'text' : 'password'}
              value={settings.orkutToken || ''}
              onChange={(e) => setSettings({ ...settings, orkutToken: e.target.value })}
              placeholder="Enter token"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">QRIS Code</label>
            <NeoInput
              value={settings.orkutCodeQr || ''}
              onChange={(e) => setSettings({ ...settings, orkutCodeQr: e.target.value })}
              placeholder="Enter QRIS code string"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </NeoCardContent>
      </NeoCard>

      {/* Midtrans Settings */}
      <NeoCard className="bg-card backdrop-blur-xl border border-border">
        <NeoCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <NeoCardTitle className="text-foreground">Midtrans QRIS</NeoCardTitle>
                <NeoCardDescription className="text-muted-foreground">Configure your Midtrans payment gateway</NeoCardDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, midtransEnabled: !settings.midtransEnabled })}
              className={`relative w-14 h-7 rounded-full transition-all ${
                settings.midtransEnabled ? 'bg-violet-500' : 'bg-white/20'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all ${
                settings.midtransEnabled ? 'left-8' : 'left-1'
              }`} />
            </button>
          </div>
        </NeoCardHeader>
        <NeoCardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Merchant ID</label>
            <NeoInput
              value={settings.midtransMerchantId || ''}
              onChange={(e) => setSettings({ ...settings, midtransMerchantId: e.target.value })}
              placeholder="Enter Midtrans merchant ID"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Server Key</label>
              <button
                type="button"
                onClick={() => setShowMidtransKeys(!showMidtransKeys)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showMidtransKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <NeoInput
              type={showMidtransKeys ? 'text' : 'password'}
              value={settings.midtransServerKey || ''}
              onChange={(e) => setSettings({ ...settings, midtransServerKey: e.target.value })}
              placeholder="Enter server key (SB-Mid-server-xxx)"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Client Key</label>
            <NeoInput
              type={showMidtransKeys ? 'text' : 'password'}
              value={settings.midtransClientKey || ''}
              onChange={(e) => setSettings({ ...settings, midtransClientKey: e.target.value })}
              placeholder="Enter client key (SB-Mid-client-xxx)"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
            <div>
              <p className="text-foreground font-medium">Production Mode</p>
              <p className="text-muted-foreground text-sm">Enable for live transactions</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, midtransIsProduction: !settings.midtransIsProduction })}
              className={`relative w-14 h-7 rounded-full transition-all ${
                settings.midtransIsProduction ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all ${
                settings.midtransIsProduction ? 'left-8' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Fee Settings */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 space-y-4">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-violet-600" />
              <p className="text-foreground font-medium">Fee Settings</p>
            </div>
            
            {/* Fee Type */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, midtransFeeType: 'fixed' })}
                className={`flex-1 p-3 rounded-lg border transition-all ${
                  settings.midtransFeeType === 'fixed'
                    ? 'border-violet-500 bg-violet-500/20 text-foreground'
                    : 'border-border bg-muted text-muted-foreground hover:border-border/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm font-medium">Nominal Tetap (Rp)</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, midtransFeeType: 'percent' })}
                className={`flex-1 p-3 rounded-lg border transition-all ${
                  settings.midtransFeeType === 'percent'
                    ? 'border-violet-500 bg-violet-500/20 text-foreground'
                    : 'border-border bg-muted text-muted-foreground hover:border-border/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  <span className="text-sm font-medium">Persentase (%)</span>
                </div>
              </button>
            </div>

            {/* Fee Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {settings.midtransFeeType === 'fixed' ? 'Nominal Fee (Rp)' : 'Persentase Fee (%)'}
              </label>
              <NeoInput
                type="number"
                value={settings.midtransFeeAmount || 0}
                onChange={(e) => setSettings({ ...settings, midtransFeeAmount: parseFloat(e.target.value) || 0 })}
                placeholder={settings.midtransFeeType === 'fixed' ? 'Contoh: 1000' : 'Contoh: 2.5'}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                min={0}
                step={settings.midtransFeeType === 'percent' ? '0.1' : '100'}
              />
              <p className="text-xs text-muted-foreground">
                {settings.midtransFeeType === 'fixed' 
                  ? 'Fee akan ditambahkan ke setiap transaksi'
                  : 'Fee dihitung dari persentase total harga produk'}
              </p>
            </div>

            {/* Random Fee Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Random Fee Min</label>
                <NeoInput
                  type="number"
                  value={settings.midtransRandomFeeMin || 1}
                  onChange={(e) => setSettings({ ...settings, midtransRandomFeeMin: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Random Fee Max</label>
                <NeoInput
                  type="number"
                  value={settings.midtransRandomFeeMax || 100}
                  onChange={(e) => setSettings({ ...settings, midtransRandomFeeMax: parseInt(e.target.value) || 100 })}
                  placeholder="100"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  min={0}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Random fee akan ditambahkan ke fee dasar (antara min dan max) untuk membuat kode unik setiap transaksi
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 font-medium text-sm">Environment Notice</p>
                <p className="text-amber-400/80 text-xs mt-1">
                  {settings.midtransIsProduction 
                    ? 'Production mode is enabled. Real transactions will be processed.'
                    : 'Sandbox mode is active. Use test credentials for testing.'}
                </p>
              </div>
            </div>
          </div>
        </NeoCardContent>
      </NeoCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <NeoButton
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white border-0 min-w-[200px]"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </NeoButton>
      </div>
    </div>
  )
}
