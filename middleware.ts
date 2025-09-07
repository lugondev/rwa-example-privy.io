import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that are completely public
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/api/auth',
  '/api/user-sync',
  '/api/debug'
];

// Routes that need authentication but not profile completion
const basicAuthRoutes = [
  '/portfolio',
  '/test',
  '/test-auth',
  '/test-privy'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Allow basic auth routes (wallet, portfolio, test pages)
  if (basicAuthRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // For all other routes, check if user is authenticated
  const authHeader = request.headers.get('authorization');
  const authCookie = request.cookies.get('auth-token');
  const privyToken = request.cookies.get('privy-token');
  
  // If no auth tokens found, redirect to login
  if (!authHeader && !authCookie && !privyToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  
  // Add basic security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
