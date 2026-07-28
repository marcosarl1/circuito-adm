const ADMIN_USER = process.env.ADMIN_USER || 'admincircuito';

export default function middleware(request: Request): Response | undefined {
  const { pathname } = new URL(request.url);

  const accept = request.headers.get('accept') || '';
  if (!accept.includes('text/html')) {
    return undefined;
  }

  if (pathname === '/login' || pathname.startsWith('/api/')) {
    return undefined;
  }

  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/circuito_session=([^;]+)/);

  if (!match || !match[1].startsWith(ADMIN_USER + ':')) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/login' },
    });
  }

  return undefined;
}

export const config = {
  matcher: ['/((?!api/).*)'],
};
