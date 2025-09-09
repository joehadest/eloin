import { NextResponse } from 'next/server'

export function middleware(request) {
    // Allow public routes
    const publicPaths = ['/', '/login', '/api/login', '/api/health']
    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname === path)

    if (isPublicPath) {
        return NextResponse.next()
    }

    // For other routes, continue with normal flow
    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
