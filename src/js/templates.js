import {
  convertDollar,
  slugify,
} from './utils.js';

export function sectionTemplate(section) {
  return (`
<section>
  <h2>${section.title}</h2>
  ${gameListTemplate(section)}
  <a class="see-all link" id="collection-${section.type}" href="/collection/${section.type}" aria-label="Ver el listado de ${section.title}">Ver todos</a>
</section>
`);
}

export function gameListTemplate(section) {
  return (`
<ul class="carousel" aria-roledescription="Carrusel" aria-label="${section.title}">
  ${section.type === 'new' ?
    section.list.map((game, index) => `<li>${gameCardNewTemplate(game, index)}</li>`).join('')
  : section.list.map(game => `<li>${gameCardTemplate(game)}</li>`).join('')
  }
</ul>
`);
}

export function gamePriceTemplate(game) {
  if (!game.sold_separately) {
    return '';
  }

  // const off = Math.round((game.price.amount - game.price.deal)*100/game.price.amount);
  // const amount = convertDollar(game.price.deal, dollar);
  // const amountPrev = convertDollar(game.price.amount, dollar);

  return (`
<div class="game-price">
  ${game.price.off ? `<span class="game-price-off">${game.price.off}% OFF</span>` : ''}
  <span class="game-price-amount">
    ${(game.price.deal || game.price.amount) ?
      `<x-price amount="${convertDollar(game.price.deal || game.price.amount, dollar)}"></x-price>`
      : game.demo ? 'Demo' : 'Gratis'
    }
  </span>
  ${game.price.deal ? `<div class="game-price-prev">
    <x-price amount="${convertDollar(game.price.amount, dollar)}" strike></x-price>
  </div>` : ''}
  ${game.price.amount > 0 ?
    `<small class="game-price-taxes">impuestos incluídos</small>`
    : ''
  }
  ${game.gold_deal ? `<div>Precio Gold: <x-price amount="${convertDollar(game.price.gold_deal, dollar)}"></x-price></div>` : ''}
</div>
  `);
}

export function gameInfoTemplate(game) {
  return (`
<div>
  <h3 class="game-title"><a id="detail-${game.id}" href="/game/${slugify(game.title)}_${game.id}" class="link">${game.title}</a></h3>
  <p class="game-by">by ${game.developer || game.publisher}</p>
  ${game.game_pass ? `<img class="game-pass" src="/src/assets/game-pass.png" width="60px" height="11px" alt="Disponible en Game Pass">` : ''}
  ${game.ea_play ? `<img class="game-pass" src="/src/assets/ea-play.png" width="60px" height="11px" alt="Disponible en EA Play">` : ''}
  ${gamePriceTemplate(game)}
</div>
  `);
}

export function gameDetailTemplate(game) {
  const img = game.images.titledheroart ?
  (game.images.titledheroart.url || game.images.titledheroart[0].url)
  : game.images.screenshot ? game.images.screenshot[0].url
  : game.images.superheroart.url;
  const until = Math.ceil((Date.parse(new Date(game.price.ends)) - Date.parse(new Date())) / (24 * 3600 * 1000));
  return (`
<article class="game-preview" style="--game-preview-url: url(${img}?w=1000&q=70)">
  <video class="hero" autoplay loop muted playsinline></video>
  <div>
    <div class="game-preview-info">
      <h3 class="game-title">${game.title}</h3>
      <p class="game-by">by ${game.developer || game.publisher}</p>
      ${game.game_pass ? `<img class="game-pass" src="/src/assets/game-pass.png" width="70px" height="13px" alt="Disponible en Game Pass">` : ''}
      ${game.ea_play ? `<img class="game-pass" src="/src/assets/ea-play.png" width="70px" height="13px" alt="Disponible en EA Play">` : ''}

      ${gamePriceTemplate(game)}
      <a href="https://www.xbox.com/es-ar/games/store/a/${game.id}" class="game-buy-now btn">Comprar ahora</a>
      ${until ? `<div class="game-deal-ends"><small>La oferta termina en ${until} días.</small></div>` : ''}

      <h4>Fecha de lanzamiento</h4>
      <time datetime="${new Date(game.release_date).toLocaleString('es-AR')}">${new Date(game.release_date).toLocaleString('es-AR', { day: '2-digit' , month: '2-digit', year: 'numeric',  })}</time>

      <h4>Descripción</h4>
      <p class="game-description">${game.description}</p>
    </div>
    ${Array.isArray(game.images.screenshot) ? `
      <div class="game-preview-images">
        <h4>Galeria</h4>
        <img alt="" width="100%" loading="lazy" decoding="async" src="${img}?w=1000" />
        <a href="https://www.youtube.com/results?search_query=${game.title}+xbox+trailer" target="_blank" class="game-preview-video" aria-label="Ver trailers en YouTube">
          <img width="100%" loading="lazy" decoding="async" src="/src/assets/video.jpg" alt="" />
        </a>
        ${game.images.screenshot.map((img) => `<img alt="" width="100%" loading="lazy" decoding="async" src="${img.url}?w=1000" />`).join('')}
      </div>
    ` : ''}
  </div>
</article>
`);
}

export function gameCardNewTemplate(game, index) {
  const img = game.images.titledheroart ?
    (game.images.titledheroart.url || game.images.titledheroart[0].url)
    : game.images.screenshot[0].url;
  return (`
<article class="game-preview-new">
  ${gameInfoTemplate(game)}
  <img class="game-img" width="315px" height="177px" alt="" ${index === 0 ? `fetchpriority="high"` : `loading="lazy"` } decoding="async" src="${img}?w=630">
</article>
`);
}

export function gameCardTemplate(game) {
  const img = game.images.boxart ?
    game.images.boxart.url : game.images.poster?.url;
  return (`
<article class="game-preview">
  ${gameInfoTemplate(game)}
  <img class="game-img" width="165px" height="165px" alt="" decoding="async" loading="lazy" src="${img}?w=310">
</article>
`);
}

export function newsTemplate(news) {
  return (`
<article class="news-preview">
  <h2><a href="${news.link}">${news.title}</a></h2>
  <img class="news-img" width="500px" height="500px" alt="" decoding="async" loading="lazy" src="${news.image}">
  <p>${news.description}</p>
</article>
`);
}

export function emptyWishlist() {
  return '<p class="empty-list">Aún no tienes favoritos.</p>';
}

export function emptyList() {
  return '<p class="empty-list">No se encontraron juegos.</p>';
}

export function gamepassSection() {
  return (`
<section class="gamepass">
  <h2>Xbox Game Pass</h2>
  <ul>
    <li><a href="/gamepass/new" id="gamepass-new" class="link">Recién agregados</a></li>
    <li><a href="/gamepass/coming" id="gamepass-coming" class="link">Se están por sumar</a></li>
    <li><a href="/gamepass/leaving" id="gamepass-leaving" class="link">Los que se van</a></li>
    <li><a href="/gamepass/all" id="gamepass-all" class="link">Todos</a></li>
  </ul>
</section>
  `);
}

export function goldSection() {
  return (`
<section class="gold">
  <h2>Xbox Live Gold</h2>
  <ul>
    <li><a href="/gold/gold-new" id="gold-new" class="link">Disponibles</a></li>
    <li><a href="/gold/gold-deals" id="gold-deals" class="link">Ofertas</a></li>
    <li><a href="/gold/gold-free" id="gold-free" class="link">Días gratis</a></li>
  </ul>
</section>
  `);
}
