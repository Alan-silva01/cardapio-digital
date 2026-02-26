import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        page.on('console', msg => console.log('LOG:', msg.text()));
        page.on('pageerror', error => console.log('ERROR:', error.message));
        page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

        console.log("Navegando...");
        await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: 10000 });
        console.log("Aguardando 2 segundos...");
        await new Promise(r => setTimeout(r, 2000));

        const content = await page.content();
        console.log("HTML:", content.substring(0, 500));
        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
