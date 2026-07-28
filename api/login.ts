import type { VercelRequest, VercelResponse } from '@vercel/node';

const ADMIN_USER = (process.env['ADMIN_USER'] as string) || 'admincircuito';
const ADMIN_PASS = process.env['ADMIN_PASS'] as string | undefined;

export default function (req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { username, password } = req.body as Record<string, string>;

  if (!ADMIN_PASS) {
    return res.status(500).json({ error: 'ADMIN_PASS não configurado' });
  }

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const cookie = `circuito_session=${ADMIN_USER}:${Date.now()}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=1800`;

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ success: true });
}
