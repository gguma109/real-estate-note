const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
        page.on('dialog', async dialog => {
            console.log('DIALOG MESSAGE:', dialog.message());
            await dialog.dismiss();
        });

        await page.goto('https://real-estate-note.pages.dev/brokerage.html', { waitUntil: 'networkidle2' });

        await page.evaluate(() => {
            localStorage.setItem('auth_token', 'test');
            localStorage.setItem('user_email', 'test@test.com');
            localStorage.setItem('activeTab', 'rental');
        });

        await page.reload({ waitUntil: 'networkidle2' });

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
            convertRentalToAd(rentals[0].id);
        });

        await wait(1000);

        await page.evaluate(async () => {
            try {
                console.log("Ad ID value:", document.getElementById('editor-ad-id').value);
                console.log("Ads array:", JSON.stringify(ads));
                await saveCurrentAd(true);
                console.log("saveCurrentAd finished");
            } catch (e) {
                console.log("SAVE EXCEPTION:", e.toString());
            }
        });

        await wait(3000);

        await browser.close();
    } catch (err) {
        console.error("SCRIPT ERROR:", err);
    }
})();
