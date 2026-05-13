'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProductById,
  getProductByCode,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  getProductCategoryById,
  getProductCategoryByCode,
  getProductsByCategoryCode
} from '@/lib/github-db'

// Parse stock items from input (supports newline and comma separated)
function parseStockItems(input: string): string[] {
  if (!input || !input.trim()) return []
  
  // First try to split by newlines, then by commas if no newlines
  let items: string[]
  if (input.includes('\n')) {
    items = input.split('\n')
  } else {
    items = input.split(',')
  }
  
  return items
    .map(item => item.trim())
    .filter(item => item.length > 0)
}

// ============ PRODUCT CATEGORY ACTIONS ============

export async function createCategoryAction(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const code = formData.get('code') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const isActive = formData.get('isActive') === 'on'

  if (!code || !name) {
    return { error: 'Code dan nama kategori harus diisi' }
  }

  // Check if code already exists
  const existing = await getProductCategoryByCode(session.id, code)
  if (existing) {
    return { error: 'Code kategori sudah digunakan' }
  }

  const category = await createProductCategory({
    userId: session.id,
    code: code.toUpperCase(),
    name,
    description: description || '',
    isActive,
  })

  if (!category) {
    return { error: 'Gagal membuat kategori produk' }
  }

  revalidatePath('/dashboard/products', 'max')
  return { success: true, category }
}

export async function updateCategoryAction(id: string, formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const existingCategory = await getProductCategoryById(id)
  if (!existingCategory || existingCategory.userId !== session.id) {
    return { error: 'Kategori tidak ditemukan' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const isActive = formData.get('isActive') === 'on'

  if (!name) {
    return { error: 'Nama kategori harus diisi' }
  }

  const category = await updateProductCategory(id, {
    name,
    description: description || '',
    isActive,
  })

  if (!category) {
    return { error: 'Gagal mengupdate kategori' }
  }

  revalidatePath('/dashboard/products', 'max')
  return { success: true, category }
}

export async function deleteCategoryAction(id: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const existingCategory = await getProductCategoryById(id)
  if (!existingCategory || existingCategory.userId !== session.id) {
    return { error: 'Kategori tidak ditemukan' }
  }

  // Check if category has products
  const products = await getProductsByCategoryCode(session.id, existingCategory.code)
  if (products.length > 0) {
    return { error: `Tidak dapat menghapus kategori. Masih ada ${products.length} produk dalam kategori ini.` }
  }

  const success = await deleteProductCategory(id)
  if (!success) {
    return { error: 'Gagal menghapus kategori' }
  }

  revalidatePath('/dashboard/products', 'max')
  return { success: true }
}

export async function toggleCategoryStatusAction(id: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const existingCategory = await getProductCategoryById(id)
  if (!existingCategory || existingCategory.userId !== session.id) {
    return { error: 'Kategori tidak ditemukan' }
  }

  const category = await updateProductCategory(id, {
    isActive: !existingCategory.isActive,
  })

  if (!category) {
    return { error: 'Gagal mengubah status kategori' }
  }

  revalidatePath('/dashboard/products', 'max')
  return { success: true }
}

// ============ PRODUCT ACTIONS ============

export async function createProductAction(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const categoryCode = formData.get('categoryCode') as string
  const code = formData.get('code') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const itemsInput = formData.get('items') as string
  const successMessage = formData.get('successMessage') as string
  const isActive = formData.get('isActive') === 'on'

  // Parse stock items
  const items = parseStockItems(itemsInput)
  const stock = items.length

  if (!categoryCode || !code || !name || isNaN(price)) {
    return { error: 'Semua field harus diisi dengan benar' }
  }

  // Verify category exists
  const category = await getProductCategoryByCode(session.id, categoryCode)
  if (!category) {
    return { error: 'Kategori produk tidak ditemukan' }
  }

  // Check if product code already exists
  const existingProduct = await getProductByCode(session.id, code)
  if (existingProduct) {
    return { error: 'Code produk sudah digunakan' }
  }

  const product = await createProduct({
    userId: session.id,
    categoryCode: categoryCode.toUpperCase(),
    code: code.toUpperCase(),
    name,
    description: description || '',
    price,
    stock,
    items,
    successMessage: successMessage || undefined,
    isActive,
  })

  if (!product) {
    return { error: 'Gagal membuat produk' }
  }

  revalidatePath('/dashboard/products', 'max')
  redirect('/dashboard/products')
}

export async function updateProductAction(id: string, formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const existingProduct = await getProductById(id)
  if (!existingProduct || existingProduct.userId !== session.id) {
    return { error: 'Produk tidak ditemukan' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const itemsInput = formData.get('items') as string
  const successMessage = formData.get('successMessage') as string
  const isActive = formData.get('isActive') === 'on'

  // Parse stock items
  const items = parseStockItems(itemsInput)
  const stock = items.length

  if (!name || isNaN(price)) {
    return { error: 'Semua field harus diisi dengan benar' }
  }

  const product = await updateProduct(id, {
    name,
    description: description || '',
    price,
    stock,
    items,
    successMessage: successMessage || undefined,
    isActive,
  })

  if (!product) {
    return { error: 'Gagal mengupdate produk' }
  }

  revalidatePath('/dashboard/products', 'max')
  redirect('/dashboard/products')
}

// Add stock to existing product
export async function addStockAction(id: string, newItemsInput: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const existingProduct = await getProductById(id)
  if (!existingProduct || existingProduct.userId !== session.id) {
    return { error: 'Produk tidak ditemukan' }
  }

  const newItems = parseStockItems(newItemsInput)
  
  if (newItems.length === 0) {
    return { error: 'Minimal harus ada 1 item untuk ditambahkan' }
  }

  const currentItems = existingProduct.items || []
  const updatedItems = [...currentItems, ...newItems]

  const product = await updateProduct(id, {
    items: updatedItems,
    stock: updatedItems.length,
  })

  if (!product) {
    return { error: 'Gagal menambah stock' }
  }

  revalidatePath('/dashboard/products', 'max')
  return { 
    success: true, 
    oldStock: currentItems.length,
    newStock: updatedItems.length,
    added: newItems.length 
  }
}

export async function deleteProductAction(id: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const existingProduct = await getProductById(id)
  if (!existingProduct || existingProduct.userId !== session.id) {
    return { error: 'Produk tidak ditemukan' }
  }

  const success = await deleteProduct(id)
  if (!success) {
    return { error: 'Gagal menghapus produk' }
  }

  revalidatePath('/dashboard/products', 'max')
  return { success: true }
}

export async function toggleProductStatusAction(id: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const existingProduct = await getProductById(id)
  if (!existingProduct || existingProduct.userId !== session.id) {
    return { error: 'Produk tidak ditemukan' }
  }

  const product = await updateProduct(id, {
    isActive: !existingProduct.isActive,
  })

  if (!product) {
    return { error: 'Gagal mengubah status produk' }
  }

  revalidatePath('/dashboard/products', 'max')
  return { success: true }
}
