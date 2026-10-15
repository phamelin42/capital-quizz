# Capital Quizz

Un quiz de capitales en Angular, construit avec le design system [Fuda](https://github.com/phamelin42/design-system-fuda). Site : <https://capitals-quizz.phamelin.fr>. Son jumeau, [Flag Quizz](https://flag-quizz.phamelin.fr), fait deviner les pays à partir de leur drapeau.

- Le nom d'une capitale et la photo d'un lieu emblématique s'affichent (« Quel pays a pour capitale Budapest ? »), quatre pays sont proposés, un seul est le bon.
- Un sélecteur **Monde / États-Unis** change de jeu : en mode États-Unis, on devine l'état à partir de sa capitale. Changer de mode remet le score à zéro.
- Un clic valide ou non la réponse. Le score, la série en cours et le record s'affichent en haut.
- Une fois la réponse donnée apparaissent **une anecdote** sur la capitale (en bas à gauche) et **la carte Google Maps** (en bas à droite), ainsi que le nom du monument photographié. Avant, aucun de ces éléments n'est affiché.
- Les 195 pays (193 membres de l'ONU, le Vatican et la Palestine) et les 50 états sont tirés dans un ordre mélangé, sans répétition jusqu'à épuisement, puis le paquet est refait.
- Thème Jour par défaut, thème Nuit au choix du joueur. Clavier complet, WCAG 2.2 AA vérifié par axe.

## Démarrer

Node ≥ 22.22.3 est requis (Angular 22).

```bash
npm ci
npm start          # http://localhost:4200
```

| Commande                             | Rôle                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `npm test`                           | Tests unitaires (Vitest) : service du quiz, intégrité des 245 fiches, composants |
| `npm run lint` / `npm run typecheck` | ESLint / tsc                                                                     |
| `npm run build`                      | Build de production dans `dist/capital-quizz/browser`                            |
| `npm run e2e`                        | Playwright sur ce build : parcours, clavier, mouvement réduit, axe Jour/Nuit     |
| `npm run places`                     | Télécharge les photos manquantes (voir plus bas)                                 |

Pour lancer Playwright avec un Chromium déjà installé : `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/chemin/chrome npm run e2e`.

## La dépendance Fuda

Fuda n'est pas publiée sur npm (le paquet `fuda` du registre est un autre projet). `package.json` la prend sur GitHub, à une branche précise :

```json
"fuda": "git+https://github.com/phamelin42/design-system-fuda.git#claude/blissful-gates-sj2nz2"
```

Le script `prepare` de Fuda construit la bibliothèque à l'installation, ce qui rend `npm ci` plus long. **Quand cette branche de Fuda sera fusionnée, remplacer `#claude/blissful-gates-sj2nz2` par `#main`** (ou un tag), puis `npm install` pour mettre à jour `package-lock.json`.

## Les photos

Les 245 photos (une par capitale) sont dans `public/places/{world,us}/<code>.jpg`, en 800 × 600. Elles viennent de [Wikimedia Commons](https://commons.wikimedia.org), sous licence libre ; leurs auteurs et licences sont dans `public/places/credits.json` et sur la page `credits.html` du site.

`src/app/data/photo-articles.json` donne, pour chaque code, l'article Wikipédia (fr) du monument : c'est la photo principale de cet article qui est utilisée. Pour changer une photo, on change l'article et on relance :

```bash
npm run places -- world/fr us/tx    # seulement ces entrées (supprimer d'abord leur .jpg)
npm run places                      # toutes les photos manquantes
```

Le script refuse toute photo qui n'est pas en licence libre ou pas en JPEG, recadre en 4:3, régénère `credits.json` et `credits.html`, et attend quand Wikimedia demande de ralentir : on peut le relancer sans risque.

## La carte Google Maps

La carte est une iframe `https://www.google.com/maps?q=<capitale>, <pays ou état>&output=embed&hl=fr`. Cette forme ne demande aucune clé d'API mais n'est pas documentée par Google : si elle cessait de fonctionner, il faudrait passer à la [Maps Embed API](https://developers.google.com/maps/documentation/embed/get-started) avec une clé restreinte par domaine. L'iframe n'est créée qu'après la réponse, donc Google n'est contacté qu'à ce moment-là.

## Ajouter ou corriger une capitale

Les fiches sont dans `src/app/data/` : un fichier par continent, plus `us-states.ts`. Chacune a un code (ISO en minuscules, ou abréviation postale pour les états), la capitale, le nom du monument et une anecdote. Le nom du pays vient de `Intl.DisplayNames` (surcharges dans `country-name.ts`), celui de l'état de `us-state-name.ts`. `places.spec.ts` et `photos.spec.ts` vérifient que chaque fiche a une capitale, un monument, une anecdote, un article de photo et un crédit.

Quelques capitales sont ambiguës : on retient la plus citée et l'anecdote le dit (La Paz et Sucre en Bolivie, Pretoria / Le Cap / Bloemfontein en Afrique du Sud, Amsterdam / La Haye, Yamoussoukro / Abidjan, Dodoma / Dar es Salaam, Porto-Novo / Cotonou, Colombo / Sri Jayawardenepura Kotte, Jérusalem pour Israël, Ramallah pour la Palestine).

## Mise en ligne

Vercel (`vercel.json`). Le domaine `capitals-quizz.phamelin.fr` se configure dans le projet Vercel (Domains) et chez le registraire (entrée DNS) : ce n'est pas dans le dépôt.
