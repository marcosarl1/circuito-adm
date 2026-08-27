declare const process: { env: Record<string, string | undefined> };

const ADMIN_USER = (process.env['ADMIN_USER'] as string) || 'admincircuito';
const ADMIN_PASS = process.env['ADMIN_PASS'] as string | undefined;

interface ProxyConfig {
  prefix: string;
  envUrl: string;
  envKey: string;
  scrapeEnvKey?: string;
  buildTargetUrl: (baseUrl: string, path: string, search: string) => string;
  envErrorMessage: string;
  fetchErrorMessage: string;
}

async function handleApi(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);

  if (url.pathname === '/api/login' && request.method === 'POST') {
    if (!ADMIN_PASS) {
      return Response.json(
        { error: 'ADMIN_PASS não configurado' },
        { status: 500 },
      );
    }

    const { username, password } = (await request.json()) as Record<
      string,
      string
    >;

    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      return Response.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const cookie = `circuito_session=${ADMIN_USER}:${Date.now()}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=1800`;

    return Response.json(
      { success: true },
      {
        status: 200,
        headers: { 'Set-Cookie': cookie },
      },
    );
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
    const cookie =
      'circuito_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
    return Response.json(
      { success: true },
      {
        status: 200,
        headers: { 'Set-Cookie': cookie },
      },
    );
  }

  return undefined;
}

function isAuthenticated(request: Request): boolean {
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/circuito_session=([^;]+)/);
  return !!(match && match[1].startsWith(ADMIN_USER + ':'));
}

async function handleProxy(
  request: Request,
  config: ProxyConfig,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(config.prefix)) return undefined;

  const baseUrl = process.env[config.envUrl] as string | undefined;
  let apiKey = process.env[config.envKey] as string | undefined;
  if (config.scrapeEnvKey && url.pathname.includes('/scrape/')) {
    apiKey = process.env[config.scrapeEnvKey] || apiKey;
  }

  if (!baseUrl || !apiKey) {
    return Response.json({ error: config.envErrorMessage }, { status: 500 });
  }
  if (!isAuthenticated(request)) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const path = url.pathname.replace(config.prefix, '').replace(/^\/+/, '');
  const targetUrl = config.buildTargetUrl(baseUrl, path, url.search);

  const headers = new Headers(request.headers);
  headers.set('x-api-key', apiKey);
  headers.delete('host');
  headers.delete('content-length');

  const body = ['GET', 'HEAD'].includes(request.method)
    ? undefined
    : await request.arrayBuffer();

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('set-cookie');
    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ error: config.fetchErrorMessage }, { status: 502 });
  }
}

function handleEventsProxy(request: Request): Promise<Response | undefined> {
  return handleProxy(request, {
    prefix: '/api/events-proxy',
    envUrl: 'API_URL',
    envKey: 'API_KEY',
    scrapeEnvKey: 'SCRAPERS_API_KEY',
    buildTargetUrl: (base, path, search) => {
      const b = base.replace(/\/$/, '');
      if (path === 'health' || path.startsWith('health')) return `${b}/health${search}`;
      return `${b}/api/v1/${path}${search}`;
    },
    envErrorMessage: 'API_URL ou API_KEY não configurados',
    fetchErrorMessage: 'Erro ao comunicar com a API externa',
  });
}

function handlePostsProxy(request: Request): Promise<Response | undefined> {
  return handleProxy(request, {
    prefix: '/api/posts-proxy',
    envUrl: 'POSTS_API_URL',
    envKey: 'POSTS_API_KEY',
    buildTargetUrl: (base, path, search) =>
      `${base}/${path ? '/' + path : ''}${search}`,
    envErrorMessage: 'POSTS_API_URL ou POSTS_API_KEY não configurados',
    fetchErrorMessage: 'Erro ao comunicar com a API de posts',
  });
}

async function handleWarmup(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (url.pathname !== '/api/warmup') return undefined;

  const warmTargets: Promise<unknown>[] = [];
  const apiUrl = process.env['API_URL'] as string | undefined;
  if (apiUrl) {
    // endpoint leve e sem auth — ideal para tirar do cold start
    warmTargets.push(fetch(`${apiUrl.replace(/\/$/, '')}/health`).catch(() => {}));
  }
  const postsUrl = process.env['POSTS_API_URL'] as string | undefined;
  const postsKey = process.env['POSTS_API_KEY'] as string | undefined;
  if (postsUrl && postsKey) {
    warmTargets.push(
      fetch(`${postsUrl.replace(/\/$/, '')}/`, {
        headers: { 'x-api-key': postsKey },
      }).catch(() => {}),
    );
  }
  // não bloqueia o cron — dispara e responde imediatamente
  if (warmTargets.length) void Promise.allSettled(warmTargets);
  return Response.json({ ok: true, warmed: warmTargets.length });
}

export default async function middleware(
  request: Request,
): Promise<Response | undefined> {
  const warmup = await handleWarmup(request);
  if (warmup) return warmup;

  const { pathname } = new URL(request.url);

  const accept = request.headers.get('accept') || '';

  const eventsProxy = await handleEventsProxy(request);
  if (eventsProxy) return eventsProxy;

  const postsProxy = await handlePostsProxy(request);
  if (postsProxy) return postsProxy;

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
