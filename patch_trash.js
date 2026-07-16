const fs = require('fs');

let trash = fs.readFileSync('functions/api/trash.js', 'utf8');

trash = trash.replace(
    /const rentals = await env\.JEJU_DB\.prepare\("SELECT id, 'rental'/g,
    'const rentals = await env.DB.prepare("SELECT id, \\\'rental\\\''
);

trash = trash.replace(
    /if \(type === 'rental'\) \{ tableName = 'rentals'; targetDB = env\.JEJU_DB; \}/g,
    "if (type === 'rental') { tableName = 'rentals'; targetDB = env.DB; }"
);

trash = trash.replace(
    /await env\.JEJU_DB\.prepare\("DELETE FROM rentals/g,
    'await env.DB.prepare("DELETE FROM rentals'
);

fs.writeFileSync('functions/api/trash.js', trash);
console.log('Patched trash.js to use env.DB for rentals');
