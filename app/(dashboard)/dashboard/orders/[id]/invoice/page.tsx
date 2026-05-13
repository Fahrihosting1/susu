'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Printer, Check, Clock, X, Package, CreditCard, Calendar, Hash, User } from 'lucide-react'
import { NeoButton } from '@/components/ui/neo-button'
import type { Order } from '@/types'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusConfig = {
  pending: { label: 'Menunggu', icon: Clock, color: 'bg-amber-500', textColor: 'text-amber-600' },
  processing: { label: 'Diproses', icon: Clock, color: 'bg-blue-500', textColor: 'text-blue-600' },
  completed: { label: 'Selesai', icon: Check, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  cancelled: { label: 'Dibatalkan', icon: X, color: 'bg-red-500', textColor: 'text-red-600' },
}

export default function InvoicePage() {
  const params = useParams()
  const router = useRouter()
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order)
      } else {
        router.push('/dashboard/orders')
      }
    } catch {
      router.push('/dashboard/orders')
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 bg-black border-4 border-black animate-pulse" />
      </div>
    )
  }

  if (!order) return null

  const StatusIcon = statusConfig[order.status].icon
  const pricePerUnit = order.totalPrice / order.quantity

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header Actions - Hide on print */}
      <div className="flex items-center justify-between no-print">
        <Link href={`/dashboard/orders/${order.id}`}>
          <NeoButton variant="outline" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </NeoButton>
        </Link>
        <div className="flex items-center gap-2">
          <NeoButton variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Print
          </NeoButton>
        </div>
      </div>

      {/* Invoice Card */}
      <div 
        ref={invoiceRef}
        className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] print-invoice"
      >
        {/* Invoice Header */}
        <div className="border-b-4 border-black p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight print:text-2xl">INVOICE</h1>
              <p className="text-sm text-gray-600 mt-1 font-mono">#{order.id.slice(0, 12).toUpperCase()}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 border-2 border-black ${statusConfig[order.status].color} text-white font-bold`}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig[order.status].label.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-2 border-b-4 border-black">
          <div className="p-6 border-r-4 border-black">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-2">
              <User className="w-4 h-4" />
              Pembeli
            </div>
            <p className="font-bold text-lg">{order.buyerName}</p>
            <p className="text-sm text-gray-600 font-mono">{order.buyerContact}</p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-2">
              <Calendar className="w-4 h-4" />
              Tanggal
            </div>
            <p className="font-bold text-lg">{formatDate(order.createdAt)}</p>
            <p className="text-sm text-gray-600">{formatTime(order.createdAt)}</p>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-6 border-b-4 border-black">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-4">
            <Package className="w-4 h-4" />
            Detail Produk
          </div>
          
          {/* Product Table Header */}
          <div className="grid grid-cols-12 gap-4 bg-black text-white font-bold text-sm p-3">
            <div className="col-span-6">PRODUK</div>
            <div className="col-span-2 text-center">QTY</div>
            <div className="col-span-2 text-right">HARGA</div>
            <div className="col-span-2 text-right">TOTAL</div>
          </div>
          
          {/* Product Row */}
          <div className="grid grid-cols-12 gap-4 border-b-2 border-black p-3 items-center">
            <div className="col-span-6">
              <p className="font-bold">{order.productName}</p>
              {order.notes && (
                <p className="text-xs text-gray-500 mt-1">{order.notes}</p>
              )}
            </div>
            <div className="col-span-2 text-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 border-2 border-black font-bold">
                {order.quantity}
              </span>
            </div>
            <div className="col-span-2 text-right font-mono text-sm">
              {formatCurrency(pricePerUnit)}
            </div>
            <div className="col-span-2 text-right font-bold font-mono">
              {formatCurrency(order.totalPrice)}
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="p-6 border-b-4 border-black">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-4">
            <CreditCard className="w-4 h-4" />
            Ringkasan Pembayaran
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-mono">{formatCurrency(order.totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Biaya Admin</span>
              <span className="font-mono">Rp 0</span>
            </div>
            <div className="border-t-2 border-dashed border-gray-300 my-2" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">TOTAL</span>
              <span className="font-black text-2xl font-mono">{formatCurrency(order.totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Payment Status Bar */}
        <div className={`p-4 ${order.status === 'completed' ? 'bg-emerald-50' : order.status === 'cancelled' ? 'bg-red-50' : 'bg-amber-50'}`}>
          <div className="flex items-center justify-center gap-3">
            {order.status === 'completed' ? (
              <>
                <div className="w-8 h-8 bg-emerald-500 border-2 border-black flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-emerald-700">PEMBAYARAN LUNAS</p>
                  <p className="text-xs text-emerald-600">Transaksi berhasil</p>
                </div>
              </>
            ) : order.status === 'cancelled' ? (
              <>
                <div className="w-8 h-8 bg-red-500 border-2 border-black flex items-center justify-center">
                  <X className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-red-700">DIBATALKAN</p>
                  <p className="text-xs text-red-600">Transaksi dibatalkan</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-amber-500 border-2 border-black flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-amber-700">MENUNGGU PEMBAYARAN</p>
                  <p className="text-xs text-amber-600">Silakan selesaikan pembayaran</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t-4 border-black">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Terima kasih telah berbelanja!</p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Hash className="w-3 h-3" />
              <span className="font-mono">{order.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
