export const config = { runtime: 'edge' };

const ADMIN_USER = (process.env['ADMIN_USER'] as string) || 'admincircuito';
const ADMIN_PASS = process.env['ADMIN_PASS'] as string | undefined;

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405 });
  }

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
