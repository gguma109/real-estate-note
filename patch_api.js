const fs = require('fs');

// Patch rentals.js
let rentals = fs.readFileSync('functions/api/rentals.js', 'utf8');
rentals = rentals.replace(/env\.JEJU_DB/g, 'env.DB');
const rentalMigration = `
        try {
            await env.DB.prepare("ALTER TABLE rentals ADD COLUMN is_deleted BOOLEAN DEFAULT 0").run();
            await env.DB.prepare("ALTER TABLE rentals ADD COLUMN deleted_at DATETIME").run();
        } catch (err) {}
`;
rentals = rentals.replace(/(try \{\s*)(const \{ results \})/, `$1${rentalMigration}        $2`);
fs.writeFileSync('functions/api/rentals.js', rentals);

// Patch ads.js
let ads = fs.readFileSync('functions/api/ads.js', 'utf8');
const adsMigration = `
        try {
            await env.JEJU_DB.prepare(\`
                CREATE TABLE IF NOT EXISTS ads (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    category TEXT,
                    data TEXT,
                    is_deleted BOOLEAN DEFAULT 0,
                    deleted_at DATETIME,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            \`).run();
            await env.JEJU_DB.prepare("ALTER TABLE ads ADD COLUMN is_deleted BOOLEAN DEFAULT 0").run();
            await env.JEJU_DB.prepare("ALTER TABLE ads ADD COLUMN deleted_at DATETIME").run();
        } catch (err) {}
`;
ads = ads.replace(/(try \{\s*)(const \{ results \})/, `$1${adsMigration}        $2`);
fs.writeFileSync('functions/api/ads.js', ads);

// Patch notes.js
let notes = fs.readFileSync('functions/api/notes.js', 'utf8');
const notesMigration = `
        try {
            await env.DB.prepare("ALTER TABLE notes ADD COLUMN is_deleted BOOLEAN DEFAULT 0").run();
            await env.DB.prepare("ALTER TABLE notes ADD COLUMN deleted_at DATETIME").run();
        } catch (err) {}
`;
notes = notes.replace(/(try \{\s*)(const \{ results \})/, `$1${notesMigration}        $2`);
fs.writeFileSync('functions/api/notes.js', notes);

console.log('Patched APIs for automatic DB migrations and correct DB bindings');
