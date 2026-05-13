'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, Trash2, Receipt } from 'lucide-react'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoBadge } from '@/components/ui/neo-badge'
import { NeoSelect } from '@/components/ui/neo-select'
import { updateOrderStatusAction, deleteOrderAction } from '@/actions/order.actions'
import { ORDER_STATUS } from '@/lib/constants'
import type { Order } from '@/types'

interface OrderTableProps {
  orders: Order[]
  onUpdate?: () => void
}

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
    month: 'short',
    year: 'numeric',
  })
}

const statusVariants = {
  pending: 'warning',
  processing: 'default',
  completed: 'success',
  cancelled: 'destructive',
} as const

export function OrderTable({ orders, onUpdate }: OrderTableProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleStatusChange(orderId: string, status: Order['status']) {
    setLoading(orderId)
    await updateOrderStatusAction(orderId, status)
    onUpdate?.()
    setLoading(null)
  }

  async function handleDelete(orderId: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) return
    
    setLoading(orderId)
    await deleteOrderAction(orderId)
    onUpdate?.()
    setLoading(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-card neo-border p-4 flex flex-col lg:flex-row lg:items-center gap-4"
        >
          {/* Order Info */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Produk</p>
              <p className="font-bold truncate">{order.productName}</p>
              <p className="text-sm text-muted-foreground">x{order.quantity}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Pembeli</p>
              <p className="font-bold truncate">{order.buyerName}</p>
              <p className="text-sm text-muted-foreground truncate">{order.buyerContact}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Total</p>
              <p className="font-black text-primary">{formatCurrency(order.totalPrice)}</p>
              <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Status</p>
              <NeoBadge variant={statusVariants[order.status]}>
                {ORDER_STATUS[order.status].label}
              </NeoBadge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 lg:border-l-2 lg:border-border lg:pl-4">
            <NeoSelect
              value={order.status}
              onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
              disabled={loading === order.id}
              className="w-36"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </NeoSelect>
            
            <Link href={`/dashboard/orders/${order.id}`}>
              <NeoButton variant="outline" size="icon-sm">
                <Eye className="w-4 h-4" />
              </NeoButton>
            </Link>

            <Link href={`/dashboard/orders/${order.id}/invoice`}>
              <NeoButton variant="outline" size="icon-sm">
                <Receipt className="w-4 h-4" />
              </NeoButton>
            </Link>
            
            <NeoButton
              variant="destructive"
              size="icon-sm"
              onClick={() => handleDelete(order.id)}
              disabled={loading === order.id}
            >
              <Trash2 className="w-4 h-4" />
            </NeoButton>
          </div>
        </div>
      ))}
    </div>
  )
}
