// Mise en page : aucune page ne doit défiler horizontalement, de 1 600 px à 800 px de large.
// Les tableaux larges peuvent défiler dans leur propre cadre.
const { chromium } = require('playwright');
const { PAGE, check, finish } = require('./helpers');
const { SEED } = require('./fixtures');

const VIEWS = ['tableau-de-bord', 'operations', 'flux-nous', 'flux-doudou', 'flux-congo', 'flux-mali', 'flux-local', 'partenaires', 'fonds-sbi', 'utilisateurs', 'parametres'];

(async () => {
  console.log('Mise en page');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(PAGE);
  await page.waitForTimeout(500);
  await page.evaluate(SEED);
  for (const w of [1600, 1440, 1366, 1280, 1024, 900, 800]) {
    await page.setViewportSize({ width: w, height: 900 });
    const bad = [];
    for (const v of VIEWS) {
      await page.evaluate(h => { location.hash = h; }, v);
      await page.waitForTimeout(120);
      const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (o > 0) bad.push(`${v} (+${o} px)`);
    }
    check(!bad.length, `${w} px : aucune page ne déborde`, bad.join(', '));
  }
  await browser.close();
  finish(errors);
})().catch(e => { console.error(e); process.exit(1); });
