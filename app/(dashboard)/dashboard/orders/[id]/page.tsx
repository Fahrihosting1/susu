'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, User, Phone, Calendar, DollarSign, Hash, FileText, Save, Receipt } from 'lucide-react'
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent, NeoCardFooter } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoBadge } from '@/components/ui/neo-badge'
import { NeoSelect } from '@/components/ui/neo-select'
import { updateOrderStatusAction } from '@/actions/order.actions'
import { ORDER_STATUS } from '@/lib/constants'
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
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusVariants = {
  pending: 'warning',
  processing: 'default',
  completed: 'success',
  cancelled: 'destructive',
} as const

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newStatus, setNewStatus] = useState<Order['status'] | null>(null)

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order)
        setNewStatus(data.order.status)
      } else {
        router.push('/dashboard/orders')
      }
    } catch {
      router.push('/dashboard/orders')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveStatus() {
    if (!order || !newStatus || newStatus === order.status) return
    
    setSaving(true)
    const result = await updateOrderStatusAction(order.id, newStatus)
    
    if (!result.error) {
      setOrder({ ...order, status: newStatus })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 bg-primary neo-border animate-pulse" />
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders">
          <NeoButton variant="outline" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </NeoButton>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black uppercase tracking-tight">Detail Pesanan</h1>
          <p className="text-muted-foreground text-sm">ID: {order.id}</p>
        </div>
        <Link href={`/dashboard/orders/${order.id}/invoice`}>
          <NeoButton variant="outline">
            <Receipt className="w-4 h-4" />
            Invoice
          </NeoButton>
        </Link>
        <NeoBadge variant={statusVariants[order.status]} className="text-sm px-4 py-2">
          {ORDER_STATUS[order.status].label}
        </NeoBadge>
      </div>

      {/* Product Info */}
      <NeoCard className="bg-primary text-primary-foreground">
        <NeoCardContent className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white neo-border-2 flex items-center justify-center shrink-0">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-black text-xl">{order.productName}</p>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm opacity-80">Qty: {order.quantity}</span>
              <span className="font-bold">{formatCurrency(order.totalPrice)}</span>
            </div>
          </div>
        </NeoCardContent>
      </NeoCard>

      {/* Buyer Info */}
      <NeoCard>
        <NeoCardHeader>
          <NeoCardTitle>Informasi Pembeli</NeoCardTitle>
        </NeoCardHeader>
        <NeoCardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-muted neo-border-2">
            <User className="w-6 h-6 text-secondary" />
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Nama</p>
              <p className="font-bold">{order.buyerName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-muted neo-border-2">
            <Phone className="w-6 h-6 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Kontak</p>
              <p className="font-bold">{order.buyerContact}</p>
            </div>
          </div>
        </NeoCardContent>
      </NeoCard>

      {/* Order Details */}
      <NeoCard>
        <NeoCardHeader>
          <NeoCardTitle>Detail Pesanan</NeoCardTitle>
        </NeoCardHeader>
        <NeoCardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted neo-border-2">
              <Hash className="w-6 h-6 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Jumlah</p>
                <p className="font-bold">{order.quantity}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-muted neo-border-2">
              <DollarSign className="w-6 h-6 text-success" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Total</p>
                <p className="font-black text-success">{formatCurrency(order.totalPrice)}</p>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="p-4 bg-muted neo-border-2">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground uppercase font-bold">Catatan</p>
              </div>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}

          <div className="flex flex-col gap-2 text-sm text-muted-foreground border-t-2 border-border pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Dibuat: {formatDate(order.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Diperbarui: {formatDate(order.updatedAt)}</span>
            </div>
          </div>
        </NeoCardContent>
      </NeoCard>

      {/* Update Status */}
      <NeoCard>
        <NeoCardHeader>
          <NeoCardTitle>Update Status</NeoCardTitle>
        </NeoCardHeader>
        <NeoCardContent>
          <div className="flex items-center gap-4">
            <NeoSelect
              value={newStatus || order.status}
              onChange={(e) => setNewStatus(e.target.value as Order['status'])}
              className="flex-1"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </NeoSelect>
          </div>
        </NeoCardContent>
        <NeoCardFooter>
          <NeoButton
            onClick={handleSaveStatus}
            disabled={saving || newStatus === order.status}
          >
            <Save className="w-5 h-5" />
            {saving ? 'Menyimpan...' : 'Simpan Status'}
          </NeoButton>
        </NeoCardFooter>
      </NeoCard>
    </div>
  )
}
