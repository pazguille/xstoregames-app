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
} from './utils.js';

import {
  sectionTemplate,
  gameImportantTemplate,
  gameCardTemplate,
  gameDetailTemplate,
  newsTemplate,
  emptyList,
  emptyWishlist,
  gamepassSection,
  goldSection,
  supportSection,
  marketplaceItemsTemplate,
  // theGameAward,
} from './templates.js';

const documentTitle = document.title;
const documentDescription = document.querySelector('[name="description"]').content;

const LIMIT = 10;

const gamesCache = new Map();

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

  const $main = document.querySelector('main');
  const $metaDescription = document.querySelector('[name="description"]');
  const $canonical = document.querySelector('#canonical');
  const $preloadLCP = document.querySelector('#preloadLCP');

  const $footer = document.querySelector('footer');

  const $installBtn = document.querySelector('#install-btn');
  const $pageBack = document.querySelector('#page-back-btn');

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

  async function showPage(page, id) {
    $prevPage = $currentPage;

    $main.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.title = documentTitle;
    $metaDescription.content = documentDescription;
    $canonical.href = window.location.origin + window.location.pathname;

    setTimeout(() => {
      requestIdleCallback(() => {
        $home.setAttribute('hidden', true);
      });
    }, 300);

    if (page === 'wishlist') {
      $footer.dataset.active = page;

      $home.setAttribute('hidden', true);

      requestIdleCallback(() => {
        $pageBack.hide();
        $search.hide();
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
      $currentPageContent.innerHTML = '<h2><img alt="" src="/src/assets/icons/news.svg" width="24" height="24" /> Noticias recientes</h2>';

      $loading.show();
      const news = await fetch(getXboxNewsURL()).then(res => res.json());

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
        $search.hide();
        $installBtn.hide();
      });

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

      game.lcp = game.images.titledheroart ?
        (game.images.titledheroart.url || game.images.titledheroart[0].url)
        : game.images.screenshot ? game.images.screenshot[0].url
        : (game.images.superheroart?.url || game.images.boxart?.url);

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
      requestIdleCallback(() => {
        $pageBack.show();
        $search.hide();
        $installBtn.hide();
      });

      const $prev = $currentPageContent;

      $currentPage = $list;
      $currentPageContent = $listContent;

      if ($prev === null || $currentPageContent.innerHTML === '') {
        $currentPage.scrollTo(0, 0);
        $currentPageContent.innerHTML = '';
        const section = sections.find(section => section.type === id);
        $currentPageContent.insertAdjacentHTML('beforeend', `<h2>${section.icon}${section.title}</h2>`);

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
    }

    if (page === 'games') {
      requestIdleCallback(() => {
        $pageBack.show();
        $search.hide();
        $installBtn.hide();
      });

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

    if (page === 'gamepass') {
      requestIdleCallback(() => {
        $pageBack.show();
        $search.hide();
        $installBtn.hide();
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

    if (page === 'gold') {
      requestIdleCallback(() => {
        $pageBack.show();
        $search.hide();
        $installBtn.hide();
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
          goldGames.map((game, i) => requestIdleCallback(() => {
            $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game, i !== 0));
            gamesCache.set(game.id, game);
          }));
        } else {
          $currentPageContent.insertAdjacentHTML('beforeend', emptyList());
        }

        $loading.hide();
      }

    }

    if (!$prevPage) {
      $home.classList.add('page-prev-on');
    }

    $currentPage.removeAttribute('hidden');

    if (window.swipeToBack) {
      $currentPage.classList.remove('page-prev-on');
    } else {
      yieldToMain(() => {
        $currentPage.classList.remove('page-prev-on');
      });
    }

    requestIdleCallback(() => {
      $loading.hide();
      $currentPage.classList.add('page-on');
    });
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
          if (index === 3) {
            $home.insertAdjacentHTML('beforeend', goldSection());
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
    requestIdleCallback(() => {
      $pageBack.show();
      $search.show();
      $installBtn.hide();
    });

    $currentPage = $results
    $currentPageContent = $resultsContent;

    if (history.state === null) {
      history.pushState({ page: 'results', q, }, 'Resultados de busqueda', `${basePath}/search?q=${q}`);
    } else {
      history.replaceState({ page: 'results', q, }, 'Resultados de busqueda', `${basePath}/search?q=${q}`);
    }

    $currentPage.removeAttribute('hidden');
    requestIdleCallback(() => {
      $currentPage.classList.add('page-on');
    });

    if (window.swipeToBack) {
      $currentPage.classList.remove('page-prev-on');
    } else {
      yieldToMain(() => {
        $currentPage.classList.remove('page-prev-on');
      });
    }

    $currentPageContent.innerHTML = '';
    $loading.show();
    $search.close();
    $main.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // const searchResults = await fetch(searchXboxURL(q)).then(res => res.json());
    function fetchSearchGames(query) {
      const params = new URLSearchParams({
        market: `${lang}-${store}`,
        clientId: '7F27B536-CF6B-4C65-8638-A0F8CBDFCA65',
        sources: 'DCatAll-Products',
        filter: '+ClientType:StoreWeb',
        counts: '20,0,0',
        query,
      }).toString();
      return fetch(`https://www.microsoft.com/msstoreapiprod/api/autosuggest?${params}`, {
        headers: {
          'accept-language': 'es,es-419;q=0.9,en;q=0.8',
        }
      })
      .then(response => response.json())
      .then(response => response.ResultSets[0])
      .then(data => {
        if (!data) { return Promise.reject(new Error()); }
        return data.Suggests
          .filter((result) => result.Source === 'Juego')
          .map((result) => result.Metas[0].Value);
      })
      .then((games) => fetch(gameXboxURL(games)).then(res => res.json()))
      .catch(err => { throw { error: err }; });
    };
    const searchResults = await fetchSearchGames(q);
    $loading.hide();
    searchResults.map((game) => requestIdleCallback(() => {
      $currentPageContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
      gamesCache.set(game.id, game);
    }));
  }

  const { page, id, searchParams } = getPageFromURL(window.location.href);;
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
      loadSearchPage(q);
      break;

    case 'news':
    case 'game':
    case 'games':
    case 'collection':
    case 'gamepass':
    case 'gold':
      history.replaceState({ page, id }, document.title, window.location.href);
      showPage(page, id);
      break;
  }

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
      if (window.swipeToBack) {
        $home.classList.remove('page-prev-on');
      } else {
        yieldToMain(() => {
          $home.classList.remove('page-prev-on');
       });
      }
      $pageBack.hide();

      $search.show();
      $installBtn.show();
      $searchForm.elements[0].value = '';

      $currentPage = null;
      $currentPageContent = null;

      document.title = documentTitle;
      $metaDescription.content = documentDescription;
      $canonical.href = window.location.origin + window.location.pathname;

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

    } else if (eve.state.page === 'games') {
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

  requestIdleCallback(() => {
    document.body.addEventListener('click', async (eve) => {
      if (!eve.target.classList.contains('link')) { return; }
      $prevFocus = document.activeElement;

      eve.preventDefault();

      const { page, id } = getPageFromURL(eve.target.href);

      history.pushState({ page, id }, '', eve.target.href);

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

    $searchForm.addEventListener('submit', async (eve) => {
      eve.preventDefault();
      const q = eve.target.elements[0].value;
      $pageBack.show();
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
