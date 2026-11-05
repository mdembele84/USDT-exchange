// Flux « USDT → devise locale » : cas du client qui échange 53 168 USDT,
// 2 310 LE pour 100 USDT côté client, 2 404 LE pour 100 USDT chez Nouhoum.
const { chromium } = require('playwright');
const path = require('path');
const { PAGE, SHOTS, check, finish, near, flat } = require('./helpers');

(async () => {
  console.log('USDT → devise locale');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  const hero = () => page.evaluate(() => document.querySelector('#sim-out .hero-res .big')?.innerText);
  await page.goto(PAGE);
  await page.waitForTimeout(600);

  // Calcul
  const r = await page.evaluate(() => {
    const d = newDraft('local'); d.vals.usdt = 53168;
    const v = resolve('local', d), res = compute('local', v);
    return { v, net: res.netUsdt, pct: res.marginPct, payout: res.payout, be: breakEven('local', v) };
  });
  check(r.v.rateProvider === 2404 && r.v.rateClient === 2310, 'taux par défaut : 2 404 et 2 310 pour 100 USDT');
  check(near(r.payout.amount, 1228180.8), 'le client reçoit 1 228 180,80 SLE', r.payout.amount);
  check(near(r.payout.usdt, 51089.05), '51 089,05 USDT vendus à Nouhoum', r.payout.usdt);
  check(near(r.net, 2078.95), 'marge nette de 2 078,95 USDT', r.net);
  check(near(r.pct, 0.0391, 0.0001), 'marge de 3,91 %', r.pct);
  check(near(r.be, 0.0391, 0.0001), 'point mort à −3,91 % sur le taux du partenaire', r.be);

  // Simulateur
  await page.evaluate(() => { location.hash = 'simulateur'; });
  await page.waitForTimeout(200);
  await page.click('[data-act="pick-type"][data-type="local"]');
  await page.fill('#sim-usdt', '53168');
  await page.waitForTimeout(150);
  check(flat(await hero()) === '2078,95USDT', 'le simulateur affiche 2 078,95 USDT', await hero());
  await page.screenshot({ path: path.join(SHOTS, 'local-simulateur.png'), fullPage: true });

  await page.click('[data-act="seg"][data-key="base"][data-value="1"]');
  await page.waitForTimeout(150);
  const perOne = await page.evaluate(() => [document.querySelector('#sim-rateProvider').value, document.querySelector('#sim-rateClient').value]);
  check(perOne[0] === '24,04' && perOne[1] === '23,1', 'taux pour 1 USDT : 24,04 et 23,10', perOne.join(' / '));
  check(flat(await hero()) === '2078,95USDT', 'même marge avec une cotation pour 1 USDT');
  await page.click('[data-act="seg"][data-key="base"][data-value="100"]');
  await page.waitForTimeout(150);

  await page.fill('#sim-currency', 'ghs');
  await page.press('#sim-currency', 'Tab');
  await page.waitForTimeout(200);
  const other = await page.evaluate(() => ({ cur: document.querySelector('#sim-currency').value, rate: document.querySelector('#sim-rateProvider').value, out: document.querySelector('#sim-out').innerText }));
  check(other.cur === 'GHS' && other.rate === '' && other.out.includes('Complétez les paramètres'), 'une autre devise demande de saisir les taux');
  await page.fill('#sim-rateProvider', '1550');
  await page.fill('#sim-rateClient', '1500');
  await page.waitForTimeout(150);
  check(flat(await hero()) === '1715,10USDT', 'GHS saisi à la main : 1 715,10 USDT', await hero());
  await page.click('[data-act="sim-reset"]');
  await page.waitForTimeout(150);

  // Nouvelle opération
  await page.click('#tbnew');
  await page.click('.drawer [data-act="pick-type"][data-type="local"]');
  await page.fill('#dr-client', 'Client test');
  await page.fill('#dr-usdt', '53168');
  await page.click('[data-act="drawer-save"]');
  await page.waitForTimeout(250);
  const op = await page.evaluate(() => S.ops.find(o => o.type === 'local'));
  check(op && op.inputs.usdt === 53168 && op.inputs.partner === 'Nouhoum' && op.inputs.currency === 'SLE' && op.ref.startsWith('LC-'), 'opération enregistrée avec Nouhoum, SLE et la référence LC-', JSON.stringify(op && op.inputs));
  await page.screenshot({ path: path.join(SHOTS, 'local-detail.png') });
  await page.keyboard.press('Escape');

  // Paramètres : partenaire par défaut
  await page.evaluate(() => { location.hash = 'parametres'; });
  await page.waitForTimeout(200);
  await page.fill('#set-local-local-partner', 'Nouhoum K.');
  await page.click('[data-act="save-set"][data-form="set-local"]');
  await page.waitForTimeout(200);
  check(await page.evaluate(() => S.config.local.partner === 'Nouhoum K.' && FLUX.local.sub() === 'Nouhoum K. · Sierra Leone'), 'partenaire par défaut renommé dans Paramètres');

  // Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { location.hash = 'simulateur'; });
  await page.waitForTimeout(250);
  check(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) <= 0, 'simulateur mobile sans défilement horizontal');

  await browser.close();
  finish(errors);
})().catch(e => { console.error(e); process.exit(1); });
