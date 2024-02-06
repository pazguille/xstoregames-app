const API_DOMAIN = 'https://api.xstoregames.com';
export const getXboxURL = (list, skipitems = 0, count = 10) => `${API_DOMAIN}/api/games?list=${list}&skipitems=${skipitems}&count=${count}&lang=${lang}&store=${store}`;
export const searchXboxURL = (query) => `${API_DOMAIN}/api/search?q=${query}&lang=${lang}&store=${store}`;
export const gameXboxURL = (id) => `${API_DOMAIN}/api/games?id=${id}&lang=${lang}&store=${store}`;
export const gameXboxRelatedURL = (id) => `${API_DOMAIN}/api/games?related=${id}&lang=${lang}&store=${store}`;
export const getXboxNewsURL = () => `${API_DOMAIN}/api/news`;
export const getGamePassURL = (list) => `${API_DOMAIN}/api/gamepass?list=${list}&lang=${lang}&store=${store}`;
export const getVideoURL = (slug) => `${API_DOMAIN}/api/videos?game=${slug}`;

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
    .replace(/--+/g, '-')
    .replace(/_+/g, '-');
}

const IIBBs = {
  NONE: 0,
  PAMP: 0.01,
  CABA: 0.02,
  BA: 0.02,
  CBA: 0.03,
  TFUE: 0.03,
  SALTA: 0.036,
  NEU: 0.04,
  RNEGRO: 0.05,
  CHACO: 0.055,
};

const IVA = 0.21;
const IIBB = IIBBs[window.localStorage.getItem('state') || 'CABA'];
const AFIP = 0.30;
const PAISA = 0.08;

export function convertDollar(price) {
  if (store !== 'ar') {
    return price.toFixed(2);
  }

  const final = toFixed(price) + toFixed(price * IVA) + toFixed(price * IIBB) + toFixed(price * AFIP) + toFixed(price * PAISA);
  return final.toFixed(2);
}

function toFixed(num) {
  const rounded = Math.round(num * 100) / 100;
  return Number.parseFloat(rounded.toFixed(2));
}

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
