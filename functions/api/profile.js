export async function onRequestGet(context) {
    const { request, env } = context;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const user = await env.DB.prepare("SELECT id, email, nickname FROM users WHERE id = ?").bind(token).first();
        if (user) {
            return new Response(JSON.stringify(user), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        }
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await request.json();

        // Ensure user exists first, if not this will insert them
        await env.DB.prepare("INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)").bind(token, body.email).run();

        // Update the nickname
        await env.DB.prepare("UPDATE users SET nickname = ? WHERE id = ?").bind(body.nickname || null, token).run();

        return new Response(JSON.stringify({ success: true, nickname: body.nickname }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
