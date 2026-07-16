const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log("Launching browser...");
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
        page.on('dialog', async dialog => {
            console.log('DIALOG MESSAGE:', dialog.message());
            await dialog.dismiss();
        });

        console.log("Navigating to https://real-estate-note.pages.dev/brokerage.html");
        await page.goto('https://real-estate-note.pages.dev/brokerage.html', { waitUntil: 'networkidle2' });

        console.log("Setting localStorage auth_token...");
        await page.evaluate(() => {
            localStorage.setItem('auth_token', 'test');
            localStorage.setItem('user_email', 'test@test.com');
            localStorage.setItem('activeTab', 'rental');
        });

        console.log("Reloading page...");
        await page.reload({ waitUntil: 'networkidle2' });

        const wait = (ms) => new Promise(r => setTimeout(r, ms));

        console.log("Waiting for rentals to load...");
        await wait(3000);

        console.log("Simulating click on 광고매물복사...");
        await page.evaluate(() => {
            if (rentals.length === 0) {
                rentals = [{
                    id: 'fake_123',
                    type: '상가/사무실',
                    status: 'active',
                    address: '테스트 주소'
                }];
            }
            convertRentalToAd(rentals[0].id);
        });

        await wait(1000);

        console.log("Clicking Save button in Editor...");
        await page.evaluate(() => {
            saveCurrentAd(true);
        });

        await wait(3000);

        console.log("Done. Checking ads array length:", await page.evaluate(() => ads.length));
        console.log("Checking if editor is open:", await page.evaluate(() => !document.getElementById('ads-editor-view').classList.contains('hidden')));

        await browser.close();
    } catch (err) {
        console.error("SCRIPT ERROR:", err);
    }
})();
