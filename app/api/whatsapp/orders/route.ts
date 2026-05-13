import { NextRequest, NextResponse } from 'next/server'
import { getBotSettings, getProductById, createOrder, updateOrder, getOrderById, updateProduct } from '@/lib/github-db'
import type { Order } from '@/types'

// POST /api/whatsapp/orders - Create a new order from WhatsApp
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    const userId = request.headers.get('x-user-id')

    if (!apiKey || !userId) {
      return NextResponse.json(
        { error: 'Missing API key or user ID' },
        { status: 401 }
      )
    }

    // Verify API key
    const botSettings = await getBotSettings(userId)
    if (!botSettings || botSettings.waApiKey !== apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, quantity, buyerName, buyerContact, buyerId, notes, platform } = body

    if (!productId || !quantity || !buyerName || !buyerContact) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, quantity, buyerName, buyerContact' },
        { status: 400 }
      )
    }

    // Get product and validate
    const product = await getProductById(productId)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (!product.isActive) {
      return NextResponse.json(
        { error: 'Product is not available' },
        { status: 400 }
      )
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${product.stock}` },
        { status: 400 }
      )
    }

    // Calculate total price
    const totalPrice = product.price * quantity

    // Create order
    const order = await createOrder({
      userId: product.userId,
      productId: product.id,
      productName: product.name,
      quantity,
      totalPrice,
      buyerName,
      buyerContact,
      buyerId: buyerId || undefined,
      status: 'pending',
      paymentStatus: 'unpaid',
      notes: notes ? `[WhatsApp${platform ? ` - ${platform}` : ''}] ${notes}` : `[WhatsApp${platform ? ` - ${platform}` : ''}]`,
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        productName: order.productName,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      }
    })
  } catch (error) {
    console.error('WhatsApp create order API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/whatsapp/orders?orderId=xxx - Get order details
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    const userId = request.headers.get('x-user-id')

    if (!apiKey || !userId) {
      return NextResponse.json(
        { error: 'Missing API key or user ID' },
        { status: 401 }
      )
    }

    // Verify API key
    const botSettings = await getBotSettings(userId)
    if (!botSettings || botSettings.waApiKey !== apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify order belongs to this user
    if (order.userId !== userId) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      order
    })
  } catch (error) {
    console.error('WhatsApp get order API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/whatsapp/orders - Update order (complete, deliver items)
export async function PATCH(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    const userId = request.headers.get('x-user-id')

    if (!apiKey || !userId) {
      return NextResponse.json(
        { error: 'Missing API key or user ID' },
        { status: 401 }
      )
    }

    // Verify API key
    const botSettings = await getBotSettings(userId)
    if (!botSettings || botSettings.waApiKey !== apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId, action, paymentStatus, paymentMethod, paymentTransactionId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const order = await getOrderById(orderId)
    if (!order || order.userId !== userId) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Handle different actions
    if (action === 'complete') {
      // Complete order and deliver items
      const product = await getProductById(order.productId)
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      if (product.items.length < order.quantity) {
        return NextResponse.json(
          { error: 'Insufficient stock items' },
          { status: 400 }
        )
      }

      // Take items from stock
      const deliveredItems = product.items.slice(0, order.quantity)
      const remainingItems = product.items.slice(order.quantity)

      // Update product stock
      await updateProduct(product.id, {
        items: remainingItems,
        stock: remainingItems.length,
      })

      // Update order status
      await updateOrder(orderId, {
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: paymentMethod || order.paymentMethod,
        paymentTransactionId: paymentTransactionId || order.paymentTransactionId,
      })

      return NextResponse.json({
        success: true,
        deliveredItems,
        successMessage: product.successMessage,
        message: 'Order completed successfully'
      })
    } else if (action === 'update_payment') {
      // Just update payment status
      await updateOrder(orderId, {
        paymentStatus,
        paymentMethod,
        paymentTransactionId,
      })

      return NextResponse.json({
        success: true,
        message: 'Payment status updated'
      })
    } else if (action === 'cancel') {
      await updateOrder(orderId, {
        status: 'cancelled',
        paymentStatus: 'failed',
      })

      return NextResponse.json({
        success: true,
        message: 'Order cancelled'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('WhatsApp update order API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
