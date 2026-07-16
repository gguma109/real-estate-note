const fs = require('fs');
const file = 'public/management.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Add tab button
const tabGasBtn = `<button onclick="switchTab('gas')" id="tab-gas"
                        class="flex-1 py-3 text-center text-sm font-bold border-b-2 text-gray-400 border-transparent transition-all flex justify-center items-center gap-2">가스검침표</button>`;
const tabCalcBtn = `\n                    <button onclick="switchTab('calc')" id="tab-calc"
                        class="flex-1 py-3 text-center text-sm font-bold border-b-2 text-gray-400 border-transparent transition-all flex justify-center items-center gap-2">정산계산기</button>`;
if (content.includes(tabGasBtn) && !content.includes("tab-calc")) {
    content = content.replace(tabGasBtn, tabGasBtn + tabCalcBtn);
}

// 2. Insert Calculator Content right before DEV LOGIN
const devLoginStr = '<!-- ===== DEV LOGIN ===== -->';
const calcContent = `
            <!-- ===== TAB: 정산계산기 ===== -->
            <div id="content-calc" class="hidden flex-1 flex flex-col bg-gray-50 overflow-y-auto">
                <header class="bg-blue-50/50 text-blue-900 border-b border-blue-100 p-4 text-center sticky top-0 z-10 shadow-sm">
                    <h1 class="text-xl font-bold tracking-wider">퇴실 정산 계산기</h1>
                </header>
                
                <div class="p-4 space-y-6">
                    <!-- 토글 -->
                    <div class="flex bg-gray-200 rounded-xl p-1 shadow-inner">
                        <button id="calc-type-end" onclick="toggleCalcType('end')" class="flex-1 py-2 text-sm font-bold bg-white text-primary rounded-lg shadow-sm transition-all">만기퇴실</button>
                        <button id="calc-type-mid" onclick="toggleCalcType('mid')" class="flex-1 py-2 text-sm font-bold text-gray-500 rounded-lg hover:bg-gray-100 transition-all">중도퇴실</button>
                    </div>

                    <!-- 입력 폼 -->
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <!-- 공통: 보증금 -->
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">보증금 (원금)</label>
                            <input type="text" id="calc-deposit" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="w-full text-right font-bold text-lg border-b-2 border-gray-300 focus:border-primary outline-none py-1 bg-transparent placeholder-gray-300" placeholder="0">
                        </div>

                        <div class="border-t border-gray-100 my-4 pt-4 space-y-4">
                            <h3 class="text-xs font-black text-red-500">차감(공제) 항목</h3>
                            
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm font-bold text-gray-600 whitespace-nowrap">미납 월세/관리비</label>
                                <input type="text" id="calc-unpaid-rent" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[200px] text-right font-semibold border-b border-gray-300 focus:border-red-400 outline-none py-1 bg-transparent text-red-600" placeholder="0">
                            </div>
                            
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm font-bold text-gray-600 whitespace-nowrap">미납 전기세</label>
                                <input type="text" id="calc-unpaid-elec" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[200px] text-right font-semibold border-b border-gray-300 focus:border-red-400 outline-none py-1 bg-transparent text-red-600" placeholder="0">
                            </div>
                            
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm font-bold text-gray-600 whitespace-nowrap">미납 가스비</label>
                                <input type="text" id="calc-unpaid-gas" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[200px] text-right font-semibold border-b border-gray-300 focus:border-red-400 outline-none py-1 bg-transparent text-red-600" placeholder="0">
                            </div>
                            
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm font-bold text-gray-600 whitespace-nowrap">청소/원상복구비</label>
                                <input type="text" id="calc-cleaning" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[200px] text-right font-semibold border-b border-gray-300 focus:border-red-400 outline-none py-1 bg-transparent text-red-600" placeholder="0">
                            </div>

                            <!-- 중도퇴실 전용 -->
                            <div id="calc-mid-fields" class="hidden space-y-4 pt-4 border-t border-dashed border-gray-200 mt-2">
                                <h3 class="text-xs font-black text-orange-500">중도퇴실 추가 공제</h3>
                                <div class="flex items-center justify-between gap-3">
                                    <label class="text-sm font-bold text-gray-600 whitespace-nowrap">중개수수료(복비)</label>
                                    <input type="text" id="calc-brokerage" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[200px] text-right font-semibold border-b border-gray-300 focus:border-orange-400 outline-none py-1 bg-transparent text-orange-600" placeholder="0">
                                </div>
                                <div class="flex items-center justify-between gap-3">
                                    <label class="text-sm font-bold text-gray-600 whitespace-nowrap">잔여/위약 월세</label>
                                    <input type="text" id="calc-penalty" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[200px] text-right font-semibold border-b border-gray-300 focus:border-orange-400 outline-none py-1 bg-transparent text-orange-600" placeholder="0">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 결과 표시 -->
                    <div class="bg-gradient-to-br from-blue-600 to-primary p-6 rounded-2xl shadow-lg text-white mt-4">
                        <div class="flex justify-between items-end mb-2 opacity-80">
                            <span class="text-sm font-medium">총 공제액</span>
                            <span class="text-sm font-bold" id="calc-total-deduction">- 0 원</span>
                        </div>
                        <div class="flex justify-between items-end">
                            <span class="text-lg font-bold">최종 반환액</span>
                            <span class="text-3xl font-black" id="calc-final-return">0 <span class="text-xl font-bold">원</span></span>
                        </div>
                    </div>

                    <button onclick="copySettlement()" class="w-full py-4 bg-gray-800 text-white font-bold rounded-xl shadow-md hover:bg-gray-900 active:scale-95 transition-all flex justify-center items-center gap-2 mt-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        내역 복사하기
                    </button>
                </div>
            </div>
`;
if (!content.includes('id="content-calc"')) {
    content = content.replace(devLoginStr, calcContent + '\n        ' + devLoginStr);
}

// 3. Inject JS Logic
const jsLogicStr = `
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
if (!content.includes('calculateSettlement() {')) {
    const jsInsertPoint = '// --- 1.2 퇴실확인서(Moveout) 로직 ---';
    content = content.replace(jsInsertPoint, jsLogicStr + '\n        ' + jsInsertPoint);
}

fs.writeFileSync(file, content);
console.log('Added UI and JS cleanly');
