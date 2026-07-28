import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function (req: VercelRequest, res: VercelResponse) {
  const cookie = 'circuito_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ success: true });
}
