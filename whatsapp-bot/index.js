/**
 * WhatsApp Store Bot - cPanel Version
 * Menggunakan Baileys dengan Pairing Code
 * 
 * Setup untuk cPanel:
 * 1. Edit config.json dengan API Key, User ID, dan Nomor WA
 * 2. npm install
 * 3. Start via cPanel Node.js Selector
 * 4. Buka URL aplikasi di browser untuk melihat Pairing Code
 * 5. Link pairing code di WhatsApp > Linked Devices > Link a Device
 */

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const http = require('http')

// Load config
const config = require('./config.json')

const API_URL = config.apiUrl
const API_KEY = config.apiKey
const USER_ID = config.userId
const OWNER = config.ownerNumber
const BOT_NAME = config.botName || 'Store Bot'
const PHONE_NUMBER = config.phoneNumber || config.ownerNumber // Nomor untuk pairing
const HTTP_PORT = config.httpPort || 3000

// Status untuk HTTP server
let botStatus = {
  connected: false,
  pairingCode: null,
  phoneNumber: PHONE_NUMBER,
  lastUpdate: new Date().toISOString(),
  error: null
}

// API Headers
const apiHeaders = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
  'x-user-id': USER_ID
}

// Store untuk menyimpan data sementara
const userState = new Map()
const orderCache = new Map()

// Memory store
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

// Logging function
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [${type}] ${message}`
  console.log(logMessage)
  
  // Also write to log file
  try {
    fs.appendFileSync('./bot.log', logMessage + '\n')
  } catch (e) {}
}

// Format currency
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

// HTTP Server untuk menampilkan status dan pairing code
function startHttpServer() {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp Bot Status</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="5">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { 
      color: #25D366;
      font-size: 24px;
      margin-bottom: 10px;
    }
    .status {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: bold;
      margin: 15px 0;
    }
    .connected { background: #25D366; color: white; }
    .disconnected { background: #ff6b6b; color: white; }
    .waiting { background: #ffd93d; color: #333; }
    .pairing-code {
      background: #25D366;
      color: white;
      font-size: 36px;
      font-weight: bold;
      letter-spacing: 8px;
      padding: 20px 30px;
      border-radius: 15px;
      margin: 20px 0;
      font-family: monospace;
    }
    .info {
      color: rgba(255,255,255,0.8);
      font-size: 14px;
      margin: 10px 0;
      line-height: 1.6;
    }
    .phone {
      color: #25D366;
      font-size: 18px;
      margin: 10px 0;
    }
    .instructions {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 15px;
      margin-top: 20px;
      text-align: left;
    }
    .instructions h3 {
      color: #25D366;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .instructions ol {
      color: rgba(255,255,255,0.8);
      font-size: 13px;
      padding-left: 20px;
    }
    .instructions li { margin: 5px 0; }
    .error {
      background: rgba(255,107,107,0.2);
      border: 1px solid #ff6b6b;
      color: #ff6b6b;
      padding: 10px;
      border-radius: 10px;
      margin: 15px 0;
      font-size: 13px;
    }
    .refresh {
      color: rgba(255,255,255,0.5);
      font-size: 12px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>WhatsApp Bot Status</h1>
    <p class="info">${BOT_NAME}</p>
    
    ${botStatus.connected ? `
      <div class="status connected">CONNECTED</div>
      <p class="info">Bot sudah terhubung dan siap menerima pesan!</p>
    ` : botStatus.pairingCode ? `
      <div class="status waiting">WAITING PAIRING</div>
      <p class="phone">+${botStatus.phoneNumber}</p>
      <div class="pairing-code">${botStatus.pairingCode}</div>
      <div class="instructions">
        <h3>Cara Pairing:</h3>
        <ol>
          <li>Buka WhatsApp di HP</li>
          <li>Pergi ke Settings > Linked Devices</li>
          <li>Tap "Link a Device"</li>
          <li>Tap "Link with phone number instead"</li>
          <li>Masukkan kode di atas</li>
        </ol>
      </div>
    ` : `
      <div class="status disconnected">STARTING...</div>
      <p class="info">Bot sedang memulai, tunggu sebentar...</p>
    `}
    
    ${botStatus.error ? `<div class="error">${botStatus.error}</div>` : ''}
    
    <p class="refresh">Auto refresh setiap 5 detik</p>
    <p class="info" style="margin-top: 10px; font-size: 12px;">Last update: ${botStatus.lastUpdate}</p>
  </div>
</body>
</html>
    `
    
    res.end(html)
  })
  
  server.listen(HTTP_PORT, '0.0.0.0', () => {
    log(`HTTP Server running on port ${HTTP_PORT}`)
  })
}

// API Functions
async function verifyConnection() {
  try {
    const res = await axios.post(`${API_URL}/api/whatsapp/verify`, {}, { headers: apiHeaders })
    return res.data.valid
  } catch (error) {
    log(`Failed to verify API: ${error.message}`, 'ERROR')
    return false
  }
}

async function updateConnectionStatus(connected) {
  try {
    await axios.put(`${API_URL}/api/whatsapp/verify`, { connected }, { headers: apiHeaders })
  } catch (error) {
    log(`Failed to update status: ${error.message}`, 'ERROR')
  }
}

async function getProducts() {
  try {
    const res = await axios.get(`${API_URL}/api/whatsapp/products`, { headers: apiHeaders })
    return res.data
  } catch (error) {
    log(`Failed to get products: ${error.message}`, 'ERROR')
    return { categories: [] }
  }
}

async function createOrder(data) {
  try {
    const res = await axios.post(`${API_URL}/api/whatsapp/orders`, data, { headers: apiHeaders })
    return res.data
  } catch (error) {
    log(`Failed to create order: ${error.message}`, 'ERROR')
    return { error: error.response?.data?.error || 'Gagal membuat order' }
  }
}

async function getOrder(orderId) {
  try {
    const res = await axios.get(`${API_URL}/api/whatsapp/orders?orderId=${orderId}`, { headers: apiHeaders })
    return res.data
  } catch (error) {
    return null
  }
}

async function createPayment(orderId) {
  try {
    const res = await axios.post(`${API_URL}/api/whatsapp/payment`, { orderId }, { headers: apiHeaders })
    return res.data
  } catch (error) {
    log(`Failed to create payment: ${error.message}`, 'ERROR')
    return { error: error.response?.data?.error || 'Gagal membuat pembayaran' }
  }
}

async function checkPayment(orderId) {
  try {
    const res = await axios.get(`${API_URL}/api/whatsapp/payment?orderId=${orderId}`, { headers: apiHeaders })
    return res.data
  } catch (error) {
    return { isPaid: false }
  }
}

async function completeOrder(orderId) {
  try {
    const res = await axios.patch(`${API_URL}/api/whatsapp/orders`, {
      orderId,
      action: 'complete'
    }, { headers: apiHeaders })
    return res.data
  } catch (error) {
    return { error: error.response?.data?.error || 'Gagal menyelesaikan order' }
  }
}

// Message handlers
async function handleStart(sock, sender) {
  const data = await getProducts()
  
  let text = `*${BOT_NAME}*\n\n`
  text += `Selamat datang di ${BOT_NAME}!\n`
  text += `Silakan pilih kategori produk:\n\n`
  
  if (data.categories.length === 0) {
    text += `_Belum ada produk tersedia_`
  } else {
    data.categories.forEach((cat, i) => {
      text += `*${i + 1}.* ${cat.name}\n`
    })
    text += `\n_Balas dengan nomor kategori untuk melihat produk_`
  }
  
  userState.set(sender, { 
    step: 'select_category',
    categories: data.categories 
  })
  
  await sock.sendMessage(sender, { text })
}

async function handleCategorySelection(sock, sender, number) {
  const state = userState.get(sender)
  if (!state || state.step !== 'select_category') return false
  
  const index = parseInt(number) - 1
  if (isNaN(index) || index < 0 || index >= state.categories.length) {
    await sock.sendMessage(sender, { text: 'Nomor kategori tidak valid. Silakan pilih ulang.' })
    return true
  }
  
  const category = state.categories[index]
  
  let text = `*${category.name}*\n`
  if (category.description) text += `${category.description}\n`
  text += `\nPilih produk:\n\n`
  
  category.products.forEach((product, i) => {
    text += `*${i + 1}.* ${product.name}\n`
    text += `   ${formatRupiah(product.price)} | Stok: ${product.stock}\n\n`
  })
  
  text += `_Balas dengan nomor produk untuk membeli_\n`
  text += `_Ketik "menu" untuk kembali ke menu utama_`
  
  userState.set(sender, {
    step: 'select_product',
    category,
    products: category.products
  })
  
  await sock.sendMessage(sender, { text })
  return true
}

async function handleProductSelection(sock, sender, number) {
  const state = userState.get(sender)
  if (!state || state.step !== 'select_product') return false
  
  const index = parseInt(number) - 1
  if (isNaN(index) || index < 0 || index >= state.products.length) {
    await sock.sendMessage(sender, { text: 'Nomor produk tidak valid. Silakan pilih ulang.' })
    return true
  }
  
  const product = state.products[index]
  
  if (product.stock < 1) {
    await sock.sendMessage(sender, { text: 'Maaf, produk ini sedang habis.' })
    return true
  }
  
  let text = `*Detail Produk*\n\n`
  text += `Nama: ${product.name}\n`
  text += `Kategori: ${state.category.name}\n`
  text += `Harga: ${formatRupiah(product.price)}\n`
  text += `Stok: ${product.stock}\n`
  if (product.description) text += `\n${product.description}\n`
  text += `\n_Balas "beli" untuk melanjutkan pembelian_\n`
  text += `_Ketik "menu" untuk kembali_`
  
  userState.set(sender, {
    step: 'confirm_product',
    product
  })
  
  await sock.sendMessage(sender, { text })
  return true
}

async function handleBuyConfirmation(sock, sender) {
  const state = userState.get(sender)
  if (!state || state.step !== 'confirm_product') return false
  
  const product = state.product
  const buyerContact = sender.replace('@s.whatsapp.net', '')
  
  const orderResult = await createOrder({
    productId: product.id,
    quantity: 1,
    buyerName: `WA ${buyerContact}`,
    buyerContact,
    buyerId: sender,
    platform: 'WhatsApp'
  })
  
  if (orderResult.error) {
    await sock.sendMessage(sender, { text: `Gagal membuat order: ${orderResult.error}` })
    return true
  }
  
  const order = orderResult.order
  const paymentResult = await createPayment(order.id)
  
  if (paymentResult.error) {
    await sock.sendMessage(sender, { text: `Gagal membuat pembayaran: ${paymentResult.error}` })
    return true
  }
  
  const payment = paymentResult.payment
  
  let text = `*INVOICE*\n\n`
  text += `Order ID: ${order.id}\n`
  text += `Produk: ${order.productName}\n`
  text += `Total: ${formatRupiah(payment.amount)}\n`
  text += `Metode: QRIS\n`
  text += `Expired: 5 menit\n\n`
  text += `_Scan QRIS di bawah untuk membayar_`
  
  await sock.sendMessage(sender, { text })
  
  if (payment.qrisUrl) {
    await sock.sendMessage(sender, { 
      image: { url: payment.qrisUrl },
      caption: `QRIS untuk order ${order.id}\nTotal: ${formatRupiah(payment.amount)}`
    })
  }
  
  userState.set(sender, {
    step: 'waiting_payment',
    orderId: order.id
  })
  
  startPaymentChecker(sock, sender, order.id)
  return true
}

async function startPaymentChecker(sock, sender, orderId) {
  let attempts = 0
  const maxAttempts = 60
  
  const checkInterval = setInterval(async () => {
    attempts++
    
    const result = await checkPayment(orderId)
    
    if (result.isPaid) {
      clearInterval(checkInterval)
      
      const completeResult = await completeOrder(orderId)
      
      if (completeResult.error) {
        await sock.sendMessage(sender, { 
          text: `Pembayaran berhasil tapi gagal memproses: ${completeResult.error}\nHubungi admin.` 
        })
        return
      }
      
      let text = `*PEMBAYARAN BERHASIL*\n\n`
      text += `Order ID: ${orderId}\n\n`
      text += `*Akun Anda:*\n`
      text += `\`\`\`\n`
      completeResult.deliveredItems.forEach(item => {
        text += `${item}\n`
      })
      text += `\`\`\`\n`
      if (completeResult.successMessage) {
        text += `\n${completeResult.successMessage}`
      }
      text += `\nTerima kasih telah berbelanja!`
      
      await sock.sendMessage(sender, { text })
      userState.delete(sender)
    } else if (attempts >= maxAttempts) {
      clearInterval(checkInterval)
      await sock.sendMessage(sender, { 
        text: `Order ${orderId} telah expired. Silakan buat order baru.` 
      })
      userState.delete(sender)
    }
  }, 5000)
}

async function handleMessage(sock, m) {
  try {
    if (!m.message) return
    if (m.key.fromMe) return
    if (m.key.remoteJid === 'status@broadcast') return
    
    const sender = m.key.remoteJid
    const messageType = Object.keys(m.message)[0]
    
    let text = ''
    if (messageType === 'conversation') {
      text = m.message.conversation
    } else if (messageType === 'extendedTextMessage') {
      text = m.message.extendedTextMessage.text
    } else {
      return
    }
    
    const lowerText = text.toLowerCase().trim()
    
    if (lowerText === 'menu' || lowerText === 'start' || lowerText === '/start' || lowerText === '.menu') {
      return await handleStart(sock, sender)
    }
    
    if (lowerText === 'cek' || lowerText === 'check') {
      const state = userState.get(sender)
      if (state?.step === 'waiting_payment' && state.orderId) {
        const result = await checkPayment(state.orderId)
        if (result.isPaid) {
          await sock.sendMessage(sender, { text: 'Pembayaran sudah diterima! Memproses pesanan...' })
        } else {
          await sock.sendMessage(sender, { text: 'Pembayaran belum diterima. Silakan scan QRIS untuk membayar.' })
        }
        return
      }
    }
    
    if (lowerText === 'beli' || lowerText === 'buy') {
      return await handleBuyConfirmation(sock, sender)
    }
    
    if (/^\d+$/.test(text.trim())) {
      const state = userState.get(sender)
      if (state?.step === 'select_category') {
        return await handleCategorySelection(sock, sender, text.trim())
      } else if (state?.step === 'select_product') {
        return await handleProductSelection(sock, sender, text.trim())
      }
    }
    
    await sock.sendMessage(sender, { 
      text: `Ketik *menu* untuk melihat daftar produk.` 
    })
    
  } catch (error) {
    log(`Error handling message: ${error.message}`, 'ERROR')
  }
}

// Main function
async function startBot() {
  log('=' .repeat(50))
  log('WhatsApp Store Bot - cPanel Version')
  log('=' .repeat(50))
  
  // Start HTTP server for pairing code display
  startHttpServer()
  
  // Verify API connection
  log('Verifying API connection...')
  const isValid = await verifyConnection()
  if (!isValid) {
    botStatus.error = 'Failed to verify API. Check config.json'
    botStatus.lastUpdate = new Date().toISOString()
    log('Failed to verify API. Check config.json', 'ERROR')
    return
  }
  log('API connection verified!')
  
  // Validate phone number
  if (!PHONE_NUMBER) {
    botStatus.error = 'phoneNumber tidak diset di config.json'
    botStatus.lastUpdate = new Date().toISOString()
    log('phoneNumber tidak diset di config.json', 'ERROR')
    return
  }
  
  // Setup auth
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  
  // Create socket
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Safari', '18.1'],
    logger: pino({ level: 'silent' }),
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id, undefined)
        return msg?.message || undefined
      }
      return { conversation: '' }
    }
  })
  
  store.bind(sock.ev)
  
  // Request pairing code if not registered
  if (!sock.authState.creds.registered) {
    log(`Requesting pairing code for ${PHONE_NUMBER}...`)
    
    try {
      // Clean phone number (remove + and spaces)
      const cleanNumber = PHONE_NUMBER.replace(/[^0-9]/g, '')
      const code = await sock.requestPairingCode(cleanNumber)
      
      botStatus.pairingCode = code
      botStatus.phoneNumber = cleanNumber
      botStatus.lastUpdate = new Date().toISOString()
      
      log(`Pairing Code: ${code}`)
      log(`Buka browser ke URL aplikasi untuk melihat kode pairing`)
    } catch (error) {
      botStatus.error = `Failed to get pairing code: ${error.message}`
      botStatus.lastUpdate = new Date().toISOString()
      log(`Failed to get pairing code: ${error.message}`, 'ERROR')
    }
  }
  
  // Connection event
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    
    botStatus.lastUpdate = new Date().toISOString()
    
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      const errorMsg = lastDisconnect?.error?.message || 'Unknown'
      log(`Connection closed: ${errorMsg}`, 'WARN')
      
      botStatus.connected = false
      botStatus.pairingCode = null
      
      await updateConnectionStatus(false)
      
      if (reason === DisconnectReason.badSession) {
        botStatus.error = 'Bad session. Delete session folder and restart.'
        log('Bad session. Delete session folder and restart.', 'ERROR')
      } else if (reason === DisconnectReason.connectionReplaced) {
        botStatus.error = 'Connection replaced. Close other sessions.'
        log('Connection replaced. Close other sessions.', 'ERROR')
      } else if (reason === DisconnectReason.loggedOut) {
        botStatus.error = 'Logged out. Delete session folder and restart.'
        log('Logged out. Deleting session...', 'WARN')
        fs.rmSync('./session', { recursive: true, force: true })
        setTimeout(() => startBot(), 3000)
      } else if (reason === DisconnectReason.restartRequired) {
        log('Restarting...')
        setTimeout(() => startBot(), 1000)
      } else {
        log('Reconnecting in 3 seconds...')
        setTimeout(() => startBot(), 3000)
      }
    } else if (connection === 'open') {
      log('Bot Connected Successfully!')
      
      botStatus.connected = true
      botStatus.pairingCode = null
      botStatus.error = null
      
      await updateConnectionStatus(true)
      
      try {
        await sock.sendMessage(`${OWNER}@s.whatsapp.net`, { 
          text: `*${BOT_NAME}* terhubung!\n\nKetik *menu* untuk melihat daftar produk.` 
        })
      } catch (e) {
        log('Could not send notification to owner', 'WARN')
      }
    }
  })
  
  sock.ev.on('creds.update', saveCreds)
  
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    const m = chatUpdate.messages[0]
    if (!m.message) return
    
    m.message = Object.keys(m.message)[0] === 'ephemeralMessage' 
      ? m.message.ephemeralMessage.message 
      : m.message
    
    await handleMessage(sock, m)
  })
  
  return sock
}

// Handle errors
process.on('uncaughtException', (err) => {
  log(`Uncaught Exception: ${err.message}`, 'ERROR')
  botStatus.error = err.message
  botStatus.lastUpdate = new Date().toISOString()
})

process.on('unhandledRejection', (err) => {
  log(`Unhandled Rejection: ${err}`, 'ERROR')
})

// Start
startBot()
