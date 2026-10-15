# Capital Quizz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un quiz « Quel pays a pour capitale X ? » (photo d'un lieu emblématique), avec un mode Monde (195 pays) et un mode États-Unis (50 états), jumeau de flag-quizz.

**Architecture:** Copie renommée de flag-quizz. `Country` devient `Place` (capitale, monument, anecdote). `QuizService` gagne un signal `mode` et deux listes injectables. Un script `npm run places` télécharge des photos libres de Wikipédia/Commons, commitées dans `public/places/`.

**Tech Stack:** Angular 22 (zoneless, signaux), Fuda, Vitest, Playwright + axe, Node ≥ 22.22.3 (ici Node 24 via le PATH).

**Spec:** `docs/superpowers/specs/2026-10-15-capital-quizz-design.md`

## Global Constraints

- Textes de l'interface, documentation, commits : français. Pied de commit : `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` et `Claude-Session: https://claude.ai/code/session_013zSN3QGyUmhTTefFQy2wqx`.
- Branche `claude/eager-archimedes-wy274m`, aucune PR.
- Question : « Quel pays a pour capitale X ? » / « Quel état a pour capitale X ? » (jamais le nom du pays avant la réponse). Noms sans article.
- Rien (anecdote, carte, nom du monument, nom du pays) ne donne la réponse avant le clic ; anecdote et carte absentes du DOM avant la réponse.
- Style : uniquement des tokens Fuda ; pas de `prefers-color-scheme`.
- Terminé = `npm run lint`, `typecheck`, `test`, `build` verts, et `e2e` (interface modifiée).
- Photos : licence libre uniquement, JPEG, `public/places/{world,us}/<code>.jpg`, crédit dans `public/places/credits.json`.
- Liens du pied de page : `https://phamelin.fr/#projects` (« Vous voulez en voir plus ? Visitez mon portfolio ») et `https://flag-quizz.phamelin.fr`. Site : `capitals-quizz.phamelin.fr`.
- User-Agent des requêtes Wikimedia : sans adresse e-mail ni donnée personnelle.

## Review Focus

- Changer de mode en pleine question répondue : réponse, paquet et compteurs remis à zéro, focus sur la première proposition (tests service + app).
- `choose()` avec un code de l'autre mode : ignoré (test service).
- Capitales à nom composé ou à apostrophe (Saint-Domingue, N'Djamena, Washington D.C.) : l'URL de la carte reste correcte (test `map-url`).
- Mode États-Unis, paquet de 50 : aucune répétition avant épuisement (test service).
- Photo ou crédit manquant pour une fiche : le test d'intégrité échoue (test `places.spec`).

---

### Task 1: Renommer le projet et vérifier la base

**Files:** Modify `package.json`, `package-lock.json` (nom), `angular.json`, `vercel.json`, `playwright.config.ts`, `src/index.html`, `README.md`, `CLAUDE.md`.

- [ ] Remplacer `flag-quizz` par `capital-quizz` (nom, chemin `dist/capital-quizz/browser`), titre HTML « Capital Quizz », description « Devine le pays à partir de sa capitale. ».
- [ ] Ajouter le script `"places": "node scripts/fetch-places.mjs"` à `package.json`.
- [ ] Run `npm run lint && npm run typecheck && npm test && npm run build` — Expected: tout passe (appli encore identique à flag-quizz).
- [ ] Commit « Renommer le projet en capital-quizz ».

### Task 2: Modèle `Place` et noms

**Files:** Create `src/app/data/place.ts`, `src/app/data/us-state-name.ts`; Modify `country-name.ts` (inchangé) ; Test `src/app/data/us-state-name.spec.ts`.

**Interfaces:** Produces `interface Place { code; capital; landmark; funFact }` (readonly strings), `usStateName(code: string): string`, `placeName(mode: Mode, code: string): string`, `type Mode = 'world' | 'us'`.

- [ ] Test : `usStateName('tx') === 'Texas'`, `'ga' → 'Géorgie'`, `'wv' → 'Virginie-Occidentale'`, 50 codes distincts.
- [ ] Implémenter la table des 50 états (noms français officiels) ; `placeName('world', code) = countryName(code)`, `placeName('us', code) = usStateName(code)`.
- [ ] Commit.

### Task 3: Données du monde (195)

**Files:** Modify `src/app/data/{europe,asia,africa,americas,oceania}.ts`, `countries.ts` ; Create `src/app/data/photo-articles.json` ; Test `src/app/data/countries.spec.ts` (réécrit en `places.spec.ts`).

**Interfaces:** Produces `WORLD: readonly Place[]` (195), `STATES: readonly Place[]` (50, Task 4), `photo-articles.json: { world: Record<string,string>; us: Record<string,string> }`.

- [ ] Réécrire le spec : 195 entrées, codes uniques `^[a-z]{2}$`, drapeau `flag-icons` inutile (retiré), `capital`/`landmark` non vides, anecdote > 20 caractères, nom de pays distinct et résolu, `photo-articles.json.world` a exactement les mêmes codes. Run : FAIL.
- [ ] Rédiger les 195 fiches continent par continent (capitale française, monument, anecdote vérifiée sur la capitale) et le JSON des articles. Run : PASS.
- [ ] Commit par groupe de continents.

### Task 4: Données des États-Unis (50)

**Files:** Create `src/app/data/us-states.ts` ; Modify `photo-articles.json` ; Test `places.spec.ts`.

- [ ] Test : 50 entrées, codes `^[a-z]{2}$` uniques, `washington dc` absent, capitales/monuments/anecdotes non vides, `photo-articles.json.us` a les mêmes codes. FAIL puis PASS après rédaction.
- [ ] Commit.

### Task 5: `QuizService` à deux modes

**Files:** Modify `src/app/quiz/quiz.service.ts`, `quiz.service.spec.ts`.

**Interfaces:** Produces `COUNTRIES`, `US_STATES` (`InjectionToken<readonly Place[]>`), `RANDOM`; `QuizService.mode: Signal<Mode>`, `setMode(mode: Mode): void`; `Question = { place: Place; options: readonly Place[] }` (champ `country` renommé `place`).

- [ ] Tests : mode initial `world` ; `setMode('us')` remet score/série/record/asked à 0, tire dans la liste des états ; `setMode` vers le mode actif sans effet ; `choose` d'un code de l'autre mode ignoré ; 50 questions d'affilée en mode `us` sans répétition ; les tests existants adaptés (`place`). FAIL.
- [ ] Implémenter : `draw()` lit la liste du mode courant ; `setMode` réinitialise paquet, `lastCode`, compteurs, réponse, puis redessine. PASS.
- [ ] Commit.

### Task 6: Carte, anecdote et question

**Files:** Rename `flag-card/` → `place-card/` (`PlaceCard`, `app-place-card`), Modify `fun-fact/`, `map-panel/` (+ `map-url.ts`, `map-url.spec.ts`) ; Create `src/app/place-card/photo-src.ts`.

**Interfaces:** Consumes `Place`, `Mode`, `placeName`. Produces `PlaceCard` inputs `place: Place`, `mode: Mode`, `revealed: boolean` ; `mapUrl(capital: string, region: string): string` → `https://www.google.com/maps?q=<capital>, <region>&output=embed&hl=fr` ; `photoSrc(mode, code): string` → `places/<world|us>/<code>.jpg`.

- [ ] Tests `map-url` : « Saint-Domingue, République dominicaine » et « N'Djamena, Tchad » encodés ; `q` contient la capitale et la région. `photoSrc('us','tx') === 'places/us/tx.jpg'`.
- [ ] `PlaceCard` : titre (`slot="title"`) « Quel pays a pour capitale » / « Quel état a pour capitale » en `<h2>` visible, capitale en grand (classe `app-capital`), `<img class="app-photo">` avec `alt` « Lieu à deviner » avant, « <monument>, <capitale> » après. `FunFact` et `MapPanel` prennent `place` et `mode`.
- [ ] Style : tokens Fuda, ratio 4/3, `object-fit: cover`.
- [ ] Commit.

### Task 7: Sélecteur de mode, options, pied de page, assemblage

**Files:** Create `src/app/mode-switch/` (`ModeSwitch`, `app-mode-switch`), `src/app/site-footer/` (`SiteFooter`, `app-site-footer`) ; Modify `answer-options/`, `app.html`, `app.ts`, `app.scss`, `app.spec.ts`.

**Interfaces:** Consumes `QuizService.setMode/mode`. `ModeSwitch` : deux boutons Fuda `aria-pressed` « Monde » / « États-Unis » dans un `role="group"` « Mode de jeu » ; le bouton actif est `primary`, l'autre `secondary`.

- [ ] Tests app : titre « Capital Quizz » ; question « Quel pays a pour capitale … » ; propositions = noms de pays ; passage en États-Unis : « Quel état a pour capitale », propositions = noms d'états, score à 0, focus sur la première proposition ; photo `alt` « Lieu à deviner » puis monument ; bouton « Capitale suivante » ; `aria-label` du groupe d'options selon le mode ; pied de page : deux liens avec `href` exacts + « Vous voulez en voir plus ? Visitez mon » ; texte du verdict « La bonne réponse était : Hongrie ».
- [ ] Implémenter ; le pied de page contient aussi le lien « Crédits photo » vers `credits.html`.
- [ ] Run `npm test` — PASS ; commit.

### Task 8: Script de photos, récupération et crédits

**Files:** Create `scripts/fetch-places.mjs`, `public/places/credits.json`, `public/places/{world,us}/*.jpg`, `public/credits.html` ; Test `src/app/data/photos.spec.ts`.

**Interfaces:** Consumes `photo-articles.json`. Produces `credits.json: Record<'world/<code>'|'us/<code>', { title, author, license, licenseUrl, source }>`.

- [ ] Test `photos.spec.ts` : pour chaque fiche des deux modes, `public/places/<mode>/<code>.jpg` existe (> 5 Ko) et `credits.json` a une entrée avec `license` libre (`CC BY`, `CC BY-SA`, `CC0`, `Public domain`, `PD…`). FAIL (aucune photo).
- [ ] Script : pour chaque entrée absente, `GET https://fr.wikipedia.org/api/rest_v1/page/summary/<article>` (champ `originalimage`/`thumbnail`), lecture licence/auteur par l'API Commons (`extmetadata`), refus des licences non libres et des non-JPEG, téléchargement d'une miniature 800 px, écriture du fichier, du crédit et de `credits.html`. Pause ≥ 1 s entre requêtes, reprise avec attente croissante sur 429/5xx, arrêt propre et relançable.
- [ ] Lancer `npm run places` jusqu'à complétion ; changer d'article dans `photo-articles.json` pour les échecs. PASS du test.
- [ ] Commit (photos par lots).

### Task 9: e2e, a11y, documentation

**Files:** Modify `e2e/helpers.ts`, `e2e/quiz.spec.ts`, `e2e/a11y.spec.ts`, `README.md`, `CLAUDE.md`.

- [ ] Adapter les helpers (`currentCode` lit `places/(world|us)/xx.jpg` ; `nameOf` selon le mode) et les parcours : bonne/mauvaise réponse, suivant, une seule réponse, clavier (premier Tab : thème, puis mode, puis propositions), mouvement réduit, thème, mobile 360 px, favicon ; nouveaux : bascule en États-Unis, liens du pied de page, `credits.html` répond.
- [ ] axe Jour/Nuit en mode Monde et États-Unis, avant et après réponse.
- [ ] README et CLAUDE.md adaptés (structure, règles, domaine, script de photos).
- [ ] Run `npm run lint && npm run typecheck && npm test && npm run build && npm run e2e` — tout vert ; commit ; `git push -u origin claude/eager-archimedes-wy274m`.
