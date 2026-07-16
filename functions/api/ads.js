export async function onRequestGet(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/bearer /i, '').trim();

    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        
        try {
            await env.JEJU_DB.prepare(`
                CREATE TABLE IF NOT EXISTS ads (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    category TEXT,
                    data TEXT,
                    is_deleted BOOLEAN DEFAULT 0,
                    deleted_at DATETIME,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `).run();
            await env.JEJU_DB.prepare("ALTER TABLE ads ADD COLUMN is_deleted BOOLEAN DEFAULT 0").run();
            await env.JEJU_DB.prepare("ALTER TABLE ads ADD COLUMN deleted_at DATETIME").run();
        } catch (err) {}
        const { results } = await env.JEJU_DB.prepare(
            "SELECT * FROM ads WHERE user_id = ? ORDER BY updated_at DESC"
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

        // Ensure user exists
        try {
            await env.JEJU_DB.prepare(
                "INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)"
            ).bind(token, body.email || `user_${token}@placeholder.com`).run();
        } catch(e) {}

        const id = body.id && !body.id.startsWith('temp_') ? body.id : crypto.randomUUID();

        await env.JEJU_DB.prepare(`
            INSERT OR REPLACE INTO ads 
            (id, user_id, category, data, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
            id, token, body.category || '기타', JSON.stringify(body.data || {})
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

        if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });

        const result = await env.JEJU_DB.prepare(
            "DELETE FROM ads WHERE id = ? AND user_id = ?"
        ).bind(id, token).run();

        if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "Not found or unauthorized" }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
