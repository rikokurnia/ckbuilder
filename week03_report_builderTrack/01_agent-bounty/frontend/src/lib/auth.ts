import { ccc } from '@ckb-ccc/core';
import crypto from 'node:crypto';

const COOKIE = 'agentbounty_session';
const secret = () => {
  if (process.env.APP_AUTH_SECRET) return process.env.APP_AUTH_SECRET;
  if (process.env.NODE_ENV === 'production') throw new Error('APP_AUTH_SECRET is required in production.');
  return 'agentbounty-local-auth-only';
};
const sign = (value: string) => crypto.createHmac('sha256', secret()).update(value).digest('base64url');
const token = (payload: object) => { const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url'); return `${encoded}.${sign(encoded)}`; };
const decode = <T>(value: string): T | null => {
  const [encoded, signature] = value.split('.');
  if (!encoded || !signature || signature.length !== sign(encoded).length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(sign(encoded)))) return null;
  try { return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as T; } catch { return null; }
};

export function createChallenge(origin: string) {
  const payload = { nonce: crypto.randomBytes(24).toString('hex'), origin, exp: Date.now() + 5 * 60_000 };
  return { message: `AgentBounty sign-in\nOrigin: ${origin}\nNonce: ${payload.nonce}\nExpires: ${new Date(payload.exp).toISOString()}`, challengeToken: token(payload) };
}

export async function verifyChallenge(input: any, requestOrigin: string) {
  const challenge = decode<{ nonce: string; origin: string; exp: number }>(input.challengeToken || '');
  if (!challenge || challenge.exp < Date.now() || challenge.origin !== requestOrigin) return null;
  const expected = `AgentBounty sign-in\nOrigin: ${challenge.origin}\nNonce: ${challenge.nonce}\nExpires: ${new Date(challenge.exp).toISOString()}`;
  if (input.message !== expected || !input.signature?.signature || !input.signature?.identity || !input.signature?.signType) return null;
  const signature = new ccc.Signature(input.signature.signature, input.signature.identity, input.signature.signType);
  if (!(await ccc.Signer.verifyMessage(expected, signature))) return null;
  return { actor: signature.identity, sessionToken: token({ actor: signature.identity, exp: Date.now() + 8 * 60 * 60_000 }) };
}

export function actorFromRequest(request: Request) {
  if (process.env.ALLOW_GUEST_MUTATIONS === 'true') return 'demo_guest';
  const raw = request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const session = raw ? decode<{ actor: string; exp: number }>(decodeURIComponent(raw)) : null;
  return session && session.exp >= Date.now() ? session.actor : null;
}

export const authCookie = COOKIE;
