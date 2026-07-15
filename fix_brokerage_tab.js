const fs = require('fs');
const file = 'public/brokerage.html';
let content = fs.readFileSync(file, 'utf8');

const newSwitchTab = `        function switchTab(tab) {
            localStorage.setItem('activeTab', tab);
            const rBtn = document.getElementById('tab-rental');
            const nBtn = document.getElementById('tab-notes');
            const aBtn = document.getElementById('tab-ads');
            const rContent = document.getElementById('content-rental');
            const nContent = document.getElementById('content-notes');
            const aContent = document.getElementById('content-ads');
            const tBtn = document.getElementById('tab-trash');
            const tContent = document.getElementById('content-trash');

            const activeClass = "flex-1 py-3 text-center text-sm font-bold border-b-2 text-primary border-primary transition-all flex justify-center items-center gap-2";
            const inactiveClass = "flex-1 py-3 text-center text-sm font-bold border-b-2 text-gray-400 border-transparent transition-all flex justify-center items-center gap-2";

            if(rBtn) rBtn.className = inactiveClass;
            if(nBtn) nBtn.className = inactiveClass;
            if(aBtn) aBtn.className = inactiveClass;
            if(tBtn) tBtn.className = inactiveClass;

            if(rContent) rContent.classList.add('hidden');
            if(nContent) nContent.classList.add('hidden');
            if(aContent) aContent.classList.add('hidden');
            if(tContent) tContent.classList.add('hidden');
            document.body.classList.remove('pb-28');

            if (tab === 'rental') {
                if(rBtn) rBtn.className = activeClass;
                if(rContent) {
                    rContent.classList.remove('hidden');
                    rContent.classList.add('flex');
                }
                if (document.getElementById('rental-editor-view') && document.getElementById('rental-editor-view').classList.contains('hidden')) {
                    loadRentalsFromCloud();
                }
                if (document.getElementById('sync-icon')) {
                    document.getElementById('sync-icon').classList.remove('hidden');
                    setTimeout(() => document.getElementById('sync-icon').classList.add('hidden'), 2000);
                }
            } else if (tab === 'notes') {
                if(nBtn) nBtn.className = activeClass;
                if(nContent) {
                    nContent.classList.remove('hidden');
                    nContent.classList.add('flex');
                }
                if (document.getElementById('note-editor-view') && document.getElementById('note-editor-view').classList.contains('hidden')) {
                    if (typeof loadNotesFromCloud === 'function') loadNotesFromCloud();
                }
                if (document.getElementById('sync-icon-notes')) {
                    document.getElementById('sync-icon-notes').classList.remove('hidden');
                    setTimeout(() => document.getElementById('sync-icon-notes').classList.add('hidden'), 2000);
                }
            } else if (tab === 'ads') {
                if(aBtn) aBtn.className = activeClass;
                if(aContent) {
                    aContent.classList.remove('hidden');
                    aContent.classList.add('flex');
                }
                document.body.classList.add('pb-28');
                if (document.getElementById('ad-editor-view') && document.getElementById('ad-editor-view').classList.contains('hidden')) {
                    loadAdsFromCloud();
                }
                if (document.getElementById('sync-icon-ads')) {
                    document.getElementById('sync-icon-ads').classList.remove('hidden');
                    setTimeout(() => document.getElementById('sync-icon-ads').classList.add('hidden'), 2000);
                }
            } else if (tab === 'trash') {
                if(tBtn) tBtn.className = activeClass;
                if(tContent) {
                    tContent.classList.remove('hidden');
                    tContent.classList.add('flex');
                }
                loadTrashFromCloud();
            }
        }`;

// Replace everything between "function switchTab(tab) {" and the matching closing brace.
// Since regex for nested braces is hard, we can use a precise string replace using split.
const parts = content.split('function switchTab(tab) {');
if (parts.length === 2) {
    const after = parts[1];
    // Find where the next function starts (e.g. function createNote) to figure out where switchTab ends.
    // Or just look for "function renderRentalsList(" which is the next function.
    const nextFunc = after.indexOf('function renderRentalsList');
    if (nextFunc !== -1) {
        const afterNext = after.substring(nextFunc);
        content = parts[0] + newSwitchTab + '\\n\\n        ' + afterNext;
        fs.writeFileSync(file, content);
        console.log('Fixed switchTab in brokerage.html');
    } else {
        console.log('Could not find renderRentalsList');
    }
}
