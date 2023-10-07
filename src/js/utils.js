export const getXboxURL = (list, skipitems = 0) => `https://api.xstoregames.com/api/games?list=${list}&skipitems=${skipitems}&lang=${lang}&store=${store}`;
export const searchXboxURL = (query) => `https://api.xstoregames.com/api/search?q=${query}&lang=${lang}&store=${store}`;
export const gameXboxURL = (id) => `https://api.xstoregames.com/api/games?id=${id}&lang=${lang}&store=${store}`;
export const getXboxNewsURL = () => `https://api.xstoregames.com/api/news`;
export const getGamePassURL = (list) => `https://api.xstoregames.com/api/gamepass?list=${list}&lang=${lang}&store=${store}`;
export const getVideoURL = (slug) => `https://api.xstoregames.com/api/videos?game=${slug}`;

const mlId = { ar: 'MLA', mx: 'MLM', };
export const getMarketplaceItemsURL = (limit = 20) => `https://api.mercadolibre.com/sites/${mlId[store]}/search?category=${mlId[store]}455245&limit=${limit}`;

export function getPageFromURL(url) {
  const { pathname, searchParams } = new URL(url);
  let pathSplit = pathname.split('/');
  pathSplit = pathSplit.filter(p => !['', '-store'].includes(p));

  const lang = 'es';
  let store = pathname.split('/').filter(p => p.includes('-store'));

  const page = store.length ? (pathSplit[1] || 'home') : (pathSplit[0] || 'home');
  const id = store.length ? pathSplit[2] : pathSplit[1];
  const gameId = id ? id.split('_')[1] : null;

  store = store.length ? store[0].split('-store')[0] : 'ar';

  return { id, gameId, page, searchParams, store, lang };
}

export function slugify(str) {
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

const IVA = 0.21;
const IIBB = 0.02;
const AFIP = 0.45;
const PAISA = 0.08;

export function convertDollar(price) {
  if (store !== 'ar') {
    return price.toFixed(2)
  }

  const final = toFixed(price) + toFixed(price * IVA) + toFixed(price * IIBB) + toFixed(price * AFIP) + toFixed(price * PAISA);
  return final.toFixed(2);
}

function toFixed(num) {
  const rounded = Math.round(num * 100) / 100;
  return Number.parseFloat(rounded.toFixed(2));
}

export function fetchSearchGames(query) {
  const params = new URLSearchParams({
    market: `${lang}-${store}`,
    clientId: '7F27B536-CF6B-4C65-8638-A0F8CBDFCA65',
    sources: 'DCatAll-Products',
    filter: '+ClientType:StoreWeb',
    counts: '20,0,0',
    query,
  }).toString();
  return fetch(`https://www.microsoft.com/msstoreapiprod/api/autosuggest?${params}`, {
    headers: {
      'accept-language': 'es,es-419;q=0.9,en;q=0.8',
    }
  })
  .then(response => response.json())
  .then(response => response.ResultSets[0])
  .then(data => {
    if (!data) { return Promise.reject(new Error()); }
    return data.Suggests
      .filter((result) => result.Source === 'Juego')
      .map((result) => result.Metas[0].Value);
  })
  .then((games) => fetch(gameXboxURL(games)).then(res => res.json()))
  .catch(err => { throw { error: err }; });
};

const pr = new Intl.PluralRules(`${lang}-${store}`);
const suffixes = new Map([
  ['one',   'juego'],
  ['other', 'juegos'],
]);
export function pluralGames(n) {
  const rule = pr.select(n);
  const suffix = suffixes.get(rule);
  return `${n} ${suffix}`;
};
