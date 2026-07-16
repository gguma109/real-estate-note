const fs = require('fs');

let adsContent = fs.readFileSync('functions/api/ads.js', 'utf8');

const regex = /try\s*\{\s*await env\.JEJU_DB\.prepare\("ALTER TABLE ads ADD COLUMN is_deleted BOOLEAN DEFAULT 0"\)\.run\(\);\s*await env\.JEJU_DB\.prepare\("ALTER TABLE ads ADD COLUMN deleted_at DATETIME"\)\.run\(\);\s*\}\s*catch\s*\(err\)\s*\{\}/;

adsContent = adsContent.replace(regex, '');

fs.writeFileSync('functions/api/ads.js', adsContent);
console.log('Fixed ads.js');
