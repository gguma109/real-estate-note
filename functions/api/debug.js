export async function onRequestGet(context) { try { const { results } = await context.env.JEJU_DB.prepare(`
SELECT
name
FROM
sqlite_master
WHERE
type='table'`).all(); return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } }); } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); } }
