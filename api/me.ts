export const config = { runtime: 'edge' };

const ADMIN_USER = (process.env['ADMIN_USER'] as string) || 'admincircuito';

export default async function handler(request: Request): Promise<Response> {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/circuito_session=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token || !token.startsWith(ADMIN_USER + ':')) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  return Response.json({ authenticated: true, user: ADMIN_USER });
}
