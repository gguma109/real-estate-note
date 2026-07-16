export async function onRequestGet(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/bearer /i, '').trim();

    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        await env.JEJU_DB.prepare(`
            CREATE TABLE IF NOT EXISTS settlements (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        try {
            await env.JEJU_DB.prepare("ALTER TABLE settlements ADD COLUMN is_deleted BOOLEAN DEFAULT 0").run();
            await env.JEJU_DB.prepare("ALTER TABLE settlements ADD COLUMN deleted_at DATETIME").run();
        } catch(e) {}

        const { results } = await env.JEJU_DB.prepare(
            "SELECT * FROM settlements WHERE user_id = ? AND IFNULL(is_deleted, 0) = 0 ORDER BY updated_at DESC"
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
        await env.JEJU_DB.prepare(`
            CREATE TABLE IF NOT EXISTS settlements (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        const body = await request.json();
        const id = body.id || 'settle_' + Date.now();
        const dataStr = typeof body.data === 'string' ? body.data : JSON.stringify(body.data || body);

        const existing = await env.JEJU_DB.prepare("SELECT id FROM settlements WHERE id = ? AND user_id = ?").bind(id, token).first();

        if (existing) {
            await env.JEJU_DB.prepare(
                "UPDATE settlements SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
            ).bind(dataStr, id, token).run();
        } else {
            await env.JEJU_DB.prepare(
                "INSERT INTO settlements (id, user_id, data) VALUES (?, ?, ?)"
            ).bind(id, token, dataStr).run();
        }

        return new Response(JSON.stringify({ success: true, id }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
    }
}

export async function onRequestDelete(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/bearer /i, '').trim();
    
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return new Response(JSON.stringify({ error: "ID required" }), { status: 400 });

    try {
        await env.JEJU_DB.prepare("UPDATE settlements SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?").bind(id, token).run();
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
    }
}
