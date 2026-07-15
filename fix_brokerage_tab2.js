const fs = require('fs');
const file = 'public/brokerage.html';
let content = fs.readFileSync(file, 'utf8');

const replacement = `        function switchTab(tab) {
            localStorage.setItem('activeTab', tab);
            const rBtn = document.getElementById('tab-rental');
            const nBtn = document.getElementById('tab-notes');
            const aBtn = document.getElementById('tab-ads');
            const tBtn = document.getElementById('tab-trash');
            const rContent = document.getElementById('content-rental');
            const nContent = document.getElementById('content-notes');
            const aContent = document.getElementById('content-ads');
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

const startMarker = 'function switchTab(tab) {';
const startIndex = content.indexOf(startMarker);
if (startIndex !== -1) {
    const endMarker = 'async function fetchWithAuth(';
    const endIndex = content.indexOf(endMarker, startIndex);
    if (endIndex !== -1) {
        content = content.substring(0, startIndex) + replacement + '\n\n        ' + content.substring(endIndex);
        fs.writeFileSync(file, content);
        console.log('Fixed switchTab in brokerage.html');
    } else {
        console.log('Could not find fetchWithAuth');
    }
} else {
    console.log('Could not find switchTab');
}
