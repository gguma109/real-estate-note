const fs = require('fs');
let html = fs.readFileSync('public/management.html', 'utf8');

// 1. replace content-calc structure
const calcStartMarker = '<!-- ===== TAB: 정산계산기 ===== -->';
const calcEndMarker = '<!-- ===== TAB: 더보기 ===== -->';

let idxStart = html.indexOf(calcStartMarker);
let idxEnd = html.indexOf(calcEndMarker);

let calcBlock = html.substring(idxStart, idxEnd);

// extract the inner form content
let formStartIdx = calcBlock.indexOf('<div class="p-4 space-y-4 max-w-lg mx-auto w-full">');
let formContent = calcBlock.substring(formStartIdx);

let newCalcBlock = `<!-- ===== TAB: 정산계산기 ===== -->
            <div id="content-calc" class="hidden flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
                
                <!-- 리스트 뷰 -->
                <div id="calc-list-view" class="flex-1 flex flex-col animate-fade-in pb-20">
                    <header class="bg-blue-50/50 text-blue-900 border-b border-blue-100 p-4 text-center sticky top-0 z-10 shadow-sm flex justify-between items-center">
                        <div class="w-8"></div>
                        <h1 class="text-xl font-bold tracking-wider">연세 정산 계산기</h1>
                        <button onclick="addSettlement()" class="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors shadow-sm text-lg font-bold" style="padding-bottom: 2px;">
                            +
                        </button>
                    </header>
                    <div class="flex-1 overflow-y-auto p-4 space-y-3" id="calc-list">
                    </div>
                    <div id="calc-empty" class="hidden flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                        <div class="text-4xl mb-4 opacity-50">🧮</div>
                        <p class="font-bold">등록된 정산 내역이 없습니다.</p>
                        <p class="text-xs mt-2">상단의 + 버튼을 눌러 정산을 등록해보세요.</p>
                    </div>
                </div>

                <!-- 에디터 뷰 -->
                <div id="calc-editor-view" class="hidden absolute inset-0 z-20 flex flex-col bg-gray-50 animate-fade-in-down pb-20">
                    <div class="bg-white border-b border-gray-200 p-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                        <button onclick="closeSettlementEditor()"
                            class="text-gray-500 font-bold text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 shadow-sm active:scale-95 transition-all flex items-center gap-1">
                            <span>◀</span> 뒤로
                        </button>
                        <div class="font-bold text-gray-800 text-sm">정산 편집</div>
                        <button onclick="saveSettlementToCloud()"
                            class="text-primary font-bold text-sm px-4 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 shadow-sm active:scale-95 transition-all">저장</button>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto" id="calc-editor-content">
                        <div class="bg-blue-50/50 p-4 border-b border-blue-100 mb-2">
                            <label class="block text-xs font-bold text-blue-900 mb-1 ml-1">정산명 (식별용)</label>
                            <input type="text" id="calc-title" class="w-full px-3 py-2 bg-white border border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm font-bold text-gray-800 placeholder-blue-300 shadow-sm transition-all" placeholder="예: 201호 정산 (홍길동)">
                        </div>
                        <input type="hidden" id="calc-id" value="">
                        \n` + formContent + `
                    </div>
                </div>
            </div>\n\n            `;

html = html.replace(calcBlock, newCalcBlock);

// 2. Add JavaScript logic for Settlements
const jsLogic = `
        // ========== 3. 정산 계산기 (Settlements) ==========
        let settlements = [];
        
        async function loadSettlements() {
            const data = await fetchWithAuth('/api/settlements');
            if (data && Array.isArray(data)) {
                settlements = data;
            } else {
                settlements = [];
            }
            renderSettlements();
        }

        function renderSettlements() {
            const list = document.getElementById('calc-list');
            const empty = document.getElementById('calc-empty');
            
            if (!settlements || settlements.length === 0) {
                list.innerHTML = '';
                empty.classList.remove('hidden');
                return;
            }
            empty.classList.add('hidden');
            
            list.innerHTML = settlements.map(s => {
                let parsed = {};
                try {
                    parsed = JSON.parse(s.data);
                } catch(e) {}
                
                const title = parsed.title || '이름없는 정산';
                const dateObj = new Date(s.updated_at || s.created_at || Date.now());
                const dateStr = dateObj.getMonth() + 1 + '월 ' + dateObj.getDate() + '일';
                
                const start = parsed.startDate || '-';
                const moveout = parsed.moveoutDate || '-';
                
                return \`
                <div class="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-4 cursor-pointer hover:border-blue-300 transition-colors active:scale-[0.98] relative overflow-hidden" onclick="openSettlementEditor('\${s.id}')">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2 overflow-hidden">
                            <span class="text-lg">🧮</span>
                            <h3 class="font-black text-gray-800 text-[1.1rem] truncate">\${title}</h3>
                        </div>
                        <button onclick="event.stopPropagation(); deleteSettlement('\${s.id}')" class="text-red-300 hover:text-red-500 transition-colors p-1" style="padding-bottom:15px; padding-left:15px;">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                    <div class="flex flex-col gap-1 text-[0.8rem] text-gray-500 font-bold bg-gray-50 p-2 rounded-lg border border-gray-100 mt-2">
                        <div class="flex justify-between">
                            <span>계약 기간:</span>
                            <span class="text-gray-800">\${start} ~ \${moveout}</span>
                        </div>
                        <div class="flex justify-between mt-1">
                            <span>최종 반환액:</span>
                            <span class="text-primary font-black">\${parsed.finalReturn || '0'}</span>
                        </div>
                    </div>
                    <div class="text-[0.7rem] text-gray-400 font-medium pt-2 mt-2 border-t border-gray-50 text-right">
                        수정일: \${dateStr}
                    </div>
                </div>
                \`;
            }).join('');
        }

        async function addSettlement() {
            const tempId = 'settle_' + Date.now();
            const newS = {
                id: tempId,
                title: '',
                data: '{}',
                created_at: new Date().toISOString()
            };
            settlements.unshift(newS);
            renderSettlements();
            
            // clear form
            document.getElementById('calc-title').value = '';
            document.getElementById('calc-date-start').value = '';
            document.getElementById('calc-date-end').value = '';
            document.getElementById('calc-date-moveout').value = '';
            
            document.getElementById('calc-deposit').value = '';
            document.getElementById('calc-yearly-rent').value = '';
            document.getElementById('calc-unpaid-elec').value = '';
            document.getElementById('calc-unpaid-gas').value = '';
            document.getElementById('calc-cleaning').value = '';
            document.getElementById('calc-brokerage').value = '';
            
            if(typeof calculateSettlement === 'function') {
                calculateSettlement();
            }
            
            openSettlementEditor(tempId);
        }

        function openSettlementEditor(id) {
            document.getElementById('calc-list-view').classList.add('hidden');
            document.getElementById('calc-editor-view').classList.remove('hidden');
            
            const s = settlements.find(item => item.id === id);
            if (!s) return;
            
            document.getElementById('calc-id').value = id;
            
            let parsed = {};
            try { parsed = JSON.parse(s.data || '{}'); } catch(e) {}
            
            if(parsed.title !== undefined) {
                // Populate fields
                document.getElementById('calc-title').value = parsed.title || '';
                document.getElementById('calc-date-start').value = parsed.startDate || '';
                document.getElementById('calc-date-end').value = parsed.endDate || '';
                document.getElementById('calc-date-moveout').value = parsed.moveoutDate || '';
                
                document.getElementById('calc-deposit').value = parsed.deposit || '';
                document.getElementById('calc-yearly-rent').value = parsed.yearlyRent || '';
                document.getElementById('calc-unpaid-elec').value = parsed.unpaidElec || '';
                document.getElementById('calc-unpaid-gas').value = parsed.unpaidGas || '';
                document.getElementById('calc-cleaning').value = parsed.cleaning || '';
                document.getElementById('calc-brokerage').value = parsed.brokerage || '';
            }
            
            if(typeof calculateSettlement === 'function') {
                calculateSettlement(); // trigger recalcs to populate display texts
            }
        }
        
        function closeSettlementEditor() {
            document.getElementById('calc-editor-view').classList.add('hidden');
            document.getElementById('calc-list-view').classList.remove('hidden');
            renderSettlements();
        }

        async function saveSettlementToCloud() {
            const id = document.getElementById('calc-id').value;
            if(!id) return;
            
            const payloadData = {
                title: document.getElementById('calc-title').value,
                startDate: document.getElementById('calc-date-start').value,
                endDate: document.getElementById('calc-date-end').value,
                moveoutDate: document.getElementById('calc-date-moveout').value,
                deposit: document.getElementById('calc-deposit').value,
                yearlyRent: document.getElementById('calc-yearly-rent').value,
                unpaidElec: document.getElementById('calc-unpaid-elec').value,
                unpaidGas: document.getElementById('calc-unpaid-gas').value,
                cleaning: document.getElementById('calc-cleaning').value,
                brokerage: document.getElementById('calc-brokerage').value,
                finalReturn: document.getElementById('calc-final-return').innerText.replace(/<[^>]*>?/gm, '')
            };
            
            const payload = {
                id: id,
                title: payloadData.title,
                ...payloadData
            };
            
            let sIndex = settlements.findIndex(item => item.id === id);

            const res = await fetchWithAuth('/api/settlements', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res && res.success && res.id) {
                if(sIndex > -1) {
                    settlements[sIndex].data = JSON.stringify(payloadData);
                    settlements[sIndex].updated_at = new Date().toISOString();
                }
                alert('성공적으로 저장되었습니다!');
                closeSettlementEditor();
            } else {
                alert('저장 중 오류가 발생했습니다.');
            }
        }

        async function deleteSettlement(id) {
            if (confirm('이 정산 내역을 삭제하시겠습니까?')) {
                settlements = settlements.filter(r => r.id !== id);
                renderSettlements();

                if (!id.startsWith('settle_')) {
                    await fetchWithAuth('/api/settlements?id=' + id, { method: 'DELETE' });
                }
            }
        }
`;

// Insert the jsLogic right before "// ========== 정산 계산기 ==========" or at the end of the script
let endScriptIdx = html.indexOf('// ========== 정산 계산기 ==========');
if(endScriptIdx !== -1) {
    html = html.substring(0, endScriptIdx) + jsLogic + '\\n    ' + html.substring(endScriptIdx);
} else {
    // just append before closing script
    html = html.replace('</script>\\n</body>', jsLogic + '\\n</script>\\n</body>');
}

// Ensure loadSettlements is called when tab is switched
let tabSwitchStr = "if (tabId === 'moveout') {";
html = html.replace(tabSwitchStr, "if (tabId === 'calc') {\\n                    if (settlements.length === 0) loadSettlements();\\n                }\\n                if (tabId === 'moveout') {");

fs.writeFileSync('public/management.html', html);
