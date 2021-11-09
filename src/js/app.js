import {
  sectionTemplate,
  gameCardTemplate,
  gameDeailTemplate,
 } from './templates.js';

const getXboxURL = (list, skipitems = 0) => `https://xbox-api.pazguille.me/api/xbox-games?list=${list}&skipitems=${skipitems}`;
// const getXboxURL = (list, skipitems = 0) => `http://localhost:3031/api/xbox-games?list=${list}&skipitems=${skipitems}`;
const sections = [
  {
    type: 'new',
    title: 'Salidos del horno',
    list: [],
  },
  {
    type: 'deals',
    title: 'Descuentitos',
    list: [],
  },
  {
    type: 'coming',
    title: '¡Mirá lo que se viene!',
    list: [],
  },
  {
    type: 'best',
    title: 'Deberías jugarlos',
    list: [],
  },
];
const games = [];
const LIMIT = 10;
let skipitems = 0;

export default async function bootApp() {
  const $pageBack = document.querySelector('.page-back-btn');
  const $loading = document.querySelector('.x-loader');
  const $home = document.querySelector('.home');
  const $detail = document.querySelector('.detail');
  const $detailContent = document.querySelector('.detail-content');
  const $list = document.querySelector('.list');
  const $listContent = document.querySelector('.list-content');

  await Promise.all(sections.map(async ({type}) => {
    const resp = await fetch(getXboxURL(type));
    const games = await resp.json();
    const section = sections.find(section => section.type === type);
    section.list.push(...games);
  }));

  window.dollar = await fetch('https://www.dolarsi.com/api/api.php?type=valoresprincipales')
    .then(response => response.json())
    .then(data => {
      return parseFloat(data[0].casa.compra.replace(',', '.'));
    });

  requestIdleCallback(() => {
    $loading.setAttribute('hidden', true);
  });

  const html = sections.map(section => sectionTemplate(section));
  html.map((chunk) => requestIdleCallback(() => {
    $home.insertAdjacentHTML('beforeend', chunk);
  }));

  games.push(...sections.map(({ list }) => list).flat());

  document.body.addEventListener('click', (eve) => {
    if (!eve.target.classList.contains('link')) { return; }
    eve.preventDefault();

    const data = eve.target.id.split('-');
    const type = data[0];
    const id = data[1];

    if (type === 'game') {
      const game = games.find((game) => {
        if (game.id === id) {
          return game;
        }
      });

      requestIdleCallback(() => {
        const html = gameDeailTemplate(game);
        $detailContent.innerHTML = html;
        $detail.classList.add('page-on');
      });
      history.pushState({ page: 'game' }, game.title, eve.target.href);
    }

    if (type === 'list') {
      const section = sections.find(section => section.type === id);
      section.list.map((game) => requestIdleCallback(() => {
        $listContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
      }));
      history.pushState({ page: 'list' }, section.title, eve.target.href);
      $list.classList.add('page-on');

      const o = new IntersectionObserver(async(entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          o.unobserve(o.current);
          const resp = await fetch(getXboxURL(id, skipitems += LIMIT));
          const moreGames = await resp.json();
          moreGames.map((game) => requestIdleCallback(() => {
            $listContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
          }));
          requestIdleCallback(() => {
            o.current = $listContent.lastElementChild;
            o.observe(o.current);
          });
          section.list.push(...moreGames);
          games.push(...moreGames);
        }
      });

      requestIdleCallback(() => {
        o.current = $listContent.lastElementChild;
        o.observe(o.current);
      });
    }

    $pageBack.removeAttribute('hidden');

  });

  $pageBack.addEventListener('click', () => {
    history.back();
  });

  window.addEventListener('popstate', (eve) => {
    if (eve.state && eve.state.page === 'list') {
      $detail.classList.remove('page-on');
      setTimeout(() => {
        requestIdleCallback(() => {
          $detailContent.innerHTML = '';
        });
      }, 300);

    } else {
      skipitems = LIMIT;
      $pageBack.setAttribute('hidden', true);
      $list.classList.remove('page-on');
      $detail.classList.remove('page-on');
      setTimeout(() => {
        requestIdleCallback(() => {
          $listContent.innerHTML = '';
          $detailContent.innerHTML = '';
        });
      }, 300);
    }
  });

  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);

  if (params.has('id')) {
    const game = games.find((game) => {
      if (game.id === params.get('id')) {
        return game;
      }
    });
    requestIdleCallback(() => {
      $pageBack.removeAttribute('hidden');
      const html = gameDeailTemplate(game);
      $detailContent.innerHTML = html;
      $detail.classList.add('page-on');
    });
  }

  // if (params.has('list')) {
  //   const id = params.get('list');
  //   const section = sections.find(section => section.type === id);
  //   $pageBack.removeAttribute('hidden');
  //   section.list.map((game) => requestIdleCallback(() => {
  //     $listContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
  //   }));
  //   $list.classList.add('page-on');

  //   const o = new IntersectionObserver(async(entries) => {
  //     const first = entries[0];
  //     if (first.isIntersecting) {
  //       o.unobserve(o.current);
  //       const resp = await fetch(getXboxURL(id, skipitems += LIMIT));
  //       const moreGames = await resp.json();
  //       moreGames.map((game) => requestIdleCallback(() => {
  //         $listContent.insertAdjacentHTML('beforeend', gameCardTemplate(game));
  //       }));
  //       requestIdleCallback(() => {
  //         o.current = $listContent.lastElementChild;
  //         o.observe(o.current);
  //       });
  //       section.list.push(...moreGames);
  //       games.push(...moreGames);
  //     }
  //   });

  //   requestIdleCallback(() => {
  //     o.current = $listContent.lastElementChild;
  //     o.observe(o.current);
  //   });
  // }

  const touchPassiveListener = { passive: true, capture: false, };
  const $main = document.querySelector('main');
  const threshold = 95;
  let startOffsetY = 0;
  let currentOffsetY = 0;
  let refresh = false;

  function resetTouchFn(eve) {
    refresh = false;
    currentOffsetY = 0;
    startOffsetY = eve.touches[0].pageY;
  }

  function onTouchEndFn() {
    if (refresh && this.scrollTop <= 0) {
      window.location.reload();
    } else {
      refresh = false;
      this.style = undefined;
    }
  };

  function onTouchMoveFn(eve) {
    const dif_y = eve.touches[0].pageY - startOffsetY;
    currentOffsetY = dif_y;
    if (this.scrollTop <= 0 && dif_y > 0 && dif_y < threshold) {
      this.style.transform = `translateY(${currentOffsetY}px)`;
    }
    if (dif_y > threshold) {
      refresh = true;
    }
  };

  $main.addEventListener('touchstart', resetTouchFn, touchPassiveListener);
  $main.addEventListener('touchmove', onTouchMoveFn, touchPassiveListener);
  $main.addEventListener('touchend', onTouchEndFn, touchPassiveListener);
}
