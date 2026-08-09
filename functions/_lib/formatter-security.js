const SESSION_COOKIE = 'formatter_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const encoder = new TextEncoder();

export class FormatterHttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function decodeBase64Url(value) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function parseJwtPart(value) {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

function bytesToBase64Url(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256Hex(value) {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
    return Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
}

function readCookie(request, name) {
    const cookieHeader = request.headers.get('Cookie') || '';
    for (const part of cookieHeader.split(';')) {
        const [key, ...valueParts] = part.trim().split('=');
        if (key === name) return decodeURIComponent(valueParts.join('='));
    }
    return null;
}

export function formatterSessionCookie(token, request, maxAge = SESSION_MAX_AGE_SECONDS) {
    const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
    return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=${maxAge}${secure}`;
}

export async function verifyGoogleIdToken(credential, expectedAudience) {
    if (typeof credential !== 'string' || credential.length > 5000) {
        throw new FormatterHttpError(400, '올바른 Google 인증 정보가 필요합니다.');
    }

    const parts = credential.split('.');
    if (parts.length !== 3) throw new FormatterHttpError(401, 'Google 인증 정보가 올바르지 않습니다.');

    let header;
    let payload;
    try {
        header = parseJwtPart(parts[0]);
        payload = parseJwtPart(parts[1]);
    } catch (_) {
        throw new FormatterHttpError(401, 'Google 인증 정보를 해석할 수 없습니다.');
    }

    if (header.alg !== 'RS256' || !header.kid) {
        throw new FormatterHttpError(401, '지원하지 않는 Google 인증 형식입니다.');
    }

    const jwksResponse = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    if (!jwksResponse.ok) throw new FormatterHttpError(503, 'Google 인증 서버에 연결할 수 없습니다.');
    const jwks = await jwksResponse.json();
    const jwk = Array.isArray(jwks.keys) ? jwks.keys.find(key => key.kid === header.kid) : null;
    if (!jwk) throw new FormatterHttpError(401, 'Google 인증 서명 키를 찾을 수 없습니다.');

    const publicKey = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
    );
    const validSignature = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        publicKey,
        decodeBase64Url(parts[2]),
        encoder.encode(`${parts[0]}.${parts[1]}`)
    );

    const now = Math.floor(Date.now() / 1000);
    const audienceMatches = payload.aud === expectedAudience || (Array.isArray(payload.aud) && payload.aud.includes(expectedAudience));
    const issuerMatches = payload.iss === 'accounts.google.com' || payload.iss === 'https://accounts.google.com';
    const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
    if (!validSignature || !audienceMatches || !issuerMatches || !payload.sub || !payload.email || !emailVerified || payload.exp <= now || (payload.iat && payload.iat > now + 60) || (payload.nbf && payload.nbf > now + 60)) {
        throw new FormatterHttpError(401, '만료되었거나 올바르지 않은 Google 로그인입니다.');
    }

    return { id: String(payload.sub), email: String(payload.email) };
}

export function createSessionToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return bytesToBase64Url(bytes);
}

export async function hashSessionToken(token) {
    return sha256Hex(token);
}

export async function requireFormatterUser(context) {
    const token = readCookie(context.request, SESSION_COOKIE);
    if (!token) throw new FormatterHttpError(401, '사이트 ID로 다시 로그인해 주세요.');

    const tokenHash = await hashSessionToken(token);
    const now = Math.floor(Date.now() / 1000);
    const session = await context.env.DB.prepare(
        'SELECT user_id, expires_at FROM formatter_sessions WHERE token_hash = ?1 LIMIT 1'
    ).bind(tokenHash).first();

    if (!session || Number(session.expires_at) <= now) {
        if (session) {
            await context.env.DB.prepare('DELETE FROM formatter_sessions WHERE token_hash = ?1').bind(tokenHash).run();
        }
        throw new FormatterHttpError(401, '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
    }

    return String(session.user_id);
}

async function formatterEncryptionKey(env) {
    const secret = env.FORMATTER_SETTINGS_SECRET;
    if (typeof secret !== 'string' || secret.length < 32) {
        throw new FormatterHttpError(503, '양식변환기 보안 키가 설정되지 않았습니다.');
    }
    const keyBytes = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
    return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptFormatterApiKey(apiKey, userId, provider, env) {
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    const key = await formatterEncryptionKey(env);
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: encoder.encode(`${userId}:${provider}`) },
        key,
        encoder.encode(apiKey)
    );
    return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptFormatterApiKey(value, userId, provider, env) {
    const [version, ivValue, ciphertextValue] = String(value || '').split('.');
    if (version !== 'v1' || !ivValue || !ciphertextValue) {
        throw new FormatterHttpError(500, '저장된 API 키 형식이 올바르지 않습니다.');
    }
    try {
        const key = await formatterEncryptionKey(env);
        const plaintext = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: decodeBase64Url(ivValue),
                additionalData: encoder.encode(`${userId}:${provider}`)
            },
            key,
            decodeBase64Url(ciphertextValue)
        );
        return new TextDecoder().decode(plaintext);
    } catch (error) {
        if (error instanceof FormatterHttpError) throw error;
        throw new FormatterHttpError(500, '저장된 API 키를 복호화할 수 없습니다.');
    }
}

export function formatterErrorResponse(error) {
    const status = error instanceof FormatterHttpError ? error.status : 500;
    const message = error instanceof FormatterHttpError ? error.message : '서버 처리 중 오류가 발생했습니다.';
    if (status >= 500) {
        console.error(JSON.stringify({ message: 'formatter request failed', error: error instanceof Error ? error.message : String(error) }));
    }
    return Response.json({ error: message }, { status });
}
