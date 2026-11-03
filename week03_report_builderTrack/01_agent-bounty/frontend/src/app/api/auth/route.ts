import { authCookie, createChallenge, verifyChallenge } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return NextResponse.json({ success: true, data: createChallenge(new URL(request.url).origin) });
}

export async function POST(request: Request) {
  const verified = await verifyChallenge(await request.json(), new URL(request.url).origin);
  if (!verified) return NextResponse.json({ success: false, code: 'AUTH_REQUIRED', error: 'Wallet signature is invalid or expired.' }, { status: 401 });
  const response = NextResponse.json({ success: true, data: { actor: verified.actor } });
  response.cookies.set(authCookie, verified.sessionToken, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 8 * 60 * 60 });
  return response;
}
