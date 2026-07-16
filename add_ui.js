const fs = require('fs');
const file = 'public/management.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Add tab button
const tabGasBtn = `<button onclick="switchTab('gas')" id="tab-gas"
                        class="flex-1 py-3 text-center text-sm font-bold border-b-2 text-gray-400 border-transparent transition-all flex justify-center items-center gap-2">가스검침표</button>`;
const tabCalcBtn = `\n                    <button onclick="switchTab('calc')" id="tab-calc"
                        class="flex-1 py-3 text-center text-sm font-bold border-b-2 text-gray-400 border-transparent transition-all flex justify-center items-center gap-2">정산계산기</button>`;
content = content.replace(tabGasBtn, tabGasBtn + tabCalcBtn);

// 2. Add content block after content-gas
const contentGasEndStr = '</div>\n        </div>\n\n        <!-- ===== DEV LOGIN ===== -->';
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
content = content.replace(contentGasEndStr, '</div>\n' + calcContent + '        </div>\n\n        <!-- ===== DEV LOGIN ===== -->');

fs.writeFileSync(file, content);
console.log('Added UI logic');
