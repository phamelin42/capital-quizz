# Capital Quizz : conception

Date : 2026-10-15. Site : https://capitals-quizz.phamelin.fr

## But

Un quiz de capitales, jumeau de [flag-quizz](https://github.com/phamelin42/flag-quizz) : même pile (Angular 22, Fuda), mêmes règles de jeu, même exigence d'accessibilité. Au lieu d'un drapeau, la carte de question montre **le nom d'une capitale et la photo d'un lieu emblématique** de cette ville ; le joueur trouve le pays parmi 4 propositions. Une option permet de jouer avec **les 50 états des États-Unis** (capitale d'un état, 4 états proposés).

Réussite : le jeu se joue en entier au clavier, dans les deux modes, sans qu'aucun élément n'annonce la réponse avant le clic ; `lint`, `typecheck`, `test`, `build` et `e2e` sont verts ; chaque photo est sous licence libre et créditée.

## Révision : le joueur tape la capitale (2026-10-15, validée avant l'implémentation)

Cette section remplace ce qui suit sur le déroulé d'une question (propositions à 4 choix, question « Quel pays a pour capitale X ? »).

- **Question** : « Quelle est la capitale de la Hongrie ? » (« … de l'Alabama ? » en mode États-Unis), au-dessus de la photo d'un lieu emblématique de la capitale. Le complément est écrit à la main, avec l'article (`place-of.ts`).
- **Réponse** : un champ texte, un bouton « Valider » (ou Entrée) et un bouton « Je ne sais pas » qui révèle la réponse et compte comme une erreur. Plus de propositions.
- **Comparaison** : on ne compare pas strictement. On ignore la casse, les accents, les tirets, les espaces, les apostrophes et l'article initial (« Havane » pour « La Havane »), on développe « St » en « Saint », et on pardonne **une faute de frappe** pour les noms de 7 lettres ou plus (insertion, oubli, remplacement ou échange de deux lettres voisines). Sous 7 lettres, seule la saisie exacte (aux accents et à la casse près) passe.
- **Variantes** (`answer-aliases.ts`) : noms anglais et orthographes courantes (Kyiv, Pékin / Beijing, Washington…), et toutes les villes qui se disputent le titre de capitale (La Paz ou Sucre ; Pretoria, Le Cap ou Bloemfontein ; Yamoussoukro ou Abidjan ; Dodoma ou Dar es Salaam ; Porto-Novo ou Cotonou ; Gitega ou Bujumbura ; Mbabane ou Lobamba ; Colombo ou Kotte ; Ramallah ou Jérusalem pour la Palestine).
- **Verdict** : une ligne avec icône et texte, annoncée (`aria-live`), jamais la couleur seule : « ✓ Bonne réponse : Budapest. » ou « ✗ Mauvaise réponse. La bonne réponse était : Budapest. » (« Tu as passé. » après « Je ne sais pas »). Le champ se verrouille.
- **Secret avant la réponse** : la photo montre la capitale (c'est voulu), mais ni son nom, ni celui du monument, ni l'anecdote, ni la carte n'apparaissent avant la réponse ; le texte alternatif de la photo est « Photo de la capitale ».
- **Focus** : après la réponse, sur « Capitale suivante » ; après « suivant » ou un changement de mode, dans le champ.

## Ce qui ne change pas par rapport à flag-quizz

Tout le CLAUDE.md de flag-quizz s'applique (il est repris tel quel, adapté au sujet) : composants standalone OnPush, signaux, Fuda uniquement par tokens, thèmes Jour/Nuit, favicon obligatoire, bouton `success` / `danger` avec coche / croix, focus après réponse sur « suivant » puis sur la première proposition, une seule réponse par question, carte et anecdote absentes du DOM avant la réponse, noms sans article.

Le projet est une copie de flag-quizz renommée `capital-quizz`, puis modifiée comme ci-dessous.

## Données

`src/app/data/` : un fichier par continent (`europe`, `asia`, `africa`, `americas`, `oceania`) plus `us-states.ts`, assemblés dans `countries.ts` (monde, 195 entrées) et `us-states.ts` (50 entrées).

```ts
interface Place {
  /** ISO 3166-1 alpha-2 minuscules (monde) ou code postal à 2 lettres minuscules (états). Identifie aussi la photo : `places/<world|us>/<code>.jpg`. */
  readonly code: string;
  /** Nom français de la capitale. */
  readonly capital: string;
  /** Nom français du monument, révélé après la réponse. */
  readonly landmark: string;
  /** Anecdote sur la capitale, rédigée à la main. */
  readonly funFact: string;
}
```

- `photo-articles.json` (`{ "world": { "fr": "Tour_Eiffel", … }, "us": { "tx": "…", … } }`) donne, pour chaque code, le titre de l'article Wikipédia (fr) du monument d'où vient la photo. Il n'est lu que par le script de photos et par les tests, pas par l'appli.
- Nom du pays : `Intl.DisplayNames` (`country-name.ts`, avec surcharges Vatican/Palestine). Nom de l'état : table française écrite à la main (`us-state-name.ts`) ; le test impose 50 noms.
- Capitales ambiguës (Bolivie, Afrique du Sud, Pays-Bas, Israël/Palestine, Côte d'Ivoire, Sri Lanka, Tanzanie, Bénin, Eswatini, Malaisie…) : on retient la capitale la plus couramment citée, sans article ; pour les capitales multiples, la fiche dit l'autre ville dans l'anecdote.
- Washington D.C. n'est pas un état : absent du mode États-Unis. Il est la capitale du pays `us` dans le mode monde.

## Moteur de jeu

`QuizService` garde son contrat (`question`, `answer`, `score`, `streak`, `bestStreak`, `asked`, `isAnswered`, `isCorrect`, `choose`, `next`) et gagne :

- `mode = signal<'world' | 'us'>('world')` et `setMode(mode)` ;
- jetons `COUNTRIES` (monde) et `US_STATES` (états), remplaçables dans les tests, ainsi que `RANDOM` ;
- changer de mode remet à zéro score, série, record, nombre de questions et paquet, puis tire une question du nouveau mode ; sans effet si le mode est déjà actif ;
- `Question` devient `{ place: Place; options: readonly Place[] }` : l'option juste et les 3 fausses viennent de la même liste, la bonne une seule fois.

Rien n'est persisté entre deux visites.

## Interface

- `place-card` (remplace `flag-card`) : le titre est une question sans le nom du pays : **« Quel pays a pour capitale Budapest ? »** (« Quel état a pour capitale Austin ? » en mode États-Unis), le nom de la capitale en grand, puis la photo. `alt` de la photo : « Lieu à deviner » avant la réponse ; après, le nom du monument et de la capitale.
- `mode-switch` : sélecteur « Monde / États-Unis » dans l'en-tête, à côté du thème. On utilise le composant Fuda qui convient s'il existe ; sinon deux boutons Fuda avec `aria-pressed` (écart signalé). Au changement, le focus va sur la première proposition.
- `answer-options` : les propositions affichent le nom du pays ou de l'état ; `aria-label` du groupe : « Choisis le pays de cette capitale » / « Choisis l'état de cette capitale » ; le bouton suivant dit « Capitale suivante ». Le texte masqué du verdict donne la bonne réponse : « La bonne réponse était : Hongrie ».
- `fun-fact` : anecdote sur la capitale, après la réponse seulement.
- `map-panel` : iframe Google Maps centrée sur la capitale, `q=<capitale>, <pays ou état>`, construite uniquement à partir de nos données (donc `bypassSecurityTrustResourceUrl` reste justifié), après la réponse seulement.
- Pied de page : « Vous voulez en voir plus ? Visitez mon [portfolio](https://phamelin.fr/#projects) », puis un lien vers le [Flag Quizz](https://flag-quizz.phamelin.fr), et la mention des crédits photo (lien vers `credits.html`).

## Photos

- `scripts/fetch-places.mjs` (`npm run places`) : pour chaque entrée de `photo-articles.json`, résout l'image principale de l'article `fr.wikipedia.org` via l'API REST, lit auteur et licence sur Commons, **refuse tout fichier qui n'est pas en licence libre**, télécharge une miniature JPEG de ~800 px de large (un fichier qui n'est pas un JPEG est refusé : on change d'article), l'écrit dans `public/places/{world,us}/<code>.jpg`, met à jour `public/places/credits.json` et régénère `public/credits.html`, la page des crédits. Lent, relançable (saute ce qui existe), poli envers Wikimedia (pause entre requêtes, reprise sur 429, User-Agent sans donnée personnelle).
- Les photos sont commitées. Le build n'a besoin d'aucun réseau.
- Un test vérifie que chaque fiche a sa photo et son crédit ; la page affiche les crédits.
- Si la récupération échoue pour une entrée, on change d'article dans le manifeste, on ne contourne pas la règle de licence.

## Mise en ligne

`capitals-quizz.phamelin.fr` (Vercel, `vercel.json` repris). Le domaine et le DNS se configurent côté Vercel et chez le registraire : hors dépôt.

## Tests

- `places.spec.ts` : 195 pays et 50 états, codes uniques, capitale, monument, article, anecdote non vides, nom de pays ou d'état résolu, photo et crédit présents.
- `quiz.service.spec.ts` : repris, plus les modes (liste utilisée, remise à zéro au changement, changement vers le même mode sans effet).
- Composants : `place-card` (pas de nom de pays dans le DOM avant réponse), `mode-switch`, pied de page.
- e2e : parcours dans les deux modes, clavier, mouvement réduit, axe Jour/Nuit, favicon, liens du pied de page, Google jamais contacté.

## Hors périmètre

Sauvegarde du score, classement, mode « pays donné, trouver la capitale », autres territoires que les 50 états.
