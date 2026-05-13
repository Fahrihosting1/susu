'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Database, CheckCircle, AlertCircle, XCircle, Sparkles, Package } from 'lucide-react'
import { toast } from 'sonner'
import { NeoButton } from '@/components/ui/neo-button'
import { LoadingButton } from '@/components/ui/loading-button'
import { useStatusModal } from '@/components/ui/status-modal'
import { addStockAction } from '@/actions/product.actions'

interface AddStockFormProps {
  productId: string
  productName: string
  currentStock: number
}

export function AddStockForm({ productId, productName, currentStock }: AddStockFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { showSuccess: showSuccessModal, showError: showErrorModal, StatusModalComponent } = useStatusModal()

  // Calculate item count from input
  const itemCount = items.split('\n').filter(item => item.trim().length > 0).length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setLoadingState('loading')
    setMessage(null)

    const result = await addStockAction(productId, items)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      setLoading(false)
      setLoadingState('error')
      showErrorModal(
        'Gagal Menambah Stock',
        result.error,
        { actionLabel: 'Coba Lagi' }
      )
      toast.error(result.error, {
        icon: <XCircle className="w-5 h-5" />,
        description: 'Gagal menambahkan stock',
      })
      setTimeout(() => setLoadingState('idle'), 2000)
    } else if (result.success) {
      setLoadingState('success')
      setMessage({ 
        type: 'success', 
        text: `Berhasil menambah ${result.added} item. Stock: ${result.oldStock} → ${result.newStock}` 
      })
      showSuccessModal(
        `${result.added} Item Berhasil Ditambahkan!`,
        `Stock ${productName}: ${result.oldStock} → ${result.newStock}`,
        { 
          actionLabel: 'OK',
          showConfetti: true,
          autoClose: 3000
        }
      )
      toast.success(`Berhasil menambah ${result.added} item!`, {
        icon: <CheckCircle className="w-5 h-5" />,
        description: `Stock: ${result.oldStock} → ${result.newStock}`,
      })
      setItems('')
      setLoading(false)
      setTimeout(() => setLoadingState('idle'), 2000)
      // Refresh the page to show updated data
      router.refresh()
    }
  }

  if (!isOpen) {
    return (
      <>
        {StatusModalComponent}
        <button
          onClick={() => setIsOpen(true)}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-3 text-white/50 hover:text-primary group hover:scale-[1.02] active:scale-[0.98]"
        >
          <Package className="w-5 h-5 group-hover:animate-wiggle" />
          <span className="font-medium">Tambah Stock</span>
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
        </button>
      </>
    )
  }

  return (
    <>
      {StatusModalComponent}
      <div className="glass-card p-5 rounded-3xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              Tambah Stock
              <Sparkles className="w-4 h-4 text-primary animate-float" />
            </h3>
            <p className="text-sm text-muted-foreground">
              Tambah item baru ke {productName}
            </p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false)
              setItems('')
              setMessage(null)
              setLoadingState('idle')
            }}
            className="text-white/50 hover:text-white text-sm hover:bg-white/10 px-2 py-1 rounded-lg transition-all"
          >
            Batal
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg flex items-center gap-3 mb-4 animate-slide-down ${
              message.type === 'success' 
                ? 'bg-success/10 text-success border border-success/20' 
                : 'bg-destructive/10 text-destructive border border-destructive/20 animate-shake'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 animate-scale-up" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="font-medium text-sm">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="newItems" className="text-sm font-medium text-white/60">
                Item Baru (format: email:password)
              </label>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full transition-all ${
                itemCount > 0 
                  ? 'bg-success/20 text-success animate-pop' 
                  : 'bg-white/10 text-white/40'
              }`}>
                +{itemCount} item
              </span>
            </div>
            <div className="relative">
              <Database className="absolute left-3 top-4 w-5 h-5 text-white/40" />
              <textarea
                id="newItems"
                value={items}
                onChange={(e) => setItems(e.target.value)}
                placeholder={`Masukkan item baru (1 item per baris):\nuser4:pass4\nuser5:pass5\nuser6:pass6`}
                className="flex w-full glass-input px-4 py-3 pl-11 text-sm rounded-2xl transition-all duration-300 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono min-h-[140px]"
                required
              />
            </div>
            <p className="text-xs text-white/40">
              Stock saat ini: <span className="font-semibold text-white">{currentStock}</span> item
            </p>
          </div>

          <LoadingButton 
            type="submit" 
            disabled={loading || itemCount === 0} 
            className="w-full"
            loading={loadingState === 'loading'}
            loadingText="Menambahkan..."
            success={loadingState === 'success'}
            successText="Berhasil Ditambahkan!"
            error={loadingState === 'error'}
            errorText="Gagal Menambahkan"
          >
            <Plus className="w-4 h-4" />
            {`Tambah ${itemCount} Item`}
          </LoadingButton>
        </form>
      </div>
    </>
  )
}
