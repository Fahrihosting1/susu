## QRIS Orkut - Quick Start (3 Steps)

### Step 1: Add API Key
Edit `/lib/orkut.ts` line ~9:
```typescript
const ORKUT_ADMIN_API_KEY = 'your-api-key-from-orkut'
```

### Step 2: Setup Admin QRIS
1. Open Dashboard → Settings
2. Scroll ke "Pengaturan QRIS Orkut"
3. Pilih **QRIS Admin (Default)**
4. Input Token + Username
5. Click "Simpan QRIS Admin"

### Step 3: Test di Bot
1. Open Telegram Bot
2. `/start`
3. Pilih produk → Click "Bayar dengan Qris ✅"
4. Receive QR Code
5. Scan & Pay ✓

---

## File Locations

| Fitur | File |
|-------|------|
| API Key | `lib/orkut.ts` |
| Settings UI | `app/(dashboard)/dashboard/settings/page.tsx` |
| Bot Handler | `app/api/telegram/webhook/route.ts` |
| Tracking | `app/payment-tracking/page.tsx` |
| Docs | `QRIS_SETUP.md` |

---

## Mode Perbandingan

| Aspek | Admin (Default) | User Custom |
|-------|-----------------|-------------|
| API Key | Hardcoded | User input |
| Token | User input | User input |
| Username | User input | User input |
| Setup Kompleksitas | Simple | Full credentials |
| Fallback | N/A | Fallback ke admin |
| Use Case | Shared QRIS | Personal QRIS |

---

Done! 🚀
