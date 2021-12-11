const IVA = 0.21;
const IIBB = 0.02;
const AFIP = 0.35;
const PAISA = 0.08;

function toFixed(num) {
  var d = 2,
    m = Math.pow(10, d),
    n = +(d ? num * m : num).toFixed(8),
    i = Math.floor(n), f = n - i,
    e = 1e-8,
    r = (f > 0.5 - e && f < 0.5 + e) ?
    ((i % 2 == 0) ? i : i + 1) : Math.round(n);
  return d ? r / m : r;
}

function convert(price, dollar) {
  const usdPrice = (price / dollar);
  const final = toFixed(usdPrice * dollar) + toFixed(price * IVA) + toFixed(price * IIBB) + toFixed(price * AFIP) + toFixed(price * PAISA);
  return final.toFixed(2);
}

const formatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
});

export function sectionTemplate(section) {
  return (`
<section>
  <h2>${section.title}</h2>
  ${gameListTemplate(section)}
  <a class="see-all link" id="collection-${section.type}" href="/collection/${section.type}">Ver todos →</a>
</section>
`);
}

export function gameListTemplate(section) {
  return (`
<div class="carousel">
  ${section.type === 'new' ?
    section.list.map(game => gameCardNewTemplate(game)).join('')
  : section.list.map(game => gameCardTemplate(game)).join('')
  }
</div>
`);
}

export function gamePriceTemplate(game) {
  const off = Math.round((game.price.amount - game.price.deal)*100/game.price.amount);
  return (`
<div class="game-price">
  ${off > 0 ? `<span class="game-price-off">${off}% OFF</span>` : ''}
  <span class="game-price-amount">
    ${game.price.amount > 0 ?
      `🇦🇷 ${formatter.format(convert(game.price.deal, dollar))}`
      : game.demo ? 'Demo' : 'Gratis'
    }
  </span>
  ${game.price.deal !== game.price.amount ? `<div class="game-price-prev"><s>
${formatter.format(convert(game.price.amount, dollar))}
</s></div>` : ''}
  ${game.price.amount > 0 ?
    `<small class="game-price-taxes">impuestos incluídos</small>`
    : ''
  }
</div>
  `);
}

export function gameInfoTemplate(game) {
  return (`
<div>
  <h3 class="game-title"><a id="detail-${game.id}" href="/game/${game.id}" class="link">${game.title}</a></h3>
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
<article class="game-preview" style="background-image: url(${img}?w=1000)">
  <div>
    <div class="game-preview-info">
      <h3 class="game-title">${game.title}</h3>
      <p class="game-by">by ${game.developer || game.publisher}</p>
      ${game.game_pass ? `<img class="game-pass" src="/src/assets/game-pass.png" width="70px" height="13px" alt="Disponible en Game Pass">` : ''}
      ${game.ea_play ? `<img class="game-pass" src="/src/assets/ea-play.png" width="70px" height="13px" alt="Disponible en EA Play">` : ''}
      ${gamePriceTemplate(game)}
      <a href="https://www.xbox.com/es-ar/games/store/a/${game.id}" class="game-buy-now btn">Comprar ahora</a>
      ${until ? `<div class="game-deal-ends"><small>La oferta termina en ${until} días.</small></div>` : ''}
      <p class="game-description">${game.description}</p>
    </div>
    ${Array.isArray(game.images.screenshot) ? `
      <div class="game-preview-images">
        <a href="https://www.youtube.com/results?search_query=${game.title}+xbox+trailer" target="_blank" class="game-preview-video">
          <img width="100%" loading="lazy" decoding="async" src="/src/assets/video.jpg" />
        </a>
        ${game.images.screenshot.map((img) => `<img width="100%" loading="lazy" decoding="async" src="${img.url}?w=1000" />`).join('')}
      </div>
    ` : ''}
  </div>
</article>
`);
}

export function gameCardNewTemplate(game) {
  const img = game.images.titledheroart ?
    (game.images.titledheroart.url || game.images.titledheroart[0].url)
    : game.images.screenshot[0].url;
  return (`
<article class="game-preview-new">
  ${gameInfoTemplate(game)}
  <img class="game-img" width="315px" height="177px" alt="" decoding="async" src="${img}?w=630">
</article>
`);
}

export function gameCardTemplate(game) {
  const img = game.images.boxart ?
    game.images.boxart.url : game.images.poster.url;
  return (`
<article class="game-preview">
  ${gameInfoTemplate(game)}
  <img class="game-img" width="155px" height="155px" alt="" decoding="async" loading="lazy" src="${img}?w=310">
</article>
`);
}

export function newsTemplate(news) {
  return (`
<article class="news-preview">
  <h2><a href="${news.link}">${news.title}</a></h2>
  <img class="news-img" width="100%" height="auto" alt="" decoding="async" loading="lazy" src="${news.image}">
  <p>${news.description}</p>
</article>
`);
}


export function emptyWishlist() {
  return '<p class="empty-wishlist">Aún no tienes favoritos.</p>';
}
