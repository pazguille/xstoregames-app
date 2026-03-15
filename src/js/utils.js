const API_DOMAIN = 'https://api.xstoregames.com';
const API_FLY_DOMAIN = 'https://fly.xstoregames.com';
// const API_DOMAIN = 'http://localhost:3031';
// const API_FLY_DOMAIN = 'http://localhost:3031';
const AUTH_DOMAIN = 'https://auth.xstoregames.com';
export const getXboxURL = (list, skipitems = 0, count = 10) => `${API_DOMAIN}/api/games?list=${list}&skipitems=${skipitems}&count=${count}&lang=${lang}&store=${store}`;
export const searchXboxURL = (query, ct) => `${API_FLY_DOMAIN}/api/search?q=${query}${ct ? `&encodedCT=${ct}`: ''}&lang=${lang}&store=${store}`;
export const gameXboxURL = (id) => `${API_DOMAIN}/api/games?id=${id}&lang=${lang}&store=${store}`;
export const gameXboxUSURL = (id) => `${API_FLY_DOMAIN}/api/games?id=${id}&lang=${lang}&store=us`;
export const gameXboxFlyURL = (id) => `${API_FLY_DOMAIN}/api/games?id=${id}&lang=${lang}&store=${store}`;
export const gameXboxRelatedURL = (id) => `${API_FLY_DOMAIN}/api/games?related=${id}&lang=${lang}&store=${store}`;
export const gameRandomURL = (count) => `${API_FLY_DOMAIN}/api/games?list=random&lang=${lang}&store=${store}&count=${count}`;
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

const IVA = 0.21;
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
const PAYMETHODS = {
  ASTROPAY: (price) => {
    try {
      const markupFactor = (window.apExchange.exchange / window.apExchange.official_exchange) + (window.apExchange.spread / 100);
      const adjustedPrice = price * markupFactor;
      const iibbTax = price * IIBB;
      const ivaTax = price * IVA;
      const finalTotal = adjustedPrice + ivaTax + iibbTax;
      return toFixed(finalTotal);
    } catch (error) {
      return toFixed(price) + toFixed(price * IVA) + toFixed(price * IIBB);
    }
  },
  TC: (price) => toFixed(price) + toFixed(price * IVA) + toFixed(price * IIBB),

  // MP: (price) => {
  //   const dprice = Number((price / window.dof.compra).toFixed(2)) * window.dccl.compra;
  //   return toFixed(dprice) + toFixed(price * IVA) + toFixed(price * IIBB);
  // },
  // NONE: (price) => price,
  // DOLLAR: (price) => Number((price / window.dof.compra).toFixed(2)),
};

const IIBB = IIBBs[window.localStorage.getItem('state') || 'CABA'];
const PAYMETHOD = PAYMETHODS[window.localStorage.getItem('paymethod') || 'TC'];

export function convertDollar(price) {
  if (store !== 'ar') {
    return price.toFixed(2);
  }

  const final = PAYMETHOD(price);

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

export function shuffle(arr) {
  let collection = arr;
  let len = arr.length;
  let random;
  let temp;

  while (len) {
    random = Math.floor(Math.random() * len);
    len -= 1;
    temp = collection[len];
    collection[len] = collection[random];
    collection[random] = temp;
  }

  return collection;
};

export async function getDollars() {
  const useAP = localStorage.getItem('paymethod') === 'ASTROPAY';
  if (!useAP) return;

  const stringApEx = localStorage.getItem('ap_exchange');

  if (stringApEx) {
    window.apExchange = JSON.parse(stringApEx);
    const now = Date.now();
    const lastUpdate = localStorage.getItem('ap_exchange_timestamp');
    const fiveMinutes = 5 * 60 * 1000;
    if (now - lastUpdate < fiveMinutes) {
      return;
    }
  }

  try {
    const res = await fetch('https://fly.xstoregames.com/api/ap-exchange?from=usd');
    const apData = await res.json();

    window.apExchange = apData;
    localStorage.setItem('ap_exchange', JSON.stringify(apData));
    localStorage.setItem('ap_exchange_timestamp', Date.now().toString());
  } catch (error) {
    console.error("Error en API Local:", error);
  }
}
