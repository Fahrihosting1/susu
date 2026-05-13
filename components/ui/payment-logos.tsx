'use client'

// Payment Logo URLs - using actual brand logos
const PAYMENT_LOGO_URLS: Record<string, string> = {
  bca: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BCA-Logo-Feature-ECpuUMJKk98GT4az4HC53b1CbEkpjs.jpg',
  bni: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bni-bank-negara-indonesia8078.logowik.com-BBq3I2kurIC9O0gqO8rSB8NPTnlqxV.webp',
  bri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-bank-bri-Q0f9xwiOkaI7FDTO2xN4jVzdolxRUt.jpg',
  mandiri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/png-transparent-bank-indonesia-mandiri-banks-in-indonesia-logo-badge-icon-TZdqB701qnSCYgqatCyeQgaQi7fcnX.png',
  dana: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f58ca3528b238877e9855fcac1daa328-tAuEdG9AaGwsFl37oJFTmq0YOABtYo.jpg',
  ovo: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-ovo-l-min-EjCegCPSVOZ48fOUEGuVW5cRhRgroS.jpg',
  gopay: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/66b3fbad834dc_com.gojek.gopay-k8sLQMDF2gcMwD0Re2xQavkMOiacy3.png',
  shopeepay: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_20260507_190933_Google-9nUBSNSoSh3QEKAwwDrJLcklmgZRzL.jpg',
}

// Payment Logo Component - now using actual images
export function PaymentLogo({ type, className }: { type: string; className?: string }) {
  const logoUrl = PAYMENT_LOGO_URLS[type.toLowerCase()]
  
  if (!logoUrl) return null
  
  return (
    <img 
      src={logoUrl} 
      alt={`${type.toUpperCase()} logo`}
      className={`object-cover ${className || ''}`}
      loading="lazy"
    />
  )
}

// Mapping for payment icons with proper brand colors (for backgrounds)
export const PAYMENT_BRAND_COLORS: Record<string, { bg: string; text: string }> = {
  bca: { bg: '#0066AE', text: 'white' },
  bni: { bg: '#FFFFFF', text: '#1a5276' },
  bri: { bg: '#00529C', text: 'white' },
  mandiri: { bg: '#003366', text: 'white' },
  dana: { bg: '#FFFFFF', text: '#108EE9' },
  ovo: { bg: '#4C2A86', text: 'white' },
  gopay: { bg: '#00AED6', text: 'white' },
  shopeepay: { bg: '#EE4D2D', text: 'white' },
}
