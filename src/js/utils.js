export const getXboxURL = (list, skipitems = 0) => `https://api.xstoregames.com/api/games?list=${list}&skipitems=${skipitems}`;
export const searchXboxURL = (query) => `https://api.xstoregames.com/api/search?q=${query}`;
export const gameXboxURL = (id) => `https://api.xstoregames.com/api/games?id=${id}`;
export const getXboxNewsURL = () => `https://api.xstoregames.com/api/news`;
export const getGamePassURL = (list) => `https://api.xstoregames.com/api/gamepass?list=${list}`;
export const getVideoURL = (slug) => `https://api.xstoregames.com/api/videos?game=${slug}`;
export const getTheGameAwardsURL = () => `https://api.xstoregames.com/api/games?id=9ND0JVB184XL,9P3J32CTXLRZ,9PM1905P9LQ6,9NM3TNRPQXLR,9PDXJP3805DN,9N201KQXS5BM,9NL4KTK0N4CG,9NR7XDNVP5SW,9N6F97F9WGL0,9P42DSXNCCDG,9NKMWCHLVCJ5,BV9ML45J2Q5V,9P9WJ5FW0GTD,BT5P2X999VH2,9PNLPMP1GGH5,9NLRT31Z4RWM,9PC4R8N1N2T6,9N5HDNDWVV34,9NS3673HVH41,9NDKXXBL90GF,9NJN1MC1X5FK,9PCW1SMN9RGG,9NGGB0GZPB9D,9N46JZZNGS3P,9N79LGZV5GHB,9N4K3F9558RP,9PNFQ9QVN34W,9NRFS8111GN3,C1C4DZJPBC2V,9NZFZXDRZQLR,9PD5BM2Z8C4L,9PCQD194J7L8,9NNMTSTGMKFZ`;

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
  var d = 2,
    m = Math.pow(10, d),
    n = +(d ? num * m : num).toFixed(8),
    i = Math.floor(n), f = n - i,
    e = 1e-8,
    r = (f > 0.5 - e && f < 0.5 + e) ?
    ((i % 2 == 0) ? i : i + 1) : Math.round(n);
  return d ? r / m : r;
}
