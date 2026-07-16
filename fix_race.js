const fs = require('fs');
let c = fs.readFileSync('public/brokerage.html', 'utf8');
c = c.replace(
    "switchTab('ads');\n            openAdEditor(tempId);",
    "openAdEditor(tempId);\n            switchTab('ads');"
);
c = c.replace(
    "switchTab('ads');\r\n            openAdEditor(tempId);",
    "openAdEditor(tempId);\n            switchTab('ads');"
);
fs.writeFileSync('public/brokerage.html', c);
