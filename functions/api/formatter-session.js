import {
    createSessionToken,
    formatterErrorResponse,
    formatterSessionCookie,
    hashSessionToken,
    verifyGoogleIdToken
} from '../_lib/formatter-security.js';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function onRequestPost(context) {
    try {
        const requestOrigin = context.request.headers.get('Origin');
        if (!requestOrigin || requestOrigin !== new URL(context.request.url).origin) {
            return Response.json({ error: '허용되지 않은 로그인 요청입니다.' }, { status: 403 });
        }
        const body = await context.request.json();
        const user = await verifyGoogleIdToken(body.credential, context.env.GOOGLE_CLIENT_ID);
        const token = createSessionToken();
        const tokenHash = await hashSessionToken(token);
        const now = Math.floor(Date.now() / 1000);

        await context.env.DB.prepare(
            `INSERT INTO users (id, email) VALUES (?1, ?2)
             ON CONFLICT(id) DO UPDATE SET email = excluded.email`
        ).bind(user.id, user.email).run();
        await context.env.DB.prepare(
            'INSERT INTO formatter_sessions (token_hash, user_id, expires_at) VALUES (?1, ?2, ?3)'
        ).bind(tokenHash, user.id, now + SESSION_MAX_AGE_SECONDS).run();
        await context.env.DB.prepare('DELETE FROM formatter_sessions WHERE expires_at <= ?1').bind(now).run();

        return Response.json(
            { success: true },
            { headers: { 'Set-Cookie': formatterSessionCookie(token, context.request) } }
        );
    } catch (error) {
        return formatterErrorResponse(error);
    }
}

export async function onRequestDelete(context) {
    try {
        const cookieHeader = context.request.headers.get('Cookie') || '';
        const sessionPart = cookieHeader.split(';').map(part => part.trim()).find(part => part.startsWith('formatter_session='));
        if (sessionPart) {
            const token = decodeURIComponent(sessionPart.slice('formatter_session='.length));
            const tokenHash = await hashSessionToken(token);
            await context.env.DB.prepare('DELETE FROM formatter_sessions WHERE token_hash = ?1').bind(tokenHash).run();
        }
        return Response.json(
            { success: true },
            { headers: { 'Set-Cookie': formatterSessionCookie('', context.request, 0) } }
        );
    } catch (error) {
        return formatterErrorResponse(error);
    }
}
