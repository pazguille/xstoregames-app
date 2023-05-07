export const getXboxURL = (list, skipitems = 0) => `https://api.xstoregames.com/api/games?list=${list}&skipitems=${skipitems}`;
export const searchXboxURL = (query) => `https://api.xstoregames.com/api/search?q=${query}`;
export const gameXboxURL = (id) => `https://api.xstoregames.com/api/games?id=${id}`;
export const getXboxNewsURL = () => `https://api.xstoregames.com/api/news`;
export const getGamePassURL = (list) => `https://api.xstoregames.com/api/gamepass?list=${list}`;
export const getVideoURL = (slug) => `https://api.xstoregames.com/api/videos?game=${slug}`;
export const getMarketplaceItemsURL = (limit = 20) => `https://api.mercadolibre.com/sites/MLA/search?category=MLA455245&limit=${limit}`;

export function getPageFromURL(url) {
  const { pathname, searchParams } = new URL(url);
  const pathSplit = pathname.split('/');
  const page = pathSplit[1];
  const id = pathSplit[2];
  const gameId = pathSplit[2] ? pathSplit[2].split('_')[1] : null;

  return { id, gameId, page, searchParams };
}

// export function getPageFromURL(url) {
//   const { pathname, searchParams } = new URL(url);
//   const [page, id] = pathname.split('/').slice(1);
//   const gameId = id ? id.split('_')[1] : null;
//   return { id, page, searchParams, gameId };
// }


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
  const final = toFixed(price) + toFixed(price * IVA) + toFixed(price * IIBB) + toFixed(price * AFIP) + toFixed(price * PAISA);
  return final.toFixed(2);
}

function toFixed(num) {
  const rounded = Math.round(num * 100) / 100;
  return Number.parseFloat(rounded.toFixed(2));
}
