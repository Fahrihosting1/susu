import { NextRequest, NextResponse } from 'next/server'
import { getProductCategories, getProducts, getBotSettings, getProductsByUserId } from '@/lib/github-db'

// GET /api/whatsapp/products - Get all products for a user's bot
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

    // Verify API key matches bot settings
    const botSettings = await getBotSettings(userId)
    if (!botSettings || botSettings.waApiKey !== apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Get categories and products for this user
    const categories = await getProductCategories(userId)
    const products = await getProducts(userId)

    // Filter active only
    const activeCategories = categories.filter(c => c.isActive)
    const activeProducts = products.filter(p => p.isActive && p.stock > 0)

    // Group products by category
    const categoriesWithProducts = activeCategories.map(category => ({
      ...category,
      products: activeProducts.filter(p => p.categoryCode === category.code)
    })).filter(c => c.products.length > 0) // Only categories with available products

    return NextResponse.json({
      success: true,
      categories: categoriesWithProducts,
      botSettings: {
        botName: botSettings.botName,
        botPhotoUrl: botSettings.botPhotoUrl,
        preferredPaymentMethod: botSettings.preferredPaymentMethod,
      }
    })
  } catch (error) {
    console.error('WhatsApp products API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
