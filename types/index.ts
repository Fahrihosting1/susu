export interface User {
  id: string
  email: string
  name: string
  password: string
  role: 'user' | 'admin'
  profilePhotoUrl?: string // URL foto profil user
  createdAt: string
  updatedAt: string
}

export interface BotSettings {
  id: string
  userId: string
  botToken: string
  ownerId: string
  botName?: string
  isActive: boolean
  preferredPaymentMethod?: 'orkut' | 'midtrans' // User's preferred payment method
  botPhotoUrl?: string // URL foto untuk sendPhoto di bot (menu, list produk, dll)
  // WhatsApp Bot Settings
  waNumber?: string // WhatsApp number (e.g., 628123456789)
  waApiKey?: string // API key for WhatsApp bot authentication
  waConnected?: boolean // Connection status
  waSessionId?: string // Session ID for reconnection
  waLastConnected?: string // Last connection timestamp
  createdAt: string
  updatedAt: string
}

// Kategori Produk (Parent) - e.g., "Alight Motion", "Canva Pro"
export interface ProductCategory {
  id: string
  userId: string
  code: string // Unique code like "AM", "CP" - used to link products
  name: string // e.g., "Alight Motion", "Canva Pro"
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Produk/Variasi - e.g., "1 Tahun - 1 Akun", "30 Hari"
export interface Product {
  id: string
  userId: string
  categoryCode: string // References ProductCategory.code
  code: string // Unique product code for this variant
  name: string // e.g., "1 Tahun - 1 Akun", "AI Bot 30hari"
  description: string
  price: number
  stock: number // Auto-calculated from items.length
  isActive: boolean
  items: string[] // Stock items in email:password format
  successMessage?: string // Additional message sent after successful transaction
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  userId: string
  productId: string
  productName: string
  quantity: number
  totalPrice: number
  buyerName: string
  buyerContact: string
  buyerId?: string // for telegram users
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  notes?: string
  paymentStatus?: 'unpaid' | 'pending' | 'paid' | 'expired' | 'failed'
  paymentQrisUrl?: string
  paymentTransactionId?: string
  paymentMethod?: 'qris' | 'midtrans' | 'saldo' // Payment method used
  isSandbox?: boolean // true if paid with Midtrans Sandbox (not real money)
  createdAt: string
  updatedAt: string
}

export interface QrisSettings {
  id: string
  type: 'admin' | 'user'
  userId?: string // untuk user QRIS, admin QRIS tidak ada userId
  username: string // Orkut username
  apiKey: string // Orkut API key
  token: string // Orkut token
  merchantId: string // Orkut merchant ID
  codeQr: string // QRIS code string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  orderId: string
  userId: string
  amount: number
  qrisUrl?: string
  qrString?: string
  transactionId?: string
  status: 'unpaid' | 'pending' | 'paid' | 'expired' | 'failed'
  paymentMethod: 'qris' | 'midtrans'
  midtransTransactionId?: string
  qrisMessageId?: number // Message ID of QRIS photo for auto-delete
  qrisChatId?: number // Chat ID for auto-delete
  createdAt: string
  updatedAt: string
}

export interface PaymentSettings {
  id: string
  // Orkut QRIS Settings
  orkutEnabled: boolean
  orkutUsername: string
  orkutApiKey: string
  orkutToken: string
  orkutMerchantId: string
  orkutCodeQr: string
  // Midtrans Settings
  midtransEnabled: boolean
  midtransServerKey: string
  midtransClientKey: string
  midtransIsProduction: boolean
  midtransMerchantId: string
  // Fee Settings
  midtransFeeType: 'fixed' | 'percent' // Tipe fee: nominal tetap atau persentase
  midtransFeeAmount: number // Nominal fee (jika fixed) atau persentase (jika percent)
  midtransRandomFeeMin: number // Random fee min (default 1)
  midtransRandomFeeMax: number // Random fee max (default 100)
  // Default payment method
  defaultPaymentMethod: 'orkut' | 'midtrans'
  createdAt: string
  updatedAt: string
}

export interface Withdrawal {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  fee: number
  netAmount: number // amount - fee
  bankType: 'bca' | 'bni' | 'bri' | 'mandiri' | 'dana' | 'ovo' | 'gopay' | 'shopeepay'
  bankAccount: string // nomor rekening/HP
  bankAccountName: string // nama pemilik
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  adminNotes?: string
  processedAt?: string
  processedBy?: string
  createdAt: string
  updatedAt: string
}

// Fee structure for withdrawals
export const WITHDRAWAL_FEES: Record<string, number> = {
  bca: 6500,
  bni: 6500,
  bri: 6500,
  mandiri: 6500,
  dana: 1000,
  ovo: 1000,
  gopay: 1000,
  shopeepay: 1000,
}

export const BANK_LABELS: Record<string, string> = {
  bca: 'BCA',
  bni: 'BNI',
  bri: 'BRI',
  mandiri: 'Mandiri',
  dana: 'DANA',
  ovo: 'OVO',
  gopay: 'GoPay',
  shopeepay: 'ShopeePay',
}

// Bot subscription for premium features
export interface BotSubscription {
  id: string
  userId: string
  userName: string
  userEmail: string
  plan: '3month' // Currently only 3 months plan
  price: number // 25000
  status: 'pending' | 'active' | 'expired'
  orderId?: string // Reference to order if paid via order system
  paymentMethod: 'saldo' | 'qris'
  paymentTransactionId?: string // Transaction ID for QRIS payments
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

// Balance adjustment for admin manual top-up
export interface BalanceAdjustment {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  type: 'add' | 'deduct'
  reason: string
  adminId: string
  adminName: string
  createdAt: string
}

// Admin fee income from Midtrans payments
export interface AdminFeeIncome {
  id: string
  orderId: string
  buyerName: string
  productName: string
  originalAmount: number
  baseFee: number
  randomFee: number
  totalFee: number
  paymentMethod: 'midtrans'
  createdAt: string
}

// Bot activity log for real-time monitoring
export interface BotActivityLog {
  id: string
  botToken: string
  botName: string
  userId: string
  userName: string
  action: 'start' | 'menu' | 'order' | 'payment' | 'complete' | 'error' | 'spam_detected'
  telegramUserId: string
  telegramUsername?: string
  message?: string
  createdAt: string
}

// Account activity log for user login/action tracking
export interface AccountActivity {
  id: string
  userId: string
  action: 'login' | 'logout' | 'register' | 'password_change' | 'profile_update' | 'bot_activate' | 'bot_deactivate' | 'product_create' | 'product_update' | 'product_delete' | 'order_complete' | 'withdrawal_request'
  ipAddress?: string
  userAgent?: string
  deviceInfo?: string
  location?: string
  details?: string
  createdAt: string
}

// Error log for tracking system errors and user feature issues
export interface ErrorLog {
  id: string
  userId?: string // Optional - null for system errors
  userName?: string
  userEmail?: string
  type: 'system' | 'user_feature' | 'bot' | 'payment' | 'api' | 'database' | 'webhook'
  severity: 'info' | 'warning' | 'error' | 'critical'
  source: string // e.g., 'telegram-webhook', 'payment-create', 'order-process'
  message: string
  stackTrace?: string
  metadata?: Record<string, unknown> // Additional context data
  isSensitive: boolean // If true, only visible to admin
  status: 'new' | 'investigating' | 'resolved' | 'ignored'
  resolvedAt?: string
  resolvedBy?: string
  resolvedNote?: string
  createdAt: string
  updatedAt: string
}

// OTP Email Settings for registration verification
export interface OtpSettings {
  id: string
  fromEmail: string // Gmail address to send OTP from
  fromPass: string // Gmail App Password
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Database {
  users: User[]
  botSettings: BotSettings[]
  productCategories: ProductCategory[]
  products: Product[]
  orders: Order[]
  qrisSettings: QrisSettings[]
  payments: Payment[]
  paymentSettings: PaymentSettings | null
  otpSettings: OtpSettings | null
  withdrawals: Withdrawal[]
  balanceAdjustments: BalanceAdjustment[]
  botSubscriptions: BotSubscription[]
  adminFeeIncomes: AdminFeeIncome[]
  botActivityLogs: BotActivityLog[]
  accountActivities: AccountActivity[]
  errorLogs: ErrorLog[]
}

export type SessionUser = Omit<User, 'password'> & {
  hasActiveSubscription?: boolean
  subscriptionEndDate?: string | null
}
