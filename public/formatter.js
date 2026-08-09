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
let formatterInitializationPromise = null;
let formatterAccountReady = false;
let formatterProviderSettings = {};

function normalizeFormatterApiKey(rawKey, provider) {
    const cleaned = String(rawKey || '').trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
    const patterns = {
        gemini: /AIza[0-9A-Za-z_-]{20,}/,
        openai: /sk-[0-9A-Za-z_-]{20,}/,
        claude: /sk-ant-[0-9A-Za-z_-]{20,}/
    };
    const match = cleaned.match(patterns[provider]);
    const key = match ? match[0] : cleaned;
    if (!key) throw new Error('API 키를 입력해 주세요.');
    if (!/^[\x21-\x7E]+$/.test(key)) {
        throw new Error('API 키에 한글이나 공백이 포함되어 있습니다. 발급 화면에서 API 키 문자열만 다시 복사해 주세요.');
    }
    return key;
}

async function formatterRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return data;
}

async function createFormatterSession(credential) {
    try {
        await formatterRequest('/api/formatter-session', {
            method: 'POST',
            body: JSON.stringify({ credential })
        });
        formatterAccountReady = true;
        formatterInitialized = false;
        formatterInitializationPromise = null;
        return true;
    } catch (error) {
        console.error('양식변환기 로그인 세션 생성 실패', error);
        formatterAccountReady = false;
        return false;
    }
}

async function destroyFormatterSession() {
    try {
        await formatterRequest('/api/formatter-session', { method: 'DELETE' });
    } catch (error) {
        console.error('양식변환기 로그인 세션 종료 실패', error);
    } finally {
        formatterAccountReady = false;
        formatterInitialized = false;
        formatterInitializationPromise = null;
        formatterProviderSettings = {};
    }
}

async function migrateLegacyFormatterSettings(settings) {
    if (Object.keys(settings.providers || {}).length > 0) return settings;

    const providers = ['gemini', 'openai', 'claude'];
    const savedProvider = localStorage.getItem('realEstateFormatterProvider');
    const legacyProvider = providers.includes(savedProvider) ? savedProvider : 'gemini';
    const legacyPrompt = localStorage.getItem('realEstateFormatterPrompt');
    const legacyWebSearch = localStorage.getItem('realEstateFormatterWebSearch') === 'true';
    const hasLegacySettings = legacyPrompt || providers.some(provider =>
        localStorage.getItem(`realEstateFormatterApiKey:${provider}`) ||
        localStorage.getItem(`realEstateFormatterModel:${provider}`)
    );
    if (!hasLegacySettings) return settings;

    const orderedProviders = providers.filter(provider => provider !== legacyProvider).concat(legacyProvider);
    let migratedSettings = settings;
    for (const provider of orderedProviders) {
        const apiKey = localStorage.getItem(`realEstateFormatterApiKey:${provider}`) || '';
        const savedModel = localStorage.getItem(`realEstateFormatterModel:${provider}`);
        if (provider !== legacyProvider && !apiKey && !savedModel) continue;
        const allowedModels = FORMATTER_MODELS[provider].map(([, value]) => value);
        const model = allowedModels.includes(savedModel) ? savedModel : allowedModels[0];
        const result = await formatterRequest('/api/formatter-settings', {
            method: 'PUT',
            body: JSON.stringify({
                provider,
                model,
                prompt: legacyPrompt || FORMATTER_DEFAULT_PROMPT,
                webSearch: legacyWebSearch,
                apiKey
            })
        });
        migratedSettings = result.settings;
    }

    localStorage.removeItem('realEstateFormatterProvider');
    localStorage.removeItem('realEstateFormatterPrompt');
    localStorage.removeItem('realEstateFormatterWebSearch');
    for (const provider of providers) {
        localStorage.removeItem(`realEstateFormatterApiKey:${provider}`);
        localStorage.removeItem(`realEstateFormatterModel:${provider}`);
    }
    showToast('이 브라우저의 기존 양식변환기 설정을 사이트 ID로 이전했습니다.', 'success');
    return migratedSettings;
}

async function loadFormatterSettings() {
    const status = document.getElementById('formatter-api-key-status');
    status.textContent = '사이트 ID의 설정을 불러오는 중입니다...';
    try {
        let settings = await formatterRequest('/api/formatter-settings');
        settings = await migrateLegacyFormatterSettings(settings);
        formatterAccountReady = true;
        formatterProviderSettings = settings.providers || {};
        document.getElementById('formatter-provider').value = settings.provider || 'gemini';
        document.getElementById('formatter-prompt').value = settings.prompt || FORMATTER_DEFAULT_PROMPT;
        document.getElementById('formatter-web-search').checked = Boolean(settings.webSearch);
        updateFormatterProviderUI();
    } catch (error) {
        formatterAccountReady = false;
        formatterProviderSettings = {};
        document.getElementById('formatter-provider').value = 'gemini';
        document.getElementById('formatter-prompt').value = FORMATTER_DEFAULT_PROMPT;
        document.getElementById('formatter-web-search').checked = false;
        updateFormatterProviderUI();
        status.textContent = error.status === 401
            ? '사이트 ID 설정을 사용하려면 로그아웃 후 Google로 다시 로그인해 주세요.'
            : `설정을 불러오지 못했습니다: ${error.message}`;
        status.className = 'mt-2 text-xs text-red-500';
    }
}

function initializeFormatter() {
    if (formatterInitialized) return formatterInitializationPromise || Promise.resolve();
    formatterInitialized = true;
    formatterInitializationPromise = loadFormatterSettings();
    return formatterInitializationPromise;
}

function updateFormatterProviderUI() {
    const provider = document.getElementById('formatter-provider').value;
    const modelSelect = document.getElementById('formatter-model');
    const savedModel = formatterProviderSettings[provider]?.model;
    modelSelect.innerHTML = FORMATTER_MODELS[provider].map(([label, value]) => `<option value="${value}">${label}</option>`).join('');
    if (savedModel && [...modelSelect.options].some(option => option.value === savedModel)) modelSelect.value = savedModel;
    const apiKeyInput = document.getElementById('formatter-api-key');
    const hasApiKey = Boolean(formatterProviderSettings[provider]?.hasApiKey);
    apiKeyInput.value = '';
    apiKeyInput.placeholder = hasApiKey ? '사이트 ID에 저장된 API 키 사용 중' : '선택한 공급자의 API 키 입력';
    const status = document.getElementById('formatter-api-key-status');
    if (formatterAccountReady) {
        status.textContent = hasApiKey
            ? '이 API 키는 사이트 ID에 안전하게 저장되어 다른 컴퓨터에서도 자동 사용됩니다.'
            : 'API 키를 입력하고 저장하면 사이트 ID에 자동 저장됩니다.';
        status.className = 'mt-2 text-xs text-gray-500';
    }
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

async function clearFormatterApiKey() {
    const provider = document.getElementById('formatter-provider').value;
    if (!formatterAccountReady) return showToast('사이트 ID로 다시 로그인해 주세요.', 'warning');
    if (!formatterProviderSettings[provider]?.hasApiKey && !document.getElementById('formatter-api-key').value) {
        return showToast('삭제할 API 키가 없습니다.', 'warning');
    }
    if (!confirm('이 사이트 ID에 저장된 API 키를 삭제할까요?')) return;
    document.getElementById('formatter-api-key').value = '';
    await saveFormatterSettings(true, true);
}

async function saveFormatterSettings(showMessage = true, clearApiKey = false) {
    if (!formatterAccountReady) {
        if (showMessage) showToast('사이트 ID로 다시 로그인해 주세요.', 'warning');
        return false;
    }
    const provider = document.getElementById('formatter-provider').value;
    let apiKey = document.getElementById('formatter-api-key').value.trim();
    if (apiKey) {
        try {
            apiKey = normalizeFormatterApiKey(apiKey, provider);
            document.getElementById('formatter-api-key').value = apiKey;
        } catch (error) {
            if (showMessage) showToast(error.message, 'warning');
            return false;
        }
    }
    try {
        const result = await formatterRequest('/api/formatter-settings', {
            method: 'PUT',
            body: JSON.stringify({
                provider,
                model: document.getElementById('formatter-model').value,
                webSearch: document.getElementById('formatter-web-search').checked,
                prompt: document.getElementById('formatter-prompt').value.trim() || FORMATTER_DEFAULT_PROMPT,
                apiKey: clearApiKey ? '' : apiKey,
                clearApiKey
            })
        });
        formatterProviderSettings = result.settings?.providers || formatterProviderSettings;
        document.getElementById('formatter-api-key').value = '';
        updateFormatterProviderUI();
        if (showMessage) showToast(clearApiKey ? '사이트 ID에 저장된 API 키를 삭제했습니다.' : '사이트 ID에 API 및 프롬프트 설정을 저장했습니다.', 'success');
        return true;
    } catch (error) {
        if (showMessage) showToast(`설정 저장 실패: ${error.message}`, 'warning');
        return false;
    }
}

async function restoreFormatterPrompt() {
    if (!confirm('내용 프롬프트를 기본값으로 되돌릴까요?')) return;
    document.getElementById('formatter-prompt').value = FORMATTER_DEFAULT_PROMPT;
    if (await saveFormatterSettings(false)) showToast('기본 프롬프트로 복원하고 사이트 ID에 저장했습니다.', 'success');
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

async function generateFormattedAd() {
    await initializeFormatter();
    const input = document.getElementById('formatter-input').value.trim();
    if (!input) return showToast('원본 매물 정보를 입력해 주세요.', 'warning');
    const provider = document.getElementById('formatter-provider').value;
    if (!document.getElementById('formatter-api-key').value.trim() && !formatterProviderSettings[provider]?.hasApiKey) {
        document.getElementById('formatter-settings').classList.remove('hidden');
        return showToast('선택한 공급자의 API 키를 입력해 주세요.', 'warning');
    }
    if (!await saveFormatterSettings(false)) return showToast('사이트 ID 설정을 저장하지 못했습니다.', 'warning');
    const button = document.getElementById('formatter-generate-btn');
    button.disabled = true; button.textContent = '변환 중...';
    try {
        const response = await formatterRequest('/api/formatter-generate', {
            method: 'POST',
            body: JSON.stringify({ input })
        });
        const result = response.result || '';
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
