'use client'

import { useState } from 'react'
import { Package, DollarSign, Hash, FileText, Save, ArrowLeft, Database, CheckCircle2, XCircle, Sparkles, FolderOpen, MessageSquareText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoInput } from '@/components/ui/neo-input'
import { NeoTextarea } from '@/components/ui/neo-textarea'
import { NeoSelect } from '@/components/ui/neo-select'
import { LoadingButton } from '@/components/ui/loading-button'
import type { Product, ProductCategory } from '@/types'

interface ProductFormProps {
  product?: Product
  categories: ProductCategory[]
  onSubmit: (formData: FormData) => Promise<{ error?: string } | void>
  submitLabel?: string
}

export function ProductForm({ product, categories, onSubmit, submitLabel = 'Simpan Produk' }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [stockItems, setStockItems] = useState<string>(product?.items?.join('\n') || '')
  const [showSuccess, setShowSuccess] = useState(false)

  // Calculate stock count from items
  const stockCount = stockItems.split('\n').filter(item => item.trim().length > 0).length

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setLoadingState('loading')
    setError(null)
    
    // Add items to formData
    formData.set('items', stockItems)
    formData.set('stock', stockCount.toString())
    
    try {
      const result = await onSubmit(formData)
      
      if (result?.error) {
        setError(result.error)
        setLoading(false)
        setLoadingState('error')
        toast.error(result.error, {
          icon: <XCircle className="w-5 h-5" />,
        })
        setTimeout(() => setLoadingState('idle'), 2000)
      } else {
        setLoadingState('success')
        setShowSuccess(true)
        toast.success(product ? 'Varian berhasil diperbarui!' : 'Varian berhasil ditambahkan!', {
          icon: <CheckCircle2 className="w-5 h-5" />,
        })
        setTimeout(() => {
          router.push('/dashboard/products')
        }, 3000)
      }
    } catch {
      setLoading(false)
      setLoadingState('error')
      toast.error('Terjadi kesalahan', {
        icon: <XCircle className="w-5 h-5" />,
      })
      setTimeout(() => setLoadingState('idle'), 2000)
    }
  }

  // Success overlay
  if (showSuccess) {
    return (
      <div className="glass-card p-5 rounded-3xl relative overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 animate-bounce-in">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full bg-success/20 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-success mb-2">
            {product ? 'Varian Diperbarui!' : 'Varian Ditambahkan!'}
          </h3>
          <p className="text-white/60 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-success animate-pulse" />
            Mengalihkan ke halaman produk...
          </p>
          
          <div className="w-48 h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-success to-primary rounded-full transition-all duration-[3000ms] ease-linear"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-5 rounded-3xl animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/products">
          <button className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h2 className="font-semibold text-lg">{product ? 'Edit Varian' : 'Tambah Varian Baru'}</h2>
          <p className="text-sm text-white/60">
            {product ? 'Perbarui informasi varian' : 'Tambah varian produk dengan harga & stok berbeda (contoh: 1 Bulan, 3 Bulan)'}
          </p>
        </div>
      </div>

      <form action={handleSubmit}>
        <div className="flex flex-col gap-5">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-xl border border-destructive/20 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Category Selection */}
          <div className="flex flex-col gap-2">
            <label htmlFor="categoryCode" className="text-sm font-medium text-white/60">
              Produk Utama
            </label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none z-10" />
              <NeoSelect
                id="categoryCode"
                name="categoryCode"
                className="pl-11"
                defaultValue={product?.categoryCode || ''}
                disabled={!!product}
                required
              >
                <option value="">Pilih Produk</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.code}>
                    [{cat.code}] {cat.name}
                  </option>
                ))}
              </NeoSelect>
            </div>
            {!product && (
              <p className="text-xs text-white/40">
                Pilih produk utama untuk varian ini (tidak bisa diubah setelah dibuat)
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="code" className="text-sm font-medium text-white/60">
                Kode Varian
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <NeoInput
                  id="code"
                  name="code"
                  type="text"
                  placeholder="1BLN, 3BLN, 1THN"
                  className="pl-11 font-mono uppercase"
                  defaultValue={product?.code || ''}
                  disabled={!!product}
                  required
                  maxLength={20}
                />
              </div>
              <p className="text-xs text-white/40">
                Kode unik untuk varian ini
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-white/60">
                Nama Varian
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <NeoInput
                  id="name"
                  name="name"
                  type="text"
                  placeholder="1 Bulan, 3 Bulan, 1 Tahun"
                  className="pl-11"
                  defaultValue={product?.name || ''}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="text-sm font-medium text-white/60">
              Deskripsi Varian (Opsional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-4 w-5 h-5 text-white/40" />
              <NeoTextarea
                id="description"
                name="description"
                placeholder="Deskripsi varian, masa aktif, fitur, dll..."
                className="pl-11 min-h-[80px]"
                defaultValue={product?.description || ''}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="price" className="text-sm font-medium text-white/60">
              Harga (Rp)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <NeoInput
                id="price"
                name="price"
                type="number"
                min="0"
                step="1000"
                placeholder="50000"
                className="pl-11"
                defaultValue={product?.price || ''}
                required
              />
            </div>
          </div>

          {/* Success Message */}
          <div className="flex flex-col gap-2">
            <label htmlFor="successMessage" className="text-sm font-medium text-white/60">
              Pesan Tambahan Setelah Transaksi (Opsional)
            </label>
            <div className="relative">
              <MessageSquareText className="absolute left-3 top-4 w-5 h-5 text-white/40" />
              <NeoTextarea
                id="successMessage"
                name="successMessage"
                placeholder={`Contoh:
🎀 CAPCUT SHARING 1 BLN 🎀

SNK CAPCUT SHARING 📌
🪷 LOGIN MAX 1 DEVICE
🪷 Garansi 20 hari
🪷 Dilarang otak atik akun

Thanks for your order ❤️`}
                className="pl-11 min-h-[150px]"
                defaultValue={product?.successMessage || ''}
              />
            </div>
            <p className="text-xs text-white/40">
              Pesan ini akan dikirim sebagai pesan terpisah setelah detail transaksi sukses. Cocok untuk SNK, tutorial, atau pesan promosi.
            </p>
          </div>

          {/* Stock Items Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="stockItems" className="text-sm font-medium text-white/60">
                Stok (Format: email:password)
              </label>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                stockCount > 0 
                  ? 'bg-success/20 text-success' 
                  : 'bg-white/10 text-white/40'
              }`}>
                {stockCount} item
              </span>
            </div>
            <div className="relative">
              <Database className="absolute left-3 top-4 w-5 h-5 text-white/40" />
              <textarea
                id="stockItems"
                value={stockItems}
                onChange={(e) => setStockItems(e.target.value)}
                placeholder={`Masukkan stok (1 item per baris):
user1@gmail.com:password123
user2@gmail.com:password456
user3@gmail.com:password789

Atau pisahkan dengan koma:
user1@gmail.com:pass1, user2@gmail.com:pass2`}
                className="flex w-full glass-input px-4 py-3 pl-11 text-sm rounded-2xl transition-all duration-300 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono min-h-[180px]"
              />
            </div>
            <p className="text-xs text-white/40">
              Masukkan akun dalam format email:password. Setiap baris = 1 stok yang akan dikirim ke pembeli.
            </p>
          </div>

          <label className="flex items-center gap-3 p-4 glass rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              defaultChecked={product?.isActive ?? true}
              className="w-5 h-5 rounded accent-primary cursor-pointer"
            />
            <span className="font-medium text-sm">
              Aktifkan varian (tampil di bot)
            </span>
          </label>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <LoadingButton 
              type="submit" 
              disabled={loading} 
              loading={loadingState === 'loading'}
              loadingText="Menyimpan..."
              success={loadingState === 'success'}
              successText="Tersimpan!"
              error={loadingState === 'error'}
              errorText="Gagal!"
              className="flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4" />
              {submitLabel}
            </LoadingButton>
            <Link href="/dashboard/products">
              <NeoButton type="button" variant="outline" className="w-full sm:w-auto">
                Batal
              </NeoButton>
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
