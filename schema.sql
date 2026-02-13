DROP TABLE IF EXISTS listings;
CREATE TABLE listings (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    price TEXT,
    status TEXT DEFAULT 'active',
    type TEXT DEFAULT 'apartment',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
INSERT INTO listings (id, title, status, type, content, price) VALUES ('1', 'Welcome Example', 'active', 'apartment', '<p>Welcome to your Cloudflare D1 powered Real Estate Note!</p>', '0');
