import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Package, FolderOpen, Layers } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { getProducts, getProductCategories } from '@/lib/github-db'
import { NeoButton } from '@/components/ui/neo-button'
import { ProductCategoryCard } from '@/components/products/ProductCategoryCard'
import { ProductCard } from '@/components/products/ProductCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function ProductsPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const categories = await getProductCategories(session.id)
  const products = await getProducts(session.id)
  const totalStock = products.reduce((sum, p) => sum + (p.items?.length || p.stock || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Produk</h1>
          <p className="text-muted-foreground text-sm">Kelola kategori dan produk yang dijual melalui bot</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-xl text-sm shadow-sm">
          <FolderOpen className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Produk:</span>
          <span className="font-semibold text-foreground">{categories.length}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-xl text-sm shadow-sm">
          <Layers className="w-4 h-4 text-secondary" />
          <span className="text-muted-foreground">Varian:</span>
          <span className="font-semibold text-foreground">{products.length}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-xl text-sm shadow-sm">
          <Package className="w-4 h-4 text-success" />
          <span className="text-muted-foreground">Total Stok:</span>
          <span className="font-semibold text-success">{totalStock} item</span>
        </div>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="glass w-full sm:w-auto mb-4">
          <TabsTrigger value="categories" className="flex-1 sm:flex-none gap-2">
            <FolderOpen className="w-4 h-4" />
            Produk
          </TabsTrigger>
          <TabsTrigger value="products" className="flex-1 sm:flex-none gap-2">
            <Layers className="w-4 h-4" />
            Varian & Stok
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab - Now labeled as "Produk" */}
        <TabsContent value="categories" className="mt-0">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <Link href="/dashboard/products/categories/new">
                <NeoButton>
                  <Plus className="w-4 h-4" />
                  Tambah Produk Baru
                </NeoButton>
              </Link>
            </div>

            {categories.length === 0 ? (
              <div className="bg-white border border-border p-8 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Belum Ada Produk</h3>
                <p className="text-muted-foreground text-sm mb-4 max-w-sm">
                  Buat produk terlebih dahulu (contoh: AI Pro, Canva Pro, Netflix Premium)
                </p>
                <Link href="/dashboard/products/categories/new">
                  <NeoButton>
                    <Plus className="w-4 h-4" />
                    Tambah Produk Pertama
                  </NeoButton>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {categories.map((category) => {
                  const categoryProducts = products.filter(p => p.categoryCode === category.code)
                  const categoryStock = categoryProducts.reduce((sum, p) => sum + (p.items?.length || p.stock || 0), 0)
                  return (
                    <ProductCategoryCard 
                      key={category.id} 
                      category={category}
                      productCount={categoryProducts.length}
                      stockCount={categoryStock}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Products Tab - Now labeled as "Varian & Stok" */}
        <TabsContent value="products" className="mt-0">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <Link href="/dashboard/products/new">
                <NeoButton disabled={categories.length === 0}>
                  <Plus className="w-4 h-4" />
                  Tambah Varian
                </NeoButton>
              </Link>
            </div>

            {categories.length === 0 ? (
              <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-warning/20 to-warning/5 rounded-3xl flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-warning" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Buat Produk Dulu</h3>
                <p className="text-white/60 text-sm mb-4 max-w-sm">
                  Anda harus membuat produk terlebih dahulu sebelum menambahkan varian
                </p>
                <Link href="/dashboard/products/categories/new">
                  <NeoButton>
                    <Plus className="w-4 h-4" />
                    Tambah Produk
                  </NeoButton>
                </Link>
              </div>
            ) : products.length === 0 ? (
              <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                  <Package className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Belum Ada Varian</h3>
                <p className="text-white/60 text-sm mb-4 max-w-sm">
                  Tambahkan varian produk (contoh: 1 Bulan, 3 Bulan, 1 Tahun)
                </p>
                <Link href="/dashboard/products/new">
                  <NeoButton>
                    <Plus className="w-4 h-4" />
                    Tambah Varian Pertama
                  </NeoButton>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {products.map((product) => {
                  const category = categories.find(c => c.code === product.categoryCode)
                  return (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      categoryName={category?.name || product.categoryCode}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
