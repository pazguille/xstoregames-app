this.addEventListener('install', async (eve) => { this.skipWaiting(); });

this.addEventListener('fetch', eve => {});

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

    const iddb = indexedDB.open('wishlist', 1);
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
          const wishlist = games.map((g) => g.id).join(',');
          const wish = await fetch(gameXboxURL(wishlist)).then(res => res.json());
          const deals = games.filter((g) => wish.find((a) => a.id === g.id && a.price.deal < g.amount));

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
