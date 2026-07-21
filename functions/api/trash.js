export async function onRequestGet(context) {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/bearer /i, '').trim();

    if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        // Ensure ads table has soft-delete columns in JEJU_DB
        try { await env.JEJU_DB.prepare("ALTER TABLE ads ADD COLUMN is_deleted BOOLEAN DEFAULT 0").run(); } catch(e){}
        try { await env.JEJU_DB.prepare("ALTER TABLE ads ADD COLUMN deleted_at TEXT").run(); } catch(e){}

        // Auto-cleanup items older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        try { await env.JEJU_DB.prepare("DELETE FROM rentals WHERE user_id = ? AND is_deleted = 1 AND deleted_at < ?").bind(token, thirtyDaysAgo).run(); } catch(e){}
        try { await env.JEJU_DB.prepare("DELETE FROM ads WHERE user_id = ? AND is_deleted = 1 AND deleted_at < ?").bind(token, thirtyDaysAgo).run(); } catch(e){}
        try { await env.DB.prepare("DELETE FROM notes WHERE user_id = ? AND is_deleted = 1 AND deleted_at < ?").bind(token, thirtyDaysAgo).run(); } catch(e){}
        try { await env.DB.prepare("DELETE FROM moveouts WHERE user_id = ? AND is_deleted = 1 AND deleted_at < ?").bind(token, thirtyDaysAgo).run(); } catch(e){}
        try { await env.DB.prepare("DELETE FROM gas_meters WHERE user_id = ? AND is_deleted = 1 AND deleted_at < ?").bind(token, thirtyDaysAgo).run(); } catch(e){}
        try { await env.JEJU_DB.prepare("DELETE FROM settlements WHERE user_id = ? AND is_deleted = 1 AND deleted_at < ?").bind(token, thirtyDaysAgo).run(); } catch(e){}

        let rentals = [];
        try { rentals = (await env.JEJU_DB.prepare("SELECT *, 'rental' as trash_type FROM rentals WHERE user_id = ? AND is_deleted = 1").bind(token).all()).results || []; } catch(e){}

        let ads = [];
        try { ads = (await env.JEJU_DB.prepare("SELECT *, 'ad' as trash_type FROM ads WHERE user_id = ? AND is_deleted = 1").bind(token).all()).results || []; } catch(e){}

        let notes = [];
        try { notes = (await env.DB.prepare("SELECT *, 'note' as trash_type FROM notes WHERE user_id = ? AND is_deleted = 1").bind(token).all()).results || []; } catch(e){}

        let moveouts = [];
        try { moveouts = (await env.DB.prepare("SELECT *, 'moveout' as trash_type FROM moveouts WHERE user_id = ? AND is_deleted = 1").bind(token).all()).results || []; } catch(e){}

        let gasMeters = [];
        try { gasMeters = (await env.DB.prepare("SELECT *, 'gas_meter' as trash_type FROM gas_meters WHERE user_id = ? AND is_deleted = 1").bind(token).all()).results || []; } catch(e){}

        let settlements = [];
        try { settlements = (await env.JEJU_DB.prepare("SELECT *, 'settlement' as trash_type FROM settlements WHERE user_id = ? AND is_deleted = 1").bind(token).all()).results || []; } catch(e){}

        const allTrash = [
            ...rentals.map(r => ({ ...r, type: 'rental', property_type: r.type, title_hint: r.type, info: r.date, trash_type: 'rental' })),
            ...ads.map(a => ({ ...a, type: 'ad', title_hint: a.category, info: a.data, trash_type: 'ad' })),
            ...notes.map(n => ({ ...n, type: 'note', title_hint: n.title, info: n.content, trash_type: 'note' })),
            ...moveouts.map(m => ({ ...m, type: 'moveout', title_hint: m.tenant_name, info: m.address, trash_type: 'moveout' })),
            ...gasMeters.map(g => ({ ...g, type: 'gas_meter', title_hint: g.building_name, info: g.reading_date, trash_type: 'gas_meter' })),
            ...settlements.map(s => ({ ...s, type: 'settlement', title_hint: s.title, info: s.data, trash_type: 'settlement' }))
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

        if (type === 'rental') { tableName = 'rentals'; targetDB = env.JEJU_DB; }
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

            if (type === 'rental') { tableName = 'rentals'; targetDB = env.JEJU_DB; }
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

            if (type === 'rental') { tableName = 'rentals'; targetDB = env.JEJU_DB; }
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
            await env.JEJU_DB.prepare("DELETE FROM rentals WHERE user_id = ? AND is_deleted = 1").bind(token).run();
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
