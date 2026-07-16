const fs = require('fs');
let c = fs.readFileSync('public/brokerage.html', 'utf8');
c = c.replace(/confirm\('이 매물을 영구 삭제하시겠습니까\?'\)/g, "confirm('이 광고매물을 휴지통으로 이동하시겠습니까?')");
fs.writeFileSync('public/brokerage.html', c);
