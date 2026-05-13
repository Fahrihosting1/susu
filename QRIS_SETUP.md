## QRIS Orkut Integration - Setup Guide

### Fitur yang Sudah Diimplementasi:

#### 1. **Settings QRIS (Dashboard Admin)**
- Pilihan antara **QRIS Admin (Default)** dan **QRIS Akun Sendiri**
- **QRIS Admin**: Cukup input Token + Username (API Key sudah di-hardcode di code)
- **QRIS Akun Sendiri**: Setup lengkap dengan Username, API Key, dan Token

**File:** `/dashboard/settings`

#### 2. **Bot Telegram Payment**
- Tombol "Bayar dengan Qris ✅" sudah aktif di bot
- Sistem otomatis:
  - Coba gunakan QRIS user (jika ada setup akun sendiri)
  - Fallback ke QRIS admin (default)
- Send QR code image ke Telegram user
- Button refresh status pembayaran

**File:** `/api/telegram/webhook`

#### 3. **Payment Tracking Page**
- Halaman publik `/payment-tracking` untuk tracking status
- Tidak perlu login untuk cek status
- Support berbagai status pembayaran

**File:** `/payment-tracking`

#### 4. **Orkut API Integration**
- Helper functions untuk create payment & check status
- Automatic QRIS generation
- Error handling & fallback mechanism

**File:** `/lib/orkut.ts`

---

### Setup Steps:

#### Step 1: Hardcode API Key
Edit `/lib/orkut.ts` dan tambahkan API Key Orkut Anda di constant:

```typescript
const ORKUT_API_KEY = 'your-api-key-here' // Tambahkan ini
```

Atau bisa juga di environment variable:
```
NEXT_PUBLIC_ORKUT_API_KEY=your-api-key-here
```

#### Step 2: Setup QRIS Admin (Default)
1. Buka Dashboard Settings
2. Pilih **QRIS Admin (Default)**
3. Input **Token** dan **Username** Orkut Anda
4. Klik "Simpan QRIS Admin"

#### Step 3: Testing Payment Flow
1. Buka Bot Telegram
2. Klik `/start`
3. List Produk → Pilih Produk → Beli
4. Pilih metode pembayaran **"Bayar dengan Qris ✅"**
5. Bot akan generate QRIS dan kirim QR code image

#### Step 4: Custom User QRIS (Optional)
Users bisa setup akun Orkut sendiri di:
- Dashboard Settings → Pilih **QRIS Akun Sendiri**
- Input semua credentials
- Sistem akan prioritas user QRIS, fallback ke admin QRIS

---

### Database Schema:

**QrisSettings:**
```
{
  id: string
  type: 'admin' | 'user'
  userId?: string
  username: string
  apiKey: string
  token: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

**Payment:**
```
{
  id: string
  orderId: string
  userId: string
  amount: number
  qrisUrl?: string
  transactionId?: string
  status: 'unpaid' | 'pending' | 'paid' | 'expired' | 'failed'
  paymentMethod: 'qris'
  createdAt: string
  updatedAt: string
}
```

---

### API Endpoints:

- `POST /api/payments/create-qris` - Generate QRIS
- `POST /api/payments/check-status` - Check payment status
- `GET/POST /api/settings/qris` - Manage QRIS settings
- `POST /api/payments/webhook/orkut` - Orkut callback webhook
- `GET /api/orders/[id]` - Get order details (public)
- `GET /payment-tracking` - Public tracking page

---

### Environment Variables:

```
NEXT_PUBLIC_ORKUT_API_KEY=your-api-key
ORKUT_API_BASE=https://api.orkut.cloud/v1
```

---

### Flow Diagram:

```
User di Bot → "Bayar QRIS"
    ↓
Check user QRIS di settings
    ↓
Jika ada → Use user QRIS
Jika tidak → Use admin QRIS (fallback)
    ↓
Call Orkut API → Create Payment
    ↓
Get QRIS Code & URL
    ↓
Send ke Telegram user dengan QR image
    ↓
User scan & bayar
    ↓
Orkut callback webhook
    ↓
Update payment status di database
    ↓
Order selesai & deliver items
```

---

### TODO (Optional Enhancement):

- [ ] Add webhook signature verification
- [ ] Add payment notification to user Telegram
- [ ] Add payment timeout handler (15 min expiry)
- [ ] Add retry mechanism untuk check status
- [ ] Add admin dashboard untuk payment history
- [ ] Add balance system integration

---

### File Structure:

```
app/
├── api/
│   ├── payments/
│   │   ├── create-qris/route.ts
│   │   ├── check-status/route.ts
│   │   └── webhook/orkut/route.ts
│   ├── settings/qris/route.ts
│   └── telegram/webhook/route.ts (updated)
├── payment-tracking/page.tsx
└── dashboard/settings/page.tsx (updated)

lib/
├── orkut.ts (new)
├── github-db.ts (updated)
└── constants.ts

types/
└── index.ts (updated)

actions/
└── qris.actions.ts (new)
```
