# WhatsApp Store Bot - cPanel Version

Bot WhatsApp untuk toko digital menggunakan Baileys dengan Pairing Code.
**Dioptimalkan untuk berjalan di cPanel Node.js Selector.**

## Cara Setup di cPanel

### 1. Upload Files
- Buka **File Manager** di cPanel
- Buat folder baru, misal: `wabot`
- Upload semua file ini ke folder tersebut:
  - `index.js`
  - `package.json`
  - `config.json`

### 2. Edit config.json
```json
{
  "apiUrl": "https://domain-vercel-kamu.vercel.app",
  "apiKey": "API_KEY_DARI_DASHBOARD",
  "userId": "USER_ID_DARI_DASHBOARD",
  "ownerNumber": "628123456789",
  "phoneNumber": "628123456789",
  "botName": "Nama Bot Kamu",
  "httpPort": 3000,
  "autoRead": true
}
```

**Penting:**
- `apiUrl`: URL aplikasi Vercel kamu (tanpa / di akhir)
- `apiKey`: Ambil dari Dashboard > Settings > WhatsApp Bot
- `userId`: Ambil dari Dashboard > Settings > WhatsApp Bot
- `phoneNumber`: Nomor WA yang akan dijadikan bot (format: 628xxx)

### 3. Setup di Node.js Selector
1. Buka **Setup Node.js App** di cPanel
2. Klik **Create Application**
3. Isi form:
   - **Node.js version**: Pilih **18.x** atau **20.x** (WAJIB!)
   - **Application mode**: Production
   - **Application root**: `wabot` (nama folder)
   - **Application URL**: Pilih domain/subdomain
   - **Application startup file**: `index.js`
4. Klik **CREATE**

### 4. Install Dependencies
1. Setelah app dibuat, klik tombol **Run NPM Install**
2. Tunggu sampai selesai

### 5. Start Bot & Pairing
1. Klik **Restart** untuk menjalankan bot
2. **Buka URL aplikasi di browser** (misal: `https://whatsapp.domain.com`)
3. Kamu akan melihat halaman dengan **Pairing Code**
4. Buka WhatsApp di HP:
   - Settings > Linked Devices
   - Link a Device
   - Tap "Link with phone number instead"
   - Masukkan kode pairing yang muncul di browser
5. Setelah terhubung, halaman akan menunjukkan status **CONNECTED**

## Perintah Bot

| Perintah | Fungsi |
|----------|--------|
| `menu` / `start` | Tampilkan menu produk |
| `1`, `2`, ... | Pilih kategori/produk |
| `beli` | Konfirmasi pembelian |
| `cek` | Cek status pembayaran |

## Troubleshooting

### Error 503 Service Unavailable
- **Cek Node.js version** - HARUS 18+ (bukan 10.x atau 14.x)
- Cek log di cPanel: klik **View Log** di Node.js Selector
- Pastikan `npm install` sudah dijalankan

### Pairing Code Tidak Muncul
- Pastikan `phoneNumber` di config.json sudah diisi dengan benar
- Format nomor: `628123456789` (tanpa + atau spasi)
- Refresh halaman browser
- Cek log untuk error message

### Bot Tidak Konek ke API
- Pastikan `apiUrl` benar dan bisa diakses
- Pastikan `apiKey` dan `userId` sudah benar (copy dari dashboard)
- Test buka `https://apiUrl/api/whatsapp/verify` di browser

### Connection Replaced
- Ada sesi WhatsApp lain yang aktif
- Logout dari WhatsApp Web lain
- Hapus folder `session` via File Manager
- Restart bot dan pairing ulang

### Session Expired
- Hapus folder `session` di File Manager
- Restart bot
- Pairing ulang dengan kode baru

## Struktur Folder
```
wabot/
├── index.js        # File utama bot
├── package.json    # Dependencies
├── config.json     # Konfigurasi (EDIT INI!)
├── session/        # Session WhatsApp (auto-generated)
└── bot.log         # Log file (auto-generated)
```

## Requirements
- **Node.js 18+** (WAJIB! Baileys tidak support Node.js lama)
- cPanel dengan Node.js Selector
- Akun WhatsApp yang akan dijadikan bot
