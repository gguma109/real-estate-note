const fs = require('fs');
const files = ['public/management.html', 'public/brokerage.html'];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // Make element access and classList updates robust
    content = content.replace(/mBtn\.className\s*=\s*/g, 'if(mBtn) mBtn.className = ');
    content = content.replace(/rBtn\.className\s*=\s*/g, 'if(rBtn) rBtn.className = ');
    content = content.replace(/nBtn\.className\s*=\s*/g, 'if(nBtn) nBtn.className = ');
    content = content.replace(/aBtn\.className\s*=\s*/g, 'if(aBtn) aBtn.className = ');
    content = content.replace(/tBtn\.className\s*=\s*/g, 'if(tBtn) tBtn.className = ');

    content = content.replace(/mContent\.classList/g, 'if(mContent) mContent.classList');
    content = content.replace(/rContent\.classList/g, 'if(rContent) rContent.classList');
    content = content.replace(/nContent\.classList/g, 'if(nContent) nContent.classList');
    content = content.replace(/aContent\.classList/g, 'if(aContent) aContent.classList');
    content = content.replace(/tContent\.classList/g, 'if(tContent) tContent.classList');
    
    // Also protect some other specific elements if they exist
    content = content.replace(/moveoutBottom\.classList/g, 'if(moveoutBottom) moveoutBottom.classList');

    // Deduplicate any double ifs that might have happened if previous replace was partial
    content = content.replace(/if\(mBtn\)\s*if\(mBtn\)/g, 'if(mBtn)');
    content = content.replace(/if\(rBtn\)\s*if\(rBtn\)/g, 'if(rBtn)');
    content = content.replace(/if\(nBtn\)\s*if\(nBtn\)/g, 'if(nBtn)');
    content = content.replace(/if\(aBtn\)\s*if\(aBtn\)/g, 'if(aBtn)');
    content = content.replace(/if\(tBtn\)\s*if\(tBtn\)/g, 'if(tBtn)');
    content = content.replace(/if\(mContent\)\s*if\(mContent\)/g, 'if(mContent)');
    content = content.replace(/if\(rContent\)\s*if\(rContent\)/g, 'if(rContent)');
    content = content.replace(/if\(nContent\)\s*if\(nContent\)/g, 'if(nContent)');
    content = content.replace(/if\(aContent\)\s*if\(aContent\)/g, 'if(aContent)');
    content = content.replace(/if\(tContent\)\s*if\(tContent\)/g, 'if(tContent)');
    content = content.replace(/if\(moveoutBottom\)\s*if\(moveoutBottom\)/g, 'if(moveoutBottom)');

    fs.writeFileSync(file, content);
    console.log("Fixed " + file);
}
