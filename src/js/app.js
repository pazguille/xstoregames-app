import {
  sectionTemplate,
  gameCardTemplate,
  gameDeailTemplate,
  newsTemplate,
 } from './templates.js';

const LIMIT = 10;
const getXboxURL = (list, skipitems = 0) => `https://xbox-api.pazguille.me/api/games?list=${list}&skipitems=${skipitems}`;
const searchXboxURL = (query) => `https://xbox-api.pazguille.me/api/search?q=${query}`;
const getXboxNewsURL = () => `https://xbox-api.pazguille.me/api/news`;
// const getXboxURL = (list, skipitems = 0) => `http://localhost:3031/api/games?list=${list}&skipitems=${skipitems}`;
// const searchXboxURL = (query) => `http://localhost:3031/api/search?q=${query}`;
// const getXboxNewsURL = () => `http://localhost:3031/api/news`;

const gamesCache = new Map();
const sections = [
  {
    type: 'new',
    title: 'Salidos del horno',
    list: [],
    skipitems: LIMIT,
  },
  {
    type: 'deals',
    title: 'Ahorrate unos mangos',
    list: [],
    skipitems: LIMIT,
  },
  {
    type: 'coming',
    title: '¡Mirá lo que se viene!',
    list: [],
    skipitems: LIMIT,
  },
  {
    type: 'best',
    title: 'Deberías jugarlos',
    list: [],
    skipitems: LIMIT,
  },
  {
    type: 'most',
    title: 'Los más jugados',
    list: [],
    skipitems: LIMIT,
  },
  {
    type: 'free',
    title: 'Gratarola',
    list: [],
    skipitems: LIMIT,
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

  const $homeBtn = document.querySelector('.home-btn');
  const $newsBtn = document.querySelector('.news-btn');
  const $news = document.querySelector('.news');
  const $newsContent = document.querySelector('.news-content');

  let $currentPage = null;
  let $currentPageContent = null;

  $homeBtn.addEventListener('click', () => {
    if (!$currentPageContent) { return; }

    $main.style = undefined;
    document.body.style = undefined;

    $loading.setAttribute('hidden', true);
    $currentPage.classList.remove('page-on');
    $currentPageContent.innerHTML = '';
    $currentPage = null;
    $currentPageContent = null;
    $pullToRefresh = $main;
  });

  $newsBtn.addEventListener('click', async () => {
    if ($currentPageContent) { return; }

    $loading.removeAttribute('hidden');

    $currentPage = $news;
    $currentPageContent = $newsContent;
    $currentPage.classList.add('page-on');

    $main.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const news = await fetch(getXboxNewsURL()).then(res => res.json());
    news.map((n) => requestIdleCallback(() => {
      $currentPageContent.insertAdjacentHTML('beforeend', newsTemplate(n));
    }));
    $loading.setAttribute('hidden', true);
  });

  $searchBtn.addEventListener('click', () => {
    $search.removeAttribute('hidden');
    requestIdleCallback(() => {
      $search.elements[0].focus();
    });
  });

  $cancelSearchBtn.addEventListener('click', (eve) => {
    eve.preventDefault();
    $searchBtn.removeAttribute('hidden');
    $search.setAttribute('hidden', true);
  });

  document.body.addEventListener('click', async (eve) => {
    if (!eve.target.classList.contains('link')) { return; }

    eve.preventDefault();
    const data = eve.target.id.split('-');
    const type = data[0];
    const id = data[1];

    $pageBack.removeAttribute('hidden');
    $main.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    if (type === 'detail') {
      $currentPage = $detail;
      $currentPageContent = $detailContent;
      const game = gamesCache.get(id);
      const html = gameDeailTemplate(game);
      requestIdleCallback(() => {
        $currentPageContent.innerHTML = html;
      });
    }

    if (type === 'collection') {
      $currentPage = $list;
      $currentPageContent = $listContent;

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

    requestIdleCallback(() => {
      $search.setAttribute('hidden', true);
      $searchBtn.setAttribute('hidden', true);
    });

    history.pushState({ page: type }, '', eve.target.href);
    $currentPage.classList.add('page-on');
    $pullToRefresh = $currentPageContent;
  });

  $pageBack.addEventListener('click', () => {
    history.back();
  });

  window.addEventListener('popstate', (eve) => {
    const $prevPage = $currentPage;
    const $prevPageContent = $currentPageContent;

    if (swipeToBack) {
      $currentPage.setAttribute('hidden', true);
    }

    $currentPage.classList.remove('page-on');

    setTimeout(() => {
      requestIdleCallback(() => {
        $prevPage.removeAttribute('hidden');
        $prevPageContent.innerHTML = '';
      });
    }, 300);

    if (eve.state && eve.state.page === 'results') {
      $currentPage = $results;
      $currentPageContent = $resultsContent;
      $searchBtn.removeAttribute('hidden');
    }

    if (eve.state && eve.state.page === 'collection') {
      $currentPage = $list;
      $currentPageContent = $listContent;
    }

    if (eve.state && eve.state.page === 'deatil') {
      $currentPage = $detail;
      $currentPageContent = $detailContent;
    }

    if (eve.state === null) {
      $main.style = undefined;
      document.body.style = undefined;
      $pageBack.setAttribute('hidden', true);
      $searchBtn.removeAttribute('hidden');
      $search.elements[0].value = '';
      $currentPage = $main;
      $currentPageContent = null;
    }

    $pullToRefresh = $currentPage;
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

    $currentPage = $results
    $currentPageContent = $resultsContent;
    $pullToRefresh = $currentPageContent;

    const q = eve.target.elements[0].value;
    if (history.state === null) {
      history.pushState({ page: 'results' }, 'Resultados de busqueda', `${eve.target.action}?search=${q}`);
    } else {
      history.replaceState({ page: 'results' }, 'Resultados de busqueda', `${eve.target.action}?search=${q}`);
    }
    $currentPage.classList.add('page-on');

    $currentPageContent.innerHTML = '';
    $loading.removeAttribute('hidden');
    $search.setAttribute('hidden', true);
    $pageBack.removeAttribute('hidden');
    $main.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const searchResults = await fetch(searchXboxURL(q)).then(res => res.json());
    $loading.setAttribute('hidden', true);
    searchResults.map((game) => requestIdleCallback(() => {
      $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
      gamesCache.set(game.id, game);
    }));
  });

  await Promise.all(sections.map(async ({type}) => {
    const games = await fetch(getXboxURL(type)).then(res => res.json());
    const section = sections.find(section => section.type === type);
    section.list.push(...games);
    games.forEach((game) => gamesCache.set(game.id, game));
  }));

  requestIdleCallback(() => {
    $loading.setAttribute('hidden', true);
  });

  sections.forEach(section => {
    requestIdleCallback(() => {
      $home.insertAdjacentHTML('beforeend', sectionTemplate(section));
    });
  });
}
