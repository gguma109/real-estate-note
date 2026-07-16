const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Inject mock localStorage for auth
    await page.goto('https://real-estate-note.pages.dev/');
    await page.evaluate(() => {
        localStorage.setItem('auth_token', 'test');
        localStorage.setItem('user_email', 'test@example.com');
    });
    
    // Go to brokerage app
    await page.goto('https://real-estate-note.pages.dev/brokerage');
    
    // Wait for rentals to load
    await page.waitForFunction('typeof rentals !== "undefined" && rentals.length > 0');
    
    // Get the first rental ID
    const rentalId = await page.evaluate(() => rentals[0].id);
    const oldNotes = await page.evaluate(() => rentals[0].special_notes || '');
    console.log('Original notes:', oldNotes);
    
    // Open editor
    await page.evaluate((id) => openRentalEditor(id), rentalId);
    
    // Type in special notes
    await page.waitForSelector('textarea[data-field="special_notes"]', { visible: true });
    await page.type('textarea[data-field="special_notes"]', ' TEST EDIT');
    
    // Click save
    await page.evaluate(() => handleRentalSaveClick());
    
    // Wait a bit for sync
    await page.waitForTimeout(2000);
    
    // Check if it saved in memory
    const newNotes = await page.evaluate(() => rentals[0].special_notes);
    console.log('New notes in memory:', newNotes);
    
    // Reload page and check if it persisted in cloud
    await page.goto('https://real-estate-note.pages.dev/brokerage');
    await page.waitForFunction('typeof rentals !== "undefined" && rentals.length > 0');
    const persistedNotes = await page.evaluate((id) => {
        const r = rentals.find(r => r.id === id);
        return r ? r.special_notes : 'not found';
    }, rentalId);
    console.log('Persisted notes from cloud:', persistedNotes);
    
    await browser.close();
})();
