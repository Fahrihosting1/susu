# WhatsApp Store Bot

Bot WhatsApp untuk toko online menggunakan Baileys dengan sistem Pairing Code.

## Fitur

- Menu produk interaktif
- Pembayaran QRIS otomatis
- Auto-deliver setelah pembayaran
- Sinkronisasi dengan dashboard web

## Persyaratan

- Node.js 18+ 
- cPanel dengan Node.js atau VPS
- Akun WhatsApp aktif

## Instalasi

### 1. Upload ke cPanel/VPS

Upload folder `whatsapp-bot` ke server Anda.

### 2. Install Dependencies

```bash
cd whatsapp-bot
npm install
```

### 3. Konfigurasi

Edit file `config.json`:

```json
{
  "apiUrl": "https://your-vercel-app.vercel.app",
  "apiKey": "YOUR_API_KEY_HERE",
  "userId": "YOUR_USER_ID_HERE",
  "ownerNumber": "628123456789",
  "botName": "Store Bot",
  "prefix": ".",
  "autoRead": true,
  "publicMode": true
}
```

- `apiUrl`: URL aplikasi Vercel Anda
- `apiKey`: API Key dari dashboard > Pengaturan > WhatsApp Bot
- `userId`: User ID Anda dari dashboard
- `ownerNumber`: Nomor WhatsApp Anda (untuk notifikasi)
- `botName`: Nama bot yang akan ditampilkan
- `autoRead`: Auto-read pesan masuk

### 4. Jalankan Bot

```bash
npm start
```

### 5. Pairing Code

1. Masukkan nomor WhatsApp saat diminta (format: 628xxx)
2. Buka WhatsApp di HP
3. Pergi ke Settings > Linked Devices > Link a Device
4. Pilih "Link with phone number instead"
5. Masukkan kode pairing yang muncul di terminal

## Perintah Bot

| Perintah | Fungsi |
|----------|--------|
| `menu` / `start` | Tampilkan menu utama |
| `1`, `2`, ... | Pilih kategori/produk |
| `beli` | Konfirmasi pembelian |
| `cek` | Cek status pembayaran |

## Struktur Folder

```
whatsapp-bot/
├── index.js        # Main bot file
├── config.json     # Konfigurasi
├── package.json    # Dependencies
├── session/        # Session WhatsApp (auto-generated)
└── README.md       # Dokumentasi
```

## Troubleshooting

### Bot tidak terhubung ke API

1. Pastikan `apiUrl` benar (harus HTTPS)
2. Pastikan `apiKey` dan `userId` sesuai dengan dashboard
3. Cek koneksi internet server

### Session expired

1. Hapus folder `session`
2. Jalankan ulang bot
3. Lakukan pairing ulang

### Pesan tidak terkirim

1. Pastikan nomor tujuan valid
2. Cek log error di terminal
3. Restart bot jika perlu

## cPanel Setup

### Menggunakan Node.js Application

1. Login ke cPanel
2. Pergi ke "Setup Node.js App"
3. Create Application:
   - Node.js version: 18+
   - Application mode: Production
   - Application root: whatsapp-bot
   - Application startup file: index.js
4. Klik "Run NPM Install"
5. Klik "Run JS Script" atau "Start App"

### Menggunakan PM2 (VPS)

```bash
npm install -g pm2
pm2 start index.js --name "wa-bot"
pm2 save
pm2 startup
```

## Support

Jika ada masalah, hubungi admin melalui dashboard.
