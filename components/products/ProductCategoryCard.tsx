'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FolderOpen, Edit, Trash2, Power, Eye, Package, Hash } from 'lucide-react'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoBadge } from '@/components/ui/neo-badge'
import { deleteCategoryAction, toggleCategoryStatusAction } from '@/actions/product.actions'
import type { ProductCategory } from '@/types'

interface ProductCategoryCardProps {
  category: ProductCategory
  productCount: number
  stockCount: number
  onUpdate?: () => void
}

export function ProductCategoryCard({ category, productCount, stockCount, onUpdate }: ProductCategoryCardProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleToggle() {
    setLoading(true)
    await toggleCategoryStatusAction(category.id)
    onUpdate?.()
    setLoading(false)
  }

  async function handleDelete() {
    if (productCount > 0) {
      alert(`Tidak dapat menghapus produk. Masih ada ${productCount} varian dalam produk ini.`)
      return
    }
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return
    
    setDeleting(true)
    const result = await deleteCategoryAction(category.id)
    if (result.error) {
      alert(result.error)
    }
    onUpdate?.()
    setDeleting(false)
  }

  return (
    <div className={`bg-white border border-border p-4 rounded-2xl shadow-sm transition-all duration-300 ${
      category.isActive 
        ? 'hover:shadow-md' 
        : 'opacity-60'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
          category.isActive 
            ? 'bg-gradient-to-br from-primary/10 to-secondary/10' 
            : 'bg-muted'
        }`}>
          <FolderOpen className={`w-6 h-6 ${category.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{category.name}</h3>
                <NeoBadge variant="outline" className="font-mono text-xs">
                  <Hash className="w-3 h-3" />
                  {category.code}
                </NeoBadge>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <NeoBadge variant={category.isActive ? 'success' : 'warning'}>
                  {category.isActive ? 'Aktif' : 'Nonaktif'}
                </NeoBadge>
              </div>
            </div>
          </div>
          
          {category.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {category.description}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {productCount} varian
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-medium ${
                  stockCount > 0 ? 'text-success' : 'text-muted-foreground'
                }`}>
                  {stockCount} stok
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Link href={`/dashboard/products/categories/${category.id}`}>
                <NeoButton variant="outline" size="icon-sm" className="rounded-xl">
                  <Eye className="w-4 h-4" />
                </NeoButton>
              </Link>
              <Link href={`/dashboard/products/categories/${category.id}/edit`}>
                <NeoButton variant="accent" size="icon-sm" className="rounded-xl">
                  <Edit className="w-4 h-4" />
                </NeoButton>
              </Link>
              <NeoButton
                variant={category.isActive ? 'warning' : 'success'}
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
                disabled={deleting || productCount > 0}
                className="rounded-xl"
                title={productCount > 0 ? 'Hapus semua varian terlebih dahulu' : 'Hapus produk'}
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
