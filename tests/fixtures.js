// Opérations d'exemple, générées dans la page (mode démo) pour les tests d'affichage.
// Le code est exécuté tel quel par page.evaluate et renvoie le nombre d'opérations créées.
const SEED = `
(() => {
  const today = todayISO(), ops = [];
  let seed = 7; const R = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const pick = (a, b) => a + R() * (b - a);
  const mk = (type, daysAgo, inputs, client, stepsDone, extra = {}) => {
    const date = addDays(today, -daysAgo), steps = {}, stepsAt = {};
    FLUX[type].steps(inputs).slice(0, stepsDone).forEach(s => { steps[s.k] = true; stepsAt[s.k] = new Date(Date.now() - daysAgo * 864e5).toISOString(); });
    const now = new Date(Date.now() - daysAgo * 864e5).toISOString();
    ops.push({ id: newId() + ops.length, type, date, ref: makeRef(type, date), client, note: '', inputs, steps, stepsAt, reconciled: !!extra.reconciled, createdBy: null, createdAt: now, updatedBy: null, updatedAt: now });
  };
  const clientsX = ['Client XAF 1', 'Client XAF 2', 'Client XAF 3', 'Client XAF 4', 'Client XAF 5', 'Client XAF 6'];
  for (let i = 0; i < 9; i++) { const rM = round(pick(3.663, 3.6725), 4); mk('nous', Math.floor(pick(0, 58)), { usdt: Math.round(pick(8000, 26000)), rateMarket: rM, rateClient: round(rM - 0.005, 4), fees: 1 }, 'Client AED ' + (i + 1), i < 6 ? 3 : 1); }
  for (let i = 0; i < 7; i++) { const c = Math.round(pick(609, 614)); mk('doudou', Math.floor(pick(0, 58)), { currency: 'XAF', usdt: Math.round(pick(2000, 6500)), rateCost: c, rateClient: c + (i % 3 === 0 ? 2 : 3), apporteur: 'doudou', commissionRate: i % 3 === 0 ? 0 : 1, receipt: 'SBI', bankRef: i % 4 === 0 ? '' : 'VIR-' + (1040 + i), fees: 0 }, clientsX[i % clientsX.length], i < 4 ? 4 : 2, { reconciled: i < 3 }); }
  for (let i = 0; i < 4; i++) { const c = Math.round(pick(8650, 8760)); mk('doudou', Math.floor(pick(0, 50)), { currency: 'GNF', usdt: Math.round(pick(1000, 3000)), rateCost: c, rateClient: c + 100, apporteur: 'doudou', commissionRate: 0, receipt: 'Nous', fees: 0 }, 'Client GNF ' + (i + 1), i < 2 ? 2 : 1); }
  for (let i = 0; i < 4; i++) { const c = Math.round(pick(610, 613)); mk('congo', Math.floor(pick(2, 55)), { usdt: Math.round(pick(15000, 42000)), rateCost: c, rateClient: c + 3, apporteur: 'zoer', commissionRate: 0, receipt: 'SBI', bankRef: 'BQ-' + (220 + i), fees: 2 }, 'Client Congo ' + (i + 1), i < 3 ? 3 : 1, { reconciled: i === 0 }); }
  for (let i = 0; i < 6; i++) { mk('mali', Math.floor(pick(0, 45)), { aed: Math.round(pick(60000, 150000)), rateXofAed: round(pick(167.5, 171), 2), rateXofXaf: 1, rateKa: Math.round(pick(609, 614)), rateAed: 3.665, fees: 2 }, 'Client Mali ' + (i + 1), i < 3 ? 5 : 2); }
  for (let i = 0; i < 3; i++) { mk('local', Math.floor(pick(0, 40)), { currency: 'SLE', country: 'Sierra Leone', partner: 'Nouhoum', base: '100', usdt: Math.round(pick(20000, 60000)), rateProvider: 2404, rateClient: 2310, fees: 1 }, 'Client SLE ' + (i + 1), i < 2 ? 3 : 1); }
  S.ops = ops; onData();
  return ops.length;
})()`;

module.exports = { SEED, SEED_COUNT: 33 };
