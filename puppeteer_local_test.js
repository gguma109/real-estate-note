const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (request.url().includes('brokerage.html') || request.url().endsWith('brokerage')) {
                const html = fs.readFileSync('public/brokerage.html', 'utf8');
                request.respond({
                    status: 200,
                    contentType: 'text/html',
                    body: html
                });
            } else {
                request.continue();
            }
        });

        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('dialog', async dialog => {
            console.log('DIALOG MESSAGE:', dialog.message());
            await dialog.dismiss();
        });

        await page.goto('https://real-estate-note.pages.dev/brokerage', { waitUntil: 'networkidle2' });

        await page.evaluate(() => {
            localStorage.setItem('auth_token', 'test');
            localStorage.setItem('user_email', 'test@test.com');
            localStorage.setItem('activeTab', 'rental');
        });

        await page.reload({ waitUntil: 'networkidle2' });

        await page.evaluate(() => {
            const originalFetchWithAuth = fetchWithAuth;
            fetchWithAuth = async function(url, options) {
                if (url.includes('/api/ads') && (!options || options.method === 'GET' || !options.method)) {
                    console.log('--- FETCHING /api/ads ---');
                    console.log(new Error().stack);
                }
                return originalFetchWithAuth(url, options);
            };
        });

        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        await wait(2000);

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
        
        console.log("Checking ads array length:", await page.evaluate(() => ads.length));
        
        await page.evaluate(async () => {
            console.log("Ad ID value:", document.getElementById('editor-ad-id').value);
            console.log("Ads array:", JSON.stringify(ads));
            await saveCurrentAd(true);
            console.log("saveCurrentAd finished");
        });

        await wait(2000);

        await browser.close();
    } catch (err) {
        console.error("SCRIPT ERROR:", err);
    }
})();
