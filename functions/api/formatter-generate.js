import {
    decryptFormatterApiKey,
    formatterErrorResponse,
    FormatterHttpError,
    requireFormatterUser
} from '../_lib/formatter-security.js';

async function providerError(response) {
    const text = await response.text();
    try {
        return JSON.parse(text).error?.message || `HTTP ${response.status}`;
    } catch (_) {
        return `HTTP ${response.status}: ${text.slice(0, 500) || '요청 실패'}`;
    }
}

async function callGemini(apiKey, model, prompt, input, webSearch) {
    const payload = {
        systemInstruction: { parts: [{ text: prompt }] },
        contents: [{ role: 'user', parts: [{ text: input }] }]
    };
    if (webSearch) payload.tools = [{ google_search: {} }];
    let lastError = '요청 실패';
    for (const version of ['v1', 'v1beta']) {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/${version}/models/${encodeURIComponent(model)}:generateContent`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                body: JSON.stringify(payload)
            }
        );
        if (response.ok) {
            const data = await response.json();
            return (data.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('\n');
        }
        lastError = await providerError(response);
        if (response.status !== 404) throw new FormatterHttpError(502, lastError);
    }
    throw new FormatterHttpError(502, lastError);
}

async function callOpenAi(apiKey, model, prompt, input) {
    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, instructions: prompt, input })
    });
    const data = await response.json();
    if (!response.ok) throw new FormatterHttpError(502, data.error?.message || `HTTP ${response.status}`);
    return (data.output || []).flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n');
}

async function callClaude(apiKey, model, prompt, input) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: 4096, system: prompt, messages: [{ role: 'user', content: input }] })
    });
    const data = await response.json();
    if (!response.ok) throw new FormatterHttpError(502, data.error?.message || `HTTP ${response.status}`);
    return (data.content || []).filter(item => item.type === 'text').map(item => item.text).join('\n');
}

export async function onRequestPost(context) {
    try {
        const userId = await requireFormatterUser(context);
        const body = await context.request.json();
        const input = String(body.input || '').trim();
        if (!input || input.length > 50000) throw new FormatterHttpError(400, '원본 매물 정보는 1~50,000자로 입력해 주세요.');

        const settings = await context.env.DB.prepare(
            `SELECT s.provider, s.prompt, s.web_search, p.model, p.encrypted_api_key
             FROM formatter_settings s
             JOIN formatter_provider_settings p
               ON p.user_id = s.user_id AND p.provider = s.provider
             WHERE s.user_id = ?1 LIMIT 1`
        ).bind(userId).first();
        if (!settings?.encrypted_api_key) throw new FormatterHttpError(400, '선택한 공급자의 API 키를 먼저 저장해 주세요.');

        const provider = String(settings.provider);
        const apiKey = await decryptFormatterApiKey(settings.encrypted_api_key, userId, provider, context.env);
        let result;
        if (provider === 'gemini') {
            result = await callGemini(apiKey, settings.model, settings.prompt, input, Boolean(settings.web_search));
        } else if (provider === 'openai') {
            result = await callOpenAi(apiKey, settings.model, settings.prompt, input);
        } else if (provider === 'claude') {
            result = await callClaude(apiKey, settings.model, settings.prompt, input);
        } else {
            throw new FormatterHttpError(400, '지원하지 않는 AI 공급자입니다.');
        }

        return Response.json({ result });
    } catch (error) {
        return formatterErrorResponse(error);
    }
}
