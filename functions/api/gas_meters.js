export async function onRequestGet(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization') || '';
    let token = authHeader.replace(/bearer /i, '').trim();

    if (!token) token = 'mock_user_123';

    try {
        try {
            await env.DB.prepare("ALTER TABLE gas_meters ADD COLUMN is_deleted BOOLEAN DEFAULT 0").run();
            await env.DB.prepare("ALTER TABLE gas_meters ADD COLUMN deleted_at DATETIME").run();
        } catch(e) {}

        const { results } = await env.DB.prepare(
            "SELECT * FROM gas_meters WHERE user_id = ? AND IFNULL(is_deleted, 0) = 0 ORDER BY created_at DESC"
        ).bind(token).all();

        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/bearer /i, '').trim();

    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await request.json();

        await env.DB.prepare(
            "INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)"
        ).bind(token, body.email || `user_${token}@placeholder.com`).run();

        const id = body.id && !body.id.startsWith('temp_') ? body.id : crypto.randomUUID();

        await env.DB.prepare(`
            INSERT OR REPLACE INTO gas_meters 
            (id, user_id, building_type, building_name, reading_date, readings_data)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            id, token, body.building_type, body.building_name, body.reading_date, body.readings_data
        ).run();

        return new Response(JSON.stringify({ success: true, id }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function onRequestDelete(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/bearer /i, '').trim();

    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });
        }

        const result = await env.DB.prepare(
            "UPDATE gas_meters SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
        ).bind(id, token).run();

        if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "Not found or unauthorized" }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
