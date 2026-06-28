this.addEventListener('install', async (eve) => { this.skipWaiting(); });

this.addEventListener('fetch', eve => {
  if (eve.request.headers.has('range')) {
    return;
  }
  eve.respondWith(fetch(eve.request));
});

this.addEventListener('notificationclick', eve => {
  eve.notification.close();
  eve.waitUntil(
    clients.openWindow(eve.notification.data.url)
  );
});

const gameXboxURL = (id) => `https://api.xstoregames.com/api/games?id=${id}`;
function slugify(str) {
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

this.addEventListener('periodicsync', async (eve) => {
  if (eve.tag === 'check-deals') {
    const notifStatus = await navigator.permissions.query({
      name: 'notifications',
    });

    if (notifStatus.state !== 'granted') {
      return;
    }

    const iddb = indexedDB.open('xstoregames', 1);
    iddb.onsuccess = eve => {
      const db = eve.target.result;
      db
        .transaction('wishlist', 'readonly')
        .objectStore('wishlist')
        .getAll()
        .onsuccess = async (eve) => {
          const games = eve.target.result;
          if (!games.length) {
            return;
          }
          const wishlist = games.map((g) => g.gameId).join(',');
          const wish = await fetch(gameXboxURL(wishlist)).then(res => res.json());
          const deals = games.filter((g) => wish.find((a) => a.id === g.gameId && a.price.deal < g.amount));
          console.log(`${this.registration.scope}wishlist`);
          if (deals.length) {
            this.registration.showNotification(`¡Nuevas ofertas!`, {
              icon: `${this.registration.scope}src/assets/favicon.png`,
              badge: `${this.registration.scope}src/assets/favicon.png`,
              body: `Encontramos ofertas para tus juegos favoritos.`,
              data: {
                url: `${this.registration.scope}wishlist`,
              },
            });
          }

        };
    };
  }
});

const broadcast = new BroadcastChannel('worker-channel');
const sorting = {
  'lowest-price': (a, b) => (a.price.gold_deal || a.price.deal || a.price.amount) > (b.price.gold_deal || b.price.deal || b.price.amount) ? 1 : -1,
  'highest-price': (a, b) => (b.price.gold_deal || b.price.deal || b.price.amount) > (a.price.gold_deal || a.price.deal || a.price.amount) ? 1 : -1,
  discount: (a, b) => {
    const aDeal = a.price.off || 0;
    const bDeal = b.price.off || 0;
    return bDeal > aDeal ? 1 : -1;
  },
  az: (a, b) => a.title > b.title ? 1 : -1,
  za: (a, b) => b.title > a.title ? 1 : -1,
  'release-oldest': (a, b) => a.release_date > b.release_date ? 1 : -1,
  'release-newest': (a, b) => b.release_date > a.release_date ? 1 : -1,
  rating: (a, b) => b.averageRating > a.averageRating ? 1 : -1,

  pc: (a, b) => b.platforms.includes('PC') ? 1 : -1,
  'coop-multi': (a, b) => b.coop.length || b.multi.length ? 1 : -1,
};
broadcast.addEventListener('message', eve => {
  const sort = eve.data.sort;
  const filter = eve.data.filter;
  let games = eve.data.games;

  if (filter) {
    games = games.filter((g) => sorting[filter](g, g) === 1);
  }

  if (sort) {
    games = games.toSorted(sorting[sort]);
  }
  broadcast.postMessage({ games });
});
