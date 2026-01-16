import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Disabled server-side redirects: rely on client-side AuthGate modal.
export function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
