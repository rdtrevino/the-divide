const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, 'serve');
const OUT = path.join(__dirname, 'cards_update');
function startServer(){return new Promise(r=>{const s=http.createServer((q,res)=>{fs.readFile(path.join(ROOT,decodeURIComponent(q.url.slice(1))),(e,d)=>{if(e){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':'text/html'});res.end(d);});});s.listen(0,'127.0.0.1',()=>r(s));});}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await startServer(); const port = srv.address().port;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1700, height: 1200 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${port}/The_Divide_-_Host_Update_Sheet.html`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(12000);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every(i => i.complete), { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const cards = await page.evaluate(() => {
    const hits = [];
    for (const el of document.querySelectorAll('body div')) {
      const r = el.getBoundingClientRect();
      if (r.width >= 300 && r.width <= 315 && r.height >= 420 && r.height <= 440) hits.push(el);
    }
    const set = new Set(hits);
    const outer = hits.filter(el => { let p = el.parentElement; while (p) { if (set.has(p)) return false; p = p.parentElement; } return true; });
    return outer.map((el, i) => {
      el.style.transform = 'none'; el.style.transition = 'none';
      el.setAttribute('data-cardcap', String(i));
      const t = (el.innerText || '').split('\n').map(s => s.trim()).filter(Boolean);
      return { i, lines: t };
    });
  });
  console.log('cards found:', cards.length);
  for (const c of cards) {
    await page.evaluate((idx) => {
      document.querySelector(`[data-cardcap="${idx}"]`).scrollIntoView({ block: 'center' });
    }, c.i);
    await page.waitForTimeout(120);
    const clip = await page.evaluate((idx) => {
      const el = document.querySelector(`[data-cardcap="${idx}"]`);
      const r0 = el.getBoundingClientRect();
      // frame overlay extends a fixed 5.4px right / 5.8px bottom past the box on this component
      return { x: Math.floor(r0.left), y: Math.floor(r0.top), width: Math.ceil(r0.width) + 6, height: Math.ceil(r0.height) + 6 };
    }, c.i);
    await page.screenshot({ path: path.join(OUT, `upd_${String(c.i).padStart(2, '0')}.png`), clip });
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(cards, null, 2));
  await browser.close(); srv.close();
})();
