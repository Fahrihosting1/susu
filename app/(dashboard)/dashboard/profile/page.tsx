'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Calendar, Save, Lock, AlertCircle, CheckCircle, Link, Activity, LogIn, LogOut, Key, UserCog, Bot, Monitor, Smartphone, Globe, Crown } from 'lucide-react'
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardDescription, NeoCardContent, NeoCardFooter } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoInput } from '@/components/ui/neo-input'
import { updateProfileAction, changePasswordAction } from '@/actions/settings.actions'
import type { SessionUser, AccountActivity } from '@/types'

export default function ProfilePage() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activities, setActivities] = useState<AccountActivity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)

  useEffect(() => {
    fetchUser()
    fetchActivities()
  }, [])

  async function fetchUser() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchActivities() {
    try {
      const res = await fetch('/api/account/activities')
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoadingActivities(false)
    }
  }

  async function handleProfileSubmit(formData: FormData) {
    setSavingProfile(true)
    setMessage(null)
    
    const result = await updateProfileAction(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' })
      fetchUser()
    }
    
    setSavingProfile(false)
  }

  async function handlePasswordSubmit(formData: FormData) {
    setSavingPassword(true)
    setMessage(null)
    
    const result = await changePasswordAction(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Password berhasil diubah!' })
    }
    
    setSavingPassword(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 bg-primary neo-border animate-pulse" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">Profil</h1>
        <p className="text-muted-foreground">Kelola informasi akun Anda</p>
      </div>

      {message && (
        <div
          className={`p-4 neo-border-2 flex items-center gap-3 ${
            message.type === 'success' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Profile Card */}
      <NeoCard className="bg-secondary text-secondary-foreground">
        <NeoCardContent className="flex items-center gap-6">
          <div className="relative">
            {user.profilePhotoUrl ? (
              <img 
                src={user.profilePhotoUrl} 
                alt={user.name}
                className="w-20 h-20 neo-border-2 object-cover"
                onError={(e) => {
                  // Fallback to initial if image fails
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={`w-20 h-20 bg-white neo-border-2 flex items-center justify-center font-black text-3xl text-secondary ${user.profilePhotoUrl ? 'hidden' : ''}`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            {/* VIP ring indicator */}
            {user.hasActiveSubscription && (
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 -z-10 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-black text-xl">{user.name}</p>
              {user.hasActiveSubscription && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30">
                  <Crown className="w-3 h-3" />
                  Sewa VIP
                </span>
              )}
            </div>
            <p className="opacity-80">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 text-sm opacity-70">
              <Calendar className="w-4 h-4" />
              Bergabung {new Date(user.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
            {user.hasActiveSubscription && user.subscriptionEndDate && (
              <div className="flex items-center gap-2 mt-1 text-sm">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400">
                  VIP sampai {new Date(user.subscriptionEndDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        </NeoCardContent>
      </NeoCard>

      {/* Update Profile */}
      <NeoCard>
        <NeoCardHeader>
          <NeoCardTitle>Informasi Profil</NeoCardTitle>
          <NeoCardDescription>
            Perbarui nama dan email Anda
          </NeoCardDescription>
        </NeoCardHeader>
        
        <form action={handleProfileSubmit}>
          <NeoCardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-bold uppercase tracking-wide">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={user.name}
                  className="pl-11"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-bold uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  className="pl-11"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="profilePhotoUrl" className="text-sm font-bold uppercase tracking-wide">
                URL Foto Profil (Opsional)
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="profilePhotoUrl"
                  name="profilePhotoUrl"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  defaultValue={user.profilePhotoUrl || ''}
                  className="pl-11"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Masukkan URL gambar dari Catbox, Imgur, atau hosting lainnya
              </p>
              {user.profilePhotoUrl && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <img 
                    src={user.profilePhotoUrl} 
                    alt="Profile preview" 
                    className="w-16 h-16 object-cover neo-border-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </NeoCardContent>

          <NeoCardFooter>
            <NeoButton type="submit" disabled={savingProfile}>
              <Save className="w-5 h-5" />
              {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
            </NeoButton>
          </NeoCardFooter>
        </form>
      </NeoCard>

      {/* Change Password */}
      <NeoCard>
        <NeoCardHeader>
          <NeoCardTitle>Ubah Password</NeoCardTitle>
          <NeoCardDescription>
            Pastikan password baru minimal 6 karakter
          </NeoCardDescription>
        </NeoCardHeader>
        
        <form action={handlePasswordSubmit}>
          <NeoCardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="currentPassword" className="text-sm font-bold uppercase tracking-wide">
                Password Saat Ini
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  placeholder="Masukkan password saat ini"
                  className="pl-11"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="newPassword" className="text-sm font-bold uppercase tracking-wide">
                Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="Min. 6 karakter"
                  className="pl-11"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="text-sm font-bold uppercase tracking-wide">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Ulangi password baru"
                  className="pl-11"
                  required
                  minLength={6}
                />
              </div>
            </div>
          </NeoCardContent>

          <NeoCardFooter>
            <NeoButton type="submit" variant="secondary" disabled={savingPassword}>
              <Lock className="w-5 h-5" />
              {savingPassword ? 'Menyimpan...' : 'Ubah Password'}
            </NeoButton>
          </NeoCardFooter>
        </form>
      </NeoCard>

      {/* Account Activity */}
      <NeoCard>
        <NeoCardHeader>
          <NeoCardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Aktivitas Akun
          </NeoCardTitle>
          <NeoCardDescription>
            Riwayat login dan aktivitas akun Anda
          </NeoCardDescription>
        </NeoCardHeader>
        
        <NeoCardContent>
          {loadingActivities ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 bg-primary neo-border animate-pulse" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada aktivitas tercatat
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 neo-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 neo-border ${getActivityColor(activity.action)}`}>
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm">
                        {getActivityLabel(activity.action)}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatActivityDate(activity.createdAt)}
                      </span>
                    </div>
                    {activity.details && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.details}
                      </p>
                    )}
                    {activity.deviceInfo && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        {activity.deviceInfo.includes('Android') || activity.deviceInfo.includes('iOS') ? (
                          <Smartphone className="w-3 h-3" />
                        ) : (
                          <Monitor className="w-3 h-3" />
                        )}
                        <span>{activity.deviceInfo}</span>
                      </div>
                    )}
                    {activity.ipAddress && activity.ipAddress !== 'Unknown' && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Globe className="w-3 h-3" />
                        <span>IP: {activity.ipAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </NeoCardContent>
      </NeoCard>
    </div>
  )
}

// Helper functions for activity display
function getActivityIcon(action: string) {
  switch (action) {
    case 'login':
      return <LogIn className="w-4 h-4" />
    case 'logout':
      return <LogOut className="w-4 h-4" />
    case 'register':
      return <User className="w-4 h-4" />
    case 'password_change':
      return <Key className="w-4 h-4" />
    case 'profile_update':
      return <UserCog className="w-4 h-4" />
    case 'bot_activate':
    case 'bot_deactivate':
      return <Bot className="w-4 h-4" />
    default:
      return <Activity className="w-4 h-4" />
  }
}

function getActivityLabel(action: string) {
  switch (action) {
    case 'login':
      return 'Login'
    case 'logout':
      return 'Logout'
    case 'register':
      return 'Registrasi'
    case 'password_change':
      return 'Ubah Password'
    case 'profile_update':
      return 'Update Profil'
    case 'bot_activate':
      return 'Bot Diaktifkan'
    case 'bot_deactivate':
      return 'Bot Dinonaktifkan'
    case 'product_create':
      return 'Produk Dibuat'
    case 'product_update':
      return 'Produk Diupdate'
    case 'product_delete':
      return 'Produk Dihapus'
    case 'order_complete':
      return 'Order Selesai'
    case 'withdrawal_request':
      return 'Request Withdraw'
    default:
      return action
  }
}

function getActivityColor(action: string) {
  switch (action) {
    case 'login':
      return 'bg-green-500/20 text-green-500'
    case 'logout':
      return 'bg-orange-500/20 text-orange-500'
    case 'register':
      return 'bg-blue-500/20 text-blue-500'
    case 'password_change':
      return 'bg-yellow-500/20 text-yellow-500'
    case 'profile_update':
      return 'bg-purple-500/20 text-purple-500'
    case 'bot_activate':
      return 'bg-emerald-500/20 text-emerald-500'
    case 'bot_deactivate':
      return 'bg-red-500/20 text-red-500'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function formatActivityDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'Baru saja'
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000)
    return `${mins} menit lalu`
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} jam lalu`
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days} hari lalu`
  }
  
  // Show full date
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
