const fs = require('fs');

let content = fs.readFileSync('functions/api/rentals.js', 'utf8');
content = content.replace(/env\.DB/g, 'env.JEJU_DB');
fs.writeFileSync('functions/api/rentals.js', content);

console.log('Fixed rentals.js to use JEJU_DB');
