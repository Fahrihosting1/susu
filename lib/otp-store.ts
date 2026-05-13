// In-memory OTP store
// Note: In production with multiple instances, use Redis or database

interface OtpData {
  otp: string
  expiresAt: number
  userData: {
    name: string
    email: string
    password: string
  }
}

// Using global to persist across hot reloads in development
const globalForOtp = globalThis as unknown as {
  otpStore: Map<string, OtpData> | undefined
}

export const otpStore = globalForOtp.otpStore ?? new Map<string, OtpData>()

if (process.env.NODE_ENV !== 'production') {
  globalForOtp.otpStore = otpStore
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function setOtp(email: string, otp: string, userData: { name: string; email: string; password: string }): void {
  const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes
  otpStore.set(email.toLowerCase(), { otp, expiresAt, userData })
}

export function getOtp(email: string): OtpData | undefined {
  return otpStore.get(email.toLowerCase())
}

export function deleteOtp(email: string): void {
  otpStore.delete(email.toLowerCase())
}

export function verifyOtp(email: string, otp: string): { valid: boolean; error?: string; userData?: OtpData['userData'] } {
  const storedData = getOtp(email)
  
  if (!storedData) {
    return { valid: false, error: 'OTP tidak ditemukan. Silakan minta kode baru.' }
  }

  if (Date.now() > storedData.expiresAt) {
    deleteOtp(email)
    return { valid: false, error: 'OTP sudah kadaluarsa. Silakan minta kode baru.' }
  }

  if (storedData.otp !== otp) {
    return { valid: false, error: 'Kode OTP salah' }
  }

  return { valid: true, userData: storedData.userData }
}
