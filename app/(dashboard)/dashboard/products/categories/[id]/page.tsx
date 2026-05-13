import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FolderOpen, Hash, Package, Plus, Edit } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { getProductCategoryById, getProductsByCategoryCode } from '@/lib/github-db'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoBadge } from '@/components/ui/neo-badge'
import { ProductCard } from '@/components/products/ProductCard'

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const category = await getProductCategoryById(id)

  if (!category || category.userId !== session.id) {
    notFound()
  }

  const products = await getProductsByCategoryCode(session.id, category.code)
  const totalStock = products.reduce((sum, p) => sum + (p.items?.length || p.stock || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <button className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
            <NeoBadge variant="outline" className="font-mono">
              <Hash className="w-3 h-3" />
              {category.code}
            </NeoBadge>
          </div>
          <p className="text-white/60 text-sm">
            {category.description || 'Tidak ada deskripsi'}
          </p>
        </div>
        <Link href={`/dashboard/products/categories/${category.id}/edit`}>
          <NeoButton variant="outline">
            <Edit className="w-4 h-4" />
            Edit Produk
          </NeoButton>
        </Link>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl text-sm">
          <FolderOpen className="w-4 h-4 text-primary" />
          <span className="text-white/60">Status:</span>
          <NeoBadge variant={category.isActive ? 'success' : 'warning'}>
            {category.isActive ? 'Aktif' : 'Nonaktif'}
          </NeoBadge>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl text-sm">
          <Package className="w-4 h-4 text-secondary" />
          <span className="text-white/60">Varian:</span>
          <span className="font-semibold">{products.length}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl text-sm">
          <span className="text-white/60">Total Stok:</span>
          <span className="font-semibold text-success">{totalStock} item</span>
        </div>
      </div>

      {/* Products in this category */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Varian Produk</h2>
          <Link href={`/dashboard/products/new?category=${category.code}`}>
            <NeoButton size="sm">
              <Plus className="w-4 h-4" />
              Tambah Varian
            </NeoButton>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Belum Ada Varian</h3>
            <p className="text-white/60 text-sm mb-4 max-w-sm">
              Tambahkan varian pertama untuk produk ini (contoh: 1 Bulan, 3 Bulan, 1 Tahun)
            </p>
            <Link href={`/dashboard/products/new?category=${category.code}`}>
              <NeoButton>
                <Plus className="w-4 h-4" />
                Tambah Varian
              </NeoButton>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                categoryName={category.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
