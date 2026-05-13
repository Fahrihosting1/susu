'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { updateOrder, deleteOrder, getOrderById } from '@/lib/github-db'
import type { Order } from '@/types'

export async function updateOrderStatusAction(id: string, status: Order['status']) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const existingOrder = await getOrderById(id)
  if (!existingOrder || existingOrder.userId !== session.id) {
    return { error: 'Order tidak ditemukan' }
  }

  const order = await updateOrder(id, { status })

  if (!order) {
    return { error: 'Gagal mengupdate status order' }
  }

  revalidatePath('/dashboard/orders', 'max')
  return { success: true }
}

export async function deleteOrderAction(id: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const existingOrder = await getOrderById(id)
  if (!existingOrder || existingOrder.userId !== session.id) {
    return { error: 'Order tidak ditemukan' }
  }

  const success = await deleteOrder(id)
  if (!success) {
    return { error: 'Gagal menghapus order' }
  }

  revalidatePath('/dashboard/orders', 'max')
  return { success: true }
}

export async function generateQrisPaymentAction(orderId: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const order = await getOrderById(orderId)
  if (!order || order.userId !== session.id) {
    return { error: 'Order tidak ditemukan' }
  }

  try {
    // Call API to create QRIS payment
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/payments/create-qris`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          userId: session.id,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Gagal membuat QRIS payment' }
    }

    revalidatePath(`/dashboard/orders/${orderId}`, 'max')
    return { success: true, ...data }
  } catch (error) {
    console.error('Generate QRIS Error:', error)
    return { error: 'Gagal membuat QRIS payment' }
  }
}
