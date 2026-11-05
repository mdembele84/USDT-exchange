// Mode démo (page ouverte hors de claude.ai) : saisie, étapes, paramètres, commissions, thème sombre, mobile.
const { chromium } = require('playwright');
const path = require('path');
const { PAGE, SHOTS, check, finish } = require('./helpers');
const { SEED, SEED_COUNT } = require('./fixtures');

(async () => {
  console.log('Mode démo');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  const shot = name => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true });
  const docOverflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const go = async hash => { await page.evaluate(h => { location.hash = h; }, hash); await page.waitForTimeout(200); };

  await page.goto(PAGE);
  await page.waitForTimeout(600);
  check(await page.evaluate(() => S.mode) === 'demo', 'démarre en mode démo hors de claude.ai');
  await shot('demo-vide');

  // Saisie d'une opération Mali depuis le panneau
  await page.click('#tbnew');
  await page.click('.drawer [data-act="pick-type"][data-type="mali"]');
  await page.fill('#dr-client', 'Client test');
  await page.fill('#dr-aed', '80000');
  await page.click('[data-act="drawer-save"]');
  await page.waitForTimeout(200);
  const op = await page.evaluate(() => S.ops[0]);
  check(op && op.type === 'mali' && op.inputs.aed === 80000 && op.inputs.rateKa === 612, 'opération Mali enregistrée avec les taux du jour', JSON.stringify(op && op.inputs));
  await page.click('.drawer .step input >> nth=0');
  await page.waitForTimeout(150);
  check(await page.evaluate(() => S.ops[0].steps.collect === true), 'première étape validée');
  await page.keyboard.press('Escape');

  // Opérations d'exemple et toutes les vues
  check(await page.evaluate(SEED) === SEED_COUNT, `${SEED_COUNT} opérations d'exemple chargées`);
  for (const v of ['tableau-de-bord', 'operations', 'flux-nous', 'flux-doudou', 'flux-congo', 'flux-mali', 'flux-local', 'simulateur', 'partenaires', 'fonds-sbi', 'utilisateurs', 'parametres']) {
    await go(v);
    await shot('demo-' + v);
    check(await docOverflow() <= 0, `pas de défilement horizontal : ${v}`);
  }

  // Paramètres
  await go('parametres');
  await page.fill('#set-rates-rates-xafKa', '615');
  await page.click('[data-act="save-set"][data-form="set-rates"]');
  await page.waitForTimeout(150);
  check(await page.evaluate(() => S.config.rates.xafKa) === 615, 'taux KA enregistré');

  // Commissions
  await go('partenaires');
  await page.click('[data-act="pay"][data-id="doudou"]');
  await page.click('[data-act="pay-confirm"]');
  await page.waitForTimeout(150);
  check(await page.evaluate(() => !commissionsDue(S.ops.map(enrich)).doudou), 'commissions Doudou marquées comme versées');

  // Thème sombre
  await page.emulateMedia({ colorScheme: 'dark' });
  await go('tableau-de-bord');
  await shot('demo-sombre');
  await page.emulateMedia({ colorScheme: 'light' });

  // Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  for (const v of ['tableau-de-bord', 'operations', 'simulateur', 'parametres']) {
    await go(v);
    await shot('demo-mobile-' + v);
    check(await docOverflow() <= 0, `mobile sans défilement horizontal : ${v}`);
  }

  await browser.close();
  finish(errors);
})().catch(e => { console.error(e); process.exit(1); });
