export async function onRequestGet(context) {
    const { request, env } = context;
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        try {
            await env.DB.prepare("ALTER TABLE moveouts ADD COLUMN is_deleted BOOLEAN DEFAULT 0").run();
            await env.DB.prepare("ALTER TABLE moveouts ADD COLUMN deleted_at DATETIME").run();
        } catch(e) {}

        const { results } = await env.DB.prepare(
            "SELECT * FROM moveouts WHERE user_id = ? AND IFNULL(is_deleted, 0) = 0 ORDER BY created_at DESC"
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

        // Ensure user exists (basic upsert)
        await env.DB.prepare(
            "INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)"
        ).bind(token, body.email || `user_${token}@placeholder.com`).run();

        const id = body.id && !body.id.startsWith('temp_') ? body.id : crypto.randomUUID();

        await env.DB.prepare(`
            INSERT OR REPLACE INTO moveouts 
            (id, user_id, contract_type, room_type, tenant_name, address, room, current_pwd, new_pwd, empty_status, cleaning_status, damage_status, gas_status, water_status, electric_status, refund_bank, refund_account, refund_owner, form_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id, token, body.contract_type || '', body.room_type || '', body.tenant_name || '', body.address || '', body.room || '',
            body.current_pwd || '', body.new_pwd || '', body.empty_status || '', body.cleaning_status || '', body.damage_status || '',
            body.gas_status || '', body.water_status || '', body.electric_status || '', body.refund_bank || '', body.refund_account || '', body.refund_owner || '',
            body.form_data || ''
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

        if (!id) {
            return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });
        }

        const result = await env.DB.prepare(
            "UPDATE moveouts SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
        ).bind(id, token).run();

        if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "Not found or unauthorized" }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
