const API_DOMAIN = 'https://api.xstoregames.com';
const API_FLY_DOMAIN = 'https://fly.xstoregames.com';
const AUTH_DOMAIN = 'https://auth.xstoregames.com';
export const getXboxURL = (list, skipitems = 0, count = 10) => `${API_DOMAIN}/api/games?list=${list}&skipitems=${skipitems}&count=${count}&lang=${lang}&store=${store}`;
export const searchXboxURL = (query, ct) => `${API_FLY_DOMAIN}/api/search?q=${query}${ct ? `&encodedCT=${ct}`: ''}&lang=${lang}&store=${store}`;
export const gameXboxURL = (id) => `${API_DOMAIN}/api/games?id=${id}&lang=${lang}&store=${store}`;
export const gameXboxUSURL = (id) => `${API_FLY_DOMAIN}/api/games?id=${id}&lang=${lang}&store=us`;
export const gameXboxFlyURL = (id) => `${API_FLY_DOMAIN}/api/games?id=${id}&lang=${lang}&store=${store}`;
export const gameXboxRelatedURL = (id) => `${API_FLY_DOMAIN}/api/games?related=${id}&lang=${lang}&store=${store}`;
export const getXboxNewsURL = () => `${API_FLY_DOMAIN}/api/news`;
export const getGamePassURL = (list) => `${API_DOMAIN}/api/gamepass?list=${list}&lang=${lang}&store=${store}`;
export const getVideoURL = (slug) => `${API_FLY_DOMAIN}/api/videos?game=${slug}`;
export const getXboxCatalogURL = (list, ct) => `${API_DOMAIN}/api/catalog?list=${list}${ct ? `&encodedCT=${ct}`: ''}&lang=${lang}&store=${store}`;
export const getGameReviewsURL = (id) => `${API_FLY_DOMAIN}/api/games?reviews=${id}`;
export const getDollar = () => 'https://dolarapi.com/v1/dolares/tarjeta';

export const loginURL = () => `${AUTH_DOMAIN}/api/token?auth=true`;
export const logoutURL = () => `${AUTH_DOMAIN}/api/logout`;
export const getGamerURL = () => `${AUTH_DOMAIN}/api/user`;
export const getGamerById = (id) => `${AUTH_DOMAIN}/api/user?gamertag=${id}`;
export const getGamerGamesById = (id, count = 0) => `${AUTH_DOMAIN}/api/games?gamertag=${id}&count=${count}&lang=${lang}&store=${store}`;
export const getGamerAchievementsById = (id, count = 0) => `${AUTH_DOMAIN}/api/achievements?gamertag=${id}&count=${count}&lang=${lang}&store=${store}`;
export const getGamerAchievementsByTitleId = (id, titleId) => `${AUTH_DOMAIN}/api/achievements?gamertag=${id}&titleId=${titleId}&lang=${lang}&store=${store}`;
export const getGamerClipsById = (id, count = 0) => `${AUTH_DOMAIN}/api/clips?gamertag=${id}&count=${count}&lang=${lang}&store=${store}`;

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

  return { id, gameId, page, searchParams, store, lang, paths: pathSplit };
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
