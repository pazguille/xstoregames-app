import {
  getXboxURL,
  searchXboxURL,
  gameXboxURL,
  getXboxNewsURL,
  getGamePassURL,
  updateDollar,
  getVideoURL,
  slugify,
} from './utils.js';

import {
  sectionTemplate,
  gameCardTemplate,
  gameDetailTemplate,
  newsTemplate,
  emptyList,
  emptyWishlist,
  gamepassSection,
  goldSection,
} from './templates.js';

const documentTitle = document.title;
const documentDescription = document.querySelector('[name="description"]').content;

const LIMIT = 10;

const gamesCache = new Map();

const sections = [
  {
    type: 'new',
    title: 'Salidos del horno',
    list: [],
    skipitems: 0,
  },
  {
    type: 'deals',
    title: 'Ahorrate unos mangos',
    list: [],
    skipitems: 0,
  },
  {
    type: 'coming',
    title: '¡Mirá lo que se viene!',
    list: [],
    skipitems: 0,
  },
  {
    type: 'best',
    title: 'Deberías jugarlos',
    list: [],
    skipitems: 0,
  },
  {
    type: 'most',
    title: 'Los más jugados',
    list: [],
    skipitems: 0,
  },
  {
    type: 'free',
    title: 'Gratarola',
    list: [],
    skipitems: 0,
  },
];

async function bootApp() {
  const dollar = JSON.parse(window.localStorage.getItem('dollar'));
  if (!dollar || dollar.date !== new Date().toDateString()) {
    await updateDollar();
  } else {
    window.dollar = dollar.amount;
    updateDollar();
  }

  const wishlist = new Set(
    JSON.parse(window.localStorage.getItem('wishlist'))
  );

  const $main = document.querySelector('main');
  const $loading = document.querySelector('x-loader');

  const $metaDescription = document.querySelector('[name="description"]');

  const $installBtn = document.querySelector('#install-btn');
  const $pageBack = document.querySelector('#page-back-btn');
  const $shareBtn = document.querySelector('#share-btn');
  const $favBtn = document.querySelector('#fav-btn');

  const $search = document.querySelector('#search-collapse');
  const $searchForm = document.querySelector('#search');

  const $home = document.querySelector('.home');
  const $detail = document.querySelector('.detail');
  const $detailContent = document.querySelector('.detail-content');
  const $list = document.querySelector('.collection');
  const $listContent = document.querySelector('.collection-content');
  const $results = document.querySelector('.results');
  const $resultsContent = document.querySelector('.results-content');

  const $news = document.querySelector('.news');
  const $newsContent = document.querySelector('.news-content');
  const $wish = document.querySelector('.wish');
  const $wishContent = document.querySelector('.wish-content');

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

  $favBtn.addEventListener('click', () => {
    const { pathname } = new URL(window.location.href);
    const pathSplit = pathname.split('/');
    const id = pathSplit[2].split('_')[1];

    if (wishlist.has(id)) {
      wishlist.delete(id);

      db
        .transaction('wishlist', 'readwrite')
        .objectStore('wishlist')
        .delete(id);

    } else {
      wishlist.add(id);

      const game = gamesCache.get(id);
      db
        .transaction('wishlist', 'readwrite')
        .objectStore('wishlist')
        .add({
          id,
          title:  game.title,
          amount: game.price.amount,
        });
    }

    window.localStorage.setItem('wishlist', JSON.stringify(Array.from(wishlist)));
  });

  document.body.addEventListener('click', async (eve) => {
    if (!eve.target.classList.contains('link')) { return; }
    $prevFocus = document.activeElement;

    eve.preventDefault();

    const { pathname } = new URL(eve.target.href);
    const pathSplit = pathname.split('/');
    const page = pathSplit[1];
    const id = pathSplit[2];

    history.pushState({ page, id }, '', eve.target.href);
    showPage(page, id);
  });

  window.addEventListener('popstate', (eve) => {
    if (window.swipeToBack) {
      const $prev = $currentPage;
      $currentPage.setAttribute('hidden', true);
      setTimeout(() => {
        requestIdleCallback(() => {
          $prev.removeAttribute('hidden');
        });
      }, 300);
    }

    if (eve.state === null) {
      if ($home.innerHTML === '') {
        window.location.reload();
        return;
      }

      $prevPage = $currentPage;
      $prevPage.classList.remove('page-on');
      setTimeout(() => {
        requestIdleCallback(() => {
          $prevPage.setAttribute('hidden', true);
          $prevFocus && $prevFocus.focus();
        });
      }, 300);

      $main.style = undefined;
      document.body.style = undefined;
      $home.removeAttribute('hidden');
      $pageBack.hide();
      $shareBtn.hide();
      $favBtn.hide();

      $search.show();
      $installBtn.show();
      $searchForm.elements[0].value = '';

      $currentPage = null;
      $currentPageContent = null;

      document.title = documentTitle;
      $metaDescription.content = documentDescription;

    } else if (eve.state.page === 'game') {
      $prevPage = $currentPage;
      showPage(eve.state.page, eve.state.id);

    } else if (eve.state.page === 'results') {
      if ($currentPage) {
        $prevPage = $currentPage;
        $prevPage.classList.remove('page-on');
        setTimeout(() => {
          requestIdleCallback(() => {
            $prevPage.setAttribute('hidden', true);
            $prevFocus && $prevFocus.focus();
          });
        }, 300);
      }
      loadSearchPage(eve.state.q);

    } else if (eve.state.page === 'wishlist') {
      showPage(eve.state.page);

    } else if (eve.state.page === 'news') {
      showPage(eve.state.page);

    } else if (eve.state.page === 'collection') {
      if ($currentPage) {
        $prevPage = $currentPage;
        $prevPage.classList.remove('page-on');
        setTimeout(() => {
          requestIdleCallback(() => {
            $prevPage.setAttribute('hidden', true);
            $prevFocus && $prevFocus.focus();
          });
        }, 300);
      }
      showPage(eve.state.page, eve.state.id);

    } else if (eve.state.page === 'gamepass') {
      if ($currentPage) {
        $prevPage = $currentPage;
        $prevPage.classList.remove('page-on');
        setTimeout(() => {
          requestIdleCallback(() => {
            $prevPage.setAttribute('hidden', true);
            $prevFocus && $prevFocus.focus();
          });
        }, 300);
      }
      showPage(eve.state.page, eve.state.id);

    } else if (eve.state.page === 'gold') {
      if ($currentPage) {
        $prevPage = $currentPage;
        $prevPage.classList.remove('page-on');
        setTimeout(() => {
          requestIdleCallback(() => {
            $prevPage.setAttribute('hidden', true);
            $prevFocus && $prevFocus.focus();
          });
        }, 300);
      }
      showPage(eve.state.page, eve.state.id);
    }

    window.swipeToBack = false;
  });

  $searchForm.addEventListener('submit', async (eve) => {
    eve.preventDefault();
    const q = eve.target.elements[0].value;
    $pageBack.show();
    loadSearchPage(q);
  });

  async function showPage(page, id) {
    $prevPage = $currentPage;

    $main.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.title = documentTitle;
    $metaDescription.content = documentDescription;

    setTimeout(() => {
      requestIdleCallback(() => {
        $home.setAttribute('hidden', true);
      });
    }, 300);

    if (page === 'wishlist') {
      $home.setAttribute('hidden', true);

      requestIdleCallback(() => {
        $pageBack.hide();
        $shareBtn.hide();
        $favBtn.hide();
        $search.hide();
        $installBtn.hide();
      });

      if ($prevPage) {
        $prevPage.setAttribute('hidden', true);
        $prevPage.classList.remove('page-on');
      }

      $currentPage = $wish;
      $currentPageContent = $wishContent;
      $currentPageContent.innerHTML = '<h2>Favoritos</h2>';

      const games = Array.from(wishlist).reverse().join(',');
      if (games.length) {
        $loading.show();
        const wish = await fetch(gameXboxURL(games)).then(res => res.json());
        wish.map((w) => requestIdleCallback(() => {
          $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(w));
        }));
        $loading.hide();
      } else {
        requestIdleCallback(() => {
          $currentPageContent.insertAdjacentHTML('beforeend', emptyWishlist());
        });
      }
    }

    if (page === 'news') {
      $home.setAttribute('hidden', true);

      requestIdleCallback(() => {
        $search.hide();
        $installBtn.hide();
        $pageBack.hide();
      });

      if ($prevPage) {
        $prevPage.setAttribute('hidden', true);
        $prevPage.classList.remove('page-on');
      }

      $currentPage = $news;
      $currentPageContent = $newsContent;
      $currentPageContent.innerHTML = '<h2>Noticias recientes</h2>';

      $loading.show();
      const news = await fetch(getXboxNewsURL()).then(res => res.json());
      news.map((n) => requestIdleCallback(() => {
        $currentPageContent.insertAdjacentHTML('beforeend', newsTemplate(n));
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
        $search.hide();
        $installBtn.hide();
      });

      if ($prevPage) {
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

      const html = gameDetailTemplate(game);
      requestIdleCallback(() => {
        document.title = `${game.title} | XStore`;
        $metaDescription.content = `${game.title}: ${game.description.split('.')[0].replace(/\n/gi, '')}.`;
        $shareBtn.show({
          title: `${game.title} en XStore`,
          url: window.location.href,
        });
        $favBtn.show(wishlist.has(gameId));
        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = html;
      });

      requestIdleCallback(async () => {
        if (!window.matchMedia('(prefers-reduced-motion)').matches || (navigator.connection && !navigator.connection.saveData)) {
          const video = await fetch(getVideoURL(slugify(game.title))).then(res => res.json());
          if (video && video.full) {
            document.querySelector('video').src = video.full;
          }
        }
      })
    }

    if (page === 'collection') {
      requestIdleCallback(() => {
        $pageBack.show();
        $search.hide();
        $installBtn.hide();
        $shareBtn.hide();
        $favBtn.hide();
      });

      const $prev = $currentPageContent;

      $currentPage = $list;
      $currentPageContent = $listContent;

      if ($prev === null || $currentPageContent.innerHTML === '') {
        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = '';
        const section = sections.find(section => section.type === id);
        $currentPageContent.insertAdjacentHTML('beforeend', `<h2>${section.title}</h2>`);
        section.list.map((game) => requestIdleCallback(() => {
          $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
          gamesCache.set(game.id, game);
        }));

        requestIdleCallback(() => {
          const o = new IntersectionObserver(async (entries) => {
            const first = entries[0];
            if (first.isIntersecting) {
              o.unobserve(o.current);
              const moreGames = await fetch(getXboxURL(id, section.skipitems += LIMIT)).then(res => res.json());
              if (moreGames.length === 0) { return; }
              moreGames.map((game) => requestIdleCallback(() => {
                $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
                gamesCache.set(game.id, game);
              }));
              requestIdleCallback(() => {
                o.current = $currentPageContent.lastElementChild;
                o.observe(o.current);
                section.list.push(...moreGames);
              });
            }
          });
          o.current = $currentPageContent.lastElementChild;
          o.observe(o.current);
        });
      }
    }

    if (page === 'gamepass') {
      requestIdleCallback(() => {
        $pageBack.show();
        $search.hide();
        $installBtn.hide();
        $shareBtn.hide();
        $favBtn.hide();
      });

      const $prev = $currentPageContent;

      $currentPage = $list;
      $currentPageContent = $listContent;

      if ($prev === null || $currentPageContent.innerHTML === '') {
        $loading.show();
        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = '';

        const gamepassGames = await fetch(getGamePassURL(id)).then(res => res.json());
        if (gamepassGames.length) {
          gamepassGames.map((game) => requestIdleCallback(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
            gamesCache.set(game.id, game);
          }));
        } else {
          $currentPageContent.insertAdjacentHTML('beforeend', emptyList());
        }

        $loading.hide();
      }
    }

    if (page === 'gold') {
      requestIdleCallback(() => {
        $pageBack.show();
        $search.hide();
        $installBtn.hide();
        $shareBtn.hide();
        $favBtn.hide();
      });

      const $prev = $currentPageContent;

      $currentPage = $list;
      $currentPageContent = $listContent;

      if ($prev === null || $currentPageContent.innerHTML === '') {
        $loading.show();
        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = '';

        const goldGames = await fetch(getXboxURL(id)).then(res => res.json());
        if (goldGames.length) {
          goldGames.map((game) => requestIdleCallback(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
            gamesCache.set(game.id, game);
          }));
        } else {
          $currentPageContent.insertAdjacentHTML('beforeend', emptyList());
        }

        $loading.hide();
      }

    }

    $currentPage.removeAttribute('hidden');
    requestIdleCallback(() => {
      $currentPage.classList.add('page-on');
    });
  }

  function loadHomePage() {
    const preloadLCP = sections[0].list[0];
    const lcp = preloadLCP.images.titledheroart ?
      (preloadLCP.images.titledheroart.url || preloadLCP.images.titledheroart[0].url)
      : preloadLCP.images.screenshot[0].url;
    document.querySelector('#preloadLCP').href = lcp + '?w=630';

    $home.removeAttribute('hidden');
    sections.forEach((section, index) => {
      requestIdleCallback(() => {
        $home.insertAdjacentHTML('beforeend', sectionTemplate(section));
        if (index === 0) {
          $home.insertAdjacentHTML('beforeend', '<notification-prompt hidden></notification-prompt>');
        }

        if (index === 2) {
          $home.insertAdjacentHTML('beforeend', gamepassSection());
        }

        if (index === 5) {
          $home.insertAdjacentHTML('beforeend', goldSection());
        }
      });
    });
  }

  async function loadSearchPage(q) {
    requestIdleCallback(() => {
      $pageBack.show();
      $search.show();
      $installBtn.hide();
      $shareBtn.hide();
      $favBtn.hide();
    });

    $currentPage = $results
    $currentPageContent = $resultsContent;

    if (history.state === null) {
      history.pushState({ page: 'results', q, }, 'Resultados de busqueda', `/search?q=${q}`);
    } else {
      history.replaceState({ page: 'results', q, }, 'Resultados de busqueda', `/search?q=${q}`);
    }

    $currentPage.removeAttribute('hidden');
    requestIdleCallback(() => {
      $currentPage.classList.add('page-on');
    });

    $currentPageContent.innerHTML = '';
    $loading.show();
    $search.close();
    $main.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const searchResults = await fetch(searchXboxURL(q)).then(res => res.json());
    $loading.hide();
    searchResults.map((game) => requestIdleCallback(() => {
      $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
      gamesCache.set(game.id, game);
    }));
  }

  await Promise.all(sections.map(async ({ type }) => {
    const games = await fetch(getXboxURL(type)).then(res => res.json());
    const section = sections.find(section => section.type === type);
    section.list.push(...games);
    games.forEach((game) => gamesCache.set(game.id, game));
  }));

  const { pathname, searchParams } = new URL(window.location.href);
  const pathSplit = pathname.split('/');
  const page = pathSplit[1];
  const id = pathSplit[2];

  switch (page) {
    case '':
      loadHomePage();
      break;
    case 'wishlist':
      showPage('wishlist');
      break;
    case 'news':
      showPage('news');
      break;
    case 'game':
      showPage('game', id);
      break;
    case 'collection':
      showPage('collection', id);
      break;
    case 'gamepass':
      showPage('gamepass', id);
      break;
    case 'gold':
      showPage('gold', id);
      break;
    case 'search':
      const q = searchParams.get('q');
      loadSearchPage(q);
      break;
  }

  requestIdleCallback(() => {
    $loading.hide();
  });

  requestIdleCallback(() => {
    $searchForm.addEventListener('submit', (eve) => {
      gtag('event', 'search', {
        search_term: eve.target.elements[0].value,
      });
    });
    $shareBtn.addEventListener('click', (eve) => {
      gtag('event', 'share', {
        page_location: window.location.href,
      });
    });
    $favBtn.addEventListener('click', (eve) => {
      if (eve.target.active) {
        gtag('event', 'add_to_wishlist', {
          page_location: window.location.href,
        });
      }
    });
    $detailContent.addEventListener('click', (eve) => {
      if (eve.target.classList.contains('game-buy-now')) {
        gtag('event', 'begin_checkout', {
          page_location: window.location.href,
        });
      }
    });
    window.addEventListener('appinstalled', (eve) => {
      gtag('event', 'app_installed');
    });
  });
}
bootApp();

requestIdleCallback(() => {
  import('./swipes.js');
});
