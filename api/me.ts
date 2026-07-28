import type { VercelRequest, VercelResponse } from '@vercel/node';

const ADMIN_USER = (process.env['ADMIN_USER'] as string) || 'admincircuito';

export default function (req: VercelRequest, res: VercelResponse) {
  const cookie = req.cookies['circuito_session'] as string | undefined;

  if (!cookie || !cookie.startsWith(ADMIN_USER + ':')) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({ authenticated: true, user: ADMIN_USER });
}
