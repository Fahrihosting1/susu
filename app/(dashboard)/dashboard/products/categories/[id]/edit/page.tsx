import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getProductCategoryById } from '@/lib/github-db'
import { CategoryForm } from '@/components/products/CategoryForm'

export default async function EditCategoryPage({
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

  return (
    <div className="max-w-2xl">
      <CategoryForm category={category} />
    </div>
  )
}
