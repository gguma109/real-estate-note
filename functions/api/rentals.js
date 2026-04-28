export async function onRequestGet(context) {
    const { request, env } = context;

    // JWT Verify function (simple implementation for Cloudflare Workers)
    // In a production environment, you'd use a more robust library like jose
    // but Cloudflare standard limits mean we often import a lightweight verifier or manually check
    // For simplicity of this MVP, we rely on Google's endpoint or assume the token passed via header is valid if it matches our basic DB check.
    // To truly verify, we should decode and verify signature against Google's public keys.

    // For this implementation, we will expect a custom header Authorization: Bearer <user_id> 
    // This is set after the frontend verifies the Google JWT via Google's library and sends us the Google User ID (sub).

    // **SECURITY NOTE**: In a real, highly secure production app, the frontend sends the raw JWT,
    // and this worker MUST verify the JWT signature using google-auth-library or similar.
    // Due to environment constraints here, we are doing a simplified auth check.

    const authHeader = request.headers.get('Authorization') || '';
    let token = authHeader.replace(/bearer /i, '').trim();

    // 디버깅: 토큰이 없어도 기본 유저로 조회 허용
    if (!token) token = 'mock_user_123';

    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM rentals WHERE user_id = ? ORDER BY created_at DESC"
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

        // Ensure user exists (basic upsert)
        // In a real app we'd decode JWT to get email, but here we just ensure the user ID is tracked
        await env.DB.prepare(
            "INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)"
        ).bind(token, body.email || `user_${token}@placeholder.com`).run();

        // Upsert rental (Insert or Update if ID exists)
        const id = body.id && !body.id.startsWith('temp_') ? body.id : crypto.randomUUID();

        await env.DB.prepare(`
            INSERT OR REPLACE INTO rentals 
            (id, user_id, type, date, movein, address, room, deposit, premium, rent, yearly_rent, maintenance, inc_internet, inc_tv, inc_water, structure, options, special_notes, phone, common_pwd, unit_pwd, business_name, exclusive_area, supply_area, land_area, total_floor_area, sale_price, current_loan, completion_date, building_config, total_deposit, total_monthly_income, loan_interest_rate, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id, token, body.type, body.date, body.movein, body.address, body.room,
            body.deposit, body.premium, body.rent, body.yearly_rent, body.maintenance,
            body.inc_internet ? 1 : 0, body.inc_tv ? 1 : 0, body.inc_water ? 1 : 0,
            body.structure, body.options, body.special_notes, body.phone, body.common_pwd, body.unit_pwd,
            body.business_name, body.exclusive_area, body.supply_area,
            body.land_area, body.total_floor_area, body.sale_price, body.current_loan,
            body.completion_date, body.building_config, body.total_deposit, body.total_monthly_income, body.loan_interest_rate,
            body.status || '진행중'
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

        // Only delete if it belongs to this user
        const result = await env.DB.prepare(
            "DELETE FROM rentals WHERE id = ? AND user_id = ?"
        ).bind(id, token).run();

        if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "Not found or unauthorized" }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
