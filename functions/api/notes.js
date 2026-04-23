export async function onRequestGet(context) {
    const { request, env } = context;
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC"
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
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await request.json();

        // Ensure user exists
        await env.DB.prepare(
            "INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)"
        ).bind(token, body.email || `user_${token}@placeholder.com`).run();

        const id = body.id && !body.id.startsWith('temp_') ? body.id : crypto.randomUUID();

        await env.DB.prepare(`
            INSERT OR REPLACE INTO notes 
            (id, user_id, title, content, is_shared, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
            id, token, body.title || '새 노트', body.content || '', body.is_shared ? 1 : 0
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
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });

        const result = await env.DB.prepare(
            "DELETE FROM notes WHERE id = ? AND user_id = ?"
        ).bind(id, token).run();

        if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "Not found or unauthorized" }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
