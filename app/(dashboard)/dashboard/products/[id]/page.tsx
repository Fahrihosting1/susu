import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Package, Calendar, Hash, DollarSign, FolderOpen } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { getProductById, getProductCategoryByCode } from '@/lib/github-db'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoBadge } from '@/components/ui/neo-badge'
import { AddStockForm } from './add-stock-form'

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

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const product = await getProductById(id)

  if (!product || product.userId !== session.id) {
    notFound()
  }

  const category = await getProductCategoryByCode(session.id, product.categoryCode)

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/dashboard/products">
          <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight">{product.name}</h1>
            <NeoBadge variant="outline" className="font-mono text-xs">
              <Hash className="w-3 h-3" />
              {product.code}
            </NeoBadge>
          </div>
          <div className="flex items-center gap-2">
            <NeoBadge variant="secondary">
              <FolderOpen className="w-3 h-3" />
              {category?.name || product.categoryCode}
            </NeoBadge>
            <NeoBadge variant={product.isActive ? 'success' : 'warning'}>
              {product.isActive ? 'Aktif' : 'Nonaktif'}
            </NeoBadge>
          </div>
        </div>
        <Link href={`/dashboard/products/${product.id}/edit`}>
          <NeoButton variant="accent" className="w-full sm:w-auto">
            <Edit className="w-4 h-4" />
            Edit
          </NeoButton>
        </Link>
      </div>

      {/* Product Info Card */}
      <div className="glass-card p-5 rounded-3xl">
        <div className="flex flex-col gap-5">
          {/* Image */}
          <div className="w-full h-40 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl flex items-center justify-center">
            <Package className="w-12 h-12 text-secondary/50" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 glass rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-white/50 font-medium">Harga</p>
                <p className="font-semibold">{formatCurrency(product.price)}</p>
              </div>
            </div>
            
            <div className={`flex items-center gap-3 p-4 glass rounded-2xl`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                product.stock > 0 ? 'bg-success/20' : 'bg-destructive/20'
              }`}>
                <Hash className={`w-5 h-5 ${product.stock > 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
              <div>
                <p className="text-xs text-white/50 font-medium">Stok</p>
                <p className={`font-semibold ${product.stock > 0 ? 'text-success' : 'text-destructive'}`}>
                  {product.stock} item
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="font-medium text-sm text-white/50 mb-2">Deskripsi</h3>
              <p className="text-sm whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* Stock Items Preview */}
          {product.items && product.items.length > 0 && (
            <div>
              <h3 className="font-medium text-sm text-white/50 mb-2">
                Stok Items ({product.items.length})
              </h3>
              <div className="glass rounded-2xl p-3 max-h-40 overflow-y-auto">
                <ul className="text-xs font-mono flex flex-col gap-1">
                  {product.items.slice(0, 10).map((item, idx) => (
                    <li key={idx} className="text-white/60 truncate flex items-center gap-2">
                      <span className="text-white/30">{idx + 1}.</span>
                      <span>{item.length > 40 ? item.substring(0, 40) + '...' : item}</span>
                    </li>
                  ))}
                  {product.items.length > 10 && (
                    <li className="text-primary text-xs mt-2">
                      +{product.items.length - 10} item lainnya...
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-col gap-1 text-xs text-white/40 border-t border-white/10 pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>Dibuat: {formatDate(product.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>Diperbarui: {formatDate(product.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Stock Form */}
      <AddStockForm productId={product.id} productName={product.name} currentStock={product.stock} />
    </div>
  )
}
