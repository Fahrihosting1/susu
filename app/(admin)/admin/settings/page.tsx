'use client'

import { useState, useEffect } from 'react'
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardDescription, NeoCardContent } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoInput } from '@/components/ui/neo-input'
import { Settings, Save, AlertCircle, CheckCircle, Loader2, Info, Mail, Eye, EyeOff } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

export default function AdminSettingsPage() {
  const [adminEmails, setAdminEmails] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  // OTP Settings
  const [otpFromEmail, setOtpFromEmail] = useState('')
  const [otpFromPass, setOtpFromPass] = useState('')
  const [otpIsActive, setOtpIsActive] = useState(false)
  const [showOtpPass, setShowOtpPass] = useState(false)
  const [loadingOtp, setLoadingOtp] = useState(true)
  const [savingOtp, setSavingOtp] = useState(false)
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load OTP settings on mount
  useEffect(() => {
    const loadOtpSettings = async () => {
      try {
        const res = await fetch('/api/admin/otp-settings')
        if (res.ok) {
          const data = await res.json()
          if (data.settings) {
            setOtpFromEmail(data.settings.fromEmail || '')
            setOtpFromPass(data.settings.fromPass || '')
            setOtpIsActive(data.settings.isActive || false)
          }
        }
      } catch (error) {
        console.error('Failed to load OTP settings:', error)
      } finally {
        setLoadingOtp(false)
      }
    }
    loadOtpSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    
    setTimeout(() => {
      setMessage({ 
        type: 'info', 
        text: 'Admin emails are configured via ADMIN_EMAILS environment variable on Vercel.' 
      })
      setSaving(false)
    }, 1000)
  }

  const handleSaveOtp = async () => {
    setSavingOtp(true)
    setOtpMessage(null)

    try {
      const res = await fetch('/api/admin/otp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromEmail: otpFromEmail,
          fromPass: otpFromPass,
          isActive: otpIsActive,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setOtpMessage({ type: 'success', text: 'Pengaturan OTP berhasil disimpan!' })
      } else {
        setOtpMessage({ type: 'error', text: data.error || 'Gagal menyimpan pengaturan OTP' })
      }
    } catch (error) {
      setOtpMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan' })
    } finally {
      setSavingOtp(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground mt-1">Configure system-wide settings</p>
      </div>

      {/* Alert Message */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : message.type === 'info'
            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : message.type === 'info' ? (
            <Info className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* OTP Email Settings */}
      <NeoCard className="bg-card backdrop-blur-xl border border-border">
        <NeoCardHeader>
          <NeoCardTitle className="text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-emerald-600" />
            </div>
            Email OTP Verification
          </NeoCardTitle>
          <NeoCardDescription className="text-muted-foreground">
            Konfigurasi email untuk verifikasi OTP saat registrasi akun baru
          </NeoCardDescription>
        </NeoCardHeader>
        <NeoCardContent className="space-y-4">
          {loadingOtp ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {otpMessage && (
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                  otpMessage.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                    : 'bg-red-500/10 border-red-500/20 text-red-600'
                }`}>
                  {otpMessage.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <p className="text-sm">{otpMessage.text}</p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
                <div>
                  <p className="text-foreground font-medium text-sm">Aktifkan Verifikasi OTP</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    User harus verifikasi email saat registrasi
                  </p>
                </div>
                <Switch
                  checked={otpIsActive}
                  onCheckedChange={setOtpIsActive}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Pengirim (Gmail)</label>
                <NeoInput
                  type="email"
                  value={otpFromEmail}
                  onChange={(e) => setOtpFromEmail(e.target.value)}
                  placeholder="youremail@gmail.com"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-muted-foreground text-xs">Email Gmail yang akan digunakan untuk mengirim kode OTP</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">App Password</label>
                <div className="relative">
                  <NeoInput
                    type={showOtpPass ? 'text' : 'password'}
                    value={otpFromPass}
                    onChange={(e) => setOtpFromPass(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOtpPass(!showOtpPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showOtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Bukan password biasa! Buat App Password di Google Account &gt; Security &gt; 2-Step Verification &gt; App passwords
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-400 font-medium text-sm">Cara Membuat App Password Gmail</p>
                    <ol className="text-amber-400/80 text-xs mt-2 space-y-1 list-decimal list-inside">
                      <li>Buka Google Account &gt; Security</li>
                      <li>Aktifkan 2-Step Verification jika belum</li>
                      <li>Cari &quot;App passwords&quot; di bagian bawah</li>
                      <li>Buat app password baru dengan nama bebas</li>
                      <li>Copy 16 karakter password yang muncul</li>
                    </ol>
                  </div>
                </div>
              </div>

              <NeoButton
                onClick={handleSaveOtp}
                disabled={savingOtp}
                className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white border-0"
              >
                {savingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Pengaturan OTP
                  </>
                )}
              </NeoButton>
            </>
          )}
        </NeoCardContent>
      </NeoCard>

      {/* Admin Emails */}
      <NeoCard className="bg-card backdrop-blur-xl border border-border">
        <NeoCardHeader>
          <NeoCardTitle className="text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Settings className="w-4 h-4 text-violet-600" />
            </div>
            Admin Access
          </NeoCardTitle>
          <NeoCardDescription className="text-muted-foreground">
            Configure which users have admin access to this panel
          </NeoCardDescription>
        </NeoCardHeader>
        <NeoCardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Admin Emails</label>
            <NeoInput
              value={adminEmails}
              onChange={(e) => setAdminEmails(e.target.value)}
              placeholder="admin@example.com, admin2@example.com"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-muted-foreground text-xs">Comma-separated list of admin email addresses</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 font-medium text-sm">Environment Variable Required</p>
                <p className="text-amber-400/80 text-xs mt-1">
                  To add admin access, set the <code className="bg-amber-500/20 px-1.5 py-0.5 rounded">ADMIN_EMAILS</code> environment 
                  variable on Vercel with comma-separated email addresses.
                </p>
              </div>
            </div>
          </div>

          <NeoButton
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white border-0"
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
        </NeoCardContent>
      </NeoCard>

      {/* Midtrans Webhook Info */}
      <NeoCard className="bg-card backdrop-blur-xl border border-border">
        <NeoCardHeader>
          <NeoCardTitle className="text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Info className="w-4 h-4 text-cyan-600" />
            </div>
            Webhook Configuration
          </NeoCardTitle>
        </NeoCardHeader>
        <NeoCardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-muted border border-border">
            <p className="text-foreground text-sm font-medium mb-2">Midtrans Webhook URL</p>
            <code className="text-cyan-600 text-xs bg-cyan-500/10 px-3 py-2 rounded-lg block break-all">
              {typeof window !== 'undefined' ? `${window.location.origin}/api/payments/midtrans/webhook` : '/api/payments/midtrans/webhook'}
            </code>
            <p className="text-muted-foreground text-xs mt-2">
              Set this URL in your Midtrans dashboard under Settings &gt; Configuration &gt; Payment Notification URL
            </p>
          </div>
        </NeoCardContent>
      </NeoCard>
    </div>
  )
}
