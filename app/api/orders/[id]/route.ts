import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getOrderById, updateOrder } from '@/lib/github-db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  // Allow public access to order details (for payment tracking)
  const order = await getOrderById(id)

  if (!order) {
    return NextResponse.json(
      { success: false, error: 'Order not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    order: {
      id: order.id,
      productName: order.productName,
      totalPrice: order.totalPrice,
      buyerName: order.buyerName,
      buyerContact: order.buyerContact,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentQrisUrl: order.paymentQrisUrl,
      paymentTransactionId: order.paymentTransactionId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    },
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const order = await getOrderById(id)

  if (!order || order.userId !== session.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const updatedOrder = await updateOrder(id, body)

  if (!updatedOrder) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }

  return NextResponse.json({ success: true, order: updatedOrder })
}
