# QRIS Orkut - Setup Final

## 1. Environment Variables Setup

Tambahkan ke file `.env.local`:

```env
# Orkut Admin Credentials
ORKUT_ADMIN_USERNAME=comot4zie
ORKUT_ADMIN_API_KEY=new2025
ORKUT_ADMIN_AUTH_TOKEN=2008874:buGS6koVX4aATv8pZR1znsQrBDi5tgc0
ORKUT_ADMIN_MERCHANT_ID=2008874
ORKUT_ADMIN_CODE_QR=00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214057526533688570303UMI51440014ID.CO.QRIS.WWW0215ID20243395197280303UMI5204541153033605802ID5923GUNAWAN%20STORE%20OK20088746009PONTIANAK61057811162070703A01630477D2
```

## 2. API Integration

API sudah terintegrasi di `lib/orkut.ts` dengan:

### Membuat QRIS:
```typescript
const result = await createOrkutQrisPayment(
  amount,           // Jumlah (akan ditambah fee)
  description,      // Deskripsi
  'admin',         // atau 'user'
  userId           // optional jika user QRIS
)

// Response
{
  success: true,
  transactionId: 'FAHRI-B1ND0U3E',
  qrsImageUrl: 'https://api.qrserver.com/...',  // QR Image
  qrString: '00020101...',                       // Raw QRIS String
  amount: 10100,           // Total dengan fee
  originalAmount: 10000,   // Amount asli
  fee: 100,               // Fee yang digenerate random
  expiresAt: '2026-05-02T00:14:06.204Z'
}
```

### Check Status:
```typescript
const status = await checkOrkutPaymentStatus(
  transactionId,  // dari response create
  'admin'        // atau 'user'
)

// Response
{
  success: true,
  status: 'paid',  // atau 'pending', 'failed'
  amount: '10',
  brand: 'DANA',
  description: 'NOBU / EV**...'
}
```

## 3. Bot QRIS Payment Flow

### User di Bot:
1. `/start` → Pilih produk → `Bayar dengan Qris ✅`
2. Bot generate QRIS dengan fee random 100-200
3. Bot send QR image dari Orkut API
4. User bisa click `✅ Cek Status Pembayaran` untuk check realtime
5. Setelah pembayaran sukses, status auto update

### Message Preview:
```
💳 PEMBAYARAN QRIS

📦 Produk: Kuota 10GB
📊 Jumlah: 1x
💰 Harga: Rp 10.000
💸 Admin Fee: Rp 150
───────────────
💵 Total Bayar: Rp 10.150

🆔 ID Transaksi: FAHRI-B1ND0U3E

📌 Instruksi Pembayaran:
1. Buka aplikasi e-wallet/banking
2. Scan QR Code di bawah
3. Ikuti proses pembayaran
4. Tunggu konfirmasi (otomatis)

⏱️ Berlaku sampai: 02/05/2026 07:14:06

Pembayaran akan diproses secara otomatis setelah berhasil.
```

**Buttons:**
- ✅ Cek Status Pembayaran (real-time check)
- 🔄 Refresh (ulangi check)
- ❌ Batal (cancel order)

## 4. Status Check Features

Real-time status update dengan:
- ✅ Auto-detect pembayaran sukses
- ⏳ Show pending jika belum bayar
- ❌ Alert jika expired/gagal
- 🏦 Show nama bank & keterangan pembayaran

## 5. Dashboard Integration

### Settings:
- Dashboard → Settings → "Pengaturan QRIS Orkut"
- Pilih: Admin Default atau User Custom
- Simpan credentials

### Payment Tracking:
- `/payment-tracking` - public page untuk track pembayaran
- Recent orders di dashboard show payment status
- Admin bisa lihat history pembayaran

## 6. Fee System

- Random fee 100-200 per transaksi
- Ditambahkan otomatis ke amount
- Tampil di pesan pembayaran
- Masuk ke akun Orkut admin

## Testing

1. Setup `.env.local` dengan credentials
2. Jalankan bot: `/start`
3. Pilih produk
4. Click `Bayar dengan Qris ✅`
5. Bot akan generate QRIS + kirim QR image
6. Click `Cek Status Pembayaran` untuk test status check
