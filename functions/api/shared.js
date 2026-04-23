export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: "Missing Note ID" }), { status: 400 });
        }

        // Fetch Note but only if it is marked as shared (is_shared = 1)
        const { results } = await env.DB.prepare(`
            SELECT notes.title, notes.content, notes.updated_at, users.email, users.nickname
            FROM notes 
            JOIN users ON notes.user_id = users.id
            WHERE notes.id = ? AND notes.is_shared = 1
        `).bind(id).all();

        if (!results || results.length === 0) {
            return new Response(JSON.stringify({ error: "Not found or not shared" }), { status: 404 });
        }

        return new Response(JSON.stringify(results[0]), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
