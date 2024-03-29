import {
  getXboxURL,
  gameXboxURL,
  getXboxNewsURL,
  getGamePassURL,
  getVideoURL,
  slugify,
  getPageFromURL,
  getMarketplaceItemsURL,
  convertDollar,
  fetchSearchGames,
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
  marketplaceItemsTemplate,
  filtersTemplate,
} from './templates.js';

const documentTitle = document.title;
const documentDescription = document.querySelector('[name="description"]').content;

const LIMIT = 10;

const gamesCache = new Map();
const allGamesCache = new Map();

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

async function bootApp() {
  const $loading = document.querySelector('x-loader');
  const $splash = document.querySelector('.splash-loading');

  const wishlist = new Set(
    JSON.parse(window.localStorage.getItem('wishlist'))
  );

  const cart = new Set(
    JSON.parse(window.sessionStorage.getItem('cart'))
  );

  let sorted = null;

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

  const $modal = document.querySelector('.modal');

  let $currentPage = null;
  let $prevPage = null;
  let $currentPageContent = null;
  let $prevFocus = null;

  let db = null;
  const iddb = window.indexedDB.open('wishlist', 1);
  iddb.onupgradeneeded = eve => {
    eve.currentTarget.result
      .createObjectStore(
        'wishlist', { keyPath: 'id', autoIncrement: true }
      )
      .createIndex('game', 'game', { unique: true });
  };
  iddb.onsuccess = eve => { db = eve.target.result; };

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

      $home.setAttribute('hidden', true);

      requestIdleCallback(() => {
        $pageBack.hide();
        $installBtn.hide();
      });

      if ($prevPage) {
        $prevPage.setAttribute('hidden', true);
        $prevPage.classList.remove('page-on');
      }

      $currentPage = $wish;
      $currentPageContent = $wishContent;
      $currentPageContent.innerHTML = '<h2><img alt="" src="/src/assets/icons/heart.svg" width="24" height="24" /> Favoritos</h2>';

      const games = Array.from(wishlist).reverse().join(',');
      if (games.length) {
        $loading.show();
        const wish = await fetch(gameXboxURL(games)).then(res => res.json());
        wish.map((w) => {
          gamesCache.set(w.id, w);
          requestIdleCallback(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(w));
          });
        });
        $loading.hide();
        document.dispatchEvent(new CustomEvent('wishlistdone'));
      } else {
        requestIdleCallback(() => {
          $currentPageContent.insertAdjacentHTML('beforeend', emptyWishlist());
        });
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
      $currentPageContent.innerHTML = '<h2><img alt="" src="/src/assets/icons/news.svg" width="24" height="24" /> Noticias recientes</h2>';

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

    }

    if (page === 'collection') {
      const { searchParams } = getPageFromURL(window.location.href);
      const sort = searchParams.get('sort');

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
        $currentPageContent.insertAdjacentHTML('beforeend', `
          <h2>${section.icon}${section.title}</h2>
          <button id="sort-btn" class="sort-btn header-btn" aria-label="Ordenar">
            <svg aria-hidden="true" fill="none" width="22" height="22" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M14.84 16.72a.76.76 0 0 1-.59.28.73.73 0 0 1-.53-.22l-3-3a.75.75 0 0 1 1.06-1.07l1.72 1.73V3.75a.75.75 0 0 1 1.5 0v10.68l1.72-1.71a.75.75 0 1 1 1.06 1.06l-2.94 2.94ZM6.34 3.28A.76.76 0 0 0 5.75 3c-.2 0-.38.07-.53.22l-3 3A.75.75 0 0 0 3.28 7.3L5 5.56v10.69a.75.75 0 0 0 1.5 0V5.57l1.72 1.71a.75.75 0 1 0 1.06-1.06L6.34 3.28Z" fill="#9AA495"/></svg>
          </button>
        `);

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

      if (sort && sort !== sorted) {
        sorted = sort;
        $loading.show();

        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = '';
        $currentPageContent.insertAdjacentHTML('beforeend', `
          <h2>${section.icon}${section.title}</h2>
          <button id="sort-btn" class="sort-btn header-btn" aria-label="Ordenar">
            <svg aria-hidden="true" fill="none" width="22" height="22" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M14.84 16.72a.76.76 0 0 1-.59.28.73.73 0 0 1-.53-.22l-3-3a.75.75 0 0 1 1.06-1.07l1.72 1.73V3.75a.75.75 0 0 1 1.5 0v10.68l1.72-1.71a.75.75 0 1 1 1.06 1.06l-2.94 2.94ZM6.34 3.28A.76.76 0 0 0 5.75 3c-.2 0-.38.07-.53.22l-3 3A.75.75 0 0 0 3.28 7.3L5 5.56v10.69a.75.75 0 0 0 1.5 0V5.57l1.72 1.71a.75.75 0 1 0 1.06-1.06L6.34 3.28Z" fill="#9AA495"/></svg>
          </button>
        `);

        const allGames = allGamesCache.get(id) || await fetch(getXboxURL(id, 0, 10000))
          .then(res => res.json()).then(res => { allGamesCache.set(id, res); return res; });

        broadcast.postMessage({
          sort,
          games: allGames,
        });

        broadcast.addEventListener('message', eve => {
          eve.data.sorted.map((game, i) => yieldToMain(() => {
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
        $currentPageContent.insertAdjacentHTML('beforeend', `<h2><img alt="" src="/src/assets/icons/pad.svg" width="24" height="24" /> Juegos</h2>`);
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
          total += Number(convertDollar(c.price.deal || c.price.amount));
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
            `
          );
        });
      }
    }

    if (page === 'gamepass') {
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

        const gamepassGames = await fetch(getGamePassURL(id)).then(res => res.json());
        if (gamepassGames.length) {
          gamepassGames.map((game, i) => requestIdleCallback(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game, i !== 0));
            gamesCache.set(game.id, game);
          }));
        } else {
          $currentPageContent.insertAdjacentHTML('beforeend', emptyList());
        }

        $loading.hide();
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
            const { results } = await fetch(getMarketplaceItemsURL()).then(res => res.json());
            await yieldToMain(() => {
              $home.insertAdjacentHTML('beforeend', marketplaceItemsTemplate(results));
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
      const searchResults = await fetchSearchGames(q);
      if (searchResults.length) {
        searchResults.map((game) => {
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
      history.replaceState({ page, id }, document.title, window.location.href);
      showPage(page, id);
      break;
  }


  window.addEventListener('popstate', (eve) => {
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

      document.title = documentTitle;
      $metaDescription.content = documentDescription;
      $canonical.href = window.location.origin + window.location.pathname;

    } else {
      if ($prevPage && !['wishlist', 'news'].includes(eve.state.page)) {
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

      if (searchParams.get('sort')) {
        history.replaceState({ page, id }, '', eve.target.href);
      } else {
        history.pushState({ page, id }, '', eve.target.href);
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
      if (eve.target.classList.contains('sort-btn')) {
        $modal.toggleAttribute('hidden');
        yieldToMain(() => $modal.classList.add('modal-on'));
        $currentPage.classList.add('page-scale');
        $modal.querySelector('.modal-content').focus();
      }
    });

    $modal.addEventListener('click', function() {
      $modal.classList.remove('modal-on');
      this.toggleAttribute('hidden');
      $currentPage.classList.remove('page-scale');
    });

    $searchForm.addEventListener('submit', async (eve) => {
      eve.preventDefault();
      $resultsContent.innerHTML = '';
      const q = eve.target.elements[0].value;
      if ($currentPageContent === $resultsContent) {
        history.replaceState({ page: 'results', q, }, 'Resultados de busqueda', `${basePath}/search?q=${q}`);
      } else {
        history.pushState({ page: 'results', q, }, 'Resultados de busqueda', `${basePath}/search?q=${q}`);
      }

      loadSearchPage(q);
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
