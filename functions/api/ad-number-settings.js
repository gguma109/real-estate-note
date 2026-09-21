const CATEGORY_KEYS = ['rooms', 'commercial', 'building', 'house', 'land', 'other'];

function validateRanges(value) {
    if (!value || typeof value !== 'object') throw new Error('번호 구간 정보가 없습니다.');

    const normalized = {};
    for (const key of CATEGORY_KEYS) {
        const range = value[key];
        const start = Number(range?.[0]);
        const end = Number(range?.[1]);
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start) {
            throw new Error('각 구간의 시작번호와 끝번호를 올바르게 입력해 주세요.');
        }
        normalized[key] = [start, end];
    }

    const ordered = Object.entries(normalized).sort((a, b) => a[1][0] - b[1][0]);
    for (let i = 1; i < ordered.length; i += 1) {
        if (ordered[i][1][0] <= ordered[i - 1][1][1]) {
            throw new Error('카테고리별 번호 구간은 서로 겹칠 수 없습니다.');
        }
    }
    return normalized;
}

function getToken(request) {
    return (request.headers.get('Authorization') || '').replace(/bearer /i, '').trim();
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const token = getToken(request);
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const ranges = validateRanges(body.ranges);
        await env.DB.prepare('INSERT OR IGNORE INTO users (id, email) VALUES (?1, ?2)')
            .bind(token, body.email || `user_${token}@placeholder.com`).run();
        await env.DB.prepare('UPDATE users SET ad_number_ranges = ?1 WHERE id = ?2')
            .bind(JSON.stringify(ranges), token).run();
        return Response.json({ success: true, ranges });
    } catch (error) {
        return Response.json({ error: error.message || '번호 구간을 저장하지 못했습니다.' }, { status: 400 });
    }
}
