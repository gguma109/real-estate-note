const fs = require('fs');
const file = 'public/management.html';
let content = fs.readFileSync(file, 'utf8');

// Update switchTab logic
const switchTabReplacement = `
        function switchTab(tab) {
            localStorage.setItem('activeTab', tab);
            const mBtn = document.getElementById('tab-moveout');
            const rBtn = document.getElementById('tab-rental');
            const nBtn = document.getElementById('tab-notes');
            const gBtn = document.getElementById('tab-gas');
            const cBtn = document.getElementById('tab-calc');
            
            const mContent = document.getElementById('content-moveout');
            const rContent = document.getElementById('content-rental');
            const nContent = document.getElementById('content-notes');
            const gContent = document.getElementById('content-gas');
            const cContent = document.getElementById('content-calc');
            
            const moveoutBottom = document.getElementById('bottom-bar-moveout');

            const activeClass = "flex-1 py-3 text-center text-sm font-bold border-b-2 text-primary border-primary transition-all flex justify-center items-center gap-2";
            const inactiveClass = "flex-1 py-3 text-center text-sm font-bold border-b-2 text-gray-400 border-transparent transition-all flex justify-center items-center gap-2";

            if(mBtn) mBtn.className = inactiveClass;
            if(rBtn) rBtn.className = inactiveClass;
            if(nBtn) nBtn.className = inactiveClass;
            if (gBtn) gBtn.className = inactiveClass;
            if (cBtn) cBtn.className = inactiveClass;

            if(mContent) mContent.classList.add('hidden');
            if(rContent) rContent.classList.add('hidden');
            if(nContent) nContent.classList.add('hidden');
            if(gContent) gContent.classList.add('hidden');
            if(cContent) cContent.classList.add('hidden');
            
            if(moveoutBottom) moveoutBottom.classList.add('hidden');
            document.body.classList.remove('pb-20');

            if (tab === 'moveout') {
                if(mBtn) mBtn.className = activeClass;
                if(mContent) {
                    mContent.classList.remove('hidden');
                    mContent.classList.add('flex');
                }
                if(moveoutBottom) moveoutBottom.classList.remove('hidden');
                document.body.classList.add('pb-20');
                if (document.getElementById('moveout-editor-view') && document.getElementById('moveout-editor-view').classList.contains('hidden')) {
                    loadMoveoutsFromCloud();
                }
                if (document.getElementById('sync-icon')) {
                    document.getElementById('sync-icon').classList.remove('hidden');
                    setTimeout(() => document.getElementById('sync-icon').classList.add('hidden'), 2000);
                }
            } else if (tab === 'rental') {
                if(rBtn) rBtn.className = activeClass;
                if(rContent) {
                    rContent.classList.remove('hidden');
                    rContent.classList.add('flex');
                }
                if (document.getElementById('rental-editor-view') && document.getElementById('rental-editor-view').classList.contains('hidden')) {
                    loadRentalsFromCloud();
                }
                if (document.getElementById('sync-icon-rental')) {
                    document.getElementById('sync-icon-rental').classList.remove('hidden');
                    setTimeout(() => document.getElementById('sync-icon-rental').classList.add('hidden'), 2000);
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
            } else if (tab === 'gas') {
                if(gBtn) gBtn.className = activeClass;
                if(gContent) {
                    gContent.classList.remove('hidden');
                    gContent.classList.add('flex');
                }
                if (document.getElementById('gas-editor-view') && document.getElementById('gas-editor-view').classList.contains('hidden')) {
                    if (typeof loadGasFromCloud === 'function') loadGasFromCloud();
                }
                if (document.getElementById('sync-icon-gas')) {
                    document.getElementById('sync-icon-gas').classList.remove('hidden');
                    setTimeout(() => document.getElementById('sync-icon-gas').classList.add('hidden'), 2000);
                }
            } else if (tab === 'calc') {
                if(cBtn) cBtn.className = activeClass;
                if(cContent) {
                    cContent.classList.remove('hidden');
                    cContent.classList.add('flex');
                }
                calculateSettlement();
            }
        }
`;

const switchTabStart = content.indexOf('function switchTab(tab) {');
const fetchWithAuthStart = content.indexOf('async function fetchWithAuth(url', switchTabStart);

if (switchTabStart !== -1 && fetchWithAuthStart !== -1) {
    content = content.substring(0, switchTabStart) + switchTabReplacement + '\n        ' + content.substring(fetchWithAuthStart);
}

// 3. Add logic functions at the end of the script tag
const jsLogic = `
        // ========== 계산기 로직 ==========
        let calcType = 'end'; // 'end' = 만기퇴실, 'mid' = 중도퇴실

        function toggleCalcType(type) {
            calcType = type;
            const endBtn = document.getElementById('calc-type-end');
            const midBtn = document.getElementById('calc-type-mid');
            const midFields = document.getElementById('calc-mid-fields');

            if (type === 'end') {
                endBtn.className = "flex-1 py-2 text-sm font-bold bg-white text-primary rounded-lg shadow-sm transition-all";
                midBtn.className = "flex-1 py-2 text-sm font-bold text-gray-500 rounded-lg hover:bg-gray-100 transition-all";
                midFields.classList.add('hidden');
            } else {
                midBtn.className = "flex-1 py-2 text-sm font-bold bg-white text-primary rounded-lg shadow-sm transition-all";
                endBtn.className = "flex-1 py-2 text-sm font-bold text-gray-500 rounded-lg hover:bg-gray-100 transition-all";
                midFields.classList.remove('hidden');
            }
            calculateSettlement();
        }

        function formatCalcInput(input) {
            let val = input.value.replace(/[^0-9]/g, '');
            if (val) {
                input.value = Number(val).toLocaleString();
            } else {
                input.value = '';
            }
        }

        function getNumValue(id) {
            const val = document.getElementById(id).value.replace(/,/g, '');
            return val ? parseInt(val, 10) : 0;
        }

        function calculateSettlement() {
            const deposit = getNumValue('calc-deposit');
            let deduction = 0;
            deduction += getNumValue('calc-unpaid-rent');
            deduction += getNumValue('calc-unpaid-elec');
            deduction += getNumValue('calc-unpaid-gas');
            deduction += getNumValue('calc-cleaning');

            if (calcType === 'mid') {
                deduction += getNumValue('calc-brokerage');
                deduction += getNumValue('calc-penalty');
            }

            const total = deposit - deduction;

            document.getElementById('calc-total-deduction').innerText = '- ' + deduction.toLocaleString() + ' 원';
            document.getElementById('calc-final-return').innerHTML = total.toLocaleString() + ' <span class="text-xl font-bold">원</span>';
        }

        function copySettlement() {
            const typeStr = calcType === 'end' ? '만기퇴실' : '중도퇴실';
            const deposit = document.getElementById('calc-deposit').value || '0';
            const unpaidRent = document.getElementById('calc-unpaid-rent').value || '0';
            const unpaidElec = document.getElementById('calc-unpaid-elec').value || '0';
            const unpaidGas = document.getElementById('calc-unpaid-gas').value || '0';
            const cleaning = document.getElementById('calc-cleaning').value || '0';
            const brokerage = document.getElementById('calc-brokerage').value || '0';
            const penalty = document.getElementById('calc-penalty').value || '0';
            const final = document.getElementById('calc-final-return').innerText.replace(' 원', '');
            
            let text = \`[보증금 정산 내역 (\${typeStr})]\n\n\`;
            text += \`■ 보증금(원금): \${deposit}원\n\n\`;
            text += \`■ 차감(공제) 내역\n\`;
            if (unpaidRent !== '0') text += \`- 미납 월세/관리비: \${unpaidRent}원\n\`;
            if (unpaidElec !== '0') text += \`- 미납 전기세: \${unpaidElec}원\n\`;
            if (unpaidGas !== '0') text += \`- 미납 가스비: \${unpaidGas}원\n\`;
            if (cleaning !== '0') text += \`- 청소/원상복구비: \${cleaning}원\n\`;
            
            if (calcType === 'mid') {
                if (brokerage !== '0') text += \`- 중개수수료(복비): \${brokerage}원\n\`;
                if (penalty !== '0') text += \`- 잔여/위약 월세: \${penalty}원\n\`;
            }
            
            const totalDeduction = document.getElementById('calc-total-deduction').innerText.replace('- ', '').replace(' 원', '');
            text += \`------------------------\n\`;
            text += \`공제액 합계: \${totalDeduction}원\n\n\`;
            text += \`▶ 최종 반환액: \${final}원\n\`;

            navigator.clipboard.writeText(text).then(() => {
                const btn = event.currentTarget;
                const originalText = btn.innerHTML;
                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg> 복사 완료!';
                btn.classList.replace('bg-gray-800', 'bg-green-600');
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.replace('bg-green-600', 'bg-gray-800');
                }, 2000);
            }).catch(err => {
                alert('복사에 실패했습니다.');
            });
        }
`;

const scriptEnd = content.lastIndexOf('</script>');
content = content.substring(0, scriptEnd) + jsLogic + '\n    ' + content.substring(scriptEnd);

fs.writeFileSync(file, content);
console.log('Added JS logic');
