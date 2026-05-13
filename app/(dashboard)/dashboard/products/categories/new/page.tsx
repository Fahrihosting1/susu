import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { CategoryForm } from '@/components/products/CategoryForm'

export default async function NewCategoryPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="max-w-2xl">
      <CategoryForm />
    </div>
  )
}
