/**
 * WhatsApp Store Bot
 * Menggunakan Baileys dengan Pairing Code
 * 
 * Setup:
 * 1. Edit config.json dengan API Key dan User ID dari dashboard
 * 2. npm install
 * 3. npm start
 * 4. Masukkan nomor WhatsApp saat diminta
 * 5. Gunakan pairing code yang muncul di WhatsApp > Linked Devices > Link a Device
 */

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const chalk = require('chalk')
const readline = require('readline')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

// Load config
const config = require('./config.json')

const API_URL = config.apiUrl
const API_KEY = config.apiKey
const USER_ID = config.userId
const OWNER = config.ownerNumber
const BOT_NAME = config.botName || 'Store Bot'
const PREFIX = config.prefix || '.'

// API Headers
const apiHeaders = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
  'x-user-id': USER_ID
}

// Store untuk menyimpan data sementara
const userState = new Map() // Untuk tracking state user (sedang pilih kategori, produk, dll)
const orderCache = new Map() // Cache order yang sedang diproses

// Readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (text) => new Promise((resolve) => rl.question(text, resolve))

// Memory store
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

// Format currency
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

// API Functions
async function verifyConnection() {
  try {
    const res = await axios.post(`${API_URL}/api/whatsapp/verify`, {}, { headers: apiHeaders })
    return res.data.valid
  } catch (error) {
    console.error(chalk.red('Failed to verify API connection:'), error.message)
    return false
  }
}

async function updateConnectionStatus(connected) {
  try {
    await axios.put(`${API_URL}/api/whatsapp/verify`, { connected }, { headers: apiHeaders })
  } catch (error) {
    console.error('Failed to update connection status:', error.message)
  }
}

async function getProducts() {
  try {
    const res = await axios.get(`${API_URL}/api/whatsapp/products`, { headers: apiHeaders })
    return res.data
  } catch (error) {
    console.error('Failed to get products:', error.message)
    return { categories: [] }
  }
}

async function createOrder(data) {
  try {
    const res = await axios.post(`${API_URL}/api/whatsapp/orders`, data, { headers: apiHeaders })
    return res.data
  } catch (error) {
    console.error('Failed to create order:', error.message)
    return { error: error.response?.data?.error || 'Gagal membuat order' }
  }
}

async function getOrder(orderId) {
  try {
    const res = await axios.get(`${API_URL}/api/whatsapp/orders?orderId=${orderId}`, { headers: apiHeaders })
    return res.data
  } catch (error) {
    console.error('Failed to get order:', error.message)
    return null
  }
}

async function createPayment(orderId) {
  try {
    const res = await axios.post(`${API_URL}/api/whatsapp/payment`, { orderId }, { headers: apiHeaders })
    return res.data
  } catch (error) {
    console.error('Failed to create payment:', error.message)
    return { error: error.response?.data?.error || 'Gagal membuat pembayaran' }
  }
}

async function checkPayment(orderId) {
  try {
    const res = await axios.get(`${API_URL}/api/whatsapp/payment?orderId=${orderId}`, { headers: apiHeaders })
    return res.data
  } catch (error) {
    console.error('Failed to check payment:', error.message)
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
    console.error('Failed to complete order:', error.message)
    return { error: error.response?.data?.error || 'Gagal menyelesaikan order' }
  }
}

// Message handlers
async function handleStart(sock, sender) {
  const data = await getProducts()
  const botSettings = data.botSettings || {}
  
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
  
  // Save state
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
  
  // Create order
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
  
  // Create payment
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
  
  // Send QRIS image
  if (payment.qrisUrl) {
    await sock.sendMessage(sender, { 
      image: { url: payment.qrisUrl },
      caption: `QRIS untuk order ${order.id}\nTotal: ${formatRupiah(payment.amount)}`
    })
  }
  
  // Save order for checking
  userState.set(sender, {
    step: 'waiting_payment',
    orderId: order.id
  })
  
  // Start payment checker
  startPaymentChecker(sock, sender, order.id)
  
  return true
}

async function startPaymentChecker(sock, sender, orderId) {
  let attempts = 0
  const maxAttempts = 60 // 5 minutes (5 seconds interval)
  
  const checkInterval = setInterval(async () => {
    attempts++
    
    const result = await checkPayment(orderId)
    
    if (result.isPaid) {
      clearInterval(checkInterval)
      
      // Complete order and deliver items
      const completeResult = await completeOrder(orderId)
      
      if (completeResult.error) {
        await sock.sendMessage(sender, { 
          text: `Pembayaran berhasil tapi gagal memproses order: ${completeResult.error}\nHubungi admin.` 
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
  }, 5000) // Check every 5 seconds
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
      return // Only handle text messages
    }
    
    const lowerText = text.toLowerCase().trim()
    
    // Commands
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
    
    // Check if it's a number (category or product selection)
    if (/^\d+$/.test(text.trim())) {
      const state = userState.get(sender)
      if (state?.step === 'select_category') {
        return await handleCategorySelection(sock, sender, text.trim())
      } else if (state?.step === 'select_product') {
        return await handleProductSelection(sock, sender, text.trim())
      }
    }
    
    // Default: show menu
    await sock.sendMessage(sender, { 
      text: `Ketik *menu* untuk melihat daftar produk.` 
    })
    
  } catch (error) {
    console.error('Error handling message:', error)
  }
}

// Main function
async function startBot() {
  console.log(chalk.cyan('='.repeat(50)))
  console.log(chalk.cyan.bold('  WhatsApp Store Bot'))
  console.log(chalk.cyan('='.repeat(50)))
  
  // Verify API connection
  console.log(chalk.yellow('\nVerifying API connection...'))
  const isValid = await verifyConnection()
  if (!isValid) {
    console.log(chalk.red('Failed to verify API. Please check your config.json'))
    process.exit(1)
  }
  console.log(chalk.green('API connection verified!'))
  
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
    const phoneNumber = await question(chalk.blue.bold('\nMasukkan Nomor WhatsApp (contoh: 628123456789):\n'))
    const code = await sock.requestPairingCode(phoneNumber.trim())
    console.log(chalk.green.bold(`\nKode Pairing: ${code}`))
    console.log(chalk.yellow('Buka WhatsApp > Linked Devices > Link a Device > Masukkan kode di atas\n'))
  }
  
  // Connection event
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(chalk.red('\nConnection closed:', lastDisconnect?.error?.message || 'Unknown'))
      
      await updateConnectionStatus(false)
      
      if (reason === DisconnectReason.badSession) {
        console.log(chalk.yellow('Bad session. Please delete session folder and restart.'))
        process.exit()
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log(chalk.yellow('Connection replaced. Please close other sessions.'))
        process.exit()
      } else if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.yellow('Logged out. Please delete session folder and restart.'))
        fs.rmSync('./session', { recursive: true, force: true })
        process.exit()
      } else if (reason === DisconnectReason.restartRequired) {
        console.log(chalk.yellow('Restarting...'))
        startBot()
      } else {
        console.log(chalk.yellow('Reconnecting...'))
        startBot()
      }
    } else if (connection === 'open') {
      console.log(chalk.green.bold('\nBot Connected Successfully!'))
      console.log(chalk.cyan(`Bot Name: ${BOT_NAME}`))
      console.log(chalk.cyan(`Owner: ${OWNER}`))
      
      await updateConnectionStatus(true)
      
      // Send notification to owner
      try {
        await sock.sendMessage(`${OWNER}@s.whatsapp.net`, { 
          text: `*${BOT_NAME}* terhubung!\n\nKetik *menu* untuk melihat daftar perintah.` 
        })
      } catch (e) {
        console.log(chalk.yellow('Could not send notification to owner'))
      }
    }
  })
  
  // Credentials update
  sock.ev.on('creds.update', saveCreds)
  
  // Message event
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    const m = chatUpdate.messages[0]
    if (!m.message) return
    
    // Handle ephemeral messages
    m.message = Object.keys(m.message)[0] === 'ephemeralMessage' 
      ? m.message.ephemeralMessage.message 
      : m.message
    
    await handleMessage(sock, m)
  })
  
  // Auto-read messages
  if (config.autoRead) {
    sock.ev.on('messages.upsert', async (chatUpdate) => {
      const m = chatUpdate.messages[0]
      if (m.key.remoteJid && !m.key.fromMe) {
        await sock.readMessages([m.key])
      }
    })
  }
  
  return sock
}

// Handle errors
process.on('uncaughtException', (err) => {
  console.error(chalk.red('Uncaught Exception:'), err)
})

process.on('unhandledRejection', (err) => {
  console.error(chalk.red('Unhandled Rejection:'), err)
})

// Start
startBot()
