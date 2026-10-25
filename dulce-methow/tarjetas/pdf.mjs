import { chromium } from 'playwright-core';
const [,, input, output] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1125, height: 675 } });
await page.goto(input, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
// 1125x675 CSS px at 300 dpi -> 3.75x2.25 in; scale CSS px (96/in) down to fit.
await page.pdf({ path: output, width: '3.75in', height: '2.25in', scale: 96/300, printBackground: true, pageRanges: '1', margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await browser.close();
console.log('ok', output);
