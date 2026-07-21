export async function onRequestGet(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/bearer /i, '').trim();

    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        // Auto-cleanup items older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        try { await env.DB.prepare("DELETE FROM rentals WHERE user_id = ? AND is_deleted = 1 AND deleted_at < ?").bind(token, thirtyDaysAgo).run(); } catch(e){}
        try { await env.JEJU_DB.prepare("DELETE FROM ads WHERE user_id = ? AND is_deleted = 1 AND deleted_at < ?").bind(token, thirtyDaysAgo).run(); } catch(e){}
        try { await env.DB.prepare("DELETE FROM notes WHERE user_id = ? AND is_deleted = 1 AND deleted_at < ?").bind(token, thirtyDaysAgo).run(); } catch(e){}
        try { await env.DB.prepare("DELETE FROM moveouts WHERE user_id = ? AND is_deleted = 1 AND deleted_at < ?").bind(token, thirtyDaysAgo).run(); } catch(e){}
        try { await env.DB.prepare("DELETE FROM gas_meters WHERE user_id = ? AND is_deleted = 1 AND deleted_at < ?").bind(token, thirtyDaysAgo).run(); } catch(e){}
        try { await env.JEJU_DB.prepare("DELETE FROM settlements WHERE user_id = ? AND is_deleted = 1 AND deleted_at < ?").bind(token, thirtyDaysAgo).run(); } catch(e){}

        let rentals = [];
        try { rentals = (await env.DB.prepare("SELECT id, 'rental' as type, type as title_hint, date as info, deleted_at FROM rentals WHERE user_id = ? AND is_deleted = 1").bind(token).all()).results || []; } catch(e){}

        let ads = [];
        try { ads = (await env.JEJU_DB.prepare("SELECT id, 'ad' as type, category as title_hint, data as info, deleted_at FROM ads WHERE user_id = ? AND is_deleted = 1").bind(token).all()).results || []; } catch(e){}

        let notes = [];
        try { notes = (await env.DB.prepare("SELECT id, 'note' as type, title as title_hint, content as info, deleted_at FROM notes WHERE user_id = ? AND is_deleted = 1").bind(token).all()).results || []; } catch(e){}

        let moveouts = [];
        try { moveouts = (await env.DB.prepare("SELECT id, 'moveout' as type, tenant_name as title_hint, address as info, deleted_at FROM moveouts WHERE user_id = ? AND is_deleted = 1").bind(token).all()).results || []; } catch(e){}

        let gasMeters = [];
        try { gasMeters = (await env.DB.prepare("SELECT id, 'gas_meter' as type, building_name as title_hint, reading_date as info, deleted_at FROM gas_meters WHERE user_id = ? AND is_deleted = 1").bind(token).all()).results || []; } catch(e){}

        let settlements = [];
        try { settlements = (await env.JEJU_DB.prepare("SELECT id, 'settlement' as type, title as title_hint, data as info, deleted_at FROM settlements WHERE user_id = ? AND is_deleted = 1").bind(token).all()).results || []; } catch(e){}

        const allTrash = [
            ...rentals,
            ...ads,
            ...notes,
            ...moveouts,
            ...gasMeters,
            ...settlements
        ];

        // Sort by deleted_at descending
        allTrash.sort((a, b) => {
            const dateA = new Date(a.deleted_at || 0);
            const dateB = new Date(b.deleted_at || 0);
            return dateB - dateA;
        });

        return new Response(JSON.stringify(allTrash), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function onRequestPut(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/bearer /i, '').trim();

    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, type } = body;

        if (!id || !type) {
            return new Response(JSON.stringify({ error: "Missing ID or type" }), { status: 400 });
        }

        let tableName = '';
        let targetDB = null;

        if (type === 'rental') { tableName = 'rentals'; targetDB = env.DB; }
        else if (type === 'ad') { tableName = 'ads'; targetDB = env.JEJU_DB; }
        else if (type === 'note') { tableName = 'notes'; targetDB = env.DB; }
        else if (type === 'moveout') { tableName = 'moveouts'; targetDB = env.DB; }
        else if (type === 'gas_meter') { tableName = 'gas_meters'; targetDB = env.DB; }
        else if (type === 'settlement') { tableName = 'settlements'; targetDB = env.JEJU_DB; }
        else return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400 });

        const query = `UPDATE ${tableName} SET is_deleted = 0, deleted_at = NULL WHERE id = ? AND user_id = ?`;
        const result = await targetDB.prepare(query).bind(id, token).run();

        if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "Not found or unauthorized" }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true }));
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
        const type = url.searchParams.get('type');

        if (id && type) {
            let tableName = '';
            let targetDB = null;

            if (type === 'rental') { tableName = 'rentals'; targetDB = env.DB; }
            else if (type === 'ad') { tableName = 'ads'; targetDB = env.JEJU_DB; }
            else if (type === 'note') { tableName = 'notes'; targetDB = env.DB; }
            else if (type === 'moveout') { tableName = 'moveouts'; targetDB = env.DB; }
            else if (type === 'gas_meter') { tableName = 'gas_meters'; targetDB = env.DB; }
            else if (type === 'settlement') { tableName = 'settlements'; targetDB = env.JEJU_DB; }
            else return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400 });

            const result = await targetDB.prepare(
                `DELETE FROM ${tableName} WHERE id = ? AND user_id = ? AND is_deleted = 1`
            ).bind(id, token).run();

            if (result.meta.changes === 0) {
                return new Response(JSON.stringify({ error: "Not found or unauthorized" }), { status: 404 });
            }
        } else if (type && !id) {
            let tableName = '';
            let targetDB = null;

            if (type === 'rental') { tableName = 'rentals'; targetDB = env.DB; }
            else if (type === 'ad') { tableName = 'ads'; targetDB = env.JEJU_DB; }
            else if (type === 'note') { tableName = 'notes'; targetDB = env.DB; }
            else if (type === 'moveout') { tableName = 'moveouts'; targetDB = env.DB; }
            else if (type === 'gas_meter') { tableName = 'gas_meters'; targetDB = env.DB; }
            else if (type === 'settlement') { tableName = 'settlements'; targetDB = env.JEJU_DB; }
            else return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400 });

            await targetDB.prepare(
                `DELETE FROM ${tableName} WHERE user_id = ? AND is_deleted = 1`
            ).bind(token).run();
        } else {
            // Empty trash
            await env.DB.prepare("DELETE FROM rentals WHERE user_id = ? AND is_deleted = 1").bind(token).run();
            await env.JEJU_DB.prepare("DELETE FROM ads WHERE user_id = ? AND is_deleted = 1").bind(token).run();
            try { await env.DB.prepare("DELETE FROM notes WHERE user_id = ? AND is_deleted = 1").bind(token).run(); } catch(e){}
            try { await env.DB.prepare("DELETE FROM moveouts WHERE user_id = ? AND is_deleted = 1").bind(token).run(); } catch(e){}
            try { await env.DB.prepare("DELETE FROM gas_meters WHERE user_id = ? AND is_deleted = 1").bind(token).run(); } catch(e){}
            try { await env.JEJU_DB.prepare("DELETE FROM settlements WHERE user_id = ? AND is_deleted = 1").bind(token).run(); } catch(e){}
        }

        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
