const fs = require('fs');
let content = fs.readFileSync('public/management.html', 'utf8');

const calcUI = `
            <!-- ===== TAB: 정산계산기 ===== -->
            <div id="content-calc" class="hidden flex-1 flex flex-col bg-gray-50 overflow-y-auto pb-24">
                <header class="bg-blue-50/50 text-blue-900 border-b border-blue-100 p-4 text-center sticky top-0 z-10 shadow-sm">
                    <h1 class="text-xl font-bold tracking-wider">연세 정산 계산기</h1>
                </header>
                
                <div class="p-4 space-y-4 max-w-lg mx-auto w-full">
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
                                <p class="text-xs text-gray-500 font-bold mb-1">총계약</p>
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
                                <label class="text-sm font-medium text-gray-600">미납 전기세</label>
                                <input type="text" id="calc-unpaid-elec" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[150px] text-right font-bold text-base border-b border-gray-300 focus:border-red-400 outline-none py-1 bg-transparent" placeholder="0">
                            </div>
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm font-medium text-gray-600">미납 가스비</label>
                                <input type="text" id="calc-unpaid-gas" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[150px] text-right font-bold text-base border-b border-gray-300 focus:border-red-400 outline-none py-1 bg-transparent" placeholder="0">
                            </div>
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm font-medium text-gray-600">청소/원상복구</label>
                                <input type="text" id="calc-cleaning" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[150px] text-right font-bold text-base border-b border-gray-300 focus:border-red-400 outline-none py-1 bg-transparent" placeholder="0">
                            </div>
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm font-medium text-gray-600">중개/기타수수료</label>
                                <input type="text" id="calc-brokerage" inputmode="numeric" oninput="formatCalcInput(this); calculateSettlement();" class="flex-1 max-w-[150px] text-right font-bold text-base border-b border-gray-300 focus:border-red-400 outline-none py-1 bg-transparent" placeholder="0">
                            </div>
                        </div>
                    </div>

                    <!-- 3. 최종 정산 결과 -->
                    <div class="bg-blue-600 text-white p-5 rounded-2xl shadow-md space-y-3 relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <h3 class="font-black border-b border-blue-500/50 pb-2 relative z-10">3. 최종 반환 금액</h3>
                        
                        <div class="space-y-1 relative z-10 text-sm">
                            <div class="flex justify-between text-blue-100">
                                <span>1일 임대료:</span>
                                <span id="calc-daily-rent" class="font-bold">0 원</span>
                            </div>
                            <div class="flex justify-between text-blue-100">
                                <span>반환할 임대료:</span>
                                <span id="calc-refund-rent" class="font-bold">+ 0 원</span>
                            </div>
                            <div class="flex justify-between text-red-200">
                                <span>공제 항목 합계:</span>
                                <span id="calc-total-deduction" class="font-bold">- 0 원</span>
                            </div>
                        </div>
                        
                        <div class="pt-3 border-t border-blue-500/50 flex justify-between items-end relative z-10">
                            <span class="text-sm font-bold text-blue-100">최종 지급액</span>
                            <span id="calc-final-return" class="text-3xl font-black tracking-tight">0 <span class="text-xl">원</span></span>
                        </div>
                    </div>

                    <!-- 복사 버튼 -->
                    <button onclick="copySettlement(event)" class="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        텍스트로 정산 내역 복사하기
                    </button>
                    
                    <p class="text-center text-xs text-gray-400 mt-2">※ 복사 후 카카오톡이나 문자로 바로 붙여넣기 하세요.</p>
                </div>
            </div>`;

if (!content.includes('id="content-calc"')) {
    content = content.replace('<!-- ===== TAB: 가스검침표 ===== -->', calcUI + '\n\n            <!-- ===== TAB: 가스검침표 ===== -->');
}

fs.writeFileSync('public/management.html', content);
console.log('Injected content-calc successfully');
