'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, Edit, Trash2, Power, Eye, Database, Hash, FolderOpen } from 'lucide-react'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoBadge } from '@/components/ui/neo-badge'
import { deleteProductAction, toggleProductStatusAction } from '@/actions/product.actions'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  categoryName?: string
  onUpdate?: () => void
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function ProductCard({ product, categoryName, onUpdate }: ProductCardProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleToggle() {
    setLoading(true)
    await toggleProductStatusAction(product.id)
    onUpdate?.()
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return
    
    setDeleting(true)
    await deleteProductAction(product.id)
    onUpdate?.()
    setDeleting(false)
  }

  const stockCount = product.items?.length || product.stock || 0

  return (
    <div className={`bg-white border border-border p-4 rounded-2xl shadow-sm transition-all duration-300 ${
      product.isActive 
        ? 'hover:shadow-md' 
        : 'opacity-60'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
          product.isActive 
            ? 'bg-gradient-to-br from-secondary/10 to-primary/10' 
            : 'bg-muted'
        }`}>
          <Package className={`w-6 h-6 ${product.isActive ? 'text-secondary' : 'text-muted-foreground'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold truncate">{product.name}</h3>
                <NeoBadge variant="outline" className="font-mono text-xs">
                  <Hash className="w-3 h-3" />
                  {product.code}
                </NeoBadge>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <NeoBadge variant="secondary" className="text-xs">
                  <FolderOpen className="w-3 h-3" />
                  {categoryName || product.categoryCode}
                </NeoBadge>
                <NeoBadge variant={product.isActive ? 'success' : 'warning'}>
                  {product.isActive ? 'Aktif' : 'Nonaktif'}
                </NeoBadge>
              </div>
            </div>
            <p className="font-semibold text-primary whitespace-nowrap">
              {formatCurrency(product.price)}
            </p>
          </div>
          
          {product.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {product.description}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-muted-foreground" />
                <span className={`text-sm font-medium ${
                  stockCount > 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {stockCount} stok
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Link href={`/dashboard/products/${product.id}`}>
                <NeoButton variant="outline" size="icon-sm" className="rounded-xl">
                  <Eye className="w-4 h-4" />
                </NeoButton>
              </Link>
              <Link href={`/dashboard/products/${product.id}/edit`}>
                <NeoButton variant="accent" size="icon-sm" className="rounded-xl">
                  <Edit className="w-4 h-4" />
                </NeoButton>
              </Link>
              <NeoButton
                variant={product.isActive ? 'warning' : 'success'}
                size="icon-sm"
                onClick={handleToggle}
                disabled={loading}
                className="rounded-xl"
              >
                <Power className="w-4 h-4" />
              </NeoButton>
              <NeoButton
                variant="destructive"
                size="icon-sm"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
              </NeoButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
