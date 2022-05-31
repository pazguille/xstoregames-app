export const getXboxURL = (list, skipitems = 0) => `https://api.xstoregames.com/api/games?list=${list}&skipitems=${skipitems}`;
export const searchXboxURL = (query) => `https://api.xstoregames.com/api/search?q=${query}`;
export const gameXboxURL = (id) => `https://api.xstoregames.com/api/games?id=${id}`;
export const getXboxNewsURL = () => `https://api.xstoregames.com/api/news`;
export const getGamePassURL = (list) => `https://api.xstoregames.com/api/gamepass?list=${list}`;
export const getVideoURL = (slug) => `https://api.xstoregames.com/api/videos?game=${slug}`;

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

export async function updateDollar() {
  await fetch('https://www.dolarsi.com/api/api.php?type=valoresprincipales')
  .then(res => res.json())
  .then(data => {
    return parseFloat(data[0].casa.compra.replace(',', '.'));
  })
  .then(data => {
    window.dollar = data;
    window.localStorage.setItem('dollar', JSON.stringify({
      amount: data, date: new Date().toDateString(),
    }));
  });
}

const IVA = 0.21;
const IIBB = 0.02;
const AFIP = 0.35;
const PAISA = 0.08;

export function convertDollar(price, dollar) {
  const usdPrice = (price / dollar);
  const final = toFixed(usdPrice * dollar) + toFixed(price * IVA) + toFixed(price * IIBB) + toFixed(price * AFIP) + toFixed(price * PAISA);
  return final.toFixed(2);
}

function toFixed(num) {
  var d = 2,
    m = Math.pow(10, d),
    n = +(d ? num * m : num).toFixed(8),
    i = Math.floor(n), f = n - i,
    e = 1e-8,
    r = (f > 0.5 - e && f < 0.5 + e) ?
    ((i % 2 == 0) ? i : i + 1) : Math.round(n);
  return d ? r / m : r;
}
