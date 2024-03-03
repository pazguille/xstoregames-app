import {
  getXboxURL,
  gameXboxURL,
  gameXboxFlyURL,
  gameXboxRelatedURL,
  searchXboxURL,
  getXboxNewsURL,
  getGamePassURL,
  getXboxCatalogURL,
  getGameReviewsURL,
  getVideoURL,
  loginURL,
  getGamerURL,
  getGamerById,
  getGamerGamesById,
  getGamerAchievementsById,
  getGamerAchievementsByTitleId,
  getGamerClipsById,
  slugify,
  getPageFromURL,
  getMarketplaceItemsURL,
  convertDollar,
  pluralGames,
} from './utils.js';

import {
  sectionTemplate,
  gameImportantTemplate,
  gameCardTemplate,
  gameDetailTemplate,
  newsTemplate,
  emptyList,
  emptyWishlist,
  emptyCart,
  gamepassSection,
  supportSection,
  catalogSection,
  marketplaceItemsTemplate,
  filtersTemplate,
  filtersCatalogTemplate,
  settingsTemplate,
  collectionHeaderTemplate,
  finanzasARGSection,
  gamerPageTemplate,
  gamerGamesTemplate,
  gamerAchievementsTemplate,
  gamerClipsTemplate,
  gamerPageStatsTemplate,
  gamerPageNotFoundTemplate,
  reviewsTemplate,
} from './templates.js';

let controller;

const documentTitle = document.title;
const documentDescription = document.querySelector('[name="description"]').content;

const LIMIT = 10;

const gamesCache = new Map();
const allGamesCache = new Map();
const gamerCache = new Map();

const broadcast = new BroadcastChannel('worker-channel');

const sections = [
  {
    type: 'new',
    title: 'Salidos del horno',
    icon: '',
    list: [],
    skipitems: 0,
  },
  {
    type: 'deals',
    title: 'Ahorrate unos pesos',
    icon: `<img alt="" src="/src/assets/icons/tag.svg" width="24" height="24" />`,
    list: [],
    skipitems: 0,
  },
  {
    type: 'coming',
    title: '¡Mirá lo que se viene!',
    icon: '',
    list: [],
    skipitems: 0,
  },
  {
    type: 'best',
    title: 'Deberías jugarlos',
    icon: '',
    list: [],
    skipitems: 0,
  },
  {
    type: 'most',
    title: 'Los más jugados',
    icon: '<img alt="" src="/src/assets/icons/chart.svg" width="24" height="24" />',
    list: [],
    skipitems: 0,
  },
  {
    type: 'free',
    title: 'Gratarola',
    icon: '',
    list: [],
    skipitems: 0,
  },
];

const gamepassTitles = {
  'gamepass-new': 'Recién agregados a Game Pass',
  'gamepass-coming': 'Se están por sumar a Game Pass',
  'gamepass-leaving': 'Los que se van de Game Pass',
  'gamepass-ea-play': 'Con EA Play en Game Pass',
  'gamepass-gp-deals': 'Ofertas exclusivas con Game Pass',
  'gamepass-all': 'Todos los juegos de Game Pass',
  'gamepass-new-pc': 'Recién agregados a PC Game Pass',
  'gamepass-coming-pc': 'Se están por sumar a PC Game Pass',
  'gamepass-leaving-pc': 'Los que se van de PC Game Pass',
  'gamepass-ea-play-pc': 'Con EA Play en Game Pass',
  'gamepass-all-pc': 'Todos los juegos de PC Game Pass',
};

const catalogTitles = {
  all: 'Todos los juegos',
  pc: 'Juegos disponibles en PC',
  shooter: 'Shooters',
  action_adventure: 'Acción y aventura',
  racing_flying: 'Carreras',
  card_board: 'Cartas',
  classics: 'Clásicos',
  educational: 'Educativos',
  family_kids: 'Para toda la familia',
  fighting: 'Pelea... piñas van, piñas vienen!',
  music: 'Música',
  platformer: 'Plataformeros',
  puzzle_trivia: 'Puzzles',
  role_playing: 'Juegos de rol',
  simulation: 'Simuladores',
  sports: 'Deportes',
  strategy: 'Estrategia',
};

async function bootApp() {
  const $loading = document.querySelector('x-loader');
  const $splash = document.querySelector('.splash-loading');

  const wishlist = new Set(
    JSON.parse(window.localStorage.getItem('wishlist'))
  );

  const cart = new Set(
    JSON.parse(window.sessionStorage.getItem('cart'))
  );

  let loggedGamer = document.cookie.includes('nickname');
  let gamer = JSON.parse(window.localStorage.getItem('gamer'));
  if (loggedGamer) {
    fetch(getGamerURL(), {
      credentials: 'include',
    })
    .then(res => res.json())
    .then(u => {
      if (u.code) {
        loggedGamer = false;
        gamer = null;
        window.localStorage.removeItem('gamer');
      } else {
        gamer = u;
        document.querySelector('#gamer img').src = gamer.displayPicRaw;
        document.querySelector('#gamer').href = '/gamer/' + gamer.gamertag;
        window.localStorage.setItem('gamer', JSON.stringify(u));
      }
    });
  }

  if (gamer) {
    document.querySelector('#gamer img').src = gamer.displayPicRaw;
    document.querySelector('#gamer').href = '/gamer/' + gamer.gamertag;
  }

  let sorted = null;
  let filtered = null;

  if (cart.size) {
    requestIdleCallback(() => {
      $cartQuantity.textContent = cart.size;
    });
  }

  document.addEventListener('cartupdate', (eve) => {
    if (eve.detail.games) {
      $cartQuantity.textContent = eve.detail.games;
    } else {
      $cartQuantity.textContent = '';
    }
  });

  const $main = document.querySelector('main');
  const $metaDescription = document.querySelector('[name="description"]');
  const $canonical = document.querySelector('#canonical');
  const $preloadLCP = document.querySelector('#preloadLCP');

  const $footer = document.querySelector('footer');

  const $installBtn = document.querySelector('#install-btn');
  const $pageBack = document.querySelector('#page-back-btn');

  const $search = document.querySelector('#search-collapse');
  const $searchForm = document.querySelector('#search');

  const $cartQuantity = document.querySelector('.cart-quantity');

  const $home = document.querySelector('.home');
  const $detail = document.querySelector('.detail');
  const $detailContent = document.querySelector('.detail-content');
  const $list = document.querySelector('.collection');
  const $listContent = document.querySelector('.collection-content');
  const $cart = document.querySelector('.cart');
  const $cartContent = document.querySelector('.cart-content');
  const $results = document.querySelector('.results');
  const $resultsContent = document.querySelector('.results-content');

  const $news = document.querySelector('.news');
  const $newsContent = document.querySelector('.news-content');
  const $wish = document.querySelector('.wish');
  const $wishContent = document.querySelector('.wish-content');

  const $gamer = document.querySelector('.gamer');
  const $gamerContent = document.querySelector('.gamer-content');

  const $modal = document.querySelector('.modal');

  let $currentPage = null;
  let $prevPage = null;
  let $currentPageContent = null;
  let $prevFocus = null;

  const db = await new Promise((resolve) => {
    const iddb = window.indexedDB.open('xstoregames', 1);
    iddb.onupgradeneeded = async (eve) => {
      eve.currentTarget.result
          .createObjectStore('wishlist', { keyPath: 'gameId' })
          .createIndex('gameId', 'gameId', { unique: true });

      // eve.currentTarget.result
      //     .createObjectStore('played', { autoIncrement: true })
      //     .createIndex('id', 'id', { unique: true });

      if ((await window.indexedDB.databases()).filter(db => db.name === 'wishlist')[0]) {
        const iddbWishlist = window.indexedDB.open('wishlist', 1);
        iddbWishlist.onsuccess = w => {
          const ww = w.target.result;
          ww.transaction('wishlist', 'readonly')
            .objectStore('wishlist')
            .getAll()
            .onsuccess = async (e) => {
              const filtered = e.target.result.filter((value, index, self) =>
                index === self.findIndex(t => t.gameId === value.gameId)
              );
              const xStore = db
                .transaction('wishlist', 'readwrite')
                .objectStore('wishlist');
              filtered.forEach((g) => { xStore.add(g); });

              window.indexedDB.deleteDatabase('wishlist');
            }
        };
      }
    };
    iddb.onsuccess = eve => { resolve(eve.target.result); };
  });

  // const gamerGames = window.gamerGames = await new Promise((resolve) => {
  //   db
  //     .transaction('played', 'readonly')
  //     .objectStore('played')
  //     .getAll()
  //     .onsuccess = (e) => resolve(e.target.result);
  // });

  async function showPage(page, id) {
    $prevPage = $currentPage;

    document.title = documentTitle;
    $metaDescription.content = documentDescription;
    $canonical.href = window.location.origin + window.location.pathname;

    setTimeout(() => {
      requestIdleCallback(() => {
        $home.setAttribute('hidden', true);
        $main.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      });
    }, 300);

    if (page === 'wishlist') {
      $footer.dataset.active = page;

      requestIdleCallback(() => {
        $pageBack.hide();
        $installBtn.hide();
      });

      if (!$prevPage) {
        $home.setAttribute('hidden', true);
      }

      $currentPage = $wish;
      $currentPageContent = $wishContent;

      if ($currentPageContent.innerHTML === '' || history.state.referer !== 'game') {
        if ($prevPage) {
          $prevPage.setAttribute('hidden', true);
          $prevPage.classList.remove('page-on');
        }

        $currentPageContent.innerHTML = collectionHeaderTemplate({
          icon: '<img alt="" src="/src/assets/icons/heart.svg" width="24" height="24" />',
          title: ' Favoritos',
          filter: false,
        });
        const games = Array.from(wishlist).reverse().join(',');
        if (games.length) {
          $loading.show();
          const wish = await fetch(gameXboxURL(games)).then(res => res.json());
          wish.map((w) => {
            gamesCache.set(w.id, w);
            requestIdleCallback(() => {
              $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(w, true, true));
            });
          });
          $loading.hide();
          document.dispatchEvent(new CustomEvent('wishlistdone'));
        } else {
          requestIdleCallback(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', emptyWishlist());
          });
        }
      } else {
        const games = Array.from(wishlist).reverse().join(',');
        const removed = Array.from($currentPageContent.querySelectorAll(`[id*=detail-]`))
          .filter((g => !games.includes(g.id.split('-')[1])));
        if (removed.length === 1) {
          yieldToMain(() => {
            removed[0].parentNode.parentNode.parentNode.remove();
          });
        }
        if (games.length === 0) {
          yieldToMain(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', emptyWishlist());
          });
        }
      }
    }

    if (page === 'news') {
      $footer.dataset.active = page;

      $home.setAttribute('hidden', true);

      requestIdleCallback(() => {
        $installBtn.hide();
        $pageBack.hide();
      });

      if ($prevPage) {
        $prevPage.setAttribute('hidden', true);
        $prevPage.classList.remove('page-on');
      }

      $currentPage = $news;
      $currentPageContent = $newsContent;
      $currentPageContent.innerHTML = collectionHeaderTemplate({
        icon: '<img alt="" src="/src/assets/icons/news.svg" width="24" height="24" />',
        title: 'Noticias recientes',
        filter: false,
      });

      $loading.show();
      const news = await fetch(getXboxNewsURL())
        .then(res => res.json())
        .then(res => res.map(n => {
          n.image = n.image.replace('1200%2C675', '670%2C380')
          return n;
        }));

      $preloadLCP.href = news[0].image;

      news.map((n, i) => requestIdleCallback(() => {
        $currentPageContent.insertAdjacentHTML('beforeend', newsTemplate(n, i !== 0));
      }));
      $loading.hide();
    }

    if (page === 'game') {
      const gameId = id.split('_')[1];

      if (!gameId) {
        window.location.href = 'https://xstoregames.com';
        return;
      }

      requestIdleCallback(() => {
        $pageBack.show();
        $installBtn.hide();
      });

      if (history.state?.referer !== history.state?.page ) {
        if (!$prevPage) {
          $home.classList.add('page-prev-on');
        }

        if ($prevPage) {
          $prevPage.classList.add('page-prev-on');

          setTimeout(() => {
            requestIdleCallback(() => {
              $prevPage.setAttribute('hidden', true);
            });
          }, 300);
        }
      }

      $currentPage = $detail;
      $currentPageContent = $detailContent;
      $currentPageContent.innerHTML = '';

      let game = gamesCache.get(gameId);

      if (!game) {
        $loading.show();
        game = await fetch(gameXboxURL(gameId)).then(res => res.json()).then(game => game[0]);
        gamesCache.set(game.id, game);
        $loading.hide();
      }

      game.lcp = (game.images.titledheroart ?
        (game.images.titledheroart.url || game.images.titledheroart[0].url)
        : game.images.screenshot ? game.images.screenshot[0].url
        : (game.images.superheroart?.url || game.images.boxart?.url)).replace('https:https:', 'https:');

      $preloadLCP.href = game.lcp + '?w=1160&q=70';

      const html = gameDetailTemplate(game);
      requestIdleCallback(() => {
        document.title = `${game.title} | XStore`;
        $metaDescription.content = `${game.title}: ${game.description.split('.')[0].replace(/\n/gi, '')}.`;
        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = html;

        yieldToMain(() => {
          document.querySelector('#share-btn').show({
            title: `${game.title} en XStore`,
            url: window.location.href,
          });
          document.querySelector('#fav-btn').show(wishlist.has(gameId));
          document.querySelector('#cart-btn').show(cart.has(gameId));
        });
      });

      requestIdleCallback(async () => {
        if (!window.matchMedia('(prefers-reduced-motion)').matches || (navigator.connection && !navigator.connection.saveData)) {
          const video = await fetch(getVideoURL(slugify(game.title))).then(res => res.json());

          if (video && video.full) {
            document.querySelector('video')
              .addEventListener('loadedmetadata', function() {
                this.toggleAttribute('hidden');
              });
            document.querySelector('video').src = video.full;
          }
          if (video && video.playlist && video.playlist.length > 0) {
            document.querySelector('.game-preview-playlist').insertAdjacentHTML('beforeend',
              video.playlist.map((id) => `<lite-youtube videoid="${id}" autoload noCookie="true"></lite-youtube>`).join('')
            )
          }
        }
      });

      requestIdleCallback(async () => {
        const o = new IntersectionObserver(async (entries) => {
          const first = entries[0];
          if (first.isIntersecting) {
            o.unobserve(o.current);
            controller = new AbortController();
            const signal = controller.signal;
            const related = await fetch(gameXboxRelatedURL(game.id), { signal }).then(res => res.json());
            const { reviews } = await fetch(getGameReviewsURL(game.id), { signal }).then(res => res.json());

            if (related.CompareEditions) {
              yieldToMain(() => {
                $currentPageContent.insertAdjacentHTML('beforeend', sectionTemplate({
                  icon: '',
                  title: 'Todas las ediciones',
                  type: 'editions',
                  list: related.CompareEditions,
                  more: false,
                }));
                o.current.remove();
                related.CompareEditions.forEach((game) => gamesCache.set(game.id, game));
              });
            }

            if (related.AddOnsByParentWithDetails) {
              yieldToMain(() => {
                $currentPageContent.insertAdjacentHTML('beforeend', sectionTemplate({
                  icon: '',
                  title: 'Complementos',
                  type: 'addons',
                  list: related.AddOnsByParentWithDetails,
                  more: false,
                }));
                o.current.remove();
                related.AddOnsByParentWithDetails.forEach((game) => gamesCache.set(game.id, game));
              });
            }

            if (reviews.length) {
              yieldToMain(() => {
                $currentPageContent.insertAdjacentHTML('beforeend', reviewsTemplate({
                  icon: '',
                  title: 'Opiniones',
                  type: 'reviews',
                  list: reviews,
                }));
                o.current.remove();
              });
            }

            if (related.PAL) {
              yieldToMain(() => {
                $currentPageContent.insertAdjacentHTML('beforeend', sectionTemplate({
                  icon: '',
                  title: 'Te pueden gustar',
                  type: 'related',
                  list: related.PAL,
                  more: false,
                }));
                o.current.remove();
                related.PAL.forEach((game) => gamesCache.set(game.id, game));
              });
            }
          }
        });
        o.current = document.querySelector('.section-skeleton');
        o.observe(o.current);
      });
    }

    if (page === 'collection') {
      const { searchParams } = getPageFromURL(window.location.href);
      const sort = searchParams.get('sort');
      const filter = searchParams.get('filter');

      requestIdleCallback(() => {
        $pageBack.show();
        $installBtn.hide();
      });

      if (!$prevPage) {
        $home.classList.add('page-prev-on');
      }

      const $prev = $currentPageContent;

      $currentPage = $list;
      $currentPageContent = $listContent;

      const section = sections.find(section => section.type === id);

      if (!sort && ($prev === null || $currentPageContent.innerHTML === '')) {
        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = '';

        $currentPageContent.insertAdjacentHTML('beforeend', collectionHeaderTemplate({
          icon: section.icon,
          title: section.title,
          filter: true,
        }));

        if (section.list.length === 0) {
          section.skipitems -= LIMIT;
        } else {
          section.list.map((game) => requestIdleCallback(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
            gamesCache.set(game.id, game);
          }));
        }

        requestIdleCallback(() => {
          const o = new IntersectionObserver(async (entries) => {
            const first = entries[0];
            if (first.isIntersecting) {
              o.unobserve(o.current);
              const moreGames = await fetch(getXboxURL(id, section.skipitems += LIMIT)).then(res => res.json());
              if (moreGames.length === 0) { return; }

              if (section.list.length === 0) {
                const game = moreGames[0];
                const lcp = game.images.boxart ? game.images.boxart.url : game.images.poster?.url;
                $preloadLCP.href = lcp + '?w=330';
              }

              moreGames.map((game,i) => requestIdleCallback(() => {
                $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game, i !== 0));
                gamesCache.set(game.id, game);
              }));
              requestIdleCallback(() => {
                o.current = $currentPageContent.lastElementChild;
                o.observe(o.current);
                section.list.push(...moreGames);
                $currentPageContent.insertAdjacentHTML('beforeend', `<br/>`);
              });
            }
          });
          o.current = $currentPageContent.lastElementChild;
          o.observe(o.current);
        });
      }

      if ((sort && sort !== sorted) || (filter && filter !== filtered)) {
        sorted = sort;
        filtered = filter;
        $loading.show();

        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = '';
        $currentPageContent.insertAdjacentHTML('beforeend', collectionHeaderTemplate({
          icon: section.icon,
          title: section.title,
          filter: true,
        }));

        // TODO: Improve API repsonse to avoid this
        const allGames = allGamesCache.get(id) || await Promise.all([
          fetch(getXboxURL(id, 0, 200)).then(res => res.json()),
          fetch(getXboxURL(id, 200, 200)).then(res => res.json()),
          fetch(getXboxURL(id, 400, 200)).then(res => res.json()),
          fetch(getXboxURL(id, 600, 200)).then(res => res.json()),
          fetch(getXboxURL(id, 800, 200)).then(res => res.json()),
          fetch(getXboxURL(id, 1000, 200)).then(res => res.json()),
          fetch(getXboxURL(id, 1200, 200)).then(res => res.json()),
          fetch(getXboxURL(id, 1400, 200)).then(res => res.json()),
        ]).then(a => a.flat()).then(a => { allGamesCache.set(id, a); return a; });

        broadcast.postMessage({
          sort,
          filter,
          games: allGames,
        });

        broadcast.addEventListener('message', eve => {
          eve.data.games.map((game, i) => yieldToMain(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game, i !== 0));
            requestIdleCallback(() => {
              gamesCache.set(game.id, game);
            });
          }));
          $loading.hide();
        }, { once: true });
      }

      requestIdleCallback(() => {
        $modal.querySelector('.modal-content').innerHTML = filtersTemplate();
      });
    }

    if (page === 'games') {
      requestIdleCallback(() => {
        $pageBack.show();
        $installBtn.hide();
      });

      if (!$prevPage) {
        $home.classList.add('page-prev-on');
      }

      const $prev = $currentPageContent;

      $currentPage = $list;
      $currentPageContent = $listContent;

      if ($prev === null || $currentPageContent.innerHTML === '') {
        $loading.show();
        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = '';

        const ids = searchParams.get('ids').split(',');
        const customGames = await fetch(gameXboxURL(ids)).then(res => res.json());
        $currentPageContent.insertAdjacentHTML('beforeend', collectionHeaderTemplate({
          icon: '<img alt="" src="/src/assets/icons/pad.svg" width="24" height="24" />',
          title: 'Juegos',
        }));

        customGames.map((game) => requestIdleCallback(() => {
          $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
          gamesCache.set(game.id, game);
        }));
      }
    }

    if (page === 'cart') {

      if ($prevPage && $prevPage.classList.contains('cart')) {
        return;
      }

      requestIdleCallback(() => {
        $pageBack.show();
        $installBtn.hide();
      });

      if (!$prevPage) {
        $home.classList.add('page-prev-on');
      }

      $currentPage = $cart;
      $currentPageContent = $cartContent;
      $currentPageContent.innerHTML = '';

      let total = 0;
      const games = searchParams.get('ids') ? searchParams.get('ids').split(',') : Array.from(cart).reverse();
      if (games.length) {
        $loading.show();
        const scart = await fetch(gameXboxURL(games)).then(res => res.json());
        scart.map((c) => {
          total += Number(convertDollar(c.price.gold_deal || c.price.deal || c.price.amount));
          gamesCache.set(c.id, c);
          requestIdleCallback(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(c));
          });
        });
        $loading.hide();
      } else {
        requestIdleCallback(() => {
          $currentPageContent.insertAdjacentHTML('beforeend', emptyCart());
        });
      }

      if (games.length > 0) {
        requestIdleCallback(() => {
          $currentPageContent.insertAdjacentHTML(
            'afterbegin',
            `<h2>
              <img alt="" src="/src/assets/icons/cart.svg" width="25" height="25" />
              ${pluralGames(games.length)} por <x-price amount="${total}"></x-price>
            </h2>
            <small class="cart-disclaimer">El carrito funciona como calculadora y no es posible avanzar con la compra.</small>
            <button
              is="share-button"
              id="cart-share-btn"
              class="share-btn header-btn"
              aria-label="Compartir"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path opacity=".12" d="M7.8 21h8.4c1.68 0 2.52 0 3.16-.33a3 3 0 0 0 1.31-1.3c.33-.65.33-1.49.33-3.17V12H3v4.2c0 1.68 0 2.52.33 3.16a3 3 0 0 0 1.3 1.31c.65.33 1.49.33 3.17.33Z" fill="#9AA495"/><path d="M22 12a1 1 0 1 0-2 0h2ZM4 12a1 1 0 1 0-2 0h2Zm.64 8.67.45-.89-.45.9Zm-1.31-1.3.89-.46-.9.45Zm16.03 1.3-.45-.89.45.9Zm1.31-1.3.9.45-.9-.46ZM15.3 7.7a1 1 0 1 0 1.42-1.42l-1.42 1.42ZM12 3l.7-.7a1 1 0 0 0-1.4 0l.7.7ZM7.3 6.3a1 1 0 0 0 1.4 1.4L7.3 6.3ZM11 15a1 1 0 1 0 2 0h-2Zm5.2 5H7.8v2h8.4v-2Zm3.8-8v4.2h2V12h-2ZM4 16.2V12H2v4.2h2ZM7.8 20c-.86 0-1.44 0-1.89-.04-.44-.03-.66-.1-.82-.18l-.9 1.78c.48.25 1 .35 1.56.4.55.04 1.23.04 2.05.04v-2ZM2 16.2c0 .82 0 1.5.04 2.05.05.56.15 1.08.4 1.57l1.78-.91a2.16 2.16 0 0 1-.18-.82C4 17.64 4 17.06 4 16.2H2Zm3.1 3.58a2 2 0 0 1-.88-.87l-1.78.9a4 4 0 0 0 1.74 1.75l.91-1.78ZM16.2 22c.82 0 1.5 0 2.05-.04a4.09 4.09 0 0 0 1.57-.4l-.91-1.78c-.16.08-.38.15-.82.18-.45.04-1.03.04-1.89.04v2Zm3.8-5.8c0 .86 0 1.44-.04 1.89-.03.44-.1.66-.18.82l1.78.9c.25-.48.35-1 .4-1.56.04-.55.04-1.23.04-2.05h-2Zm-.18 5.36a4 4 0 0 0 1.74-1.74l-1.78-.91a2 2 0 0 1-.87.87l.9 1.78ZM16.7 6.3l-4-4-1.42 1.42 4 4 1.42-1.42Zm-5.42-4-4 4 1.42 1.42 4-4-1.42-1.42ZM11 3v12h2V3h-2Z" fill="#9AA495"/></svg>
            </button>
            `
          );
          requestIdleCallback(() => {
            document.querySelector('#cart-share-btn').show({
              title: `Mirá este carrito con ${pluralGames(games.length)} en XStore`,
              url: `${window.location.origin}${window.location.pathname}?ids=${games.join(',')}`,
            });
          });
        });
      }

    }

    if (page ===  'gamer') {
      if (!gamer || !loggedGamer) {
        $loading.show();
        return window.location.href = loginURL();
      }

      if (id === undefined) {
        id = gamer.gamertag;
      }

      requestIdleCallback(() => {
        $pageBack.show();
        $installBtn.hide();
      });

      if (!$prevPage) {
        $home.classList.add('page-prev-on');
      }

      $currentPage = $gamer;
      $currentPageContent = $gamerContent;
      $currentPageContent.innerHTML = '';

      let gamerPage;
      if (gamer.gamertag !== id) {
        $loading.show();
        gamerPage = await fetch(getGamerById(id), {
          credentials: 'include',
        }).then(res => res.json()).catch(err => ({ code: 404 }));
        $loading.hide();
      } else {
        gamerPage = gamer;
      }

      const { paths, searchParams } = getPageFromURL(window.location.href);
      if (paths.length === 3 && ['games', 'achievements', 'clips'].includes(paths[2])) {
        switch(paths[2]) {
          case 'games':
            $currentPageContent.insertAdjacentHTML('beforeend', collectionHeaderTemplate({
              title: `${id} estuvo jugando`,
              filter: false,
            }));
            const games = gamerCache.has(`${id}-games`) ? Promise.resolve(gamerCache.get(`${id}-games`)) : fetch(getGamerGamesById(id), { credentials: 'include' })
              .then(res => res.json())
              .then(g => {
                if (g.code) {
                  return window.location.href = loginURL();
                } else {
                  return g;
                }
              })
              .then(g => {
                gamerCache.set(`${id}-games`, g);
                return g;
              });
            games.then((gs) => {
              gs.map((game, i) => yieldToMain(() => {
                $currentPageContent.insertAdjacentHTML('beforeend', gamerGamesTemplate(game, id));
              }));
            });
            break;

          case 'achievements':
            $currentPageContent.insertAdjacentHTML('beforeend', collectionHeaderTemplate({
              title: `${id} en ${searchParams.get('title')}`,
              filter: false,
            }));
            const achievements = await fetch(getGamerAchievementsByTitleId(id, searchParams.get('titleId')), { credentials: 'include' })
              .then(res => res.json())
              .then(a => {
                if (a.code) {
                  $loading.show();
                  return window.location.href = loginURL();
                } else {
                  return a;
                }
              });
            achievements.map((achievement, i) => requestIdleCallback(() => {
              $currentPageContent.insertAdjacentHTML('beforeend', gamerAchievementsTemplate(achievement));
            }));
            break;

          case 'clips':
            $currentPageContent.insertAdjacentHTML('beforeend', collectionHeaderTemplate({
              title: `Clips de ${id}`,
              filter: false,
            }));
            const clips = await fetch(getGamerClipsById(id), { credentials: 'include' })
              .then(res => res.json())
              .then(c => {
                if (c.code) {
                  $loading.show();
                  return window.location.href = loginURL();
                } else {
                  return c;
                }
              });
            clips.map((clip, i) => requestIdleCallback(() => {
              $currentPageContent.insertAdjacentHTML('beforeend', gamerClipsTemplate(clip));
            }));
            $currentPageContent.addEventListener('click', (eve) => {
              if (eve.target.nodeName === 'VIDEO') {
                eve.target.src = eve.target.dataset.src;
                eve.target.controls = true;
                eve.target.autoplay = true;
              }
            });
            break;
        }

        // if (gamerGames.length === 0 || gamer.gamertag !== id) {
        //   fetch(getGamerGamesById(id), { credentials: 'include' })
        //     .then(res => res.json())
        //     .then(games => {
        //       games.map((game, i) => yieldToMain(() => {
        //         $currentPageContent.querySelector('.gamer-games').insertAdjacentHTML('beforeend', gameAchievementTemplate(gamerPage, game));
        //       }));
        //       $loading.hide();
        //       if (gamer.gamertag === id) {
        //         games.forEach(game => {
        //           db
        //             .transaction('played', 'readwrite')
        //             .objectStore('played')
        //             .add(game);
        //         });
        //       }
        //     });
        // } else {
        //   gamerGames.forEach((game, i) => yieldToMain(() => {
        //     $currentPageContent.querySelector('.gamer-games').insertAdjacentHTML('beforeend', gameAchievementTemplate(gamerPage, game));
        //   }));
        //   $loading.hide();
        // }

      } else {
        if (gamerPage.code) {
          $currentPageContent.insertAdjacentHTML('beforeend', gamerPageNotFoundTemplate());
        } else {
          $currentPageContent.insertAdjacentHTML('beforeend', gamerPageTemplate(gamerPage));

          const stats = gamerCache.has(id) ? Promise.resolve(gamerCache.get(id)) : Promise.all([
            fetch(getGamerGamesById(id, 10), { credentials: 'include' }).then(res => res.json()),
            fetch(getGamerAchievementsById(id, 20), { credentials: 'include' }).then(res => res.json()),
            fetch(getGamerClipsById(id, 10), { credentials: 'include' }).then(res => res.json()),
          ]).then(([games, achievements, clips])  => {
            const s = { games, achievements, clips };
            gamerCache.set(id, s);
            return s;
          });

          stats.then(({ games, achievements, clips }) => {
            $currentPageContent.querySelector('.gamer-stats').innerHTML = gamerPageStatsTemplate(id);
            const $games = $currentPageContent.querySelector('.gamer-games');
            const $achievements = $currentPageContent.querySelector('.gamer-achievements');
            const $clips = $currentPageContent.querySelector('.gamer-clips');

            games.map((game, i) => yieldToMain(() => {
              $games.insertAdjacentHTML('beforeend', `<li>${gamerGamesTemplate(game, id)}</li>`);
            }));

            achievements.filter(a => a.state === 'Achieved').map((achievement, i) => requestIdleCallback(() => {
              $achievements.insertAdjacentHTML('beforeend', `<li>${gamerAchievementsTemplate(achievement)}</li>`);
            }));

            clips.map((clip, i) => requestIdleCallback(() => {
              $clips.insertAdjacentHTML('beforeend', `<li>${gamerClipsTemplate(clip)}</li>`);
            }));

            $clips.addEventListener('click', (eve) => {
              if (eve.target.nodeName === 'VIDEO') {
                eve.target.src = eve.target.dataset.src;
                eve.target.controls = true;
                eve.target.autoplay = true;
              }
            });
          });
        }
      }
      // $loading.hide();

      // if (gamerGames.length === 0 || gamer.gamertag !== id) {
      //   fetch(getGamerGamesById(id), { credentials: 'include' })
      //     .then(res => res.json())
      //     .then(games => {
      //       games.map((game, i) => yieldToMain(() => {
      //         $currentPageContent.querySelector('.gamer-games').insertAdjacentHTML('beforeend', gameAchievementTemplate(gamerPage, game));
      //       }));
      //       $loading.hide();
      //       if (gamer.gamertag === id) {
      //         games.forEach(game => {
      //           db
      //             .transaction('played', 'readwrite')
      //             .objectStore('played')
      //             .add(game);
      //         });
      //       }
      //     });
      // } else {
      //   gamerGames.forEach((game, i) => yieldToMain(() => {
      //     $currentPageContent.querySelector('.gamer-games').insertAdjacentHTML('beforeend', gameAchievementTemplate(gamerPage, game));
      //   }));
      //   $loading.hide();
      // }
    }

    if (page === 'gamepass') {
      const { searchParams, page } = getPageFromURL(window.location.href);
      const sort = searchParams.get('sort');
      const filter = searchParams.get('filter');

      requestIdleCallback(() => {
        $pageBack.show();
        $installBtn.hide();
      });

      if (!$prevPage) {
        $home.classList.add('page-prev-on');
      }

      const $prev = $currentPageContent;

      $currentPage = $list;
      $currentPageContent = $listContent;

      if ($prev === null || $currentPageContent.innerHTML === '') {
        $loading.show();
        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = '';
        $currentPageContent.insertAdjacentHTML('beforeend', collectionHeaderTemplate({
          title: gamepassTitles[`${page}-${id}`],
          filter: true,
        }));

        const url = id === 'gp-deals' ? getXboxURL(id) : getGamePassURL(id);
        const gamepassGames = allGamesCache.get(`${page}-${id}`) || await fetch(url).then(res => res.json());
        if (gamepassGames.length) {
          gamepassGames.map((game, i) => requestIdleCallback(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game, i !== 0));
            gamesCache.set(game.id, game);
          }));
          allGamesCache.set(`${page}-${id}`, gamepassGames);
        } else {
          $currentPageContent.insertAdjacentHTML('beforeend', emptyList());
        }

        $loading.hide();
      }

      if ((sort && sort !== sorted) || (filter && filter !== filtered)) {
        sorted = sort;
        filtered = filter;
        $loading.show();

        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = '';
        $currentPageContent.insertAdjacentHTML('beforeend', collectionHeaderTemplate({
          title: gamepassTitles[`${page}-${id}`],
          filter: true,
        }));

        const allGames = allGamesCache.get(`${page}-${id}`);

        broadcast.postMessage({
          sort,
          filter,
          games: allGames,
        });

        broadcast.addEventListener('message', eve => {
          eve.data.games.map((game, i) => yieldToMain(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game, i !== 0));
            requestIdleCallback(() => {
              gamesCache.set(game.id, game);
            });
          }));
          $loading.hide();
        }, { once: true });
      }

      requestIdleCallback(() => {
        $modal.querySelector('.modal-content').innerHTML = filtersTemplate();
      });
    }

    if (page === 'catalog') {
      const { id, searchParams } = getPageFromURL(window.location.href);

      requestIdleCallback(() => {
        $pageBack.show();
        $installBtn.hide();
      });

      if (!$prevPage) {
        $home.classList.add('page-prev-on');
      }

      const $prev = $currentPageContent;
      const sort = searchParams.get('sort');
      const list = id + (sort || '');
      let ct;
      let pc = [];

      $currentPage = $list;
      $currentPageContent = $listContent;

      if ($prev === null || $currentPageContent.innerHTML === '') {
        $loading.show();
        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = '';
        $currentPageContent.insertAdjacentHTML('beforeend', collectionHeaderTemplate({
          title: catalogTitles[id],
          filter: true,
        }));

        const catalogGames = await fetch(getXboxCatalogURL(list)).then(res => res.json());
        if (catalogGames.games.length) {
          catalogGames.games.map((game, i) => requestIdleCallback(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game, i !== 0));
            gamesCache.set(game.id, game);
          }));
          ct = catalogGames.encodedCT;

          pc.push(catalogGames.encodedCT);

          requestIdleCallback(() => {
            $modal.querySelector('.modal-content').innerHTML = filtersCatalogTemplate();
          });

          requestIdleCallback(() => {
            const o = new IntersectionObserver(async (entries) => {
              const first = entries[0];
              if (first.isIntersecting) {
                o.unobserve(o.current);
                const moreGames = await fetch(getXboxCatalogURL(list, ct)).then(res => res.json());
                if (moreGames.games.length === 0) { return; }

                moreGames.games.map((game,i) => requestIdleCallback(() => {
                  $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game, i !== 0));
                  gamesCache.set(game.id, game);
                }));
                ct = moreGames.encodedCT;

                pc.push(moreGames.encodedCT);

                if (ct) {
                  requestIdleCallback(() => {
                    o.current = $currentPageContent.lastElementChild;
                    o.observe(o.current);
                    $currentPageContent.insertAdjacentHTML('beforeend', `<br/>`);
                  });
                }
              }
            });
            o.current = $currentPageContent.lastElementChild;
            o.observe(o.current);
          });

        } else {
          $currentPageContent.insertAdjacentHTML('beforeend', emptyList());
        }

        sorted = sort;
        $loading.hide();
      }

      if (sort !== sorted) {
        sorted = sort;
        $loading.show();

        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = '';

        showPage('catalog', id);
      }
    }

    $currentPage.removeAttribute('hidden');

    if (window.swipeToBack) {
      $currentPage.classList.add('page-on');
      $currentPage.classList.remove('page-prev-on');

    } else {
      if ($prevPage && $prevPage !== $currentPage) {
        setTimeout(() => {
          requestIdleCallback(() => {
            $prevPage.classList.remove('page-on');
            $prevPage.setAttribute('hidden', true);
          });
        }, 300);
      }

      requestIdleCallback(() => {
        $loading.hide();
        $currentPage.classList.add('page-on');
        $currentPage.classList.remove('page-prev-on');
      });
    }
  }

  async function loadHomePage() {
    await yieldToMain(() => {
      $canonical.href = window.location.origin + window.location.pathname;
      if (document.querySelector('[hreflang]') === null) {
        document.head.insertAdjacentHTML('beforeend', `
          <link href="https://xstoregames.com/" rel="alternate" hreflang="x-default" />
          <link href="https://xstoregames.com/" rel="alternate" hreflang="es-ar" />
          <link href="https://xstoregames.com/mx-store" rel="alternate" hreflang="es-mx" />
        `);
      }
    });

    await Promise.all(sections.slice(0, 2).map(async ({ type }) => {
      const games = await fetch(getXboxURL(type)).then(res => res.json());
      const section = sections.find(section => section.type === type);
      section.list.push(...games);
      games.forEach((game) => gamesCache.set(game.id, game));
    }));

    const hotSale = sections[1].list.reduce(function (p, v) {
      return ( p.price.off > v.price.off ? p : v );
    });
    const lcp = hotSale.images.featurepromotionalsquareart ?
      hotSale.images.featurepromotionalsquareart.url : hotSale.images.boxart?.url;
      $preloadLCP.href = lcp + '?w=720&q=70';

    await yieldToMain(() => {
      $home.insertAdjacentHTML('beforeend', gameImportantTemplate(hotSale));
    });

    // $preloadLCP.href = window.location.origin + '/src/assets/xbox-direct.jpg';
    // await yieldToMain(() => {
    //   $home.insertAdjacentHTML('beforeend', theGameAward());
    // });

    await yieldToMain(() => {
      $splash.classList.add('bye');
      setTimeout(() => {
        $splash.toggleAttribute('hidden');
      }, 500);
      $loading.hide();
      $home.removeAttribute('hidden');
    });

    sections.slice(0, 2).forEach(async (section, index) => {
      await yieldToMain(() => {
        $home.insertAdjacentHTML('beforeend', sectionTemplate(section));
        if (index === 0) {
          $home.insertAdjacentHTML('beforeend', '<notification-prompt hidden></notification-prompt>');
        }
      });
    });

    requestIdleCallback(async () => {
      $home.insertAdjacentHTML('beforeend', supportSection());

      await Promise.all(sections.slice(2, sections.length).map(async ({ type }) => {
        const games = await fetch(getXboxURL(type)).then(res => res.json());
        const section = sections.find(section => section.type === type);
        section.list.push(...games);
        games.forEach((game) => gamesCache.set(game.id, game));
      }));

      sections.slice(2, sections.length).forEach(async(section, index) => {
        await yieldToMain(() => {
          $home.insertAdjacentHTML('beforeend', sectionTemplate(section));
          if (index === 0) {
            $home.insertAdjacentHTML('beforeend', gamepassSection());
          }
        });
      });

      requestIdleCallback(() => {
        const o = new IntersectionObserver(async (entries) => {
          const first = entries[0];
          if (first.isIntersecting) {
            o.unobserve(o.current);
            await yieldToMain(() => {
              $home.insertAdjacentHTML('beforeend', catalogSection());
            });
            const { results } = await fetch(getMarketplaceItemsURL()).then(res => res.json());
            await yieldToMain(() => {
              $home.insertAdjacentHTML('beforeend', marketplaceItemsTemplate(results));
            });
            await yieldToMain(() => {
              $home.insertAdjacentHTML('beforeend', finanzasARGSection());
            });
          }
        });

        o.current = $home.lastElementChild;
        o.observe(o.current);
      });
    });
  }

  async function loadSearchPage(q) {
    $prevPage = $currentPage;

    setTimeout(() => {
      requestIdleCallback(() => {
        $home.setAttribute('hidden', true);
        $main.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      });
    }, 300);

    requestIdleCallback(() => {
      $pageBack.show();
      $search.close();
      $installBtn.hide();
    });

    $currentPage = $results
    $currentPageContent = $resultsContent;

    if ($currentPageContent.innerHTML === '') {
      $loading.show();
      const searchResults = await fetch(searchXboxURL(q)).then(res => res.json());
      if (searchResults.length) {
        const gameResults = await fetch(gameXboxFlyURL(searchResults.join(','))).then(res => res.json());
        gameResults.map((game) => {
          gamesCache.set(game.id, game);
          requestIdleCallback(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
          })
        });
        $loading.hide();
      } else {
        requestIdleCallback(() => {
          $currentPageContent.insertAdjacentHTML('beforeend', emptyList());
        });
      }
    }

    if (!$prevPage) {
      $home.classList.add('page-prev-on');
    }

    $currentPage.removeAttribute('hidden');

    if (window.swipeToBack) {
      $currentPage.classList.add('page-on');
      $currentPage.classList.remove('page-prev-on');

    } else {
      if ($prevPage && $prevPage !== $currentPage) {
        setTimeout(() => {
          requestIdleCallback(() => {
            $prevPage.classList.remove('page-on');
            $prevPage.setAttribute('hidden', true);
          });
        }, 300);
      }

      requestIdleCallback(() => {
        $loading.hide();
        $currentPage.classList.add('page-on');
        $currentPage.classList.remove('page-prev-on');
      });
    }
  }

  const { page, id, searchParams } = getPageFromURL(window.location.href);

  switch (page) {
    case 'home':
      loadHomePage();
      break;

    case 'wishlist':
      if (id === 'export') {
        alert(`${window.location.origin}${basePath}/wishlist/import?ids=${Array.from(wishlist)}`);

      } else if (id === 'import') {
        const wishs = searchParams.get('ids').split(',');
        wishs.forEach((id) => wishlist.add(id));
        document.addEventListener('wishlistdone', () => {
          wishs.forEach((id) => {
            const game = gamesCache.get(id);
            db
              .transaction('wishlist', 'readwrite')
              .objectStore('wishlist')
              .add({
                id,
                title:  game.title,
                amount: game.price.amount,
              });
          });
          window.localStorage.setItem('wishlist', JSON.stringify(Array.from(wishlist)));
        });
      }

      showPage('wishlist');
      break;

    case 'search':
      const q = searchParams.get('q');
      $resultsContent.innerHTML = '';
      history.replaceState({ page: 'results', q, }, 'Resultados de busqueda', `${basePath}/search?q=${q}`);
      loadSearchPage(q);
      break;

    case 'news':
    case 'game':
    case 'games':
    case 'cart':
    case 'collection':
    case 'gamepass':
    case 'catalog':
    case 'gamer':
      history.replaceState({ page, id }, document.title, window.location.href);
      showPage(page, id);
      break;
  }


  window.addEventListener('popstate', (eve) => {
    if (controller && !controller.aborted) {
      controller.abort();
    }

    if (history.state) {
      history.state.referer = window.sessionStorage.getItem('page');
      window.sessionStorage.setItem('page', history.state.page);
    };

    $prevPage = $currentPage;

    if (window.swipeToBack) {
      $prevPage.setAttribute('hidden', true);
    }

    if (eve.state === null) {
      if ($home.innerHTML === '') {
        window.location.reload();
        return;
      }

      $prevPage.classList.remove('page-on');
      setTimeout(() => {
        requestIdleCallback(() => {
          $prevPage.setAttribute('hidden', true);
          $prevPage.classList.remove('page-prev-on');
          $prevFocus && $prevFocus.focus();
        });
      }, 300);

      $main.style = undefined;
      document.body.style = undefined;
      $home.removeAttribute('hidden');

      if (window.swipeToBack) {
        $home.classList.remove('page-prev-on');

      } else {
        setTimeout(() => {
          requestIdleCallback(() => {
            $home.classList.remove('page-prev-on');
          });
        }, 100);
      }

      $pageBack.hide();
      $installBtn.show();
      $searchForm.elements[0].value = '';

      $currentPage = null;
      $currentPageContent = null;

      sorted = null;
      filtered = null;

      document.title = documentTitle;
      $metaDescription.content = documentDescription;
      $canonical.href = window.location.origin + window.location.pathname;

    } else {
      if ($prevPage && history.state?.referer !== history.state?.page && !['news'].includes(eve.state.page)) {
        $prevPage.classList.remove('page-on');
        setTimeout(() => {
          requestIdleCallback(() => {
            $prevPage.setAttribute('hidden', true);
            $prevFocus && $prevFocus.focus();
          });
        }, 300);
      }

      if (eve.state.page === 'results') {
        loadSearchPage(eve.state.q);
      } else {
        showPage(eve.state.page, eve.state.id);
      }
    }

    window.swipeToBack = false;
  });

  requestIdleCallback(() => {
    document.body.addEventListener('click', async (eve) => {
      if (!eve.target.classList.contains('link')) { return; }
      $prevFocus = document.activeElement;

      eve.preventDefault();

      const { page, id, searchParams } = getPageFromURL(eve.target.href);

      const referer = history.state?.page;
      window.sessionStorage.setItem('page', page);

      if (searchParams.get('sort')) {
        history.replaceState({ referer, page, id }, '', eve.target.href);
      } else {
        history.pushState({ referer, page, id }, '', eve.target.href);
      }

      showPage(page, id);
    });

    document.body.addEventListener('click', (eve) => {
      if (eve.target.classList.contains('next')) {
        eve.target.parentNode.scrollBy(660, 0);
      }
      if (eve.target.classList.contains('prev')) {
        eve.target.parentNode.scrollBy(-660, 0);
      }
    });

    document.body.addEventListener('click', (eve) => {
      if (eve.target.classList.contains('sort-btn') || eve.target.classList.contains('settings-btn')) {
        $modal.toggleAttribute('hidden');
        yieldToMain(() => $modal.classList.add('modal-on'));
        $currentPage?.classList.add('page-scale');
        $currentPage?.classList.add('page-scale');
        $modal.querySelector('.modal-content').focus();
      }
    });

    document.body.addEventListener('click', (eve) => {
      if (eve.target.classList.contains('settings-btn')) {
        eve.preventDefault();
        $modal.querySelector('.modal-content').innerHTML = settingsTemplate();
      }
    });

    $modal.addEventListener('click', (eve) => {
      if (eve.target.nodeName === 'SELECT') {
        return;
      }
      $modal.classList.remove('modal-on');
      $modal.toggleAttribute('hidden');
      $currentPage?.classList.remove('page-scale');
    });

    $modal.addEventListener('submit', (eve) => {
      eve.preventDefault();
      const state = eve.target.elements[0].value;
      window.localStorage.setItem('state', state);
      window.location.reload();
    });

    $searchForm.addEventListener('submit', async (eve) => {
      eve.preventDefault();
      $resultsContent.innerHTML = '';

      const referer = history.state?.page;
      window.sessionStorage.setItem('page', page);

      const q = eve.target.elements[0].value;
      if ($currentPageContent === $resultsContent) {
        history.replaceState({ referer, page: 'results', q, }, 'Resultados de busqueda', `${basePath}/search?q=${q}`);
      } else {
        history.pushState({ referer, page: 'results', q, }, 'Resultados de busqueda', `${basePath}/search?q=${q}`);
      }

      loadSearchPage(q);
    });


    $gamer.addEventListener('submit', async (eve) => {
      eve.preventDefault();
      const id = eve.target.elements[0].value;
      if (id === '') {
        return;
      }
      history.pushState({ page:'gamer', id }, document.title, `${basePath}/gamer/${id}`);
      await yieldToMain(() => { $currentPageContent.innerHTML = ''; });
      showPage('gamer', id);
    });
  });

  requestIdleCallback(() => {
    $searchForm.addEventListener('submit', (eve) => {
      gtag('event', 'search', {
        search_term: eve.target.elements[0].value,
      });
    });

    $home.addEventListener('click', (eve) => {
      if (eve.target.classList.contains('marketplace_item')) {
        gtag('event', 'marketplace_item', {
          page_location: eve.target.href,
        });
      }
    });

    $detailContent.addEventListener('click', (eve) => {
      if (eve.target.classList.contains('game-buy-now')) {
        const { gameId } = getPageFromURL(window.location.href);
        const game = gamesCache.get(gameId);

        gtag('event', 'begin_checkout', {
          page_location: window.location.href,
          currency: 'ARS',
          value: parseFloat(convertDollar(game.price.deal || game.price.amount)),
        });
      }

      if (eve.target.classList.contains('share-btn')) {
        gtag('event', 'share', {
          page_location: window.location.href,
        });
      }

      if (eve.target.classList.contains('fav-btn')) {
        if (eve.target.active) {
          gtag('event', 'add_to_wishlist', {
            page_location: window.location.href,
          });
        }
      }

      if (eve.target.classList.contains('cart-btn')) {
        if (eve.target.active) {
          gtag('event', 'add_to_cart', {
            page_location: window.location.href,
          });
        }
      }

      if (eve.target.classList.contains('fav-btn')) {
        const { gameId } = getPageFromURL(window.location.href);

        if (wishlist.has(gameId)) {
          wishlist.delete(gameId);

          db
            .transaction('wishlist', 'readwrite')
            .objectStore('wishlist')
            .delete(gameId);

        } else {
          wishlist.add(gameId);

          const game = gamesCache.get(gameId);
          db
            .transaction('wishlist', 'readwrite')
            .objectStore('wishlist')
            .add({
              gameId,
              title:  game.title,
              amount: game.price.amount,
            });
        }

        window.localStorage.setItem('wishlist', JSON.stringify(Array.from(wishlist)));
      }

      if (eve.target.classList.contains('cart-btn')) {
        const { gameId } = getPageFromURL(window.location.href);

        if (cart.has(gameId)) {
          cart.delete(gameId);
        } else {
          cart.add(gameId);
        }
        const cartArr = Array.from(cart);
        window.sessionStorage.setItem('cart', JSON.stringify(cartArr));

        document.dispatchEvent(new CustomEvent('cartupdate', { detail: { games: cartArr.length } }));
      }
    });
    window.addEventListener('appinstalled', (eve) => {
      gtag('event', 'app_installed');
    });
  });

  requestIdleCallback(() => {
    import('./swipes.js');
  });
}
bootApp();
