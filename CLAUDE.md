# Flag Quizz

Quiz de drapeaux en Angular 22, construit avec la bibliothèque **Fuda** (`design-system-fuda`). Textes de l'interface, documentation et messages de commit en français.

## Commandes

Node ≥ 22.22.3 (exigé par Angular 22).

| Commande                             | Rôle                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `npm start`                          | Serveur de développement                                                     |
| `npm test`                           | Tests unitaires (Vitest via `ng test`)                                       |
| `npm run lint` / `npm run typecheck` | ESLint (angular-eslint) / tsc sur l'appli et les specs                       |
| `npm run build`                      | Build de production (`dist/flag-quizz/browser`)                              |
| `npm run e2e`                        | Playwright sur ce build : parcours, clavier, mouvement réduit, axe Jour/Nuit |

Une tâche est terminée quand `lint`, `typecheck`, `test` et `build` sont verts, et `e2e` si l'interface, le clavier ou le focus changent.

## Structure

- `src/app/data/` : une fiche par pays (`code`, `funFact`), un fichier par continent, assemblées dans `countries.ts`. Le nom français vient de `Intl.DisplayNames` (`country-name.ts`). Les drapeaux sont les SVG de `flag-icons`, copiés dans `flags/4x3/` par `angular.json`.
- `src/app/quiz/quiz.service.ts` : tout l'état de la partie (question, réponse, score, série) en signaux. `COUNTRIES` et `RANDOM` sont des jetons d'injection, remplacés dans les tests pour des tirages reproductibles.
- Un dossier par composant (`flag-card`, `answer-options`, `fun-fact`, `map-panel`) avec `.ts`, `.html`, `.scss`. `app` assemble la page.
- `e2e/` : Playwright. Google n'est jamais contacté pendant les tests (l'iframe reçoit une page vide).

## Règles du jeu à ne pas casser

- **Rien ne donne la réponse avant le clic** : anecdote, carte, nom dans le texte alternatif du drapeau. L'anecdote et la carte n'existent pas dans le DOM avant la réponse (`@if (quiz.isAnswered())` dans `app.html`), pas même sous forme d'encart vide.
- Une question ne se répond qu'une fois (`QuizService.choose` ignore le second clic).
- Le verdict n'a pas d'encart. La bonne réponse passe en bouton `success` (vert) avec une coche, le mauvais choix en `danger` avec une croix, et un texte masqué (`fd-sr`, `aria-live`) l'annonce : il ne repose jamais sur la couleur seule.
- « Drapeau suivant » est un bouton secondaire (le style par défaut de Fuda), pas `primary`.
- Après une réponse, le focus va sur « Drapeau suivant » ; après « suivant », sur la première proposition.
- L'URL de la carte est construite uniquement depuis `countryName(code)`, jamais depuis une saisie : c'est ce qui justifie `bypassSecurityTrustResourceUrl` dans `map-panel.ts`.
- Les noms de pays n'ont pas d'article (« Japon », pas « le Japon ») : les phrases sont tournées en conséquence (« La bonne réponse était : Japon »).

## Conventions Angular

Les mêmes que Fuda. Composants standalone, `OnPush` et zoneless par défaut (on ne les répète pas), aucun NgModule. Signaux partout (`input()`, `computed()`, `viewChild()`), pas de `@Input`/`@Output`. Contrôle de flux natif. `host: {}`, pas de `@HostBinding`. `inject()` plutôt que le constructeur. Sélecteurs préfixés `app`. Template et styles dans des fichiers séparés (`templateUrl`, `styleUrl`), `ViewEncapsulation.None`, classes `app-*`.

- Un contenu projeté ne se met pas dans un `@if` à plusieurs nœuds racines (NG8011) : on garde les emplacements `slot=…` en dehors des `@if` et on varie le texte avec une expression.
- `viewChild('x')` sur un `button[fdButton]` donne le composant `FdButton`, pas l'élément : lire avec `{ read: ElementRef }`.
- Les boutons Fuda en `aria-disabled="true"` sont grisés par Fuda ; on les utilise pour les propositions écartées plutôt que `disabled`, qui retirerait le focus. Playwright n'attend pas un élément `aria-disabled` : `click({ force: true })` dans les tests.
- Les surcharges de style d'un composant Fuda doivent être plus spécifiques que lui (`.app-answer-options .app-option`), car l'ordre d'insertion des feuilles dépend du premier rendu.

## Obligatoire sur tout site

- **Une icône d'onglet** (`favicon`) : `public/favicon.svg` (aux couleurs de Fuda), `public/favicon.ico` (16, 32 et 48 px) et `public/apple-touch-icon.png` (180 px), déclarés dans `src/index.html`. Un site sans icône d'onglet n'est pas terminé : l'icône par défaut d'Angular n'est pas acceptable. `e2e/quiz.spec.ts` vérifie que les fichiers répondent.

## Style

Uniquement des custom properties issues des tokens Fuda (couleur, espacement, rayon, police), aucune valeur en dur. Thème Jour par défaut, Nuit par `data-theme="dark"` posé par `FdThemeService` sur choix du joueur ; jamais de `prefers-color-scheme`. Mouvement : celui de Fuda, `prefers-reduced-motion` respecté.

## Dépendance Fuda

Voir `README.md` : installée depuis git (`prepare` construit la lib). La branche visée est dans `package.json` ; la repointer sur `main` quand elle sera fusionnée. Si une icône, une variante ou un composant manque, on l'ajoute dans Fuda, pas ici : le bouton `success` (vert) et le token `tokiwa-press` viennent de là.

## Contenu

Les anecdotes sont rédigées à la main. Les vérifier avant d'en ajouter : un fait douteux ne vaut rien. `countries.spec.ts` impose 195 pays, des codes uniques, un drapeau, un nom et une anecdote pour chacun.
