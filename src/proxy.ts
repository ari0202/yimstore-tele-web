import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret-fallback');

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // ==========================================
  // 1. ORDER DASHBOARD (Phase 3)
  // ==========================================
  if (url.pathname.startsWith('/order/')) {
    const token = url.searchParams.get('token');
    
    if (token) {
      const orderId = url.pathname.split('/').pop();
      if (!orderId) return NextResponse.next();

      url.searchParams.delete('token');
      const response = NextResponse.redirect(url);
      
      response.cookies.set(`order_token_${orderId}`, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 hari
      });
      
      return response;
    }
  }

  // ==========================================
  // 2. ADMIN DASHBOARD - STATELESS JWT VERIFY (Phase 4)
  // ==========================================
  if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_session')?.value;

    if (!token) {
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    try {
      // Fast Edge-friendly stateless verification to prevent Database Exhaustion (DDoS)
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (err) {
      // Signature invalid or expired mathematically
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('admin_session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/order/:path*', '/admin/:path*'],
};
