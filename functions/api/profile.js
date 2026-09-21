export async function onRequestGet(context) {
    const { request, env } = context;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const user = await env.DB.prepare("SELECT id, email, nickname, ad_number_prefix, ad_number_ranges FROM users WHERE id = ?").bind(token).first();
        if (user) {
            user.ad_number_prefix = user.ad_number_prefix || 'JW';
            try {
                user.ad_number_ranges = user.ad_number_ranges ? JSON.parse(user.ad_number_ranges) : null;
            } catch (_) {
                user.ad_number_ranges = null;
            }
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

        const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';
        const adNumberPrefix = String(body.ad_number_prefix || 'JW').trim().toUpperCase();

        if (!/^[A-Z0-9]{1,12}$/.test(adNumberPrefix)) {
            return new Response(JSON.stringify({ error: "매물번호 앞자리는 영문 또는 숫자 1~12자로 입력해 주세요." }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await env.DB.prepare(
            "UPDATE users SET nickname = ?, ad_number_prefix = ? WHERE id = ?"
        ).bind(nickname || null, adNumberPrefix, token).run();

        return new Response(JSON.stringify({
            success: true,
            nickname: nickname || null,
            ad_number_prefix: adNumberPrefix
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
