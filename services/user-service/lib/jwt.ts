import jwt from "jsonwebtoken";

// Configuration: prefer JWKS (asymmetric) verification in production.
const JWKS_URL = process.env.JWKS_URL; // e.g. https://auth.example.com/.well-known/jwks.json
const PUBLIC_KEY = process.env.PUBLIC_KEY; // PEM public key (optional fallback)
const PUBLIC_CERT = process.env.PUBLIC_CERT; // PEM certificate (optional) used to build x5c in JWKS
const PRIVATE_KEY = process.env.PRIVATE_KEY; // PEM private key used to sign tokens (issuer)
const JWT_KID = process.env.JWT_KID || "user-service-key-1";
const SECRET =
  process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || "dev-secret";
const JWKS_CACHE_TTL =
  Number(process.env.JWT_JWKS_CACHE_TTL_SECONDS || "300") * 1000; // ms

// Basic runtime checks (allow dev secret but warn in prod via logs elsewhere)
// Ensure we have at least one verification or signing material available
if (!JWKS_URL && !PUBLIC_KEY && !PUBLIC_CERT && !SECRET && !PRIVATE_KEY) {
  throw new Error(
    "No JWT verification material found (set JWKS_URL, PUBLIC_KEY or JWT_SECRET)"
  );
}

export function signToken(payload: object, options?: jwt.SignOptions) {
  // Note: in an RS256-backed setup tokens should be issued by the auth server (private key).
  // This helper remains for convenience (uses symmetric SECRET).
  // If PRIVATE_KEY is provided, sign with RS256 and include kid so receivers can find the key
  if (PRIVATE_KEY) {
    const signOpts: jwt.SignOptions = {
      algorithm: "RS256",
      keyid: JWT_KID,
      expiresIn: "7d",
      ...(options || {}),
    } as any;
    return jwt.sign(payload, PRIVATE_KEY, signOpts);
  }

  // Note: fallback to symmetric secret (HS256)
  return jwt.sign(payload, SECRET, { expiresIn: "7d", ...(options || {}) });
}

// Simple in-memory caches
let jwksCache: { keys: any[]; fetchedAt: number } | null = null;
const pemCache = new Map<string, { pem: string; expiresAt: number }>();

function certToPem(cert: string) {
  // Ensure line breaks every 64 chars
  const formatted = cert.match(/.{1,64}/g)?.join("\n") || cert;
  return `-----BEGIN CERTIFICATE-----\n${formatted}\n-----END CERTIFICATE-----\n`;
}

async function fetchJwks(): Promise<any[] | null> {
  if (!JWKS_URL) return null;
  if (jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_CACHE_TTL)
    return jwksCache.keys;

  const fetchFn = (globalThis as any).fetch;
  if (!fetchFn)
    throw new Error(
      "Global fetch is not available. Install a fetch polyfill or set PUBLIC_KEY/JWT_SECRET."
    );

  const res = await fetchFn(JWKS_URL);
  if (!res.ok)
    throw new Error(`Failed to fetch JWKS: ${res.status} ${res.statusText}`);
  const data = await res.json();
  jwksCache = { keys: data.keys || [], fetchedAt: Date.now() };
  return jwksCache.keys;
}

async function getPemForKid(kid?: string): Promise<string | null> {
  // If kid cached, return
  if (kid) {
    const c = pemCache.get(kid);
    if (c && c.expiresAt > Date.now()) return c.pem;
  }

  const keys = await fetchJwks();
  if (!keys || !keys.length) return PUBLIC_KEY || null;

  const jwk = kid ? keys.find((k: any) => k.kid === kid) : keys[0];
  if (!jwk) throw new Error(`Unable to find a JWKS key for kid=${kid}`);

  // Prefer x5c (certificate) if present
  if (jwk.x5c && jwk.x5c.length) {
    const pem = certToPem(jwk.x5c[0]);
    if (kid) pemCache.set(kid, { pem, expiresAt: Date.now() + JWKS_CACHE_TTL });
    return pem;
  }

  // At this point we don't support constructing PEM from n/e (RSA JWK) - require x5c or PUBLIC_KEY
  throw new Error(
    "JWKS key does not contain x5c certificate. Provide x5c or set PUBLIC_KEY."
  );
}

/**
 * Verify a JWT using the following order of preference:
 * 1. JWKS (JWKS_URL) - uses kid header to pick key and x5c -> PEM
 * 2. PUBLIC_KEY env (PEM)
 * 3. SECRET (HS256)
 *
 * Note: this function is async because fetching JWKS may be required.
 */
export async function verifyToken(token: string): Promise<any> {
  try {
    // Decode header to pick kid if present
    const decodedHeader = jwt.decode(token, { complete: true }) as any;
    const kid = decodedHeader?.header?.kid;

    if (JWKS_URL) {
      const pem = await getPemForKid(kid);
      if (!pem) throw new Error("No public key available from JWKS");
      return jwt.verify(token, pem) as any;
    }

    if (PUBLIC_KEY) {
      return jwt.verify(token, PUBLIC_KEY) as any;
    }

    // Fallback to symmetric secret
    return jwt.verify(token, SECRET) as any;
  } catch (err: any) {
    // Normalize error for callers
    const msg = err && err.message ? err.message : "Invalid token";
    throw new Error(`Token verification failed: ${msg}`);
  }
}

/**
 * Build a JWKS JSON object for this service using PUBLIC_CERT and JWT_KID.
 * PUBLIC_CERT should be a PEM certificate string (-----BEGIN CERTIFICATE-----...)
 */
export function getLocalJwks() {
  if (!PUBLIC_CERT) return null;
  // strip headers/newlines from PEM to get base64 cert
  const base64 = PUBLIC_CERT.replace(
    /-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\r|\n/g,
    ""
  );
  return {
    keys: [
      {
        kty: "RSA",
        use: "sig",
        kid: JWT_KID,
        alg: "RS256",
        x5c: [base64],
      },
    ],
  };
}
