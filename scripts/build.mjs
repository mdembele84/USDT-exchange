// Assemble l'application à partir de src/app.html et src/icons.js :
// - dist/artifact.html : la page telle qu'elle est publiée comme artefact claude.ai ;
// - index.html : la même page en document HTML complet, à ouvrir dans un navigateur.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/app.html'), 'utf8');
const icons = readFileSync(join(root, 'src/icons.js'), 'utf8').trim();

const MARK = '/*__ICONS__*/';
if (!src.includes(MARK)) throw new Error(`Marqueur ${MARK} introuvable dans src/app.html`);
const page = src.replace(MARK, () => icons);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/artifact.html'), page);

// Le titre, les polices et les styles vont dans <head> ; le reste de la page dans <body>.
const cut = page.indexOf('</style>') + '</style>'.length;
const reset = ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
  + 'body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}';
const doc = '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
  + '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  + `<style>${reset}</style>\n${page.slice(0, cut)}\n</head>\n<body>\n${page.slice(cut).trim()}\n</body>\n</html>\n`;
writeFileSync(join(root, 'index.html'), doc);

console.log('Généré : index.html et dist/artifact.html');
