const IVA = 0.21;
const IIBB = 0.02;
const AFIP = 0.35;
const PAISup10 = 0.30;
const PAISdown10 = 0.08;
const taxes = 1+IVA+IIBB+AFIP;

function convert(price, dollar) {
  const usdPrice = (price / dollar);
  const pais = usdPrice > 10 ? PAISup10 : PAISdown10;
  return (usdPrice * dollar * (taxes + pais)).toFixed(2);
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
  <a class="see-all link" id="collection-${section.type}" href="./?list=${section.type}">Ver todos →</a>
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

export function gameCardNewTemplate(game) {
  const off = Math.round((game.price.amount - game.price.deal)*100/game.price.amount);
  return (`
<article class="game-preview-new">
  <div>
    <h3 class="game-title"><a id="detail-${game.id}" href="./?id=${game.id}" class="link">${game.title}</a></h3>
    <p class="game-by">by ${game.developer || game.publisher}</p>
    <div class="game-price">
      ${off > 0 ? `<span class="game-price-off">${off}% OFF</span>` : ''}
      <span class="game-price-amount">
        ${game.price.deal > 0 ?
          `🇦🇷 ${formatter.format(convert(game.price.deal, dollar))}`
          : 'Gratis'
        }
      </span>
      ${game.price.deal > 0 ?
        `<small class="game-price-taxes">impuestos incluídos</small>`
        : ''
      }
    </div>
  </div>
  <img class="game-img" width="315px" height="177px" decoding="async" alt="" src="${game.images.superheroart.url || game.images.titledheroart.url || game.images.titledheroart[0].url}?w=630">
</article>
`);
}

export function gameCardTemplate(game) {
  const off = Math.round((game.price.amount - game.price.deal)*100/game.price.amount);
  return (`
<article class="game-preview">
  <div>
    <h3 class="game-title"><a id="detail-${game.id}" href="./?id=${game.id}" class="link">${game.title}</a></h3>
    <p class="game-by">by ${game.developer || game.publisher}</p>
    <div class="game-price">
      ${off > 0 ? `<span class="game-price-off">${off}% OFF</span>` : ''}
      <span class="game-price-amount">
        ${game.price.deal > 0 ?
          `🇦🇷 ${formatter.format(convert(game.price.deal, dollar))}`
          : 'Gratis'
        }
      </span>
      ${game.price.deal > 0 ?
        `<small class="game-price-taxes">impuestos incluídos</small>`
        : ''
      }
    </div>
  </div>
  <img class="game-img" width="155px" decoding="async" loading="lazy" height="155px" alt="" src="${game.images.boxart.url}?w=310">
</article>
`);
}

export function gameDeailTemplate(game) {
  const off = Math.round((game.price.amount - game.price.deal)*100/game.price.amount);
  return (`
<article class="game-preview" style="background-image: url(${game.images.superheroart.url || game.images.titledheroart.url || game.images.titledheroart[0].url}?w=1000)">
  <div>
    <div class="game-preview-info">
      <h3 class="game-title">${game.title}</h3>
      <p class="game-by">by ${game.developer || game.publisher}</p>
      <div class="game-price">
        ${off > 0 ? `<span class="game-price-off">${off}% OFF</span>` : ''}
        <span class="game-price-amount">
          ${game.price.deal > 0 ?
            `🇦🇷 ${formatter.format(convert(game.price.deal, dollar))}`
            : 'Gratis'
          }
        </span>
        ${game.price.deal > 0 ?
          `<small class="game-price-taxes">impuestos incluídos</small>`
          : ''
        }
      </div>
      <a href="https://www.xbox.com/es-ar/games/store/a/${game.id}" class="game-buy-now btn">Comprar Ahora</a>
      <p class="game-description">${game.description}</p>
    </div>
    ${game.images.screenshot ? `
      <div class="game-preview-images">
        ${game.images.screenshot.map((img) => `<img width="100%" loading="lazy" decoding="async" src="${img.url}?w=1000" />`).join('')}
      </div>
    ` : ''}
  </div>
</article>
`);
}
