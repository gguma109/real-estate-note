import { getDB } from './db';

export const getListings = async () => {
    try {
        const db = getDB();
        const result = await db.prepare('SELECT * FROM listings ORDER BY created_at DESC').all();
        return result.results;
    } catch (error) {
        console.error("Failed to fetch listings:", error);
        return [];
    }
};

export const getListingById = async (id) => {
    try {
        const db = getDB();
        const result = await db.prepare('SELECT * FROM listings WHERE id = ?').bind(id).first();
        return result;
    } catch (error) {
        return null;
    }
};

export const createListing = async (data) => {
    try {
        const db = getDB();
        const id = Date.now().toString();
        const now = new Date().toISOString();

        await db.prepare(
            'INSERT INTO listings (id, title, content, price, status, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, data.title, data.content || '', data.price || '', data.status || 'active', data.type || 'apartment', now, now).run();

        return { ...data, id, created_at: now, updated_at: now };
    } catch (error) {
        console.error("Failed to create listing:", error);
        return null;
    }
};

export const updateListing = async (id, data) => {
    try {
        const db = getDB();
        const now = new Date().toISOString();

        // Construct dynamic update query
        const fields = [];
        const values = [];

        if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
        if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }
        if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
        if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
        if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }

        fields.push('updated_at = ?');
        values.push(now);
        values.push(id); // For WHERE clause

        if (fields.length === 1) return null; // No fields to update

        const query = `UPDATE listings SET ${fields.join(', ')} WHERE id = ?`;
        await db.prepare(query).bind(...values).run();

        return getListingById(id);
    } catch (error) {
        console.error("Failed to update listing:", error);
        return null;
    }
};

export const deleteListing = async (id) => {
    try {
        const db = getDB();
        await db.prepare('DELETE FROM listings WHERE id = ?').bind(id).run();
        return true;
    } catch (error) {
        console.error("Failed to delete listing:", error);
        return false;
    }
};
