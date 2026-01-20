import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Modern middleware for Next.js 16
 * Handles authentication and authorization
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Check if user is approved
    if (token?.status !== 'APPROVED' && !path.startsWith('/login') && !path.startsWith('/register')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Check admin routes
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Public routes
        if (path === '/' || path.startsWith('/login') || path.startsWith('/register')) {
          return true;
        }

        // Protected routes require token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - uploads (uploaded files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public|uploads).*)',
  ],
};
