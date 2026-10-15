# Flag Quizz

Un quiz de drapeaux en Angular, construit avec le design system [Fuda](https://github.com/phamelin42/design-system-fuda).

- Un drapeau s'affiche, quatre pays sont proposés, un seul est le bon.
- Un clic valide ou non la réponse. Le score, la série en cours et le record s'affichent en haut.
- Une fois la réponse donnée apparaissent **une anecdote** sur le drapeau (en bas à gauche) et **la carte Google Maps** du pays (en bas à droite). Avant, aucun de ces encarts n'est affiché.
- Les 195 pays (193 membres de l'ONU, le Vatican et la Palestine) sont tirés dans un ordre mélangé, sans répétition jusqu'à épuisement, puis le paquet est refait.
- Thème Jour par défaut, thème Nuit au choix du joueur. Clavier complet, WCAG 2.2 AA vérifié par axe.

## Démarrer

Node ≥ 22.22.3 est requis (Angular 22).

```bash
npm ci
npm start          # http://localhost:4200
```

| Commande                             | Rôle                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `npm test`                           | Tests unitaires (Vitest) : service du quiz, intégrité des 195 fiches, composants |
| `npm run lint` / `npm run typecheck` | ESLint / tsc                                                                     |
| `npm run build`                      | Build de production dans `dist/flag-quizz/browser`                               |
| `npm run e2e`                        | Playwright sur ce build : parcours, clavier, mouvement réduit, axe Jour/Nuit     |

Pour lancer Playwright avec un Chromium déjà installé : `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/chemin/chrome npm run e2e`.

## La dépendance Fuda

Fuda n'est pas publiée sur npm (le paquet `fuda` du registre est un autre projet). `package.json` la prend sur GitHub, à une branche précise :

```json
"fuda": "git+https://github.com/phamelin42/design-system-fuda.git#claude/blissful-gates-sj2nz2"
```

Le script `prepare` de Fuda construit la bibliothèque à l'installation, ce qui rend `npm ci` plus long. **Quand cette branche de Fuda sera fusionnée, remplacer `#claude/blissful-gates-sj2nz2` par `#main`** (ou un tag), puis `npm install` pour mettre à jour `package-lock.json`.

## La carte Google Maps

La carte est une iframe `https://www.google.com/maps?q=<pays>&output=embed&hl=fr`. Cette forme ne demande aucune clé d'API mais n'est pas documentée par Google : si elle cessait de fonctionner, il faudrait passer à la [Maps Embed API](https://developers.google.com/maps/documentation/embed/get-started) avec une clé restreinte par domaine. L'iframe n'est créée qu'après la réponse, donc Google n'est contacté qu'à ce moment-là.

## Ajouter ou corriger un pays

Les fiches sont dans `src/app/data/` (un fichier par continent) : code ISO en minuscules et anecdote. Le nom français vient de `Intl.DisplayNames` (surcharges dans `country-name.ts`). Les drapeaux viennent de [flag-icons](https://github.com/lipis/flag-icons) (`flags/4x3/<code>.svg`). `countries.spec.ts` vérifie que chaque fiche a un drapeau, un nom et une anecdote.
