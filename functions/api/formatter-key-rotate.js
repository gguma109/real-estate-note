import {
    decryptFormatterApiKey,
    encryptFormatterApiKey
} from '../_lib/formatter-security.js';

const encoder = new TextEncoder();
const ALLOWED_HOSTS = new Set([
    'move-out-confirmation.pages.dev',
    'real-estate-note.pages.dev'
]);

function authorized(request, env) {
    const token = typeof env.FORMATTER_MIGRATION_TOKEN === 'string'
        ? env.FORMATTER_MIGRATION_TOKEN.trim()
        : null;
    if (typeof token !== 'string' || token.length < 32) return false;
    const actual = encoder.encode(request.headers.get('Authorization') || '');
    const expected = encoder.encode(`Bearer ${token}`);
    return actual.length === expected.length && crypto.subtle.timingSafeEqual(actual, expected);
}

async function decryptableWith(ciphertext, userId, provider, secret) {
    try {
        await decryptFormatterApiKey(ciphertext, userId, provider, { FORMATTER_SETTINGS_SECRET: secret });
        return true;
    } catch (_) {
        return false;
    }
}

export async function onRequestPost(context) {
    const hostname = new URL(context.request.url).hostname;
    if (!ALLOWED_HOSTS.has(hostname) || !authorized(context.request, context.env)) {
        return new Response(null, { status: 404 });
    }
    if (typeof context.env.FORMATTER_SETTINGS_SHARED_SECRET !== 'string' ||
        context.env.FORMATTER_SETTINGS_SHARED_SECRET.length < 32) {
        return Response.json({ error: 'Shared encryption secret is not configured.' }, { status: 503 });
    }

    let body;
    try {
        body = await context.request.json();
    } catch (_) {
        return Response.json({ error: 'Invalid request.' }, { status: 400 });
    }
    if (body?.action !== 'probe' && body?.action !== 'rotate') {
        return Response.json({ error: 'Invalid action.' }, { status: 400 });
    }

    try {
        const { results } = await context.env.DB.prepare(
            `SELECT user_id, provider, encrypted_api_key
             FROM formatter_provider_settings
             WHERE encrypted_api_key IS NOT NULL`
        ).all();
        const rows = results || [];
        if (rows.length > 100) {
            return Response.json({ error: 'Migration requires a paginated run.' }, { status: 409 });
        }

        if (body.action === 'probe') {
            let legacyDecryptable = 0;
            let sharedDecryptable = 0;
            for (const row of rows) {
                if (await decryptableWith(row.encrypted_api_key, row.user_id, row.provider,
                    context.env.FORMATTER_SETTINGS_SECRET)) legacyDecryptable++;
                if (await decryptableWith(row.encrypted_api_key, row.user_id, row.provider,
                    context.env.FORMATTER_SETTINGS_SHARED_SECRET)) sharedDecryptable++;
            }
            return Response.json({ total: rows.length, legacyDecryptable, sharedDecryptable });
        }

        const replacements = [];
        for (const row of rows) {
            const plaintext = await decryptFormatterApiKey(
                row.encrypted_api_key, row.user_id, row.provider,
                { FORMATTER_SETTINGS_SECRET: context.env.FORMATTER_SETTINGS_SECRET }
            );
            const encrypted = await encryptFormatterApiKey(
                plaintext, row.user_id, row.provider,
                { FORMATTER_SETTINGS_SHARED_SECRET: context.env.FORMATTER_SETTINGS_SHARED_SECRET }
            );
            replacements.push({ row, encrypted });
        }

        await context.env.DB.prepare(
            `CREATE TABLE IF NOT EXISTS formatter_key_rotation_backup (
                user_id TEXT NOT NULL,
                provider TEXT NOT NULL,
                encrypted_api_key TEXT NOT NULL,
                backed_up_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, provider)
            )`
        ).run();

        let rotated = 0;
        for (const { row, encrypted } of replacements) {
            const [, update] = await context.env.DB.batch([
                context.env.DB.prepare(
                    `INSERT OR IGNORE INTO formatter_key_rotation_backup
                     (user_id, provider, encrypted_api_key) VALUES (?1, ?2, ?3)`
                ).bind(row.user_id, row.provider, row.encrypted_api_key),
                context.env.DB.prepare(
                    `UPDATE formatter_provider_settings
                     SET encrypted_api_key = ?1, updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = ?2 AND provider = ?3 AND encrypted_api_key = ?4`
                ).bind(encrypted, row.user_id, row.provider, row.encrypted_api_key)
            ]);
            if (update.meta?.changes !== 1) {
                return Response.json({ error: 'A key changed during migration.', rotated }, { status: 409 });
            }
            rotated++;
        }
        return Response.json({ total: rows.length, rotated });
    } catch (error) {
        console.error(JSON.stringify({ message: 'formatter key rotation failed', error: error instanceof Error ? error.message : String(error) }));
        return Response.json({ error: 'Key migration failed without exposing key material.' }, { status: 500 });
    }
}
