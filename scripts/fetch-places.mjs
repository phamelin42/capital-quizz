#!/usr/bin/env node
/**
 * Récupère les photos des lieux emblématiques depuis Wikipédia / Wikimedia Commons.
 *
 *   npm run places                      toutes les photos manquantes
 *   npm run places -- world/fr us/tx    seulement celles-ci
 *
 * Pour chaque entrée de `src/app/data/photo-articles.json` :
 *   1. image principale de l'article fr.wikipedia.org (valeur `Titre_de_l'article`) ou en.wikipedia.org (valeur
 *      `en:Titre_de_l'article`), ou, quand on ne connaît pas
 *      le titre exact, premier résultat d'une recherche qui donne une photo libre (valeur `search:<requête>`,
 *      ou `search-en:<requête>` pour en.wikipedia.org), ou premier résultat libre d'une recherche de fichiers
 *      directement sur Commons (valeur `commons:<requête>`), ou un fichier précis de Commons (valeur `file:Nom.jpg`) ;
 *   2. licence et auteur sur Commons (seules les licences libres sont acceptées, en JPEG) ;
 *   3. miniature recadrée en 4:3 (800 × 600, sur la zone la plus marquante) écrite dans `public/places/<mode>/<code>.jpg` ;
 *   4. crédit ajouté à `public/places/credits.json`, puis `public/credits.html` régénérée.
 *
 * Le script se relance sans risque : il saute ce qui existe déjà. Il respecte les limites de Wikimedia
 * (requêtes par lots, une à la fois, attente du délai demandé sur un 429). Aucune donnée personnelle
 * n'est envoyée : le User-Agent ne contient que le nom du projet et son site.
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARTICLES = join(ROOT, 'src/app/data/photo-articles.json');
const PLACES = join(ROOT, 'public/places');
const CREDITS_JSON = join(PLACES, 'credits.json');
const CREDITS_HTML = join(ROOT, 'public/credits.html');

const USER_AGENT =
  'capital-quizz-photos/1.0 (https://capitals-quizz.phamelin.fr; script de récupération des photos)';
/** Largeur demandée à Commons : assez large pour recadrer en 4:3 sans perdre en netteté. */
const THUMB_WIDTH = 1280;
const PHOTO = { width: 800, height: 600 };
const BATCH = 40;
const MIN_BYTES = 5_000;
const PAUSE_MS = 1500;
const MAX_ATTEMPTS = 12;

/** Licences libres acceptées (la mention courte de Commons commence par l'une d'elles). */
const FREE = /^(CC BY(-SA)?\b|CC0\b|Public domain\b|PD[ -]|PDM\b)/i;
const NOT_FREE = /\b(NC|ND)\b/i;
/** Noms de fichiers à écarter dans une recherche : drapeaux, logos, cartes… ne montrent pas le lieu. */
const NOT_A_PHOTO =
  /flag|drapeau|logo|coat[ _]of|blason|armoiries|emblem|seal|map|carte|locator|location|icon|symbol|diagram|plan[ _]|panorama_map/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (...args) => console.log(new Date().toISOString().slice(11, 19), ...args);

/** GET avec nouvelles tentatives : attend le `Retry-After` sur un 429 ou une erreur serveur. */
async function get(url, { json = false } = {}) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response;
    try {
      response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT },
      });
    } catch (error) {
      log(
        `réseau (${error.cause?.code ?? error.message}), nouvelle tentative ${attempt}/${MAX_ATTEMPTS}`,
      );
      await sleep(5000 * attempt);
      continue;
    }
    if (response.ok) {
      await sleep(PAUSE_MS);
      return json ? response.json() : Buffer.from(await response.arrayBuffer());
    }
    if (response.status === 429 || response.status >= 500) {
      const asked = Number(response.headers.get('retry-after'));
      const wait = (Number.isFinite(asked) && asked > 0 ? asked : 5 * attempt) * 1000 + 1000;
      log(
        `${response.status} sur ${new URL(url).host}, attente de ${Math.round(wait / 1000)} s (${attempt}/${MAX_ATTEMPTS})`,
      );
      await sleep(wait);
      continue;
    }
    throw new Error(`${response.status} ${response.statusText} : ${url}`);
  }
  throw new Error(`Abandon après ${MAX_ATTEMPTS} tentatives : ${url}`);
}

const api = (host, params) =>
  get(
    `https://${host}/w/api.php?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`,
    { json: true },
  );

const chunks = (items, size) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, (i + 1) * size),
  );

const stripHtml = (html) =>
  String(html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, '’')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

async function exists(path) {
  try {
    return (await stat(path)).size > MIN_BYTES;
  } catch {
    return false;
  }
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

const label = (article) => decodeURIComponent(article).replace(/_/g, ' ');
const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Image principale de chaque article : { titre demandé → nom du fichier Commons }. */
async function leadImages(host, titles) {
  const found = new Map();
  for (const batch of chunks(titles, BATCH)) {
    const data = await api(host, {
      action: 'query',
      prop: 'pageimages',
      piprop: 'name',
      redirects: '1',
      titles: batch.map((t) => t.replace(/_/g, ' ')).join('|'),
    });
    const alias = new Map();
    for (const { from, to } of [...(data.query.normalized ?? []), ...(data.query.redirects ?? [])])
      alias.set(from, to);
    const resolve = (title) => {
      let current = title.replace(/_/g, ' ');
      for (let i = 0; i < 4 && alias.has(current); i++) current = alias.get(current);
      return current;
    };
    const byTitle = new Map(data.query.pages.map((page) => [page.title, page]));
    for (const title of batch) {
      const page = byTitle.get(resolve(title));
      if (page?.pageimage) found.set(title, { file: page.pageimage });
      else
        found.set(title, {
          reason:
            page && !page.missing ? 'l’article n’a pas d’image principale' : 'article introuvable',
        });
    }
  }
  return found;
}

/** Licence, auteur et miniature de chaque fichier Commons : { nom de fichier → infos }. */
async function fileInfos(names) {
  const infos = new Map();
  for (const batch of chunks([...new Set(names)], BATCH)) {
    const data = await api('commons.wikimedia.org', {
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      iiurlwidth: String(THUMB_WIDTH),
      titles: batch.map((n) => `File:${n.replace(/_/g, ' ')}`).join('|'),
    });
    for (const page of data.query.pages) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      const meta = info.extmetadata ?? {};
      infos.set(page.title.replace(/^File:/, '').replace(/ /g, '_'), {
        mime: info.mime,
        thumb: info.thumburl ?? info.url,
        source: info.descriptionurl,
        title: page.title.replace(/^File:/, ''),
        author: stripHtml(meta.Artist?.value) || 'Auteur inconnu',
        license: stripHtml(meta.LicenseShortName?.value),
        licenseUrl: stripHtml(meta.LicenseUrl?.value),
      });
    }
  }
  return infos;
}

/** Résultats d'une recherche Wikipédia, du plus pertinent au moins pertinent : [{ title, file }]. */
async function searchLeadImages(host, query) {
  const data = await api(host, {
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '0',
    gsrlimit: '6',
    prop: 'pageimages',
    piprop: 'name',
  });
  return (data.query?.pages ?? [])
    .sort((a, b) => a.index - b.index)
    .filter((page) => page.pageimage && !NOT_A_PHOTO.test(page.pageimage))
    .map((page) => ({ title: page.title, file: page.pageimage }));
}

/** Recherche directe de fichiers sur Commons : [{ file, info }] du plus au moins pertinent, JPEG d'au moins 1 000 px. */
async function searchCommons(query) {
  const data = await api('commons.wikimedia.org', {
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '12',
    prop: 'imageinfo',
    iiprop: 'url|mime|size|extmetadata',
    iiurlwidth: String(THUMB_WIDTH),
  });
  return (data.query?.pages ?? [])
    .sort((a, b) => a.index - b.index)
    .filter((page) => page.imageinfo?.[0]?.mime === 'image/jpeg' && page.imageinfo[0].width >= 1000)
    .filter((page) => !NOT_A_PHOTO.test(page.title))
    .map((page) => {
      const info = page.imageinfo[0];
      const meta = info.extmetadata ?? {};
      const file = page.title.replace(/^File:/, '').replace(/ /g, '_');
      return {
        file,
        info: {
          mime: info.mime,
          thumb: info.thumburl ?? info.url,
          source: info.descriptionurl,
          title: page.title.replace(/^File:/, ''),
          author: stripHtml(meta.Artist?.value) || 'Auteur inconnu',
          license: stripHtml(meta.LicenseShortName?.value),
          licenseUrl: stripHtml(meta.LicenseUrl?.value),
        },
      };
    });
}

/** Pourquoi un fichier ne convient pas, ou `null` s'il convient. */
function rejection(file, info) {
  if (!info) return `fichier ${file} absent de Commons (image locale, probablement non libre)`;
  if (info.mime !== 'image/jpeg') return `${file} n’est pas un JPEG (${info.mime})`;
  if (!FREE.test(info.license) || NOT_FREE.test(info.license))
    return `licence refusée pour ${file} : « ${info.license} »`;
  return null;
}

function writeCreditsHtml(credits) {
  const sections = [
    ['world', 'Monde'],
    ['us', 'États-Unis'],
  ];
  const body = sections
    .map(([mode, heading]) => {
      const rows = Object.entries(credits)
        .filter(([key]) => key.startsWith(`${mode}/`))
        .map(([, c]) => {
          const license = c.licenseUrl
            ? `<a href="${escapeHtml(c.licenseUrl)}">${escapeHtml(c.license)}</a>`
            : escapeHtml(c.license);
          return `    <li><a href="${escapeHtml(c.source)}">${escapeHtml(c.title)}</a> — ${escapeHtml(c.author)} — ${license}</li>`;
        })
        .join('\n');
      return `  <h2>${heading}</h2>\n  <ul>\n${rows}\n  </ul>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Crédits photo - Capital Quizz</title>
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <style>body{font-family:system-ui,sans-serif;line-height:1.5;max-width:60rem;margin:0 auto;padding:1rem}li{margin-block:.25rem;overflow-wrap:anywhere}</style>
</head>
<body>
  <p><a href="./">← Retour au quiz</a></p>
  <h1>Crédits photo</h1>
  <p>Les photos viennent de Wikimedia Commons et sont publiées sous licence libre. Chaque ligne donne le fichier, son auteur et sa licence.</p>
${body}
</body>
</html>
`;
}

async function main() {
  const articles = await readJson(ARTICLES, null);
  if (!articles) throw new Error(`Introuvable : ${ARTICLES}`);
  const credits = await readJson(CREDITS_JSON, {});

  const wanted = process.argv.slice(2);
  const all = Object.entries(articles).flatMap(([mode, byCode]) =>
    Object.entries(byCode).map(([code, article]) => ({
      key: `${mode}/${code}`,
      mode,
      code,
      article,
    })),
  );
  const todo = [];
  for (const entry of all) {
    if (wanted.length && !wanted.includes(entry.key)) continue;
    if (credits[entry.key] && (await exists(join(PLACES, entry.mode, `${entry.code}.jpg`))))
      continue;
    todo.push(entry);
  }
  log(`${todo.length} photo(s) à récupérer sur ${all.length}`);
  if (!todo.length) {
    await writeFile(CREDITS_HTML, writeCreditsHtml(credits));
    return;
  }

  const failures = [];
  const sortedCredits = () =>
    Object.fromEntries(Object.entries(credits).sort(([x], [y]) => x.localeCompare(y)));

  /** Télécharge, recadre et enregistre la photo d'une entrée ; `false` si elle ne convient pas. */
  async function save(entry, info, fail) {
    const download = await get(info.thumb).catch((error) => {
      fail(error.message);
      return null;
    });
    if (!download) return false;
    const photo = await sharp(download)
      .resize({ ...PHOTO, fit: 'cover', position: sharp.strategy.attention })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer()
      .catch((error) => {
        fail(`image illisible : ${error.message}`);
        return null;
      });
    if (!photo) return false;
    if (photo.length < MIN_BYTES) {
      fail(`image trop petite (${photo.length} octets)`);
      return false;
    }
    await mkdir(join(PLACES, entry.mode), { recursive: true });
    await writeFile(join(PLACES, entry.mode, `${entry.code}.jpg`), photo);
    credits[entry.key] = {
      title: info.title,
      author: info.author,
      license: info.license,
      licenseUrl: info.licenseUrl,
      source: info.source,
    };
    await writeFile(CREDITS_JSON, JSON.stringify(sortedCredits(), null, 2) + '\n');
    log(`ok ${entry.key} ← ${info.title} (${info.license})`);
    return true;
  }

  const direct = todo.filter((entry) => !/^(search(-en)?|commons|file):/.test(entry.article));
  const pinned = todo.filter((entry) => entry.article.startsWith('file:'));
  const onCommons = todo.filter((entry) => entry.article.startsWith('commons:'));
  const hostOf = (entry) =>
    entry.article.startsWith('en:') ? 'en.wikipedia.org' : 'fr.wikipedia.org';
  const titleOf = (entry) => entry.article.replace(/^(fr|en):/, '');
  const searched = todo.filter((entry) => /^search(-en)?:/.test(entry.article));

  // Articles dont on connaît le titre : par lots (un lot par site), pour ne pas dépasser les limites de l'API.
  for (const host of ['fr.wikipedia.org', 'en.wikipedia.org']) {
    for (const group of chunks(
      direct.filter((entry) => hostOf(entry) === host),
      BATCH,
    )) {
      const leads = await leadImages(host, group.map(titleOf));
      const infos = await fileInfos(
        [...leads.values()].flatMap((lead) => (lead.file ? [lead.file] : [])),
      );
      for (const entry of group) {
        const lead = leads.get(titleOf(entry));
        const fail = (reason) => failures.push(`${entry.key} (${entry.article}) : ${reason}`);
        if (!lead?.file) {
          fail(lead?.reason ?? 'pas d’image principale');
          continue;
        }
        const why = rejection(lead.file, infos.get(lead.file));
        if (why) {
          fail(why);
          continue;
        }
        await save(entry, infos.get(lead.file), fail);
      }
    }
  }

  // Fichiers choisis un par un sur Commons.
  for (const entry of pinned) {
    const file = entry.article.slice('file:'.length).replace(/ /g, '_');
    const fail = (reason) => failures.push(`${entry.key} (${entry.article}) : ${reason}`);
    const info = (await fileInfos([file])).get(file);
    const why = rejection(file, info);
    if (why) {
      fail(why);
      continue;
    }
    await save(entry, info, fail);
  }

  // Recherches directes sur Commons : on garde le premier JPEG libre.
  for (const entry of onCommons) {
    const query = entry.article.slice('commons:'.length);
    const fail = (reason) => failures.push(`${entry.key} (${entry.article}) : ${reason}`);
    const results = await searchCommons(query);
    const chosen = results.find(({ file, info }) => !rejection(file, info));
    if (!chosen) {
      fail(`aucune photo libre en JPEG d’au moins 1 000 px (${results.length} résultat(s))`);
      continue;
    }
    log(`   ${entry.key} : « ${query} » → fichier « ${chosen.info.title} »`);
    await save(entry, chosen.info, fail);
  }

  // Recherches : on essaie les résultats dans l'ordre et on garde le premier qui donne une photo libre.
  for (const entry of searched) {
    const [, kind, query] = /^(search(?:-en)?):(.*)$/.exec(entry.article);
    const fail = (reason) => failures.push(`${entry.key} (${entry.article}) : ${reason}`);
    const candidates = await searchLeadImages(
      kind === 'search-en' ? 'en.wikipedia.org' : 'fr.wikipedia.org',
      query,
    );
    if (!candidates.length) {
      fail('la recherche ne donne aucun article avec une image principale');
      continue;
    }
    const infos = await fileInfos(candidates.map((c) => c.file));
    const chosen = candidates.find((c) => !rejection(c.file, infos.get(c.file)));
    if (!chosen) {
      fail(`aucune photo libre en JPEG parmi : ${candidates.map((c) => c.title).join(', ')}`);
      continue;
    }
    log(`   ${entry.key} : « ${query} » → article « ${chosen.title} »`);
    await save(entry, infos.get(chosen.file), fail);
  }
  await writeFile(CREDITS_HTML, writeCreditsHtml(sortedCredits()));

  if (failures.length) {
    console.error(
      `\n${failures.length} échec(s) : changer l'article dans photo-articles.json, puis relancer.\n- ${failures.join('\n- ')}`,
    );
    process.exitCode = 1;
  } else {
    log('terminé');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
