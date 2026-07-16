const fs = require('fs');
const file = 'public/management.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Add tab button
const gasRegex = /(<button onclick="switchTab\('gas'\)" id="tab-gas"[\s\S]*?<\/button>)/;
const calcBtnStr = `\n                    <button onclick="switchTab('calc')" id="tab-calc"\n                        class="flex-1 py-3 text-center text-sm font-bold border-b-2 text-gray-400 border-transparent transition-all flex justify-center items-center gap-2">정산계산기</button>`;

if (!content.includes('id="tab-calc"')) {
    content = content.replace(gasRegex, '$1' + calcBtnStr);
}

// 2. Add content-calc before DEV LOGIN
const devLoginStr = '<!-- ===== DEV LOGIN ===== -->';
const calcUI = `
            <!-- ===== TAB: 정산계산기 ===== -->
            <div id="content-calc" class="hidden flex-1 flex flex-col bg-gray-50 overflow-y-auto pb-24">
                <header class="bg-blue-50/50 text-blue-900 border-b border-blue-100 p-4 text-center sticky top-0 z-10 shadow-sm">
                    <h1 class="text-xl font-bold tracking-wider">연세 정산 계산기</h1>
                </header>
                
                <div class="p-4 space-y-6">
                    <!-- 1. 계약 및 거주 정보 -->
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h3 class="font-black text-gray-800 border-b border-gray-100 pb-2">1. 계약 및 거주 정보</h3>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-gray-500 mb-1">계약 시작일</label>
                                <input type="date" id="calc-date-start" onchange="calculateSettlement()" class="w-full text-sm font-bold border-b border-gray-300 focus:border-primary outline-none py-1 bg-transparent">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-500 mb-1">계약 종료일</label>
                                <input type="date" id="calc-date-end" onchange="calculateSettlement()" class="w-full text-sm font-bold border-b border-gray-300 focus:border-primary outline-none py-1 bg-transparent">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-500 mb-1">실제 퇴실일</label>
                            <input type="date" id="calc-date-moveout" onchange="calculateSettlement()" class="w-full text-sm font-bold border-b border-gray-300 focus:border-primary outline-none py-1 bg-transparent text-primary">
                        </div>

                        <!-- 자동 계산된 일수 표시 -->
                        <div class="bg-blue-50 p-3 rounded-lg flex justify-between text-sm">
                            <div class="text-center">
                                <p class="text-xs text-gray-500 font-bold mb-1">총 계약</p>
                                <p class="font-black text-blue-900"><span id="calc-days-total">0</span>일</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs text-gray-500 font-bold mb-1">거주</p>
                                <p class="font-black text-orange-600"><span id="calc-days-lived">0</span>일</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs text-gray-500 font-bold mb-1">남은 일수</p>
                                <p class="font-black text-primary"><span id="calc-days-remain">0</span>일</p>
                            </div>
                        </div>
                    </div>

                    <!-- 2. 금액 및 공제 입력 -->
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h3 class="font-black text-gray-800 border-b border-gray-100 pb-2">2. 금액 입력 (단위: 원)</h3>
                        
                        <div class="space-y-4">
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm font-bold text-gray-600">보증금 원금</label>
                                <input type="text" id="calc-deposit" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[200px] text-right font-bold text-lg border-b border-gray-300 focus:border-primary outline-none py-1 bg-transparent text-blue-800" placeholder="0">
                            </div>
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm font-bold text-gray-600">1년 연세 총액</label>
                                <input type="text" id="calc-yearly-rent" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[200px] text-right font-bold text-lg border-b border-gray-300 focus:border-primary outline-none py-1 bg-transparent text-blue-800" placeholder="0">
                            </div>
                        </div>

                        <div class="border-t border-gray-100 pt-4 space-y-3 mt-4">
                            <h3 class="text-xs font-black text-red-500">차감(공제) 항목</h3>
                            
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm font-bold text-gray-600">미납 전기세</label>
                                <input type="text" id="calc-unpaid-elec" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[150px] text-right font-semibold border-b border-gray-300 focus:border-red-400 outline-none py-1 bg-transparent text-red-600" placeholder="0">
                            </div>
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm font-bold text-gray-600">미납 가스비</label>
                                <input type="text" id="calc-unpaid-gas" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[150px] text-right font-semibold border-b border-gray-300 focus:border-red-400 outline-none py-1 bg-transparent text-red-600" placeholder="0">
                            </div>
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm font-bold text-gray-600">청소/원상복구비</label>
                                <input type="text" id="calc-cleaning" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[150px] text-right font-semibold border-b border-gray-300 focus:border-red-400 outline-none py-1 bg-transparent text-red-600" placeholder="0">
                            </div>
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm font-bold text-gray-600">중개수수료/기타</label>
                                <input type="text" id="calc-brokerage" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[150px] text-right font-semibold border-b border-gray-300 focus:border-red-400 outline-none py-1 bg-transparent text-red-600" placeholder="0">
                            </div>
                        </div>
                    </div>

                    <!-- 3. 결과 표시 -->
                    <div class="bg-gradient-to-br from-blue-700 to-indigo-800 p-6 rounded-2xl shadow-lg text-white">
                        <div class="space-y-2 mb-4 pb-4 border-b border-white/20">
                            <div class="flex justify-between items-center text-sm opacity-90">
                                <span>하루 임대료</span>
                                <span id="calc-daily-rent" class="font-bold">0 원</span>
                            </div>
                            <div class="flex justify-between items-center text-sm opacity-90">
                                <span>반환할 임대료</span>
                                <span id="calc-refund-rent" class="font-bold text-yellow-300">+ 0 원</span>
                            </div>
                            <div class="flex justify-between items-center text-sm opacity-90">
                                <span>공제 항목 합계</span>
                                <span id="calc-total-deduction" class="font-bold text-red-300">- 0 원</span>
                            </div>
                        </div>
                        <div class="flex justify-between items-end">
                            <span class="text-lg font-bold">최종 반환 금액</span>
                            <span class="text-3xl font-black" id="calc-final-return">0 <span class="text-xl font-bold">원</span></span>
                        </div>
                    </div>

                    <button onclick="copySettlement()" class="w-full py-4 bg-gray-800 text-white font-bold rounded-xl shadow-md hover:bg-gray-900 active:scale-95 transition-all flex justify-center items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        정산 내역 복사하기
                    </button>
                </div>
            </div>
`;
if (content.includes(devLoginStr) && !content.includes('id="content-calc"')) {
    content = content.replace(devLoginStr, calcUI + '\n        ' + devLoginStr);
}

// 3. Update switchTab inside script
const switchTabGasRegex = /const gBtn = document\.getElementById\('tab-gas'\);/;
if (switchTabGasRegex.test(content) && !content.includes("const cBtn = document.getElementById('tab-calc');")) {
    content = content.replace(switchTabGasRegex, "const gBtn = document.getElementById('tab-gas');\n            const cBtn = document.getElementById('tab-calc');");
    
    content = content.replace(/const gContent = document\.getElementById\('content-gas'\);/, "const gContent = document.getElementById('content-gas');\n            const cContent = document.getElementById('content-calc');");
    
    content = content.replace(/if\s*\(gBtn\)\s*gBtn\.className = inactiveClass;/, "if (gBtn) gBtn.className = inactiveClass;\n            if (cBtn) cBtn.className = inactiveClass;");
    
    content = content.replace(/if\s*\(gContent\)\s*gContent\.classList\.add\('hidden'\);/, "if (gContent) gContent.classList.add('hidden');\n            if (cContent) cContent.classList.add('hidden');");
    
    const gasElseIf = /} else if \(\s*tab === 'gas'\s*\) {/;
    content = content.replace(gasElseIf, `} else if (tab === 'calc') {
                if(cBtn) cBtn.className = activeClass;
                if(cContent) {
                    cContent.classList.remove('hidden');
                    cContent.classList.add('flex');
                }
                if (typeof calculateSettlement === 'function') calculateSettlement();
            } else if (tab === 'gas') {`);
}

// 4. JS Logic
const jsLogicStr = `
        // ========== 연세 정산계산기 로직 ==========
        function formatCalcInput(input) {
            let val = input.value.replace(/[^0-9]/g, '');
            if (val) {
                input.value = Number(val).toLocaleString();
            } else {
                input.value = '';
            }
        }

        function getNumValue(id) {
            const el = document.getElementById(id);
            if (!el) return 0;
            const val = el.value.replace(/,/g, '');
            return val ? parseInt(val, 10) : 0;
        }

        function diffDays(start, end) {
            if (!start || !end) return 0;
            const s = new Date(start);
            const e = new Date(end);
            const diffTime = e.getTime() - s.getTime();
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        function calculateSettlement() {
            const startDate = document.getElementById('calc-date-start').value;
            const endDate = document.getElementById('calc-date-end').value;
            const moveoutDate = document.getElementById('calc-date-moveout').value;
            
            // 날짜 일수 계산
            const totalDays = diffDays(startDate, endDate);
            const livedDays = diffDays(startDate, moveoutDate);
            let remainDays = totalDays - livedDays;
            if (remainDays < 0) remainDays = 0; // 초과 거주면 남은 일수는 0

            document.getElementById('calc-days-total').innerText = totalDays > 0 ? totalDays : 0;
            document.getElementById('calc-days-lived').innerText = livedDays > 0 ? livedDays : 0;
            document.getElementById('calc-days-remain').innerText = remainDays > 0 ? remainDays : 0;

            // 임대료 계산
            const yearlyRent = getNumValue('calc-yearly-rent');
            let dailyRent = 0;
            let refundRent = 0;

            if (totalDays > 0) {
                dailyRent = yearlyRent / totalDays;
                refundRent = Math.floor(remainDays * dailyRent); // 소수점 내림
            }

            document.getElementById('calc-daily-rent').innerText = Math.floor(dailyRent).toLocaleString() + ' 원';
            document.getElementById('calc-refund-rent').innerText = '+ ' + refundRent.toLocaleString() + ' 원';

            // 공제 계산
            let deduction = 0;
            deduction += getNumValue('calc-unpaid-elec');
            deduction += getNumValue('calc-unpaid-gas');
            deduction += getNumValue('calc-cleaning');
            deduction += getNumValue('calc-brokerage');

            document.getElementById('calc-total-deduction').innerText = '- ' + deduction.toLocaleString() + ' 원';

            // 최종 계산
            const deposit = getNumValue('calc-deposit');
            const total = deposit + refundRent - deduction;

            document.getElementById('calc-final-return').innerHTML = total.toLocaleString() + ' <span class="text-xl font-bold">원</span>';
        }

        function copySettlement() {
            const start = document.getElementById('calc-date-start').value || '-';
            const end = document.getElementById('calc-date-end').value || '-';
            const moveout = document.getElementById('calc-date-moveout').value || '-';
            
            const totalDays = document.getElementById('calc-days-total').innerText;
            const livedDays = document.getElementById('calc-days-lived').innerText;
            const remainDays = document.getElementById('calc-days-remain').innerText;
            
            const deposit = document.getElementById('calc-deposit').value || '0';
            const yearlyRent = document.getElementById('calc-yearly-rent').value || '0';
            
            const dailyRentStr = document.getElementById('calc-daily-rent').innerText;
            const refundRentStr = document.getElementById('calc-refund-rent').innerText.replace('+ ', '');
            
            const elec = document.getElementById('calc-unpaid-elec').value || '0';
            const gas = document.getElementById('calc-unpaid-gas').value || '0';
            const cleaning = document.getElementById('calc-cleaning').value || '0';
            const brokerage = document.getElementById('calc-brokerage').value || '0';
            const totalDeduction = document.getElementById('calc-total-deduction').innerText.replace('- ', '');
            
            const final = document.getElementById('calc-final-return').innerText.replace(' 원', '');

            let text = \`[중도/만기 퇴실 정산 내역]\\n\\n\`;
            text += \`1. 계약 및 거주 정보\\n\`;
            text += \`계약 기간: \${start} ~ \${end} (총 \${totalDays}일)\\n\`;
            text += \`거주 기간: \${start} ~ \${moveout} (총 \${livedDays}일)\\n\`;
            text += \`남은 기간: \${remainDays}일\\n\\n\`;
            
            text += \`2. 임대료 정산 (일할 계산)\\n\`;
            text += \`연세 총액: \${yearlyRent}원\\n\`;
            text += \`하루 임대료: \${dailyRentStr}\\n\`;
            text += \`반환할 임대료: \${remainDays}일 × 하루임대료 = \${refundRentStr}\\n\\n\`;
            
            text += \`3. 차감(공제) 항목\\n\`;
            if (elec !== '0') text += \`- 미납 전기세: \${elec}원\\n\`;
            if (gas !== '0') text += \`- 미납 가스비: \${gas}원\\n\`;
            if (cleaning !== '0') text += \`- 청소/원상복구비: \${cleaning}원\\n\`;
            if (brokerage !== '0') text += \`- 중개/기타수수료: \${brokerage}원\\n\`;
            text += \`▶ 공제 합계: \${totalDeduction}\\n\\n\`;
            
            text += \`4. 최종 반환 금액\\n\`;
            text += \`보증금 \${deposit}원 + 반환임대료 \${refundRentStr.replace('원','')}원 - 공제합계 \${totalDeduction.replace('원','')}원\\n\`;
            text += \`■ 합계: \${final}원\\n\`;

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

if (!content.includes('function calculateSettlement() {')) {
    const endScriptRegex = /<\/script>\s*<\/body>/;
    content = content.replace(endScriptRegex, jsLogicStr + '\n    </script>\n</body>');
}

fs.writeFileSync(file, content);
console.log('Successfully injected exact PRORATION logic and UI via regex!');
