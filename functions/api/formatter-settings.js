import {
    encryptFormatterApiKey,
    formatterErrorResponse,
    FormatterHttpError,
    requireFormatterUser
} from '../_lib/formatter-security.js';

const PROVIDERS = new Set(['gemini', 'openai', 'claude']);

function validateSettings(body) {
    const provider = String(body.provider || '');
    const model = String(body.model || '');
    const prompt = String(body.prompt || '').trim();
    const apiKey = body.apiKey ? String(body.apiKey).trim() : '';
    if (!PROVIDERS.has(provider)) throw new FormatterHttpError(400, '지원하지 않는 AI 공급자입니다.');
    if (!/^[A-Za-z0-9._:-]{1,100}$/.test(model)) throw new FormatterHttpError(400, 'AI 모델 값이 올바르지 않습니다.');
    if (!prompt || prompt.length > 20000) throw new FormatterHttpError(400, '프롬프트는 1~20,000자로 입력해 주세요.');
    if (apiKey.length > 500) throw new FormatterHttpError(400, 'API 키가 너무 깁니다.');
    return { provider, model, prompt, apiKey, webSearch: Boolean(body.webSearch), clearApiKey: Boolean(body.clearApiKey) };
}

async function readSettings(env, userId) {
    const [settings, providersResult] = await Promise.all([
        env.DB.prepare(
            'SELECT provider, prompt, web_search FROM formatter_settings WHERE user_id = ?1 LIMIT 1'
        ).bind(userId).first(),
        env.DB.prepare(
            `SELECT provider, model,
                    CASE WHEN encrypted_api_key IS NULL THEN 0 ELSE 1 END AS has_api_key
             FROM formatter_provider_settings WHERE user_id = ?1`
        ).bind(userId).all()
    ]);
    const providers = {};
    for (const row of providersResult.results || []) {
        providers[row.provider] = { model: row.model, hasApiKey: Boolean(row.has_api_key) };
    }
    return {
        provider: settings?.provider || 'gemini',
        prompt: settings?.prompt || null,
        webSearch: Boolean(settings?.web_search),
        providers
    };
}

export async function onRequestGet(context) {
    try {
        const userId = await requireFormatterUser(context);
        return Response.json(await readSettings(context.env, userId));
    } catch (error) {
        return formatterErrorResponse(error);
    }
}

export async function onRequestPut(context) {
    try {
        const userId = await requireFormatterUser(context);
        const settings = validateSettings(await context.request.json());

        await context.env.DB.prepare(
            `INSERT INTO formatter_settings (user_id, provider, prompt, web_search, updated_at)
             VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id) DO UPDATE SET
                provider = excluded.provider,
                prompt = excluded.prompt,
                web_search = excluded.web_search,
                updated_at = CURRENT_TIMESTAMP`
        ).bind(userId, settings.provider, settings.prompt, settings.webSearch ? 1 : 0).run();

        let encryptedApiKey = null;
        if (settings.apiKey) {
            encryptedApiKey = await encryptFormatterApiKey(settings.apiKey, userId, settings.provider, context.env);
        }

        if (settings.apiKey) {
            await context.env.DB.prepare(
                `INSERT INTO formatter_provider_settings (user_id, provider, model, encrypted_api_key, updated_at)
                 VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
                 ON CONFLICT(user_id, provider) DO UPDATE SET
                    model = excluded.model,
                    encrypted_api_key = excluded.encrypted_api_key,
                    updated_at = CURRENT_TIMESTAMP`
            ).bind(userId, settings.provider, settings.model, encryptedApiKey).run();
        } else {
            await context.env.DB.prepare(
                `INSERT INTO formatter_provider_settings (user_id, provider, model, encrypted_api_key, updated_at)
                 VALUES (?1, ?2, ?3, NULL, CURRENT_TIMESTAMP)
                 ON CONFLICT(user_id, provider) DO UPDATE SET
                    model = excluded.model,
                    updated_at = CURRENT_TIMESTAMP`
            ).bind(userId, settings.provider, settings.model).run();
        }

        if (settings.clearApiKey) {
            await context.env.DB.prepare(
                `UPDATE formatter_provider_settings SET encrypted_api_key = NULL, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = ?1 AND provider = ?2`
            ).bind(userId, settings.provider).run();
        }

        return Response.json({ success: true, settings: await readSettings(context.env, userId) });
    } catch (error) {
        return formatterErrorResponse(error);
    }
}
