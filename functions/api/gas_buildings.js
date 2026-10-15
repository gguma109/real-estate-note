async function ensureGasBuildingsTable(env) {
    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS gas_buildings (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            building_name TEXT NOT NULL,
            room_numbers_data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `).run();
    await env.DB.prepare(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_gas_buildings_user_name
        ON gas_buildings(user_id, building_name COLLATE NOCASE)
    `).run();
}

function getUserId(request) {
    return (request.headers.get('Authorization') || '').replace(/bearer /i, '').trim();
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function onRequestGet({ request, env }) {
    const userId = getUserId(request);
    if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);

    try {
        await ensureGasBuildingsTable(env);
        const { results } = await env.DB.prepare(
            'SELECT id, building_name, room_numbers_data, created_at, updated_at FROM gas_buildings WHERE user_id = ? ORDER BY building_name COLLATE NOCASE'
        ).bind(userId).all();
        return jsonResponse(results || []);
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
    }
}

export async function onRequestPost({ request, env }) {
    const userId = getUserId(request);
    if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);

    try {
        const body = await request.json();
        const buildingName = String(body.building_name || '').trim();
        const roomNumbers = body.room_numbers;
        if (!buildingName) return jsonResponse({ error: '건물명을 입력해 주세요.' }, 400);
        if (buildingName.length > 120) return jsonResponse({ error: '건물명은 120자 이내로 입력해 주세요.' }, 400);
        if (!Array.isArray(roomNumbers) || roomNumbers.length === 0 || roomNumbers.length > 500 || roomNumbers.some(room => !/^\d{1,6}$/.test(String(room)))) {
            return jsonResponse({ error: '호실 번호 목록을 확인해 주세요.' }, 400);
        }

        await ensureGasBuildingsTable(env);
        await env.DB.prepare('INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)')
            .bind(userId, `user_${userId}@placeholder.com`).run();

        const existing = await env.DB.prepare(
            'SELECT id FROM gas_buildings WHERE user_id = ? AND building_name = ? COLLATE NOCASE LIMIT 1'
        ).bind(userId, buildingName).first();
        const id = existing?.id || crypto.randomUUID();
        if (existing) {
            await env.DB.prepare(
                'UPDATE gas_buildings SET building_name = ?, room_numbers_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
            ).bind(buildingName, JSON.stringify([...new Set(roomNumbers.map(String))]), id, userId).run();
        } else {
            await env.DB.prepare(
                'INSERT INTO gas_buildings (id, user_id, building_name, room_numbers_data) VALUES (?, ?, ?, ?)'
            ).bind(id, userId, buildingName, JSON.stringify([...new Set(roomNumbers.map(String))])).run();
        }

        const building = await env.DB.prepare(
            'SELECT id, building_name, room_numbers_data, created_at, updated_at FROM gas_buildings WHERE id = ? AND user_id = ?'
        ).bind(id, userId).first();
        return jsonResponse({ success: true, building });
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
    }
}
