# Change USDT

Application de suivi des opérations de change USDT : marges, commissions, étapes à valider et fonds clients reçus sur les comptes SBI. L'interface est en français.

## Flux gérés

| Flux | Principe |
|---|---|
| USDT → AED (Nous) | Nous envoie des USDT ; on lui remet des AED à Dubaï au taux marché moins le spread, puis on revend les USDT au marché. |
| Ventes USDT (Doudou) | Le client paie en XAF (compte SBI, USDT rachetés chez KA) ou en GNF (compte de Nous). Doudou touche une commission négociée. |
| Congo → Dubaï (Zoer) | Le client du Congo vire des XAF ; on achète des USDT chez KA et on les envoie à Dubaï. |
| Mali → Dubaï | XOF encaissés au Mali, AED remis à Dubaï, XOF vendus contre XAF avec Me, USDT achetés chez KA puis reconvertis en AED. |
| USDT → devise locale | Le client envoie des USDT et reçoit de la devise locale (par défaut des leones, SLE) ; un partenaire local (Nouhoum, Sierra Leone) achète les USDT et dépose la devise chez le client. |

## Fonctionnalités

- **Tableau de bord** : marge nette, volume, commissions à verser, fonds reçus sur SBI, graphique par flux, état des corridors, économie unitaire.
- **Simulateur** : marge, chaîne d'opérations, compte de résultat, sensibilité au taux et point mort, avant d'engager une opération.
- **Opérations** : journal par flux, étapes à cocher, détail, modification, duplication.
- **Partenaires** : volumes et commissions par contrepartie.
- **Fonds SBI** : relevé des virements clients reçus sur SBI, rapprochement et export CSV.
- **Utilisateurs** : fiches (nom, adresse, rôle Administrateur ou Opérateur) ; chaque saisie porte le nom de son auteur.
- **Paramètres** : taux du jour, marges, règles de commission, corridors, partenaires, paiement en devise locale.

## Où sont les données

L'application est conçue pour être publiée comme artefact sur claude.ai. Les opérations, paramètres et fiches utilisateurs sont alors enregistrés dans la base partagée de l'artefact (capacités `db`, `user` et `downloads`), visible seulement des personnes invitées comme Contributeur ou Éditeur.

Ouverte ailleurs (fichier local, GitHub Pages…), elle fonctionne en **mode démo** : tout s'utilise, mais rien n'est enregistré et les saisies disparaissent au rechargement.

## Structure

| Chemin | Contenu |
|---|---|
| `index.html` | Page complète, à ouvrir dans un navigateur. |
| `dist/artifact.html` | Même page, au format publié sur claude.ai. |
| `src/app.html` | Source : HTML, CSS et JavaScript, sans dépendance. |
| `src/icons.js` | Icônes intégrées (Lucide). |
| `scripts/build.mjs` | Assemble `index.html` et `dist/artifact.html`. |
| `tests/` | Tests Playwright : mode démo, mode connecté simulé, flux en devise locale, mise en page. |

## Développement

Prérequis : Node.js 18 ou plus récent.

```bash
npm install
npx playwright install chromium
```

Après une modification de `src/app.html` :

```bash
npm run build
npm test
```

Republiez ensuite `dist/artifact.html` sur l'artefact claude.ai. Les captures d'écran des tests sont écrites dans `tests/shots/`.

Pour ajouter une icône, copiez le contenu du fichier SVG correspondant du paquet `lucide-static` (version 0.468.0) dans `src/icons.js`.

## Licences

Icônes [Lucide](https://lucide.dev), licence ISC : voir `LICENSES/lucide.txt`. Police DM Sans chargée depuis Google Fonts.
