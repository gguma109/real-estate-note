const fs = require('fs');
let content = fs.readFileSync('functions/api/rentals.js', 'utf8');
content = content.replace(/env\.JEJU_DB/g, 'env.DB');
fs.writeFileSync('functions/api/rentals.js', content);
console.log('Fixed rentals.js back to DB');
