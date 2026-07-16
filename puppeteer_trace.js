const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        
        await page.goto('https://real-estate-note.pages.dev/brokerage.html', { waitUntil: 'networkidle2' });

        await page.evaluate(() => {
            localStorage.setItem('auth_token', 'test');
            localStorage.setItem('user_email', 'test@test.com');
            localStorage.setItem('activeTab', 'rental');
        });

        await page.reload({ waitUntil: 'networkidle2' });

        // Inject stack trace into fetchWithAuth
        await page.evaluate(() => {
            const originalFetchWithAuth = fetchWithAuth;
            fetchWithAuth = async function(url, options) {
                if (url.includes('/api/ads') && (!options || options.method === 'GET' || !options.method)) {
                    console.log('--- FETCHING /api/ads ---');
                    console.trace();
                }
                return originalFetchWithAuth(url, options);
            };
        });

        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        await wait(3000);

        await page.evaluate(() => {
            if (rentals.length === 0) {
                rentals = [{
                    id: 'fake_123',
                    type: '상가/사무실',
                    status: 'active',
                    address: '테스트 주소'
                }];
            }
            console.log("Calling convertRentalToAd...");
            convertRentalToAd(rentals[0].id);
        });

        await wait(2000);
        console.log("Done.");

        await browser.close();
    } catch (err) {
        console.error("SCRIPT ERROR:", err);
    }
})();
