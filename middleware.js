import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check if user is trying to access protected routes
  const protectedRoutes = ['/dashboard', '/pos', '/company', '/branches', '/users', '/categories', '/brands', '/products', '/inventory', '/purchase-orders', '/stock-movements', '/suppliers', '/customers', '/transactions', '/reports', '/activity-logs', '/roles'];
  
  const { pathname } = request.nextUrl;
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // Check if user has a token in cookies (we'll need to set this from client side)
    const token = request.cookies.get('authToken')?.value;
    
    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // If user is on login page and has a token, redirect based on role
  if (pathname === '/login') {
    const token = request.cookies.get('authToken')?.value;
    if (token) {
      // For now redirect to dashboard, role-based redirect will be handled by login page
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // If user is on root path, redirect based on auth status
  if (pathname === '/') {
    const token = request.cookies.get('authToken')?.value;
    if (token) {
      // Default redirect to dashboard for authenticated users
      // Role-based redirect will be handled by the respective pages
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/pos/:path*', '/company/:path*', '/branches/:path*', '/users/:path*', '/categories/:path*', '/brands/:path*', '/products/:path*', '/inventory/:path*', '/purchase-orders/:path*', '/stock-movements/:path*', '/suppliers/:path*', '/customers/:path*', '/transactions/:path*', '/reports/:path*', '/activity-logs/:path*', '/roles/:path*', '/login']
};