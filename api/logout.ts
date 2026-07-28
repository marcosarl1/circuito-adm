export const config = { runtime: 'edge' };

export default async function handler(): Promise<Response> {
  const cookie = 'circuito_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';

  return Response.json({ success: true }, {
    status: 200,
    headers: { 'Set-Cookie': cookie },
  });
}
