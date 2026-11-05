// Mode connecté : la base et l'identité de claude.ai sont simulées par un window.claude factice.
// Vérifie la reconnaissance des utilisateurs, l'attribution des saisies, les rôles et l'export.
const { chromium } = require('playwright');
const path = require('path');
const { PAGE, SHOTS, check, finish } = require('./helpers');

const MOCK = `
(() => {
  const store = new Map(), listeners = [];
  const clone = o => JSON.parse(JSON.stringify(o));
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const merge = (t, s) => { for (const k of Object.keys(s)) { const v = s[k]; if (isObj(v)) t[k] = merge(isObj(t[k]) ? t[k] : {}, v); else t[k] = v; } return t; };
  const snapDoc = p => { const d = store.get(p); return Object.freeze({ id: p.split('/').pop(), exists: !!d, data: () => (d ? Object.freeze(clone(d)) : undefined), metadata: { fromCache: false, hasPendingWrites: false } }); };
  const colDocs = c => [...store.keys()].filter(p => p.startsWith(c + '/') && p.split('/').length === c.split('/').length + 1).sort().map(snapDoc);
  const qsnap = c => { const docs = colDocs(c); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }; };
  const emit = () => setTimeout(() => listeners.slice().forEach(l => l.cb(l.kind === 'col' ? qsnap(l.path) : snapDoc(l.path))), 5);
  const docRef = p => ({ id: p.split('/').pop(), path: p,
    get: async () => snapDoc(p),
    set: async d => { store.set(p, clone(d)); emit(); },
    update: async d => { if (!store.has(p)) throw { code: 'invalid_argument', message: 'absent' }; store.set(p, merge(clone(store.get(p)), clone(d))); emit(); },
    delete: async () => { store.delete(p); emit(); },
    onSnapshot: cb => { listeners.push({ kind: 'doc', path: p, cb }); setTimeout(() => cb(snapDoc(p)), 5); return () => {}; },
    collection: c => colRef(p + '/' + c) });
  const colRef = p => ({ path: p, doc: id => docRef(p + '/' + (id || Math.random().toString(36).slice(2))),
    onSnapshot: cb => { listeners.push({ kind: 'col', path: p, cb }); setTimeout(() => cb(qsnap(p)), 5); return () => {}; },
    get: async () => qsnap(p) });
  const db = Object.freeze({ doc: docRef, collection: colRef });
  const ME = window.__ME;
  const user = Object.freeze({ me: async () => ME, id: async () => ME.id, can: async () => ME.canWrite !== false, isOwner: async () => ME.isOwner, canEdit: async () => ME.canEdit,
    profiles: async ids => Object.fromEntries([].concat(ids).map(i => [i, { id: i, name: '', avatarUrl: '', color: '#888', email: null, isMe: i === ME.id, guest: false }])) });
  const dl = Object.freeze({ save: async ({ filename, data }) => { window.__saved = { filename, data: String(data) }; return { status: 'saved' }; } });
  (window.__SEED || []).forEach(([p, d]) => store.set(p, d));
  window.__store = store;
  window.claude = { use: async n => { await new Promise(r => setTimeout(r, 40)); return n === 'db' ? db : n === 'user' ? user : n === 'downloads' ? dl : null; } };
})();`;

const STAMP = { uids: [], createdAt: '2026-10-28T17:00:00.000Z', createdBy: null, updatedAt: '2026-10-28T17:00:00.000Z' };
const MEMBERS = [
  ['members/alpha', { name: 'Utilisateur A', email: 'a@example.com', role: 'admin', ...STAMP }],
  ['members/beta', { name: 'Utilisateur B', email: 'b@example.com', role: 'admin', ...STAMP }],
];

async function session(browser, me, seed, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript({ content: `window.__ME = ${JSON.stringify(me)}; window.__SEED = ${JSON.stringify(seed)};` + MOCK });
  await page.goto(PAGE);
  await page.waitForTimeout(600);
  await fn(page);
  await ctx.close();
  return errors;
}
const footer = p => p.evaluate(() => document.querySelector('#sbfoot').innerText.replace(/\n/g, ' / '));
const stored = (p, key) => p.evaluate(k => window.__store.get(k), key);
const claim = async (p, id) => { await p.click(`.claim-row [data-act="user-claim"][data-id="${id}"]`); await p.waitForTimeout(250); };

(async () => {
  console.log('Mode connecté (base simulée)');
  const browser = await chromium.launch();
  const errors = [];

  // 1. Première visite : la personne choisit sa fiche, puis saisit
  errors.push(...await session(browser, { id: 'u_alpha_00000000000000001', name: 'A', email: null, avatarUrl: '', isOwner: false, canEdit: true }, MEMBERS, async page => {
    check(await page.evaluate(() => S.mode) === 'live', 'mode connecté');
    check(await page.evaluate(() => !!document.querySelector('.claim-row')), 'le bandeau « Qui êtes-vous ? » s\'affiche');
    await claim(page, 'alpha');
    check((await footer(page)).includes('Utilisateur A / Administrateur'), 'compte relié à la fiche Utilisateur A', await footer(page));
    check((await stored(page, 'members/alpha')).uids.includes('u_alpha_00000000000000001'), 'identifiant enregistré sur la fiche');

    await page.click('#tbnew');
    await page.click('.drawer [data-act="pick-type"][data-type="doudou"]');
    await page.fill('#dr-client', 'Client test');
    await page.fill('#dr-bankRef', 'VIR-2001');
    await page.click('[data-act="drawer-save"]');
    await page.waitForTimeout(250);
    check(await page.evaluate(() => !!document.querySelector('.drawer .step input')), 'le détail reste ouvert après l\'enregistrement');
    await page.click('.drawer .step input >> nth=0');
    await page.waitForTimeout(200);
    const op = await page.evaluate(() => { const k = [...window.__store.keys()].find(x => x.startsWith('ops/')); return window.__store.get(k); });
    check(op && op.createdByMember === 'alpha' && op.stepsBy && op.stepsBy.in === 'alpha', 'saisie et étape attribuées à Utilisateur A');
    await page.screenshot({ path: path.join(SHOTS, 'live-detail.png') });
    await page.keyboard.press('Escape');

    await page.evaluate(() => { location.hash = 'parametres'; });
    await page.waitForTimeout(200);
    await page.fill('#set-rates-rates-xafKa', '613');
    await page.click('[data-act="save-set"][data-form="set-rates"]');
    await page.waitForTimeout(200);
    const cfg = await stored(page, 'config/settings');
    check(cfg && cfg.rates.xafKa === 613 && cfg.ratesMeta.xafKa.byMember === 'alpha', 'taux enregistré dans la base avec son auteur');

    await page.evaluate(() => { location.hash = 'fonds-sbi'; });
    await page.waitForTimeout(200);
    await page.click('[data-act="export-sbi"]');
    await page.waitForTimeout(200);
    const saved = await page.evaluate(() => window.__saved);
    check(saved && /^fonds-sbi-\d{4}-\d{2}-\d{2}\.csv$/.test(saved.filename) && saved.data.includes('VIR-2001'), 'relevé SBI exporté en CSV');

    await page.evaluate(() => { location.hash = 'utilisateurs'; });
    await page.waitForTimeout(200);
    await page.click('[data-act="user-new"]');
    await page.fill('#um-name', 'Utilisateur C');
    await page.fill('#um-email', 'b@example.com');
    await page.click('[data-act="user-save"]');
    await page.waitForTimeout(100);
    check(await page.evaluate(() => document.querySelector('.field.err .errmsg')?.innerText) === 'Cette adresse a déjà une fiche.', 'adresse en double refusée');
    await page.fill('#um-email', 'c@example.com');
    await page.click('[data-act="user-save"]');
    await page.waitForTimeout(200);
    const emails = await page.evaluate(() => [...window.__store.keys()].filter(k => k.startsWith('members/')).map(k => window.__store.get(k).email + ':' + window.__store.get(k).role).sort());
    check(emails.join(',') === 'a@example.com:admin,b@example.com:admin,c@example.com:operateur', 'nouvelle fiche créée en Opérateur', emails.join(','));
    await page.screenshot({ path: path.join(SHOTS, 'live-utilisateurs.png'), fullPage: true });
  }));

  // 2. Propriétaire avec un autre compte : relie son compte à sa fiche
  errors.push(...await session(browser, { id: 'u_owner_0000000000000001', name: 'Propriétaire', email: null, avatarUrl: '', isOwner: true, canEdit: true }, MEMBERS, async page => {
    check((await footer(page)).endsWith('Propriétaire'), 'propriétaire reconnu avant de choisir sa fiche', await footer(page));
    await claim(page, 'alpha');
    check((await footer(page)).includes('Utilisateur A / Administrateur'), 'second compte relié à la même fiche');
  }));

  // 3. Opérateur : paramètres en consultation seule
  const OPERATOR = MEMBERS.map(([p, d]) => [p, p.endsWith('beta') ? { ...d, role: 'operateur' } : d]);
  errors.push(...await session(browser, { id: 'u_beta_000000000000000001', name: 'B', email: null, avatarUrl: '', isOwner: false, canEdit: true }, OPERATOR, async page => {
    await claim(page, 'beta');
    check((await footer(page)).includes('Utilisateur B / Opérateur'), 'rôle Opérateur affiché');
    await page.evaluate(() => { location.hash = 'parametres'; });
    await page.waitForTimeout(200);
    check(await page.evaluate(() => $$('[data-form^="set-"][data-path]').every(e => e.disabled) && !$$('[data-act="save-set"]').length), 'paramètres non modifiables pour un opérateur');
  }));

  // 4. Accès sans droit d'écriture
  errors.push(...await session(browser, { id: 'u_viewer_000000000000001', name: 'Lecteur', email: null, avatarUrl: '', isOwner: false, canEdit: false, canWrite: false }, MEMBERS, async page => {
    check((await footer(page)).endsWith('Lecture seule'), 'lecture seule affichée');
    check(await page.evaluate(() => document.querySelector('#tbnew').hidden), 'bouton « Nouvelle opération » masqué');
  }));

  await browser.close();
  finish(errors);
})().catch(e => { console.error(e); process.exit(1); });
