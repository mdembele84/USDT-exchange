// Outils communs aux tests : chemins, vérifications et bilan.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGE = 'file://' + path.join(ROOT, 'index.html');
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

let failures = 0;
function check(ok, label, detail = '') {
  if (ok) console.log('  ✓ ' + label);
  else { failures++; console.log('  ✗ ' + label + (detail ? ' (' + detail + ')' : '')); }
}
function finish(errors = []) {
  if (errors.length) { failures++; console.log('  ✗ erreurs JavaScript :\n    ' + errors.join('\n    ')); }
  console.log(failures ? `${failures} échec(s)\n` : 'Tout est bon\n');
  process.exitCode = failures ? 1 : 0;
}
const near = (a, b, eps = 0.01) => typeof a === 'number' && Math.abs(a - b) <= eps;
// Texte d'un élément sans espaces (les montants utilisent des espaces insécables).
const flat = s => String(s || '').replace(/\s+/g, '');

module.exports = { ROOT, PAGE, SHOTS, check, finish, near, flat };
