const FORMATTER_MODELS = {
    gemini: [
        ['Gemini 3.5 Flash-Lite — 무료 생성 (추천)', 'gemini-3.5-flash-lite'],
        ['Gemini 3.6 Flash — 무료 생성 가능', 'gemini-3.6-flash'],
        ['Gemini 3.1 Flash-Lite — 무료 생성 가능', 'gemini-3.1-flash-lite']
    ],
    openai: [
        ['GPT-5.6 Luna — 유료 (저가형)', 'gpt-5.6-luna'],
        ['GPT-5.6 Terra — 유료', 'gpt-5.6-terra'],
        ['GPT-5.6 Sol — 유료', 'gpt-5.6-sol'],
        ['GPT-4o mini — 유료 (저가형)', 'gpt-4o-mini']
    ],
    claude: [
        ['Claude Haiku 4.5 — 유료', 'claude-haiku-4-5'],
        ['Claude Sonnet 5 — 유료', 'claude-sonnet-5'],
        ['Claude Opus 5 — 유료', 'claude-opus-5']
    ]
};

const FORMATTER_DEFAULT_PROMPT = `당신은 제주도 정인부동산의 20년 경력 베테랑 중개인 비서입니다.
사용자가 입력한 부동산 매물 정보를 모바일 광고 플랫폼에서 빠르게 읽히는 광고글로 바꾸세요.

[출력 형식]
1. 반드시 제목과 본문 사이에 ---SPLIT---을 정확히 한 번 넣습니다.
2. 제목에는 말머리를 붙이지 않고 확인된 핵심 장점 3~4개를 중요도순으로 배치해 슬래시(/)로 구분합니다.
3. 본문은 아래 순서를 지킵니다.
매물 번호 : [번호] <--매물번호 꼭 확인해주세요!
* 정인부동산은 매도인과 직접 상담 후 광고하고 있습니다.

✔️매물 소개
[짧은 줄글 3~4문장]
• 핵심 장점 1
• 핵심 장점 2
• 핵심 장점 3

⭕매물 정보⭕
■항목 : 내용

064.723.0095

[작성 규칙]
- 제목은 고객이 5초 안에 차별점을 알 수 있도록 학교 도보시간, 향, 수리 상태, 구조처럼 구체적인 사실을 앞세웁니다.
- 제목에 행정구역·지역명·동네 이름을 넣지 않습니다.
- 소개는 차분하고 전문적인 정보형 문체로 작성하며 첫 문장에 입지·가격·구조·상태 중 가장 강한 장점을 제시합니다.
- 입지를 우선 설명하되 입력 또는 검색으로 확인된 시설명·거리·노선만 사용합니다.
- 주변 시세보다 낮다는 근거가 입력된 경우에만 가격 경쟁력을 언급합니다.
- 개발 호재는 검색 도구가 제공된 경우 정부·지자체·공공기관 등 신뢰 가능한 발표로 사업명·위치·진행 상태가 확인될 때만 씁니다.
- 검색 도구가 없거나 확인되지 않은 주변 시설, 시세, 개발계획은 절대 추측하지 않습니다.
- 사용자가 제공한 항목을 최대한 모두 ■ 항목으로 기재하고 누락된 핵심 정보는 확인 요망으로 씁니다.
- 현관 비밀번호, 세대 비밀번호 등 보안 정보는 절대 출력하지 않습니다.
- 금액은 2억 4,500만, 10만원처럼 읽기 쉽게 씁니다.
- 평 또는 평형이라는 단어는 쓰지 않고 모두 py로 표기합니다.
- 최고, 최상, 초특가, 무조건, 대박, 완벽, 놓치면 후회, 알짜배기, 투자가치 보장 등 과장·유인 표현을 금지합니다.
- 입력에 없는 사실을 만들지 않습니다.`;

let formatterInitialized = false;

function formatterKeyName(provider) { return `realEstateFormatterApiKey:${provider}`; }

function initializeFormatter() {
    if (formatterInitialized) return;
    formatterInitialized = true;
    const provider = localStorage.getItem('realEstateFormatterProvider') || 'gemini';
    document.getElementById('formatter-provider').value = provider;
    document.getElementById('formatter-prompt').value = localStorage.getItem('realEstateFormatterPrompt') || FORMATTER_DEFAULT_PROMPT;
    document.getElementById('formatter-web-search').checked = localStorage.getItem('realEstateFormatterWebSearch') === 'true';
    updateFormatterProviderUI();
}

function updateFormatterProviderUI() {
    const provider = document.getElementById('formatter-provider').value;
    const modelSelect = document.getElementById('formatter-model');
    const savedModel = localStorage.getItem(`realEstateFormatterModel:${provider}`);
    modelSelect.innerHTML = FORMATTER_MODELS[provider].map(([label, value]) => `<option value="${value}">${label}</option>`).join('');
    if (savedModel && [...modelSelect.options].some(option => option.value === savedModel)) modelSelect.value = savedModel;
    document.getElementById('formatter-api-key').value = localStorage.getItem(formatterKeyName(provider)) || '';
    document.getElementById('formatter-search-wrap').classList.toggle('hidden', provider !== 'gemini');
}

function toggleFormatterSettings() {
    initializeFormatter();
    document.getElementById('formatter-settings').classList.toggle('hidden');
}

function toggleFormatterApiKey() {
    const input = document.getElementById('formatter-api-key');
    input.type = input.type === 'password' ? 'text' : 'password';
}

function clearFormatterApiKey() {
    const provider = document.getElementById('formatter-provider').value;
    localStorage.removeItem(formatterKeyName(provider));
    document.getElementById('formatter-api-key').value = '';
    showToast('저장된 API 키를 삭제했습니다.', 'success');
}

function saveFormatterSettings(showMessage = true) {
    const provider = document.getElementById('formatter-provider').value;
    const apiKey = document.getElementById('formatter-api-key').value.trim();
    localStorage.setItem('realEstateFormatterProvider', provider);
    localStorage.setItem(`realEstateFormatterModel:${provider}`, document.getElementById('formatter-model').value);
    localStorage.setItem('realEstateFormatterWebSearch', document.getElementById('formatter-web-search').checked);
    localStorage.setItem('realEstateFormatterPrompt', document.getElementById('formatter-prompt').value.trim() || FORMATTER_DEFAULT_PROMPT);
    if (document.getElementById('formatter-save-key').checked && apiKey) localStorage.setItem(formatterKeyName(provider), apiKey);
    else localStorage.removeItem(formatterKeyName(provider));
    if (showMessage) showToast('API 및 프롬프트 설정을 저장했습니다.', 'success');
}

function restoreFormatterPrompt() {
    if (!confirm('내용 프롬프트를 기본값으로 되돌릴까요?')) return;
    document.getElementById('formatter-prompt').value = FORMATTER_DEFAULT_PROMPT;
    localStorage.setItem('realEstateFormatterPrompt', FORMATTER_DEFAULT_PROMPT);
    showToast('기본 프롬프트로 복원했습니다.', 'success');
}

async function pasteFormatterInput() {
    try {
        document.getElementById('formatter-input').value = await navigator.clipboard.readText();
    } catch (_) {
        showToast('브라우저에서 클립보드 읽기가 차단됐습니다. 직접 붙여넣어 주세요.', 'warning');
    }
}

function clearFormatterAll() {
    ['formatter-input', 'formatter-title', 'formatter-content'].forEach(id => document.getElementById(id).value = '');
}

async function callFormatterApi(provider, apiKey, model, prompt, input, webSearch) {
    if (provider === 'gemini') {
        const payload = {
            systemInstruction: { parts: [{ text: prompt }] },
            contents: [{ role: 'user', parts: [{ text: input }] }]
        };
        if (webSearch) payload.tools = [{ google_search: {} }];
        let lastError;
        for (const version of ['v1', 'v1beta']) {
            const response = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${encodeURIComponent(model)}:generateContent`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify(payload)
            });
            if (response.ok) {
                const data = await response.json();
                return (data.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('\n');
            }
            lastError = await response.text();
            if (response.status !== 404) throw new Error(formatterApiError(response.status, lastError));
        }
        throw new Error(formatterApiError(404, lastError));
    }
    if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model, instructions: prompt, input })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
        return (data.output || []).flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n');
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model, max_tokens: 4096, system: prompt, messages: [{ role: 'user', content: input }] })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
    return (data.content || []).filter(item => item.type === 'text').map(item => item.text).join('\n');
}

function formatterApiError(status, raw) {
    try { return JSON.parse(raw).error?.message || `HTTP ${status}`; } catch (_) { return `HTTP ${status}: ${raw || '요청 실패'}`; }
}

async function generateFormattedAd() {
    initializeFormatter();
    const input = document.getElementById('formatter-input').value.trim();
    const provider = document.getElementById('formatter-provider').value;
    const apiKey = document.getElementById('formatter-api-key').value.trim();
    if (!input) return showToast('원본 매물 정보를 입력해 주세요.', 'warning');
    if (!apiKey) {
        document.getElementById('formatter-settings').classList.remove('hidden');
        return showToast('본인의 API 키를 먼저 입력해 주세요.', 'warning');
    }
    saveFormatterSettings(false);
    const button = document.getElementById('formatter-generate-btn');
    button.disabled = true; button.textContent = '변환 중...';
    try {
        const result = await callFormatterApi(provider, apiKey, document.getElementById('formatter-model').value, document.getElementById('formatter-prompt').value.trim() || FORMATTER_DEFAULT_PROMPT, input, document.getElementById('formatter-web-search').checked);
        let [title, ...contentParts] = result.split('---SPLIT---');
        title = title.replace(/^■제목\s*:\s*/u, '').trim();
        const content = (contentParts.length ? contentParts.join('---SPLIT---') : result).trim().replace(/평형/g, 'py').replace(/평(?=\s|\n|$)/g, 'py');
        document.getElementById('formatter-title').value = contentParts.length ? title : '제목을 분리하지 못했습니다.';
        document.getElementById('formatter-content').value = content;
        showToast('양식 변환을 완료했습니다.', 'success');
    } catch (error) {
        console.error(error);
        showToast(`변환 실패: ${error.message}`, 'warning');
    } finally {
        button.disabled = false; button.textContent = '양식 변환하기';
    }
}

async function copyFormatterValue(id, message) {
    const value = document.getElementById(id).value.trim();
    if (!value) return showToast('복사할 내용이 없습니다.', 'warning');
    if (await copyTextToClipboard(value)) showToast(message, 'success');
    else showToast('복사에 실패했습니다.', 'warning');
}

function copyFormatterTitle() { return copyFormatterValue('formatter-title', '제목을 복사했습니다.'); }
function copyFormatterContent() { return copyFormatterValue('formatter-content', '내용을 복사했습니다.'); }
function copyFormatterAll() {
    const title = document.getElementById('formatter-title').value.trim();
    const content = document.getElementById('formatter-content').value.trim();
    const combined = [title, content].filter(Boolean).join('\n\n');
    if (!combined) return showToast('복사할 내용이 없습니다.', 'warning');
    return copyTextToClipboard(combined).then(ok => showToast(ok ? '제목과 내용을 모두 복사했습니다.' : '복사에 실패했습니다.', ok ? 'success' : 'warning'));
}
