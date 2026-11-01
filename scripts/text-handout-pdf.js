/* Prints a deck's text handout to PDF in headless Chrome (CI, phase 8b).

     node scripts/text-handout-pdf.js URL OUT.pdf [CHROME_PATH]

   URL is the deck's handout.html with its options (style=notes,
   student=0 ...). The page lays itself out on A4 sheets and adds
   html.mga-print-ready when done; this waits for that and saves with the
   page's own size (@page A4, no margins), backgrounds on.
   Needs puppeteer-core (the workflow installs it with DeckTape). */
const puppeteer = require('puppeteer-core');

(async () => {
    const [url, out, chrome] = process.argv.slice(2);
    if (!url || !out) { console.error('usage: text-handout-pdf.js URL OUT.pdf [CHROME_PATH]'); process.exit(2); }
    const browser = await puppeteer.launch({
        executablePath: chrome || process.env.CHROME_PATH || '/usr/bin/google-chrome',
        args: ['--no-sandbox']
    });
    try {
        const page = await browser.newPage();
        page.on('console', m => { if (m.type() === 'error' || m.type() === 'warn') console.log('[page]', m.text()); });
        page.on('pageerror', e => console.log('[page error]', e.message));
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('mga-print-ready'), { timeout: 60000 });
        await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
        console.log('wrote', out);
    } finally {
        await browser.close();
    }
})().catch(e => { console.error(e); process.exit(1); });
