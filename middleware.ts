import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/constants'

const protectedRoutes = ['/dashboard']
const adminRoutes = ['/admin']
const authRoutes = ['/login', '/register']

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)
  const { pathname } = request.nextUrl

  // Check if accessing admin routes
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Note: Full admin role check is done in the admin layout
    // Middleware can only do basic session check here
    // The admin layout will verify the role and redirect if not admin
  }

  // Check if accessing protected routes without session
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Check if accessing auth routes with session
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
}
