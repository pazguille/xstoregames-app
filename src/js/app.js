import {
  getXboxURL,
  searchXboxURL,
  gameXboxURL,
  getXboxNewsURL,
  updateDollar,
} from './utils.js';

import {
  sectionTemplate,
  gameCardTemplate,
  gameDetailTemplate,
  newsTemplate,
  emptyWishlist,
} from './templates.js';

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

  $favBtn.addEventListener('click', () => {
    const { pathname } = new URL(window.location.href);
    const pathSplit = pathname.split('/');
    const id = pathSplit[2].split('_')[1];

    if (wishlist.has(id)) {
      wishlist.delete(id);
    } else {
      wishlist.add(id);
    }

    window.localStorage.setItem('wishlist', JSON.stringify(Array.from(wishlist)));
  });

  document.body.addEventListener('click', async (eve) => {
    if (!eve.target.classList.contains('link')) { return; }
    $prevFocus = document.activeElement;

    eve.preventDefault();
    const data = eve.target.id.split('-');
    const page = data[0];
    const id = data[1];

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
      $searchForm.elements[0].value = '';

      $currentPage = null;
      $currentPageContent = null;

    } else if (eve.state.page === 'detail') {
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
      });

      if ($prevPage) {
        $prevPage.setAttribute('hidden', true);
        $prevPage.classList.remove('page-on');
      }

      $currentPage = $wish;
      $currentPageContent = $wishContent;
      $currentPageContent.innerHTML = '';

      const games = Array.from(wishlist).join(',');

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
        $pageBack.hide();
      });

      if ($prevPage) {
        $prevPage.setAttribute('hidden', true);
        $prevPage.classList.remove('page-on');
      }

      $currentPage = $news;
      $currentPageContent = $newsContent;
      $currentPageContent.innerHTML = '';

      $loading.show();
      const news = await fetch(getXboxNewsURL()).then(res => res.json());
      news.map((n) => requestIdleCallback(() => {
        $currentPageContent.insertAdjacentHTML('beforeend', newsTemplate(n));
      }));
      $loading.hide();
    }

    if (page === 'detail') {
      if (!id) {
        window.location.href = 'https://xstoregames.com';
        return;
      }

      requestIdleCallback(() => {
        $pageBack.show();
        $search.hide();
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

      let game = gamesCache.get(id);

      if (!game) {
        $loading.show();
        game = await fetch(gameXboxURL(id)).then(res => res.json()).then(game => game[0]);
        gamesCache.set(game.id, game);
        $loading.hide();
      }

      const html = gameDetailTemplate(game);
      requestIdleCallback(() => {
        $shareBtn.show({
          title: `${game.title} en XStore Games`,
          url: window.location.href,
        });
        $favBtn.show(wishlist.has(id));
        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = html;
      });
    }

    if (page === 'collection') {
      requestIdleCallback(() => {
        $pageBack.show();
        $search.hide();
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

    $currentPage.removeAttribute('hidden');
    requestIdleCallback(() => {
      $currentPage.classList.add('page-on');
    });
  }

  function loadHomePage() {
    $home.removeAttribute('hidden');
    sections.forEach(section => {
      requestIdleCallback(() => {
        $home.insertAdjacentHTML('beforeend', sectionTemplate(section));
      });
    });

  }

  async function loadSearchPage(q) {
    requestIdleCallback(() => {
      $pageBack.show();
      $search.show();
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

  const preloadLCP = sections[0].list[0];
  const lcp = preloadLCP.images.titledheroart ?
    (preloadLCP.images.titledheroart.url || preloadLCP.images.titledheroart[0].url)
    : preloadLCP.images.screenshot[0].url;
  document.querySelector('#preloadLCP').href = lcp + '?w=630';

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
      const gameId = id.split('_')[1];
      showPage('detail', gameId);
      break;
    case 'collection':
      showPage('collection', id);
      break;
    case 'search':
      const q = searchParams.get('q');
      loadSearchPage(q);
      break;
  }

  requestIdleCallback(() => {
    $loading.hide();
  });
}
bootApp();

requestIdleCallback(() => {
  import('./swipes.js');
});
