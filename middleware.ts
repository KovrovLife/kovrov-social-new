import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';

function encode(str: string): ArrayBuffer {
  const buf = new TextEncoder().encode(str);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function unsignAsync(signed: string): Promise<string | null> {
  const idx = signed.lastIndexOf('.');
  if (idx < 0) return null;
  const payload = signed.slice(0, idx);
  const h = signed.slice(idx + 1);

  const key = await crypto.subtle.importKey(
    'raw',
    encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expected = bufToHex(await crypto.subtle.sign('HMAC', key, encode(payload)));

  if (h.length !== expected.length) return null;
  let mismatch = 0;
  for (let i = 0; i < h.length; i++) {
    mismatch |= h.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0 ? payload : null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  let isAuthenticated = false;
  if (sessionCookie) {
    const payload = await unsignAsync(sessionCookie);
    if (payload && !isNaN(Number(payload))) isAuthenticated = true;
  }

  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  const isStaticPath =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico';

  if (isStaticPath) return NextResponse.next();

  // Если не авторизован и пытается зайти не на /login или /register -> на /login
  if (!isAuthenticated && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Если авторизован и пытается зайти на /login или /register -> на главную
  if (isAuthenticated && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};