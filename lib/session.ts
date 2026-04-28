// Web Crypto-based HMAC so this works in both the Edge runtime (middleware)
// and the Node runtime (API routes).

export const SESSION_COOKIE = "campaign_session";

const enc = new TextEncoder();

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_COOKIE_SECRET ?? "";
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): ArrayBuffer {
  const m = hex.match(/.{2}/g) ?? [];
  const buf = new ArrayBuffer(m.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < m.length; i++) view[i] = parseInt(m[i], 16);
  return buf;
}

export async function signValue(value: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return `${value}.${bytesToHex(sig)}`;
}

export async function verifyValue(signed: string): Promise<string | null> {
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const sigHex = signed.slice(idx + 1);
  if (!/^[0-9a-f]+$/i.test(sigHex)) return null;
  const key = await getKey();
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    hexToBytes(sigHex),
    enc.encode(value),
  );
  return ok ? value : null;
}

export async function isAuthedFromCookieValue(
  value: string | undefined,
): Promise<boolean> {
  if (!value) return false;
  return (await verifyValue(value)) !== null;
}
