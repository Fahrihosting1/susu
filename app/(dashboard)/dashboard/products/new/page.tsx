import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getProductCategories } from '@/lib/github-db'
import { ProductForm } from '@/components/products/ProductForm'
import { createProductAction } from '@/actions/product.actions'

export default async function NewProductPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const categories = await getProductCategories(session.id)

  // If no categories, redirect to create one first
  if (categories.length === 0) {
    redirect('/dashboard/products/categories/new')
  }

  return (
    <div className="max-w-2xl">
      <ProductForm 
        categories={categories}
        onSubmit={createProductAction} 
        submitLabel="Tambah Produk" 
      />
    </div>
  )
}
