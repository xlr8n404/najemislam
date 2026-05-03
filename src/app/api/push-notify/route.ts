import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Minimal Web Push payload sender using the Web Push Protocol (RFC 8030)
// We do NOT rely on web-push npm package to keep zero extra deps.
// Instead we send a plain fetch to the push endpoint with the subscription's auth keys.
// For encrypted payloads VAPID is required — we support VAPID via env vars.

async function importVapidKey(privateKeyBase64: string) {
  const raw = Buffer.from(privateKeyBase64, 'base64');
  return crypto.subtle.importKey(
    'pkcs8',
    raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function buildVapidAuthHeader(endpoint: string, vapidPublicKey: string, vapidPrivateKeyBase64: string, subject: string): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const expiry = Math.floor(Date.now() / 1000) + 12 * 3600;

  const headerBuf = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payloadBuf = Buffer.from(JSON.stringify({ aud: audience, exp: expiry, sub: subject }));
  const header = base64UrlEncode(headerBuf.buffer.slice(headerBuf.byteOffset, headerBuf.byteOffset + headerBuf.byteLength) as ArrayBuffer);
  const payload = base64UrlEncode(payloadBuf.buffer.slice(payloadBuf.byteOffset, payloadBuf.byteOffset + payloadBuf.byteLength) as ArrayBuffer);
  const signingInput = `${header}.${payload}`;

  const privateKey = await importVapidKey(vapidPrivateKeyBase64);
  const signingBuf = Buffer.from(signingInput);
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    signingBuf.buffer.slice(signingBuf.byteOffset, signingBuf.byteOffset + signingBuf.byteLength) as ArrayBuffer,
  );

  const signature = base64UrlEncode(signatureBuffer);
  const jwt = `${signingInput}.${signature}`;

  return `vapid t=${jwt}, k=${vapidPublicKey}`;
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, title, body, url } = await req.json();

    if (!user_id || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@sharableofc.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
      // VAPID keys not configured — skip silently (realtime toasts still work)
      return NextResponse.json({ success: true, skipped: true });
    }

    // Fetch all push subscriptions for this user
    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, subscription')
      .eq('user_id', user_id);

    if (!subs || subs.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const payload = JSON.stringify({ title, body, url: url || '/alerts' });
    const staleEndpoints: string[] = [];

    await Promise.all(
      subs.map(async (row) => {
        try {
          const authHeader = await buildVapidAuthHeader(
            row.endpoint,
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject
          );

          const res = await fetch(row.endpoint, {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json',
              TTL: '86400',
            },
            body: payload,
          });

          // 410 Gone / 404 means subscription expired
          if (res.status === 410 || res.status === 404) {
            staleEndpoints.push(row.endpoint);
          }
        } catch {
          // Network error — ignore silently
        }
      })
    );

    // Clean up expired subscriptions
    if (staleEndpoints.length > 0) {
      await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .in('endpoint', staleEndpoints);
    }

    return NextResponse.json({ success: true, sent: subs.length - staleEndpoints.length });
  } catch (err: any) {
    console.error('push-notify error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
