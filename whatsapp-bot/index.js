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

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
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
const PHONE_NUMBER = config.phoneNumber || config.ownerNumber
const HTTP_PORT = config.httpPort || 3000

// Global variables
let sock = null
let httpServer = null
let isRestarting = false
let restartAttempts = 0
const MAX_RESTART_ATTEMPTS = 5

// Status untuk HTTP server
let botStatus = {
  connected: false,
  pairingCode: null,
  phoneNumber: PHONE_NUMBER,
  lastUpdate: new Date().toISOString(),
  error: null,
  nodeVersion: process.version
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
const messageCache = new Map()

// Logging function
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [${type}] ${message}`
  console.log(logMessage)
  
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

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// HTTP Server untuk menampilkan status dan pairing code
function startHttpServer() {
  if (httpServer) {
    log('HTTP Server already running, skipping...')
    return
  }
  
  httpServer = http.createServer((req, res) => {
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
    h1 { color: #25D366; font-size: 24px; margin-bottom: 10px; }
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
    .info { color: rgba(255,255,255,0.8); font-size: 14px; margin: 10px 0; line-height: 1.6; }
    .phone { color: #25D366; font-size: 18px; margin: 10px 0; }
    .instructions {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 15px;
      margin-top: 20px;
      text-align: left;
    }
    .instructions h3 { color: #25D366; margin-bottom: 10px; font-size: 14px; }
    .instructions ol { color: rgba(255,255,255,0.8); font-size: 13px; padding-left: 20px; }
    .instructions li { margin: 5px 0; }
    .error {
      background: rgba(255,107,107,0.2);
      border: 1px solid #ff6b6b;
      color: #ff6b6b;
      padding: 10px;
      border-radius: 10px;
      margin: 15px 0;
      font-size: 13px;
      word-break: break-all;
    }
    .refresh { color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 20px; }
    .debug { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; margin-top: 15px; text-align: left; }
    .debug p { color: rgba(255,255,255,0.6); font-size: 11px; font-family: monospace; margin: 3px 0; }
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
      <div class="status disconnected">DISCONNECTED</div>
      <p class="info">Menunggu koneksi...</p>
    `}
    
    ${botStatus.error ? `<div class="error">Error: ${botStatus.error}</div>` : ''}
    
    <div class="debug">
      <p>Node.js: ${botStatus.nodeVersion}</p>
      <p>Phone: ${botStatus.phoneNumber}</p>
      <p>Restart attempts: ${restartAttempts}/${MAX_RESTART_ATTEMPTS}</p>
      <p>Last update: ${botStatus.lastUpdate}</p>
    </div>
    
    <p class="refresh">Auto refresh setiap 5 detik</p>
  </div>
</body>
</html>`
    
    res.end(html)
  })
  
  httpServer.listen(HTTP_PORT, () => {
    log(`HTTP Server running on port ${HTTP_PORT}`)
  })
  
  httpServer.on('error', (err) => {
    log(`HTTP Server error: ${err.message}`, 'ERROR')
  })
}

// Verify API connection
async function verifyApi() {
  try {
    const res = await axios.post(`${API_URL}/api/whatsapp/verify`, {}, { 
      headers: apiHeaders,
      timeout: 10000 
    })
    return res.data.success
  } catch (error) {
    log(`API verification failed: ${error.message}`, 'ERROR')
    return false
  }
}

// Get products from API
async function getProducts() {
  try {
    const res = await axios.get(`${API_URL}/api/whatsapp/products`, { 
      headers: apiHeaders,
      timeout: 10000 
    })
    return res.data
  } catch (error) {
    log(`Failed to get products: ${error.message}`, 'ERROR')
    return { categories: [], products: [] }
  }
}

// Create order via API
async function createOrder(productId, quantity, customerPhone, customerName) {
  try {
    const res = await axios.post(`${API_URL}/api/whatsapp/orders`, {
      action: 'create',
      productId,
      quantity,
      customerPhone,
      customerName,
      platform: 'whatsapp'
    }, { headers: apiHeaders, timeout: 15000 })
    return res.data
  } catch (error) {
    log(`Failed to create order: ${error.message}`, 'ERROR')
    return { success: false, error: error.message }
  }
}

// Create payment via API
async function createPayment(orderId) {
  try {
    const res = await axios.post(`${API_URL}/api/whatsapp/payment`, {
      action: 'create',
      orderId
    }, { headers: apiHeaders, timeout: 15000 })
    return res.data
  } catch (error) {
    log(`Failed to create payment: ${error.message}`, 'ERROR')
    return { success: false, error: error.message }
  }
}

// Check payment status
async function checkPayment(orderId) {
  try {
    const res = await axios.post(`${API_URL}/api/whatsapp/payment`, {
      action: 'check',
      orderId
    }, { headers: apiHeaders, timeout: 15000 })
    return res.data
  } catch (error) {
    log(`Failed to check payment: ${error.message}`, 'ERROR')
    return { success: false, error: error.message }
  }
}

// Send message helper
async function sendMessage(jid, content) {
  try {
    if (sock && sock.user) {
      await sock.sendMessage(jid, content)
    }
  } catch (error) {
    log(`Failed to send message: ${error.message}`, 'ERROR')
  }
}

// Handle incoming messages
async function handleMessage(msg) {
  try {
    const jid = msg.key.remoteJid
    const isGroup = jid.endsWith('@g.us')
    const sender = isGroup ? msg.key.participant : jid
    const senderNumber = sender.split('@')[0]
    
    // Get message text
    const messageType = Object.keys(msg.message || {})[0]
    let text = ''
    
    if (messageType === 'conversation') {
      text = msg.message.conversation
    } else if (messageType === 'extendedTextMessage') {
      text = msg.message.extendedTextMessage.text
    } else if (messageType === 'imageMessage' || messageType === 'videoMessage') {
      text = msg.message[messageType].caption || ''
    }
    
    if (!text) return
    
    const lowerText = text.toLowerCase().trim()
    
    log(`Message from ${senderNumber}: ${text.substring(0, 50)}...`)
    
    // Command handlers
    if (lowerText === '/start' || lowerText === '/menu' || lowerText === 'menu' || lowerText === 'halo' || lowerText === 'hi') {
      await sendMainMenu(jid, senderNumber)
    } else if (lowerText === '/produk' || lowerText === 'produk' || lowerText === 'product') {
      await sendProductList(jid)
    } else if (lowerText.startsWith('/beli ') || lowerText.startsWith('beli ')) {
      const productId = text.split(' ')[1]
      await handleBuyProduct(jid, senderNumber, productId)
    } else if (lowerText.startsWith('/cek ') || lowerText.startsWith('cek ')) {
      const orderId = text.split(' ')[1]
      await handleCheckOrder(jid, orderId)
    } else if (lowerText === '/help' || lowerText === 'help' || lowerText === 'bantuan') {
      await sendHelp(jid)
    } else {
      // Check user state for conversation flow
      const state = userState.get(senderNumber)
      if (state) {
        await handleUserState(jid, senderNumber, text, state)
      }
    }
    
  } catch (error) {
    log(`Error handling message: ${error.message}`, 'ERROR')
  }
}

// Send main menu
async function sendMainMenu(jid, senderNumber) {
  const menu = `*${BOT_NAME}*

Selamat datang! Silakan pilih menu:

/produk - Lihat daftar produk
/beli [kode] - Beli produk
/cek [order_id] - Cek status pesanan
/help - Bantuan

_Powered by WhatsApp Bot_`
  
  await sendMessage(jid, { text: menu })
}

// Send product list
async function sendProductList(jid) {
  const data = await getProducts()
  
  if (!data.products || data.products.length === 0) {
    await sendMessage(jid, { text: 'Belum ada produk tersedia.' })
    return
  }
  
  let text = `*DAFTAR PRODUK*\n\n`
  
  // Group by category
  const byCategory = {}
  data.products.forEach(p => {
    const cat = p.categoryName || 'Lainnya'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(p)
  })
  
  for (const [cat, products] of Object.entries(byCategory)) {
    text += `*${cat}*\n`
    products.forEach(p => {
      text += `- ${p.name} | ${formatRupiah(p.price)} | Stok: ${p.stock}\n`
      text += `  Kode: ${p.id}\n`
    })
    text += `\n`
  }
  
  text += `_Ketik /beli [kode] untuk membeli_`
  
  await sendMessage(jid, { text })
}

// Handle buy product
async function handleBuyProduct(jid, senderNumber, productId) {
  if (!productId) {
    await sendMessage(jid, { text: 'Format: /beli [kode_produk]\nContoh: /beli prod123' })
    return
  }
  
  // Get product info first
  const data = await getProducts()
  const product = data.products?.find(p => p.id === productId)
  
  if (!product) {
    await sendMessage(jid, { text: 'Produk tidak ditemukan. Ketik /produk untuk melihat daftar.' })
    return
  }
  
  if (product.stock <= 0) {
    await sendMessage(jid, { text: 'Maaf, stok produk ini sedang habis.' })
    return
  }
  
  // Create order
  const result = await createOrder(productId, 1, senderNumber, senderNumber)
  
  if (!result.success) {
    await sendMessage(jid, { text: `Gagal membuat pesanan: ${result.error}` })
    return
  }
  
  const order = result.order
  
  // Create payment
  const payment = await createPayment(order.id)
  
  if (!payment.success) {
    await sendMessage(jid, { text: `Pesanan dibuat tapi gagal membuat pembayaran: ${payment.error}` })
    return
  }
  
  let paymentText = `*PESANAN BERHASIL DIBUAT*

Order ID: ${order.id}
Produk: ${product.name}
Harga: ${formatRupiah(order.totalAmount)}

*PEMBAYARAN QRIS*
Silakan scan QR Code atau transfer ke:
Nominal: ${formatRupiah(payment.amount)}

_Bayar dalam 30 menit atau pesanan otomatis dibatalkan_

Ketik /cek ${order.id} untuk cek status pembayaran`

  await sendMessage(jid, { text: paymentText })
  
  // Send QR image if available
  if (payment.qrisUrl) {
    try {
      await sendMessage(jid, { 
        image: { url: payment.qrisUrl },
        caption: 'Scan QRIS untuk membayar'
      })
    } catch (e) {
      log(`Failed to send QR image: ${e.message}`, 'ERROR')
    }
  }
}

// Handle check order
async function handleCheckOrder(jid, orderId) {
  if (!orderId) {
    await sendMessage(jid, { text: 'Format: /cek [order_id]\nContoh: /cek ord_123abc' })
    return
  }
  
  const result = await checkPayment(orderId)
  
  if (!result.success) {
    await sendMessage(jid, { text: `Gagal mengecek pesanan: ${result.error}` })
    return
  }
  
  const statusEmoji = {
    'pending': 'Menunggu Pembayaran',
    'paid': 'Sudah Dibayar',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan'
  }
  
  let text = `*STATUS PESANAN*

Order ID: ${orderId}
Status: ${statusEmoji[result.status] || result.status}`

  if (result.status === 'completed' && result.deliveredItems) {
    text += `\n\n*PRODUK:*\n${result.deliveredItems}`
  }
  
  await sendMessage(jid, { text })
}

// Handle user state
async function handleUserState(jid, senderNumber, text, state) {
  // Implement conversation state handling if needed
  userState.delete(senderNumber)
}

// Send help
async function sendHelp(jid) {
  const help = `*BANTUAN*

*Perintah yang tersedia:*

/menu - Menu utama
/produk - Lihat daftar produk
/beli [kode] - Beli produk dengan kode tertentu
/cek [order_id] - Cek status pesanan
/help - Tampilkan bantuan ini

*Contoh:*
/beli prod_abc123
/cek ord_xyz789

Butuh bantuan lain? Hubungi admin.`
  
  await sendMessage(jid, { text: help })
}

// Start WhatsApp connection
async function startBot() {
  if (isRestarting) {
    log('Already restarting, skipping...')
    return
  }
  
  isRestarting = true
  
  log('==================================================')
  log('WhatsApp Store Bot - cPanel Version')
  log('==================================================')
  
  // Check Node.js version
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
  
  if (majorVersion < 18) {
    const errorMsg = `Node.js version ${nodeVersion} tidak didukung. Minimal versi 18.x diperlukan.`
    log(errorMsg, 'ERROR')
    botStatus.error = errorMsg
    botStatus.lastUpdate = new Date().toISOString()
    isRestarting = false
    return
  }
  
  log(`Node.js version: ${nodeVersion}`)
  log(`Phone number: ${PHONE_NUMBER}`)
  
  // Start HTTP server first (only once)
  startHttpServer()
  
  // Verify API
  log('Verifying API connection...')
  const apiOk = await verifyApi()
  if (!apiOk) {
    botStatus.error = 'API connection failed. Check apiUrl, apiKey, and userId in config.json'
    botStatus.lastUpdate = new Date().toISOString()
    log('API verification failed!', 'ERROR')
    isRestarting = false
    
    // Retry after delay
    setTimeout(() => {
      if (restartAttempts < MAX_RESTART_ATTEMPTS) {
        restartAttempts++
        startBot()
      }
    }, 10000)
    return
  }
  log('API connection verified!')
  
  try {
    // Get Baileys version
    const { version, isLatest } = await fetchLatestBaileysVersion()
    log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`)
    
    // Auth state
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    
    // Create socket with optimized settings
    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: ['Chrome (Linux)', 'Chrome', '130.0.0'],
      connectTimeoutMs: 120000,
      defaultQueryTimeoutMs: 120000,
      keepAliveIntervalMs: 30000,
      emitOwnEvents: false,
      retryRequestDelayMs: 2000,
      markOnlineOnConnect: true,
      syncFullHistory: false,
      getMessage: async (key) => {
        // Return cached message if available
        const cached = messageCache.get(key.id)
        if (cached) return cached
        return { conversation: '' }
      }
    })
    
    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update
      
      botStatus.lastUpdate = new Date().toISOString()
      
      if (connection === 'close') {
        botStatus.connected = false
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
        
        log(`Connection closed. Reason: ${reason}`, 'WARN')
        
        if (reason === DisconnectReason.loggedOut) {
          log('Logged out. Deleting session...', 'WARN')
          botStatus.error = 'Logged out. Session deleted. Restart bot.'
          botStatus.pairingCode = null
          
          // Delete session
          try {
            fs.rmSync('./session', { recursive: true, force: true })
          } catch (e) {}
          
          isRestarting = false
          
          // Restart after delay
          if (restartAttempts < MAX_RESTART_ATTEMPTS) {
            restartAttempts++
            setTimeout(startBot, 5000)
          }
        } else if (reason === DisconnectReason.restartRequired) {
          log('Restart required...')
          isRestarting = false
          startBot()
        } else if (reason === DisconnectReason.timedOut) {
          log('Connection timed out, reconnecting...')
          isRestarting = false
          if (restartAttempts < MAX_RESTART_ATTEMPTS) {
            restartAttempts++
            setTimeout(startBot, 5000)
          }
        } else {
          botStatus.error = `Connection closed: ${lastDisconnect?.error?.message || 'Unknown reason'}`
          isRestarting = false
          
          if (restartAttempts < MAX_RESTART_ATTEMPTS) {
            restartAttempts++
            setTimeout(startBot, 5000)
          }
        }
      } else if (connection === 'open') {
        log('Connected to WhatsApp!')
        botStatus.connected = true
        botStatus.pairingCode = null
        botStatus.error = null
        restartAttempts = 0
        isRestarting = false
        
        // Send notification to owner
        try {
          const ownerJid = OWNER + '@s.whatsapp.net'
          await sock.sendMessage(ownerJid, { text: `${BOT_NAME} terhubung!` })
        } catch (e) {}
        
        // Update connection status to API
        try {
          await axios.post(`${API_URL}/api/whatsapp/verify`, {
            action: 'connected'
          }, { headers: apiHeaders })
        } catch (e) {}
      }
    })
    
    // Request pairing code if not registered
    if (!sock.authState.creds.registered) {
      // Wait for socket to be ready - shorter delay
      await sleep(3000)
      
      // Clean phone number - must be without + and country code format
      // Example: 6285960200650 (not +6285960200650)
      let cleanPhone = PHONE_NUMBER.replace(/[^0-9]/g, '')
      
      // Make sure it starts with country code (not 0)
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1) // Indonesia
      }
      
      log(`Requesting pairing code for ${cleanPhone}...`)
      botStatus.phoneNumber = cleanPhone
      
      try {
        const code = await sock.requestPairingCode(cleanPhone)
        log(`========================================`)
        log(`PAIRING CODE: ${code}`)
        log(`========================================`)
        log(`Masukkan kode di WhatsApp > Perangkat Tertaut > Tautkan dengan nomor telepon`)
        log(`Kode berlaku 60 detik!`)
        
        botStatus.pairingCode = code
        botStatus.error = null
      } catch (error) {
        log(`Failed to get pairing code: ${error.message}`, 'ERROR')
        botStatus.error = `Pairing failed: ${error.message}`
        botStatus.pairingCode = null
        
        // Try again after delay
        log('Retrying in 10 seconds...')
        await sleep(10000)
        
        try {
          const code = await sock.requestPairingCode(cleanPhone)
          log(`PAIRING CODE (retry): ${code}`)
          botStatus.pairingCode = code
          botStatus.error = null
        } catch (err) {
          log(`Retry failed: ${err.message}`, 'ERROR')
          botStatus.error = `Pairing failed after retry: ${err.message}`
          
          // Delete session and restart
          log('Deleting session and will restart...', 'WARN')
          try {
            fs.rmSync('./session', { recursive: true, force: true })
          } catch (e) {}
          
          if (restartAttempts < MAX_RESTART_ATTEMPTS) {
            restartAttempts++
            isRestarting = false
            setTimeout(startBot, 15000)
          }
        }
      }
    }
    
    // Handle credentials update
    sock.ev.on('creds.update', saveCreds)
    
    // Handle messages
    sock.ev.on('messages.upsert', async (update) => {
      try {
        const msg = update.messages[0]
        if (!msg.message) return
        if (msg.key.fromMe) return
        if (msg.key.remoteJid === 'status@broadcast') return
        
        await handleMessage(msg)
      } catch (error) {
        log(`Error in messages.upsert: ${error.message}`, 'ERROR')
      }
    })
    
    isRestarting = false
    
  } catch (error) {
    log(`Error starting bot: ${error.message}`, 'ERROR')
    botStatus.error = error.message
    isRestarting = false
    
    if (restartAttempts < MAX_RESTART_ATTEMPTS) {
      restartAttempts++
      setTimeout(startBot, 10000)
    }
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  log(`Uncaught Exception: ${err.message}`, 'ERROR')
  botStatus.error = `Uncaught: ${err.message}`
})

process.on('unhandledRejection', (reason) => {
  log(`Unhandled Rejection: ${reason}`, 'ERROR')
  botStatus.error = `Unhandled: ${reason}`
})

// Start
startBot()
