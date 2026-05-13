import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// GET /api/whatsapp/download-bot - Redirect to GitHub or provide instructions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Return HTML page with download instructions
    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download WhatsApp Bot</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a; 
      color: #fafafa;
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    p { color: #a1a1aa; line-height: 1.6; margin-bottom: 1rem; }
    .card { 
      background: #18181b; 
      border: 1px solid #27272a; 
      border-radius: 12px; 
      padding: 1.5rem; 
      margin-bottom: 1rem;
    }
    code { 
      background: #27272a; 
      padding: 0.25rem 0.5rem; 
      border-radius: 4px; 
      font-family: monospace;
      font-size: 0.875rem;
    }
    pre { 
      background: #18181b; 
      border: 1px solid #27272a;
      border-radius: 8px; 
      padding: 1rem; 
      overflow-x: auto;
      margin: 1rem 0;
    }
    pre code { background: transparent; padding: 0; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #22c55e;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .btn:hover { background: #16a34a; }
    .btn.secondary { background: #27272a; }
    .btn.secondary:hover { background: #3f3f46; }
    ol { padding-left: 1.5rem; margin: 1rem 0; }
    li { margin-bottom: 0.5rem; color: #d4d4d8; }
    .highlight { color: #22c55e; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Download WhatsApp Bot</h1>
    <p>Bot WhatsApp untuk toko online menggunakan Baileys dengan sistem Pairing Code.</p>
    
    <div class="card">
      <h2 style="font-size: 1.125rem; margin-bottom: 1rem;">Cara Download</h2>
      <p>Folder <code>whatsapp-bot</code> sudah tersedia di project. Anda bisa:</p>
      
      <ol>
        <li><strong>Download ZIP dari GitHub:</strong> Buka repository > Code > Download ZIP</li>
        <li><strong>Clone repository:</strong> <code>git clone [repo-url]</code></li>
        <li><strong>Copy folder:</strong> Copy folder <code>whatsapp-bot</code> ke server Anda</li>
      </ol>
    </div>
    
    <div class="card">
      <h2 style="font-size: 1.125rem; margin-bottom: 1rem;">Struktur Folder</h2>
      <pre><code>whatsapp-bot/
├── index.js        # Main bot file
├── config.json     # Konfigurasi (edit ini!)
├── package.json    # Dependencies
└── README.md       # Dokumentasi lengkap</code></pre>
    </div>
    
    <div class="card">
      <h2 style="font-size: 1.125rem; margin-bottom: 1rem;">Konfigurasi</h2>
      <p>Edit file <code>config.json</code> dengan data Anda:</p>
      <pre><code>{
  "apiUrl": "${request.headers.get('host')?.includes('localhost') ? 'http://localhost:3000' : `https://${request.headers.get('host')}`}",
  "apiKey": "<span class="highlight">API_KEY_DARI_DASHBOARD</span>",
  "userId": "<span class="highlight">USER_ID_ANDA</span>",
  "ownerNumber": "628123456789",
  "botName": "Store Bot"
}</code></pre>
    </div>
    
    <div class="card">
      <h2 style="font-size: 1.125rem; margin-bottom: 1rem;">Instalasi</h2>
      <pre><code>cd whatsapp-bot
npm install
npm start</code></pre>
      <p style="margin-top: 1rem;">Ikuti instruksi pairing code di terminal.</p>
    </div>
    
    <div style="margin-top: 1.5rem;">
      <a href="/dashboard/settings" class="btn secondary">Kembali ke Dashboard</a>
    </div>
  </div>
</body>
</html>
`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Download bot error:', error)
    return NextResponse.redirect(new URL('/dashboard/settings', request.url))
  }
}
