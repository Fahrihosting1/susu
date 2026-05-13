'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, ArrowRight, AlertCircle, Loader2, Sparkles, UserPlus, KeyRound, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoInput } from '@/components/ui/neo-input'
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardDescription, NeoCardContent, NeoCardFooter } from '@/components/ui/neo-card'

type Step = 'register' | 'verify'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('register')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // OTP enabled status
  const [otpEnabled, setOtpEnabled] = useState<boolean | null>(null)
  const [checkingOtp, setCheckingOtp] = useState(true)
  
  // Form data
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // OTP
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(0)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Check if OTP is enabled
  useEffect(() => {
    const checkOtpStatus = async () => {
      try {
        const res = await fetch('/api/auth/otp-status')
        const data = await res.json()
        setOtpEnabled(data.enabled)
      } catch {
        setOtpEnabled(false)
      } finally {
        setCheckingOtp(false)
      }
    }
    checkOtpStatus()
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && step === 'verify') {
      setCanResend(true)
    }
  }, [countdown, step])

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only allow digits
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only keep last digit
    setOtp(newOtp)
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char
    })
    setOtp(newOtp)
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus()
    }
  }

  // Direct register (when OTP is disabled)
  const handleDirectRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!name || !email || !password || !confirmPassword) {
        throw new Error('Semua field harus diisi')
      }

      if (password !== confirmPassword) {
        throw new Error('Password tidak cocok')
      }

      if (password.length < 6) {
        throw new Error('Password minimal 6 karakter')
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mendaftar')
      }

      toast.success('Berhasil!', {
        description: 'Akun berhasil dibuat',
        icon: <CheckCircle className="w-5 h-5" />,
      })

      router.push(data.redirectUrl || '/dashboard')

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(message)
      toast.error('Gagal', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  // Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!name || !email || !password || !confirmPassword) {
        throw new Error('Semua field harus diisi')
      }

      if (password !== confirmPassword) {
        throw new Error('Password tidak cocok')
      }

      if (password.length < 6) {
        throw new Error('Password minimal 6 karakter')
      }

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim OTP')
      }

      toast.success('OTP Terkirim', {
        description: 'Cek email Anda untuk kode verifikasi',
        icon: <CheckCircle className="w-5 h-5" />,
      })

      setStep('verify')
      setCountdown(300) // 5 minutes
      setCanResend(false)
      setOtp(['', '', '', '', '', ''])

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(message)
      toast.error('Gagal', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return
    
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim OTP')
      }

      toast.success('OTP Terkirim Ulang', {
        description: 'Cek email Anda untuk kode baru',
        icon: <CheckCircle className="w-5 h-5" />,
      })

      setCountdown(300)
      setCanResend(false)
      setOtp(['', '', '', '', '', ''])

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(message)
      toast.error('Gagal', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const otpCode = otp.join('')

    try {
      if (otpCode.length !== 6) {
        throw new Error('Masukkan 6 digit kode OTP')
      }

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verifikasi gagal')
      }

      toast.success('Berhasil!', {
        description: 'Akun berhasil dibuat',
        icon: <CheckCircle className="w-5 h-5" />,
      })

      router.push(data.redirectUrl || '/dashboard')

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(message)
      toast.error('Verifikasi Gagal', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Loading state while checking OTP status
  if (checkingOtp) {
    return (
      <NeoCard className="liquid-glass-heavy rounded-3xl shadow-ios-xl animate-scale-in">
        <NeoCardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Memuat...</p>
        </NeoCardContent>
      </NeoCard>
    )
  }

  // Registration Form
  if (step === 'register') {
    return (
      <NeoCard className="liquid-glass-heavy rounded-3xl shadow-ios-xl animate-scale-in">
        <NeoCardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-secondary to-primary rounded-3xl flex items-center justify-center mb-4 shadow-ios-lg animate-float relative">
            <UserPlus className="w-8 h-8 text-white" />
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-warning animate-pulse" />
          </div>
          <NeoCardTitle className="text-xl font-bold normal-case animate-slide-down text-foreground">Buat Akun Baru</NeoCardTitle>
          <NeoCardDescription className="animate-slide-down stagger-1 text-muted-foreground">
            Daftar untuk mulai sewa dan kelola bot Anda
          </NeoCardDescription>
        </NeoCardHeader>
        
        <NeoCardContent>
          <form onSubmit={otpEnabled ? handleSendOtp : handleDirectRegister} className="flex flex-col gap-4">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg border border-destructive/20 text-sm font-medium animate-shake flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-2 animate-slide-up stagger-1">
              <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                Nama Lengkap
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <NeoInput
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-11 transition-all focus:scale-[1.01]"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2 animate-slide-up stagger-2">
              <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                {otpEnabled ? 'Email Aktif' : 'Email'}
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <NeoInput
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 transition-all focus:scale-[1.01]"
                  required
                  disabled={isLoading}
                />
              </div>
              {otpEnabled && (
                <p className="text-xs text-muted-foreground">Kode OTP akan dikirim ke email ini</p>
              )}
            </div>
            
            <div className="flex flex-col gap-2 animate-slide-up stagger-3">
              <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <NeoInput
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 transition-all focus:scale-[1.01]"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2 animate-slide-up stagger-4">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">
                Konfirmasi Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <NeoInput
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11 transition-all focus:scale-[1.01]"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <NeoButton
              type="submit"
              className="w-full mt-2 animate-slide-up stagger-5"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : otpEnabled ? (
                <>
                  Kirim Kode OTP
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Daftar Sekarang
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </NeoButton>
          </form>
        </NeoCardContent>
        
        <NeoCardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground animate-slide-up stagger-6">
            Sudah punya akun?{' '}
            <Link 
              href="/login" 
              className="text-primary font-medium hover:underline underline-offset-4 transition-all hover:text-secondary"
            >
              Masuk
            </Link>
          </p>
        </NeoCardFooter>
      </NeoCard>
    )
  }

  // OTP Verification Form
  return (
    <NeoCard className="liquid-glass-heavy rounded-3xl shadow-ios-xl animate-scale-in">
      <NeoCardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center mb-4 shadow-ios-lg animate-float relative">
          <KeyRound className="w-8 h-8 text-white" />
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-warning animate-pulse" />
        </div>
        <NeoCardTitle className="text-xl font-bold normal-case animate-slide-down text-foreground">Verifikasi Email</NeoCardTitle>
        <NeoCardDescription className="animate-slide-down stagger-1 text-muted-foreground">
          Masukkan kode OTP yang dikirim ke
          <br />
          <span className="text-foreground font-medium">{email}</span>
        </NeoCardDescription>
      </NeoCardHeader>
      
      <NeoCardContent>
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg border border-destructive/20 text-sm font-medium animate-shake flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          
          {/* OTP Input */}
          <div className="flex flex-col items-center gap-4 animate-slide-up">
            <div className="flex gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-2xl border border-border/50 liquid-glass-light text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:shadow-ios transition-all disabled:opacity-50"
                  disabled={isLoading}
                />
              ))}
            </div>
            
            {/* Countdown */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Kode berlaku: <span className="text-primary font-mono font-bold">{formatTime(countdown)}</span>
                </p>
              ) : (
                <p className="text-sm text-destructive">Kode sudah kadaluarsa</p>
              )}
            </div>
          </div>
          
          <NeoButton
            type="submit"
            className="w-full"
            disabled={isLoading || otp.join('').length !== 6}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Verifikasi
                <CheckCircle className="w-4 h-4" />
              </>
            )}
          </NeoButton>
          
          {/* Resend OTP */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={!canResend || isLoading}
              className={`text-sm flex items-center gap-2 transition-all ${
                canResend 
                  ? 'text-primary hover:text-secondary cursor-pointer hover:underline' 
                  : 'text-muted-foreground cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Kirim ulang kode
            </button>
            
            <button
              type="button"
              onClick={() => {
                setStep('register')
                setError(null)
              }}
              disabled={isLoading}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Ganti email
            </button>
          </div>
        </form>
      </NeoCardContent>
    </NeoCard>
  )
}
