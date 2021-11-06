import {
  sectionTemplate,
  gameDeailTemplate,
 } from './templates.js';

const getXboxURL = (list, skipitems = 0) => `https://xbox-api.pazguille.me/api/xbox-games?list=${list}&=skipitems=${skipitems}`;
// const getXboxURL = (list, skipitems = 0) => `http://localhost:3031/api/xbox-games?list=${list}&=skipitems=${skipitems}`;
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

export default async function bootApp() {
  const $loading = document.querySelector('.x-loader');
  const $container = document.querySelector('.lists');
  const $detail = document.querySelector('.detail');
  const $detailBack = document.querySelector('.detail-back-btn');
  const $detailContent = document.querySelector('.detail-content');

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
    $container.insertAdjacentHTML('beforeend', chunk);
  }));

  games.push(...sections.map(({ list }) => list).flat());

  $container.addEventListener('click', (eve) => {
    eve.preventDefault();
    const game = games.find((game) => {
      if (game.id === eve.target.id) {
        return game;
      }
    });
    history.pushState(null, game.title, eve.target.href);
    requestIdleCallback(() => {
      const html = gameDeailTemplate(game);
      $detailContent.innerHTML = html;
      $detail.classList.add('detail-on');
    });
  });

  $detailBack.addEventListener('click', () => {
    history.back();
  });

  window.addEventListener('popstate', (eve) => {
    $detail.classList.remove('detail-on');
    setTimeout(() => {
      requestIdleCallback(() => {
        $detailContent.innerHTML = '';
      });
    }, 300);
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
      const html = gameDeailTemplate(game);
      $detailContent.innerHTML = html;
      $detail.classList.add('detail-on');
    });
  }
}
