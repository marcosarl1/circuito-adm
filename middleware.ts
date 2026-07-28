const ADMIN_USER = (process.env['ADMIN_USER'] as string) || 'admincircuito';
const ADMIN_PASS = process.env['ADMIN_PASS'] as string | undefined;

async function handleApi(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);

  if (url.pathname === '/api/login' && request.method === 'POST') {
    if (!ADMIN_PASS) {
      return Response.json({ error: 'ADMIN_PASS não configurado' }, { status: 500 });
    }

    const { username, password } = await request.json() as Record<string, string>;

    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      return Response.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const cookie = `circuito_session=${ADMIN_USER}:${Date.now()}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=1800`;

    return Response.json({ success: true }, {
      status: 200,
      headers: { 'Set-Cookie': cookie },
    });
  }

  if (url.pathname === '/api/me') {
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(/circuito_session=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token || !token.startsWith(ADMIN_USER + ':')) {
      return Response.json({ authenticated: false }, { status: 401 });
    }

    return Response.json({ authenticated: true, user: ADMIN_USER });
  }

  if (url.pathname === '/api/logout') {
    const cookie = 'circuito_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
    return Response.json({ success: true }, {
      status: 200,
      headers: { 'Set-Cookie': cookie },
    });
  }

  return undefined;
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const { pathname } = new URL(request.url);

  const accept = request.headers.get('accept') || '';

  if (pathname.startsWith('/api/')) {
    return handleApi(request);
  }

  if (pathname === '/login') {
    return undefined;
  }

  if (!accept.includes('text/html')) {
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
  matcher: ['/(.*)'],
};
