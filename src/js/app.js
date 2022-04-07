import {
  sectionTemplate,
  gameCardTemplate,
  gameDetailTemplate,
  newsTemplate,
  emptyWishlist,
 } from './templates.js';

const LIMIT = 10;
const getXboxURL = (list, skipitems = 0) => `https://api.xstoregames.com/api/games?list=${list}&skipitems=${skipitems}`;
const searchXboxURL = (query) => `https://api.xstoregames.com/api/search?q=${query}`;
const gameXboxURL = (id) => `https://api.xstoregames.com/api/games?id=${id}`;
const getXboxNewsURL = () => `https://api.xstoregames.com/api/news`;
// const getXboxURL = (list, skipitems = 0) => `http://localhost:3031/api/games?list=${list}&skipitems=${skipitems}`;
// const searchXboxURL = (query) => `http://localhost:3031/api/search?q=${query}`;
// const getXboxNewsURL = () => `http://localhost:3031/api/news`;

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

async function updateDollar() {
  await fetch('https://www.dolarsi.com/api/api.php?type=valoresprincipales')
  .then(res => res.json())
  .then(data => {
    return parseFloat(data[0].casa.compra.replace(',', '.'));
  })
  .then(data => {
    window.dollar = data;
    localStorage.setItem('dollar', JSON.stringify({
      amount: data, date: new Date().toDateString(),
    }));
  });
}

export default async function bootApp() {
  const dollar = JSON.parse(localStorage.getItem('dollar'));
  if (!dollar || dollar.date !== new Date().toDateString()) {
    await updateDollar();
  } else {
    window.dollar = dollar.amount;
    updateDollar();
  }

  const wishlist = new Set(
    JSON.parse(localStorage.getItem('wishlist'))
  );

  const $favBtn = document.querySelector('.fav-btn');
  const $shareBtn = document.querySelector('.share-btn');
  const $searchBtn = document.querySelector('.search-btn');
  const $cancelSearchBtn = document.querySelector('.search-cancel-btn');
  const $search = document.querySelector('#search');
  const $pageBack = document.querySelector('.page-back-btn');
  const $loading = document.querySelector('.x-loader');
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

  $searchBtn.addEventListener('click', () => {
    $search.removeAttribute('hidden');
    requestIdleCallback(() => {
      $search.elements[0].focus();
    });
  });

  $favBtn.addEventListener('click', () => {
    const { pathname } = new URL(window.location.href);
    const pathSplit = pathname.split('/');
    const id = pathSplit[2];

    if (wishlist.has(id)) {
      wishlist.delete(id);
      $favBtn.classList.remove('fav-on');
    } else {
      wishlist.add(id);
      $favBtn.classList.add('fav-on');
    }

    localStorage.setItem('wishlist', JSON.stringify(Array.from(wishlist)));
  });

  $shareBtn.addEventListener('click', () => {
    if ('share' in navigator) {
      navigator.share({
        title: `XStore`,
        url: window.location.href,
      });
    } else if ('clipboard' in navigator) {
      navigator.clipboard.writeText(window.location.href);
    } else {
      alert(`Copia la url ${window.location.href}.`);
    }
  })

  $cancelSearchBtn.addEventListener('click', (eve) => {
    eve.preventDefault();
    $searchBtn.removeAttribute('hidden');
    $search.setAttribute('hidden', true);
  });

  document.body.addEventListener('click', async (eve) => {
    if (!eve.target.classList.contains('link')) { return; }
    $prevFocus = document.activeElement;

    eve.preventDefault();
    const data = eve.target.id.split('-');
    const page = data[0];
    const id = data[1];
    $pageBack.removeAttribute('hidden');

    showPage(page, id);
    history.pushState({ page, id }, '', eve.target.href);
  });

  $pageBack.addEventListener('click', () => {
    history.back();
  });

  window.addEventListener('popstate', (eve) => {
    if (swipeToBack) {
      const $prev = $currentPage;
      $currentPage.setAttribute('hidden', true);
      setTimeout(() => {
        requestIdleCallback(() => {
          $prev.removeAttribute('hidden');
        });
      }, 300);
    }

    $prevPage = $currentPage;
    $prevPage.classList.remove('page-on');
    setTimeout(() => {
      requestIdleCallback(() => {
        $prevPage && $prevPage.setAttribute('hidden', true);
        $prevPage = null;
        $prevFocus.focus();
      });
    }, 300);

    $shareBtn.setAttribute('hidden', true);
    $favBtn.setAttribute('hidden', true);

    if (eve.state === null) {
      $main.style = undefined;
      document.body.style = undefined;
      $home.removeAttribute('hidden');
      $pageBack.setAttribute('hidden', true);
      $searchBtn.removeAttribute('hidden');
      $search.elements[0].value = '';
      $currentPage = null;
      $currentPageContent = null;

    } else if (eve.state.page === 'detail') {
      $pageBack.removeAttribute('hidden');
      showPage(eve.state.page, eve.state.id);

    } else if (eve.state.page === 'results') {
      $pageBack.removeAttribute('hidden');
      loadSearchPage(eve.state.q);

    } else if (eve.state.page === 'wishlist') {
      $pageBack.setAttribute('hidden', true);
      showPage(eve.state.page);

    } else if (eve.state.page === 'news') {
      $pageBack.setAttribute('hidden', true);
      showPage(eve.state.page);

    } else if (eve.state.page === 'collection') {
      $pageBack.removeAttribute('hidden');
      showPage(eve.state.page, eve.state.id);
    }

    $pullToRefresh = $currentPage;
    swipeToBack = false;
  });

  const touchPassiveListener = { passive: true, capture: false, };
  const $main = document.querySelector('main');
  const threshold = 95;
  let startOffsetY = 0;
  let currentOffsetY = 0;
  let startOffsetX = 0;
  let currentOffsetX = 0;
  let refresh = false;
  let scrolling = false;
  let $pullToRefresh = $main;
  let swipeToBack = false;

  function resetTouchFn(eve) {
    refresh = false;
    scrolling = false;
    currentOffsetY = 0;
    currentOffsetX = 0;
    startOffsetY = eve.touches[0].pageY;
    startOffsetX = eve.touches[0].pageX;
  }

  function onTouchEndFn() {
    if (refresh && startOffsetY < threshold && $pullToRefresh.scrollTop <= 0) {
      window.location.reload();
    } else {
      if (!(scrolling && swipeToBack && currentOffsetX < 0)) {
        swipeToBack = false;
      }
      refresh = false;
      scrolling = false;
      this.style = undefined;
    }
  };

  function onTouchMoveFn(eve) {
    const dif_y = eve.touches[0].pageY - startOffsetY;
    const dif_x = eve.touches[0].pageX - startOffsetX;

    if (dif_x >= currentOffsetX) {
      swipeToBack = true;
    }
    currentOffsetX = dif_x;

    const touchAngle = (Math.atan2(Math.abs(dif_x), Math.abs(dif_y)) * 180) / Math.PI;
    const isScrolling = touchAngle > 45;
    if (isScrolling) {
      scrolling = true;
      return;
    }

    currentOffsetY = dif_y;

    if ($pullToRefresh.scrollTop <= 0 && startOffsetY < threshold && currentOffsetY < threshold) {
      this.style.transform = `translateY(${currentOffsetY}px)`;
    }

    if (dif_y > threshold) {
      refresh = true;
    }
  };
  $main.addEventListener('touchstart', resetTouchFn, touchPassiveListener);
  $main.addEventListener('touchmove', onTouchMoveFn, touchPassiveListener);
  $main.addEventListener('touchend', onTouchEndFn, touchPassiveListener);

  $search.addEventListener('submit', async (eve) => {
    eve.preventDefault();
    const q = eve.target.elements[0].value;
    $pageBack.removeAttribute('hidden');
    loadSearchPage(q);
  });

  async function showPage(page, id) {
    $main.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      requestIdleCallback(() => {
        $home.setAttribute('hidden', true);
      });
    }, 300);

    if ($currentPage) {
      $prevPage = $currentPage;
      setTimeout(() => {
        requestIdleCallback(() => {
          $prevPage && $prevPage.setAttribute('hidden', true);
          $prevPage = null;
        });
      }, 300);
    }

    if (page === 'wishlist') {
      if ($currentPage) {
        $currentPage.setAttribute('hidden', true);
        $currentPage.classList.remove('page-on');
      }

      $pageBack.setAttribute('hidden', true);

      $currentPage = $wish;
      $currentPageContent = $wishContent;
      $currentPageContent.innerHTML = '';
      $currentPage.classList.add('page-on');

      const games = Array.from(wishlist).join(',');
      if (games.length) {
        $loading.removeAttribute('hidden');
        const wish = await fetch(gameXboxURL(games)).then(res => res.json());
        wish.map((w) => requestIdleCallback(() => {
          $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(w));
        }));
        $loading.setAttribute('hidden', true);
      } else {
        requestIdleCallback(() => {
          $currentPageContent.insertAdjacentHTML('beforeend', emptyWishlist());
        });
      }
    }

    if (page === 'news') {
      if ($currentPage) {
        $currentPage.setAttribute('hidden', true);
        $currentPage.classList.remove('page-on');
      }
      $pageBack.setAttribute('hidden', true);

      $currentPage = $news;
      $currentPageContent = $newsContent;
      $currentPageContent.innerHTML = '';
      $currentPage.classList.add('page-on');
      $loading.removeAttribute('hidden');
      const news = await fetch(getXboxNewsURL()).then(res => res.json());
      news.map((n) => requestIdleCallback(() => {
        $currentPageContent.insertAdjacentHTML('beforeend', newsTemplate(n));
      }));
      $loading.setAttribute('hidden', true);
    }

    if (page === 'detail') {
      $currentPage = $detail;
      $currentPageContent = $detailContent;
      $currentPageContent.innerHTML = '';

      let game = gamesCache.get(id);

      if (!game) {
        $currentPage.classList.add('page-on');
        $loading.removeAttribute('hidden');
        game = await fetch(gameXboxURL(id)).then(res => res.json()).then(game => game[0]);
        gamesCache.set(game.id, game);
        $loading.setAttribute('hidden', true);
      }

      const html = gameDetailTemplate(game);
      requestIdleCallback(() => {
        $shareBtn.removeAttribute('hidden');
        $favBtn.removeAttribute('hidden');
        $favBtn.classList[wishlist.has(id) ? 'add' : 'remove']('fav-on');
        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = html;
      });
    }

    if (page === 'collection') {
      const $prev = $currentPageContent;

      $currentPage = $list;
      $currentPageContent = $listContent;

      $shareBtn.setAttribute('hidden', true);
      $favBtn.setAttribute('hidden', true);

      if ($prev === null) {
        $currentPageContent.innerHTML = '';
        const section = sections.find(section => section.type === id);
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

    requestIdleCallback(() => {
      $search.setAttribute('hidden', true);
      $searchBtn.setAttribute('hidden', true);
    });

    $pullToRefresh = $currentPageContent;

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
    $searchBtn.removeAttribute('hidden');
    $currentPage = $results
    $currentPageContent = $resultsContent;
    $pullToRefresh = $currentPageContent;

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
    $loading.removeAttribute('hidden');
    $search.setAttribute('hidden', true);
    $main.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const searchResults = await fetch(searchXboxURL(q)).then(res => res.json());
    $loading.setAttribute('hidden', true);
    searchResults.map((game) => requestIdleCallback(() => {
      $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
      gamesCache.set(game.id, game);
    }));
  }

  await Promise.all(sections.map(async ({type}) => {
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
      showPage('detail', id);
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
    $loading.setAttribute('hidden', true);
  });
}
