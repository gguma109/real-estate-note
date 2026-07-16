const fs = require('fs');
const path = require('path');

const apiDir = 'functions/api';
const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(apiDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove ALTER TABLE logic if exists
    content = content.replace(/try\s*\{\s*await env\.DB\.prepare\("ALTER TABLE .*? ADD COLUMN is_deleted BOOLEAN DEFAULT 0"\)\.run\(\);\s*await env\.DB\.prepare\("ALTER TABLE .*? ADD COLUMN deleted_at DATETIME"\)\.run\(\);\s*\}\s*catch\s*\(err\)\s*\{\}/g, '');
    content = content.replace(/try\s*\{\s*await env\.JEJU_DB\.prepare\("ALTER TABLE .*? ADD COLUMN is_deleted BOOLEAN DEFAULT 0"\)\.run\(\);\s*await env\.JEJU_DB\.prepare\("ALTER TABLE .*? ADD COLUMN deleted_at DATETIME"\)\.run\(\);\s*\}\s*catch\s*\(err\)\s*\{\}/g, '');

    // Remove IFNULL(is_deleted, 0) = 0 from SELECTs
    content = content.replace(/ AND IFNULL\(is_deleted, 0\) = 0/g, '');

    // Replace UPDATE ... SET is_deleted = 1 with DELETE FROM ...
    // e.g. "UPDATE rentals SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
    // to "DELETE FROM rentals WHERE id = ? AND user_id = ?"
    content = content.replace(/"UPDATE ([a-zA-Z0-9_]+) SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = \? AND user_id = \?"/g, '"DELETE FROM $1 WHERE id = ? AND user_id = ?"');

    fs.writeFileSync(filePath, content);
});

console.log('Reverted is_deleted logic from all API files.');
