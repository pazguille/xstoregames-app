import {
  convertDollar,
  slugify,
  getPageFromURL,
} from './utils.js';

export function sectionTemplate(section) {
  return (`
<section>
  <h2>${section.icon}${section.title}</h2>
  ${gameListTemplate(section)}
  ${section.more !== false ? `<a class="see-all link" id="collection-${section.type}" href="${basePath}/collection/${section.type}" aria-label="Ver el listado completo de ${section.title}">Ver más</a>` : ''}
</section>
`);
}

export function gameListTemplate(section) {
  return (`
<ul class="carousel" aria-roledescription="Carrusel" aria-label="${section.title}">
  <button class="prev arrow" aria-hidden="true">
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.3 18.7a1 1 0 0 0 1.4-1.4l-1.4 1.4ZM9 12l-.7-.7a1 1 0 0 0 0 1.4L9 12Zm6.7-5.3a1 1 0 0 0-1.4-1.4l1.4 1.4Zm0 10.6-6-6-1.4 1.4 6 6 1.4-1.4Zm-6-4.6 6-6-1.4-1.4-6 6 1.4 1.4Z" fill="#ffffff"/></svg>
  </button>
  ${section.type === 'new' ?
      section.list.map(game => `<li>${gameCardNewTemplate(game)}</li>`).join('')
    : section.type === 'coming' ?
        section.list.map(game => `<li>${gameCardSoonTemplate(game)}</li>`).join('')
    : section.list.map(game => `<li>${gameCardTemplate(game)}</li>`).join('')
  }
  <button class="next arrow" aria-hidden="true">
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path style="transform: rotate(180deg) translate(-24px, -24px);" d="M14.3 18.7a1 1 0 0 0 1.4-1.4l-1.4 1.4ZM9 12l-.7-.7a1 1 0 0 0 0 1.4L9 12Zm6.7-5.3a1 1 0 0 0-1.4-1.4l1.4 1.4Zm0 10.6-6-6-1.4 1.4 6 6 1.4-1.4Zm-6-4.6 6-6-1.4-1.4-6 6 1.4 1.4Z" fill="#ffffff"/></svg>
  </button>
</ul>
`);
}

export function gamePriceTemplate(game) {
  if (!game.sold_separately) {
    return '';
  }

  return (`
<div class="game-price">
  ${game.price.off ? `<span class="game-price-off">${game.price.off}% OFF</span>` : ''}
  ${game.price.deal ? `<div class="game-price-prev">
    <x-price amount="${convertDollar(game.price.amount)}" strike></x-price>
  </div>` : ''}
  <span class="game-price-amount">
    ${(game.price.deal || game.price.amount) ?
      `<x-price amount="${convertDollar(game.price.deal || game.price.amount)}"></x-price>`
      : game.demo ? 'Demo' : 'Gratis'
    }
  </span>
  ${game.price.amount > 0 ?
    `<small class="game-price-taxes">*impuestos incluidos</small>`
    : ''
  }
  ${game.gold_deal ? `<div>con Game Pass: <x-price amount="${convertDollar(game.price.gold_deal)}"></x-price></div>` : ''}
</div>
  `);
}

export function gameInfoTemplate(game) {
  return (`
<div>
  <h3 class="game-title"><a id="detail-${game.id}" href="${basePath}/game/${slugify(game.title)}_${game.id}" class="link">${game.title}</a></h3>
  <p class="game-by">by ${game.developer ||game.publisher}</p>
  ${game.game_pass ? `<img class="game-pass" src="/src/assets/game-pass.svg" width="60px" height="11px" alt="Disponible en Game Pass" loading="lazy" decoding="async" />` : ''}
  ${game.ea_play ? `<img class="game-pass" src="/src/assets/ea-play.png" width="60px" height="11px" alt="Disponible en EA Play" loading="lazy" decoding="async" />` : ''}
  ${gamePriceTemplate(game)}
</div>
  `);
}

export function gamerPageTemplate(gamer) {
  const loggedGamer = JSON.parse(window.localStorage.getItem('gamer'));
  return (`
<form method="GET" id="search-gamer" class="gamer-search">
  <input type="search" name="gamer" id="gamer" placeholder="Buscar jugador..." />
</form>
<section class="gamer-card" style="--gamer-background-color:#${gamer.preferredColor?.tertiaryColor};--gamer-foreground-color:#${gamer.preferredColor?.primaryColor};">
  <img src="${gamer.displayPicRaw}" width="155" height="155" decoding="async" loading="lazy" class="gamer-display-pic"/>
  <h2>${gamer.displayName}</h2>
  <h2><img src="/src/assets/icons/gamerscore.svg" alt="GamerScore" width="22" height="22" decoding="async" loading="lazy" />${gamer.gamerScore}</h2>
  <h3>${gamer.location}</h3>
  ${loggedGamer.gamertag === gamer.gamertag ? `<p><a href="/logout" class="link">Salir</a></p>` : ''}
</section>
<div class="gamer-stats">
  ${gameSkeletonTemplate()}
  ${gameSkeletonTemplate()}
</div>
  `);
}

export function gamerPageStatsTemplate(id) {
  return (`
<section>
  <h2>Estuvo jugando</h2>
  <ul class="carousel gamer-games"></ul>
  <a class="see-all link" id="gamer-games" href="/gamer/${id}/games" aria-label="Ver el listado completo de Juegos">Ver todos</a>
</section>

<section>
  <h2>Logros recientes</h2>
  <ul class="carousel gamer-achievements"></ul>
</section>

<section>
  <h2>Algunos clips</h2>
  <ul class="carousel gamer-clips"></ul>
  <a class="see-all link" id="gamer-clips" href="/gamer/${id}/clips" aria-label="Ver el listado completo de Clips">Ver todos</a>
</section>
  `)
}

export function gamerGamesTemplate(game, gamertag) {
  return (`
<article class="game-preview game-preview-achievements">
  <div>
    <h3 class="game-title"><a id="detail-${game.id}" href="${basePath}/gamer/${gamertag}/achievements?titleId=${game.titleId}&title=${game.title}" class="link">${game.title}</a></h3>
    ${game.timePlayed ? `<p><img src="/src/assets/icons/timeplayed.svg" alt="Tiempo jugado" width="18" height="18" decoding="async" loading="lazy" /> ${game.timePlayed}</p>`: ''}
    <p><img src="/src/assets/icons/trophy.svg" alt="Trofeos" width="18" height="18" decoding="async" loading="lazy" /> ${game.achievement.currentAchievements}</p>
    <p><img src="/src/assets/icons/gamerscore.svg" alt="GamerScore" width="18" height="18" decoding="async" loading="lazy" /> ${game.achievement.currentGamerscore} / ${game.achievement.totalGamerscore}</p>
    <progress value="${game.achievement.progressPercentage}" max="100">
      ${game.achievement.progressPercentage}%
    </progress>
  </div>
  <img class="game-img" width="165px" height="165px" alt="" decoding="async" loading="lazy" src="${game.images.boxart.url}&w=330&h=330">
</article>
  `);
}

export function gamerAchievementsTemplate(achievement) {
  return (`
<article class="game-preview-soon game-preview-achievements" style="--achievement-state: ${achievement.state === 'Achieved' ? '0' : '100%'}">
  <div>
    <p class="game-by">${achievement.title}</p>
    <h3 class="game-title">${achievement.name} - <span class="game-platform-tag">${achievement.state === 'Achieved' ? 'Desbloqueado' : 'Bloqueado'}</span></h3>
    <p>${achievement.description}</p>
    <p><img src="/src/assets/icons/gamerscore.svg" alt="GamerScore" width="18" height="18" decoding="async" loading="lazy" /> ${achievement.rewards}</p>
  </div>
  <img class="game-img" width="245px" height="138px" alt="" decoding="async" loading="lazy" src="${achievement.image}&w=490&h=276">
</article>
  `);
}

export function gamerClipsTemplate(clip) {
  return (`
<article class="game-preview-clips">
  <h3 class="game-title">${clip.title}</h3>
  <video width="365px" height="205px" poster="${clip.poster}" data-src="${clip.url}"></video>
</article>
  `);
}



export function gameDetailTemplate(game) {
  const img = game.lcp;
  // const img = game.images.titledheroart ?
  // (game.images.titledheroart.url || game.images.titledheroart[0].url)
  // : game.images.screenshot ? game.images.screenshot[0].url
  // : (game.images.superheroart?.url || game.images.boxart?.url);
  const until = Math.ceil((Date.parse(new Date(game.price.ends)) - Date.parse(new Date())) / (24 * 3600 * 1000));
  // <article class="game-preview" style="--game-preview-url: url(${img}?w=1160&q=70)">

  let storeUrl = `https://www.xbox.com/${lang}-${store}/games/store/${slugify(game.title)}/${game.id}`;

  if (['CFQ7TTC0KHS0', 'CFQ7TTC0K6L8', 'CFQ7TTC0KGQ8', 'CFQ7TTC0K5DJ'].includes(game.id)) {
    game.images.screenshot = null;
    storeUrl = `https://click.linksynergy.com/deeplink?id=jIIkBhIxUyI&mid=24542&murl=${encodeURIComponent(`https://www.microsoft.com/store/p/${slugify(game.title)}/${game.id}`)}`;
  }
  // else {
  //   // storeUrl = `https://redirect.viglink.com?u=${encodeURIComponent(storeUrl)}&key=7fc345bd4db508484216977feb5d8d93`;
  //   // storeUrl = `https://click.linksynergy.com/deeplink?id=jIIkBhIxUyI&mid=24542&murl=${encodeURIComponent(`https://www.microsoft.com/store/p/${slugify(game.title)}/${game.id}`)}`;
  // }

  // ${gamerGames.findIndex((g) => g.id === game.id) !== -1 ? '<span class="game-platform-tag">Ya lo jugaste</span>': '' }

  return (`
<article class="game-preview">
  <img class="game-img" src="${img}?w=1160&q=70" alt="" fetchpriority="high" decoding="async" width="100%" />
  <video class="hero game-preview-trailer" autoplay loop muted playsinline hidden></video>
  <div>
    <div class="game-preview-info">
      <h3 class="game-title">${game.title}</h3>
      <p class="game-by">by ${game.developer || game.publisher}</p>

      <button
        is="switch-button"
        id="fav-btn"
        class="fav-btn header-btn"
        aria-label="Favorito"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path opacity=".12" d="M16.111 3C19.633 3 22 6.353 22 9.48 22 15.814 12.178 21 12 21c-.178 0-10-5.186-10-11.52C2 6.352 4.367 3 7.889 3 9.91 3 11.233 4.024 12 4.924 12.767 4.024 14.089 3 16.111 3Z" fill="#9AA495"/><path d="m12 4.924-.761.648a1 1 0 0 0 1.522 0L12 4.924ZM16.111 4C18.924 4 21 6.734 21 9.48h2C23 5.971 20.342 2 16.111 2v2ZM21 9.48c0 1.321-.513 2.64-1.368 3.915-.854 1.273-2.013 2.447-3.21 3.456a28.537 28.537 0 0 1-3.31 2.39c-.458.282-.839.5-1.106.644a8.052 8.052 0 0 1-.337.172l-.012.006.009-.003a.55.55 0 0 1 .1-.032c.02-.005.112-.028.234-.028v2c.125 0 .221-.024.246-.03a1.098 1.098 0 0 0 .186-.063 10.016 10.016 0 0 0 .524-.262c.304-.164.719-.401 1.208-.704a30.511 30.511 0 0 0 3.547-2.561c1.281-1.08 2.589-2.39 3.582-3.87C22.285 13.03 23 11.324 23 9.48h-2ZM12 20a.895.895 0 0 1 .334.06l.01.003-.013-.005a22.257 22.257 0 0 1-1.442-.817 28.536 28.536 0 0 1-3.311-2.39c-1.197-1.009-2.356-2.183-3.21-3.456C3.513 12.121 3 10.801 3 9.48H1c0 1.845.715 3.55 1.707 5.03.993 1.48 2.3 2.79 3.582 3.87a30.516 30.516 0 0 0 3.547 2.561c.49.303.904.54 1.208.704.151.081.28.147.379.195a3.157 3.157 0 0 0 .24.103c.02.007.052.017.091.027.025.006.121.03.246.03v-2ZM3 9.48C3 6.734 5.076 4 7.889 4V2C3.658 2 1 5.971 1 9.48h2ZM7.889 4c1.641 0 2.708.818 3.35 1.572l1.522-1.297C11.871 3.23 10.292 2 7.89 2v2Zm4.872 1.572C13.404 4.818 14.47 4 16.111 4V2c-2.403 0-3.981 1.23-4.872 2.275l1.522 1.297Z" fill="#9AA495"/></svg>
      </button>

      <button
        is="switch-button"
        id="cart-btn"
        class="cart-btn header-btn"
        aria-label="Carrito"
      >
        <svg width="22" height="22" viewBox="0 0 768 768" aria-hidden="true"><path d="M352 672a64 64 0 1 0-128 0 64 64 0 0 0 128 0zm352 0a64 64 0 1 0-128 0 64 64 0 0 0 128 0zM231 224h466l-44 230a32 32 0 0 1-32 26H309c-7 0-14-2-20-6-6-5-10-12-12-20zM32 64h102l27 136c3 14 16 24 31 24h39l-13-64h-26a32 32 0 0 0-31 40l53 267a96 96 0 0 0 96 77h311c24 0 46-8 64-23 15-14 27-33 31-54l51-269a32 32 0 0 0-31-38H218L191 26c-3-15-16-26-31-26H32a32 32 0 0 0 0 64z" fill="#9AA495" /></svg>
      </button>

      <button
        is="share-button"
        id="share-btn"
        class="share-btn header-btn"
        aria-label="Compartir"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path opacity=".12" d="M7.8 21h8.4c1.68 0 2.52 0 3.16-.33a3 3 0 0 0 1.31-1.3c.33-.65.33-1.49.33-3.17V12H3v4.2c0 1.68 0 2.52.33 3.16a3 3 0 0 0 1.3 1.31c.65.33 1.49.33 3.17.33Z" fill="#9AA495"/><path d="M22 12a1 1 0 1 0-2 0h2ZM4 12a1 1 0 1 0-2 0h2Zm.64 8.67.45-.89-.45.9Zm-1.31-1.3.89-.46-.9.45Zm16.03 1.3-.45-.89.45.9Zm1.31-1.3.9.45-.9-.46ZM15.3 7.7a1 1 0 1 0 1.42-1.42l-1.42 1.42ZM12 3l.7-.7a1 1 0 0 0-1.4 0l.7.7ZM7.3 6.3a1 1 0 0 0 1.4 1.4L7.3 6.3ZM11 15a1 1 0 1 0 2 0h-2Zm5.2 5H7.8v2h8.4v-2Zm3.8-8v4.2h2V12h-2ZM4 16.2V12H2v4.2h2ZM7.8 20c-.86 0-1.44 0-1.89-.04-.44-.03-.66-.1-.82-.18l-.9 1.78c.48.25 1 .35 1.56.4.55.04 1.23.04 2.05.04v-2ZM2 16.2c0 .82 0 1.5.04 2.05.05.56.15 1.08.4 1.57l1.78-.91a2.16 2.16 0 0 1-.18-.82C4 17.64 4 17.06 4 16.2H2Zm3.1 3.58a2 2 0 0 1-.88-.87l-1.78.9a4 4 0 0 0 1.74 1.75l.91-1.78ZM16.2 22c.82 0 1.5 0 2.05-.04a4.09 4.09 0 0 0 1.57-.4l-.91-1.78c-.16.08-.38.15-.82.18-.45.04-1.03.04-1.89.04v2Zm3.8-5.8c0 .86 0 1.44-.04 1.89-.03.44-.1.66-.18.82l1.78.9c.25-.48.35-1 .4-1.56.04-.55.04-1.23.04-2.05h-2Zm-.18 5.36a4 4 0 0 0 1.74-1.74l-1.78-.91a2 2 0 0 1-.87.87l.9 1.78ZM16.7 6.3l-4-4-1.42 1.42 4 4 1.42-1.42Zm-5.42-4-4 4 1.42 1.42 4-4-1.42-1.42ZM11 3v12h2V3h-2Z" fill="#9AA495"/></svg>
      </button>

      <div>
        <h4 class="visually-hidden">Se puede jugar en:</h4>
        ${game.platforms.map(p => `<span class="game-platform-tag">${p}</span>`).join('')}
      </div>


      ${game.game_pass ? `<img class="game-pass" src="/src/assets/game-pass.svg" width="70px" height="13" alt="Disponible en Game Pass" loading="lazy" decoding="async" />` : ''}
      ${game.ea_play ? `<img class="game-pass" src="/src/assets/ea-play.png" width="70px" height="13px" alt="Disponible en EA Play" loading="lazy" decoding="async" />` : ''}

      ${gamePriceTemplate(game)}

      ${until ? `<div class="game-deal-ends"><small>La oferta termina en ${until} días.</small></div>` : ''}

      <a href="${storeUrl}" class="game-buy-now btn" rel="nofollow noopener">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" width="1em" height="1em" fill="#ffffff" aria-hidden="true"><path d="M492 158q-4 0-5-1v-2l2-3Q614 77 746 39t278-39q143 0 277 38t256 113l3 2q-3 5-6 5-8 0-17-2t-17-4q-9-1-18-1t-18 0q-47 0-95 9t-96 24-92 34-88 39q-22 11-44 21t-43 25h-5q-43-27-100-54t-120-49-123-36-113-14q-19 0-39 4t-34 4zm251 412q-44 53-101 128T525 862t-117 184-102 189-72 180-28 156q0 17 2 37t8 36l-1 2-2 1-4-2q-103-139-156-293T0 1024q0-98 20-199t60-196 96-180 130-153q5-4 15-5t15-2q30 0 66 14t75 38 76 53 74 60 65 59 51 50l1 4-1 3zm968-281q7 0 16 1t15 6q73 71 130 155t96 178 59 194 21 201q0 173-53 328t-156 293l-6 1-2-3q3-4 5-14t3-21 2-22 1-16q0-69-27-155t-72-180-102-190-117-184-117-163-102-129l-1-3 1-3q21-21 50-49t65-58 73-61 77-53 75-38 66-15zm-687 533q29 18 56 42t54 47q42 37 102 94t127 128 131 149 117 155 84 149 32 129q0 23-6 43t-23 37q-31 31-69 57t-76 49q-120 72-254 109t-275 38q-141 0-274-37t-255-110q-17-10-43-26t-51-37-47-40-27-39q-7-20-7-45 0-54 30-122t78-142 110-149 123-142 118-123 97-92q34-30 72-64t76-58z"></path></svg>
        ${new Date(game.release_date) > new Date() ? 'Precompar' : game.price.amount > 0 ? 'Comprar' : 'Descargar'}
      </a>
    </div>

    <h4>Precio en la tienda USA 🇺🇸</h4>
    <span class="game-us-price">
      <span class="skeleton"></span>
    </span>

    ${Array.isArray(game.images.screenshot) ? `
      <h4>Imágenes</h4>
      <div class="carousel game-preview-images">
        <img width="345" height="194" loading="lazy" decoding="async" src="${img}?w=1160&q=70" alt="" />
        ${game.images.screenshot.map((img) => `<img width="345" height="194" loading="lazy" decoding="async" src="${img.url}?w=1160&q=70" alt="" />`).join('')}
      </div>
    ` : ''}

    <h4>Videos</h4>
    <div class="carousel game-preview-playlist">
      <a href="https://www.youtube.com/results?search_query=${game.title}+xbox+trailer" target="_blank" rel="noreferrer noopener" class="game-preview-video" aria-label="Ver trailers en YouTube">
        <img width="25" height="32" loading="lazy" decoding="async" src="/src/assets/icons/play.svg" alt="" />
      </a>
    </div>

    ${game.release_date ? `
    <h4>Fecha de lanzamiento</h4>
    <time class="game-platform-tag" datetime="${new Date(game.release_date).toLocaleString('es-AR')}">${new Date(game.release_date).toLocaleString('es-AR', { day: '2-digit' , month: '2-digit', year: 'numeric',  })}</time>
    ` : ''}

    <h4>Pueden jugar</h4>
    <span class="game-platform-tag">Un jugador</span>
    ${game.coop.length || game.multi.length ? `
      ${game.coop.map(c => `<span class="game-platform-tag">Co-op ${c.name} (${c.min} - ${c.max})</span>`).join('')}
      ${game.multi.map(c => `<span class="game-platform-tag">Multi ${c.name} (${c.min} - ${c.max})</span>`).join('')}
    ` : ''}

    ${game.averageRating ? `
      <h4>Valoración</h4>
      <span class="game-platform-tag">${game.averageRating} / 5</span>
    ` : ''}

    ${game.size ? `
      <h4>Espacio en disco</h4>
      <span class="game-platform-tag">${game.size}</span>
    ` : ''}

    ${game.languages?.length ? `
      <h4>Idiomas disponibles</h4>
      <ul class="carousel supported-languages">
        ${game.languages.map(l => `<li><span class="game-platform-tag">${new Intl.DisplayNames(['es-AR'], { type: 'language' }).of(l)}</span></li>`).join('')}
      </ul>

    ` : ''}

    <h4>Descripción</h4>
    <p class="game-description">${game.description}</p>
  </div>
</article>
${gameSkeletonTemplate()}
`);
}

export function gameCardNewTemplate(game) {
  const img = game.images.poster?.url || game.images.boxart?.url;
  return (`
<article class="game-preview-new" style="--game-preview-new: url(${img}?w=360)">
  ${gameInfoTemplate(game)}
  <img class="game-img" width="180px" height="270px" alt="" loading="lazy" decoding="async" src="${img}?w=360">
</article>
`);
}

export function gameCardSoonTemplate(game) {
  const img = game.images.titledheroart ?
    (game.images.titledheroart.url || game.images.titledheroart[0].url)
    : game.images.screenshot[0].url;
  return (`
<article class="game-preview-soon">
  ${gameInfoTemplate(game)}
  <img class="game-img" width="256px" height="144px" alt="" loading="lazy" decoding="async" src="${img}?w=512&q=70">
</article>
`);
}

export function theGameAward() {
  return (`
<article class="game-important">
  <strong class="game-important-tag">Destacado</strong>
  <h2 class="game-title">
    <a id="developer-direct" href="/developer-direct" class="link">Developer Direct 2023</a>
  </h2>
  <img class="game-img" width="330px" height="330px" style="object-position: top;" alt="" fetchpriority="high" decoding="async" src="/src/assets/xbox-direct.jpg">
</article>
  `);
}

export function gameImportantTemplate(game) {
  const img = game.images.featurepromotionalsquareart ?
    game.images.featurepromotionalsquareart.url : game.images.boxart?.url;
  return (`
<article class="game-important">
  <strong class="game-important-tag">Oferta destacada</strong>
  <h2 class="game-title">
    <a id="detail-${game.id}" href="${basePath}/game/${slugify(game.title)}_${game.id}" class="link">${game.title}</a>
  </h2>
  <span class="game-important-tag game-price-off">${game.price.off}% OFF</span>
  <img class="game-img" width="365px" height="365px" alt="" fetchpriority="high" decoding="async" src="${img}?w=720&q=70">
</article>
  `);
}

export function gameCardTemplate(game, lazy = true) {
  const img = game.images.boxart ?
    game.images.boxart.url : game.images.poster?.url;
  return (`
<article class="game-preview">
  ${gameInfoTemplate(game)}
  <img class="game-img" width="165px" height="165px" alt="" decoding="async" ${lazy ? `loading="lazy"` : `fetchpriority="high"` } src="${img}?w=330">
</article>
`);
}

export function newsTemplate(news, lazy = true) {
  return (`
<article class="news-preview">
  <h2><a href="${news.link}">${news.title}</a></h2>
  <img class="news-img" width="335px" height="190px" alt="" decoding="async" ${lazy ? `loading="lazy"` : `fetchpriority="high"` } src="${news.image}">
  <p>${news.description}</p>
</article>
`);
}

export function emptyCart() {
  return '<p class="empty-list">No hay juegos en el carrito.</p>';
}

export function emptyWishlist() {
  return '<p class="empty-list">Aún no tienes favoritos.</p>';
}

export function emptyList() {
  return '<p class="empty-list">No se encontraron juegos.</p>';
}

export function gamerPageNotFoundTemplate() {
  return '<p class="empty-list">No se encontró al jugador.</p>';
}

export function gamepassSection() {
  return (`
<section class="gamepass">
  <div class="gamepass-collections carousel">
    <article>
      <h2 aria-label="Xbox Game Pass">
        <svg width="140" height="25" fill="none" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="m105.8 14 2.5-6.6 2.5 6.5h-5Zm3.7-8.8H107l-5.6 14.3h2.3l1.4-3.7h6.4l1.4 3.7h2.2l-5.6-14.3ZM140 15.6c0 1.3-.5 2.4-1.5 3.1-1 .8-2.3 1.2-4 1.2-2 0-3.5-.5-4.5-1.3-1-.9-1.6-2.1-1.6-3.8h2.2c0 1 .3 1.9 1 2.4.6.5 1.6.8 2.9.8 1 0 1.8-.2 2.4-.6.5-.4.8-1 .8-1.8 0-.6-.2-1-.7-1.4-.4-.3-1.3-.7-2.5-1l-1.2-.2a7 7 0 0 1-3.4-1.4 3.6 3.6 0 0 1-1-2.8c0-1.2.4-2.2 1.3-2.9a6 6 0 0 1 3.7-1c1.9 0 3.3.4 4.2 1.2 1 .8 1.5 2 1.5 3.3h-2.2c0-.9-.3-1.6-.9-2-.5-.4-1.4-.6-2.6-.6-1 0-1.6.1-2.1.5-.5.3-.8.8-.8 1.4 0 .7.3 1.2.7 1.5.4.4 1.3.7 2.4 1l1.3.2c1.6.3 2.8.8 3.5 1.5.7.7 1.1 1.6 1.1 2.7Zm-12.8 0c0 1.3-.5 2.4-1.4 3.1-1 .8-2.4 1.2-4.1 1.2-2 0-3.4-.5-4.5-1.3-1-.9-1.6-2.1-1.6-3.8h2.2c0 1 .4 1.9 1 2.4.7.5 1.6.8 2.9.8 1 0 1.9-.2 2.4-.6.6-.4.9-1 .9-1.8 0-.6-.3-1-.7-1.4-.5-.3-1.3-.7-2.5-1l-1.3-.2a7 7 0 0 1-3.3-1.4 3.6 3.6 0 0 1-1.2-2.8c0-1.2.5-2.2 1.4-2.9a6 6 0 0 1 3.7-1c1.9 0 3.3.4 4.3 1.2 1 .8 1.4 2 1.4 3.3h-2.1c-.1-.9-.4-1.6-1-2-.5-.4-1.4-.6-2.5-.6-1 0-1.7.1-2.2.5-.5.3-.7.8-.7 1.4 0 .7.2 1.2.6 1.5.5.4 1.3.7 2.5 1l1.2.2c1.7.3 2.8.8 3.6 1.5.7.7 1 1.6 1 2.7ZM94.2 7H98c.9 0 1.6.3 2 .7.5.5.7 1.1.7 2 0 .8-.2 1.4-.7 1.9-.4.4-1.1.6-2 .6h-3.9V7.1Zm7.5-.7c-.9-.8-2-1.2-3.6-1.2h-6.2v14.3h2.2v-5.2h4c1.5 0 2.7-.4 3.6-1.3.8-.8 1.3-1.9 1.3-3.3 0-1.3-.5-2.5-1.3-3.3ZM74 5.2v14.3h-2V8.2l-1.2 3-3.2 8.3h-1.8l-3.3-8.4c-.4-1-.8-2-1-2.9v11.3h-2.2V5.2h3l3 7.6 1.4 4 1.5-4.2L71 5.2h3Zm4.4 2v4.1h7.1v1.9h-7v4.4h8v2H76.2V5.1h10.3v2h-8Zm-35 4.8v7.6h-2.1v-2c-.6.8-1.2 1.3-2 1.7a7.2 7.2 0 0 1-5.5 0 6.8 6.8 0 0 1-3.6-4c-.2-.8-.4-1.8-.4-3 0-1 .2-2 .5-3a6.7 6.7 0 0 1 3.6-3.9c.8-.3 1.8-.5 2.8-.5 1.8 0 3.3.4 4.4 1.4 1.2.9 1.8 2.1 2 3.6H41c-.2-.9-.7-1.7-1.4-2.2-.8-.6-1.7-.9-2.7-.9-1.5 0-2.6.5-3.4 1.5a6 6 0 0 0-1.3 4c0 1.8.4 3.1 1.3 4.1.8 1 2 1.5 3.4 1.5 1.2 0 2.3-.4 3.1-1.1a4 4 0 0 0 1.4-3H37V12h6.2Zm5.4 2 2.5-6.6 2.5 6.5h-5Zm3.8-8.8H50l-5.6 14.3h2.3l1.3-3.7h6.4l1.4 3.7h2.3L52.6 5.2ZM15.2 6.8V7c2.4 2.9 7 9.7 6.1 12.5h.1a11.9 11.9 0 0 0-1.1-15.7c-.2-.1-1.4-.5-5 3.1ZM3.6 3.7a11.9 11.9 0 0 0-1.1 15.7c-.9-2.8 3.8-9.6 6.2-12.5-3.7-3.7-5-3.3-5.1-3.2ZM18.2 2A11.8 11.8 0 0 0 5.8 2c2.3-.4 5.8 1.6 6.1 1.8.4-.2 3.9-2.2 6.2-1.7Zm-6.3 7.8c3.6 2.8 9.8 9.5 7.9 11.4a11.9 11.9 0 0 1-15.7 0c-1.9-2 4.2-8.6 7.8-11.3Z" fill="#F2F2F2"/></svg>
      </h2>
      <ul>
        <li><a href="${basePath}/gamepass/new" id="gamepass-new" class="link">Recién agregados</a></li>
        <li><a href="${basePath}/gamepass/coming" id="gamepass-coming" class="link">Se están por sumar</a></li>
        <li><a href="${basePath}/gamepass/leaving" id="gamepass-leaving" class="link">Los que se van</a></li>
        <li><a href="${basePath}/gamepass/ea" id="gamepass-ea" class="link">Con EA Play</a></li>
        <li><a href="${basePath}/gamepass/gp-deals" id="gp-deals" class="link">Ofertas exclusivas</a></li>
        <li><a href="${basePath}/gamepass/all" id="gamepass-all" class="link">Todos</a></li>
      </ul>
    </article>
    <article>
      <h2>
        <img src="/src/assets/gamepass-pc.png" alt="Game Pass para PC" decoding="async" loading="lazy" width="170" height="25" />
      </h2>
      <ul>
        <li><a href="${basePath}/gamepass/new-pc" id="gamepass-new-pc" class="link">Recién agregados</a></li>
        <li><a href="${basePath}/gamepass/coming-pc" id="gamepass-coming-pc" class="link">Se están por sumar</a></li>
        <li><a href="${basePath}/gamepass/leaving-pc" id="gamepass-leaving-pc" class="link">Los que se van</a></li>
        <li><a href="${basePath}/gamepass/ea-pc" id="gamepass-ea-pc" class="link">Con EA Play</a></li>
        <li><a href="${basePath}/gamepass/all-pc" id="gamepass-all-pc" class="link">Todos</a></li>
      </ul>
    </article>
  </div>
  <h2>Elige tu plan</h2>
  <div class="gamepass-plans carousel">
    <article class="gamepass-plan">
      <h3>
        <img src="/src/assets/gamepass-ultimate.png" alt="Game Pass Ultimate" decoding="async" loading="lazy" width="160" height="20" />
        <strong class="game-important-tag">Plan destacado</strong>
      </h3>
      <ul>
        <li>Acceso ilimitado a más de 100 juegos de alta calidad en PC, consola y dispositivos móviles</li>
        <li>Agregamos juegos nuevos en todo momento</li>
        <li>Xbox Game Studios títulos el día de su lanzamiento</li>
        <li>Ofertas, descuentos y ventajas para miembros</li>
        <li>Beneficios gratuitos que incluyen contenido del juego y ofertas de asociados</li>
        <li>Juega en el teléfono y en la tableta desde la nube</li>
        <li>Modo multijugador en línea en consola</li>
        <li>Una biblioteca de los mejores títulos de Electronic Arts, recompensas exclusivas y contenido solo para miembros</li>
      </ul>
      <a class="btn link" href="/game/xbox-game-pass-ultimate_CFQ7TTC0KHS0">Ver más</a>
    </article>

    <article class="gamepass-plan">
      <h3>
        <img src="/src/assets/gamepass-console.png" alt="Game Pass para Consola" decoding="async" loading="lazy" width="174" height="20" />
      </h3>
      <ul>
        <li>Acceso ilimitado a más de 100 juegos de consola de alta calidad</li>
        <li>Agregamos juegos nuevos en todo momento</li>
        <li>Xbox Game Studios títulos el día de su lanzamiento</li>
        <li>Ofertas y descuentos para miembros</li>
      </ul>
      <a class="btn link" href="/game/xbox-game-pass-para-consola_CFQ7TTC0K6L8">Ver más</a>
    </article>

    <article class="gamepass-plan">
      <h3>
        <img src="/src/assets/gamepass-pc.png" alt="Game Pass para PC" decoding="async" loading="lazy" width="135" height="20" />
      </h3>
      <ul>
        <li>Acceso ilimitado a más de 100 juegos de alta calidad para PC</li>
        <li>Agregamos juegos nuevos en todo momento</li>
        <li>Xbox Game Studios títulos el día de su lanzamiento</li>
        <li>Ofertas y descuentos para miembros</li>
        <li>Una biblioteca de los mejores títulos de Electronic Arts, recompensas exclusivas y contenido solo para miembros en la PC</li>
      </ul>
      <a class="btn link" href="/game/game-pass-para-pc_CFQ7TTC0KGQ8">Ver más</a>
    </article>

    <article class="gamepass-plan">
      <h3>
        <img src="/src/assets/gamepass.svg" alt="Game Pass Core" decoding="async" loading="lazy" width="115" height="20" /><span>Core</span>
      </h3>
      <ul>
        <li>Juegos multijugador online para consola</li>
        <li>Un catálogo de más de 25 juegos de alta calidad para consola</li>
        <li>Ofertas y descuentos para miembros</li>
      </ul>
      <a class="btn link" href="/game/game-pass-core_CFQ7TTC0K5DJ">Ver más</a>
    </article>
  </div>
</section>
  `);
}

export function supportSection() {
  return (`
<section class="cafecito">
  <h2>¡Apoyá el crecimiento de XStoreGames!</h2>
  <ul>
    ${store === 'ar' ?
    `<li>
      <a href="https://cafecito.app/pazguille" rel="noopener" target="_blank">
        <img
          src="/src/assets/cafecito.svg"
          alt="Invitame un café en cafecito.app"
          width="192"
          height="40"
          decoding="async"
          loading="lazy"
        />
      </a>
    </li>
    <li>
      <a href="https://twitter.com/intent/follow?screen_name=xstoregames&user_id=1652087224542928897" rel="noopener" target="_blank">
        <img
          src="/src/assets/x.svg"
          alt=""
          width="25"
          height="25"
          decoding="async"
          loading="lazy"
        />
        <span>Seguime en Twitter</span>
      </a>
    </li>`
    :
    `<li>
      <a href="https://www.paypal.com/paypalme/pazguille" rel="noopener" target="_blank">
        <img
          src="/src/assets/paypal.svg"
          alt="Doná en Paypal"
          width="118"
          height="35"
          decoding="async"
          loading="lazy"
        />
      </a>
    </li>
    <li>
      <a href="https://twitter.com/intent/follow?screen_name=xstoregames&user_id=1652087224542928897" rel="noopener" target="_blank">
        <img
          src="/src/assets/x.svg"
          alt=""
          width="25"
          height="25"
          decoding="async"
          loading="lazy"
        />
        <span>Seguime en Twitter</span>
      </a>
    </li>`
    }
  </ul>
</section>
  `);

  // <li>
  //   <a href="https://twitter.com/compose/tweet?text=📣%20Ya%20podés%20explorar%20el%20catálogo%20de%20juegos%20de%20la%20tienda%20de%20Xbox%20Argentina%20con%20los%20precios%20finales%20incluidos%20los%20impuestos%20🎮🇦🇷✨%20https://xstoregames.com/" rel="noopener" target="_blank">
  //     <img
  //       src="/src/assets/twitter.svg"
  //       alt=""
  //       width="35"
  //       height="35"
  //       decoding="async"
  //       loading="lazy"
  //     />
  //     <span>Compartir en Twitter</span>
  //   </a>
  // </li>

  // <li>
  //   <a href="https://twitter.com/compose/tweet?text=📣%20Explorá%20el%20catálogo%20de%20juegos%20de%20la%20tienda%20de%20Xbox%20en%20https://xstoregames.com/${store}-store/%20🎮✨" rel="noopener" target="_blank">
  //     <img
  //       src="/src/assets/twitter.svg"
  //       alt=""
  //       width="35"
  //       height="35"
  //       decoding="async"
  //       loading="lazy"
  //     />
  //     <span>Compartir en Twitter</span>
  //   </a>
  // </li>
}

export function marketplaceItemsTemplate(items) {
  return (`
<section>
  <h2>Accesorios destacados</h2>
  <ul class="carousel" aria-roledescription="Carrusel" aria-label="Accesorios">
    <button class="prev arrow" aria-hidden="true">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.3 18.7a1 1 0 0 0 1.4-1.4l-1.4 1.4ZM9 12l-.7-.7a1 1 0 0 0 0 1.4L9 12Zm6.7-5.3a1 1 0 0 0-1.4-1.4l1.4 1.4Zm0 10.6-6-6-1.4 1.4 6 6 1.4-1.4Zm-6-4.6 6-6-1.4-1.4-6 6 1.4 1.4Z" fill="#ffffff"/></svg>
    </button>
    ${items.map(item => `<li>
      <article class="game-preview">
        <div>
          <h3 class="game-title"><a href="${item.permalink}" class="marketplace_item" target="_blank" rel="noopener noreferrer">${item.title}</a></h3>
          <div class="game-price">
            <x-price amount="${item.price}"></x-price>
          </div>
        </div>
        <img class="game-img" width="165px" height="165px" alt="" decoding="async" loading="lazy" src="${item.thumbnail.replace('http:', 'https:').replace('D_', 'D_2X_').replace('I.jpg', 'AB.webp')}">
      </article>
    </li>`).join('')}
    <button class="next arrow" aria-hidden="true">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path style="transform: rotate(180deg) translate(-24px, -24px);" d="M14.3 18.7a1 1 0 0 0 1.4-1.4l-1.4 1.4ZM9 12l-.7-.7a1 1 0 0 0 0 1.4L9 12Zm6.7-5.3a1 1 0 0 0-1.4-1.4l1.4 1.4Zm0 10.6-6-6-1.4 1.4 6 6 1.4-1.4Zm-6-4.6 6-6-1.4-1.4-6 6 1.4 1.4Z" fill="#ffffff"/></svg>
    </button>
  </ul>
</section>
`);
}

export function filtersTemplate() {
  const { pathname } = window.location;
  const { searchParams } = getPageFromURL(window.location.href);
  const filter = searchParams.get('filter');
  const sort = searchParams.get('sort');

  return (`
<h2>Ordenar</h2>
<ul>
  <li>
    <a href="${pathname}?${filter ? `filter=${filter}&` : ''}sort=lowest-price" class="link" rel="nofollow">Menor precio</a>
  </li>
  <li>
    <a href="${pathname}?${filter ? `filter=${filter}&` : ''}sort=highest-price" class="link" rel="nofollow">Mayor precio</a>
  </li>
  <li>
    <a href="${pathname}?${filter ? `filter=${filter}&` : ''}sort=discount" class="link" rel="nofollow">Descuento</a>
  </li>
  <li>
    <a href="${pathname}?${filter ? `filter=${filter}&` : ''}sort=az" class="link" rel="nofollow">A-Z</a>
  </li>
  <li>
    <a href="${pathname}?${filter ? `filter=${filter}&` : ''}sort=za" class="link" rel="nofollow">Z-A</a>
  </li>
  <li>
    <a href="${pathname}?${filter ? `filter=${filter}&` : ''}sort=release-newest" class="link" rel="nofollow">Fecha de lanzamiento más nueva</a>
  </li>
  <li>
    <a href="${pathname}?${filter ? `filter=${filter}&` : ''}sort=release-oldest" class="link" rel="nofollow">Fecha de lanzamiento más antigua</a>
  </li>
  <li>
    <a href="${pathname}?${filter ? `filter=${filter}&` : ''}sort=rating" class="link" rel="nofollow">Valoración</a>
  </li>
</ul>
<h2>Filtrar</h2>
<ul>
  <li>
    <a href="${pathname}?${sort ? `sort=${sort}&` : ''}filter=pc" class="link" rel="nofollow">Disponibles en PC</a>
  </li>
  <li>
    <a href="${pathname}?${sort ? `sort=${sort}&` : ''}filter=coop-multi" class="link" rel="nofollow">Jugar con amigos</a>
  </li>
</ul>
  `);
}

export function filtersCatalogTemplate() {
  const { pathname } = window.location;
  return (`
<h2>Ordenar</h2>
<ul>
  <li>
    <a href="${pathname}" class="link" rel="nofollow">Relevancia</a>
  </li>
  <li>
    <a href="${pathname}?sort=az" class="link" rel="nofollow">A-Z</a>
  </li>
  <li>
    <a href="${pathname}?sort=za" class="link" rel="nofollow">Z-A</a>
  </li>
</ul>
  `);
}

export function settingsTemplate() {
  const IIBB = window.localStorage.getItem('state');
  return (`
<h2>Ajustes</h2>
<section>
  <h3>Impuestos Provinciales</h3>
  <form id="state-tax" >
    <select name="state">
      <option value="">Seleccioná tu provincia...</option>
      <option value="CABA" ${IIBB === 'CABA' && 'selected'}>CABA</option>
      <option value="BA" ${IIBB === 'BA' && 'selected'}>Buenos Aires</option>
      <option value="CBA" ${IIBB === 'CBA' && 'selected'}>Córdoba</option>
      <option value="PAMP" ${IIBB === 'PAMP' && 'selected'}>La Pampa</option>
      <option value="RNEGRO" ${IIBB === 'RNEGRO' && 'selected'}>Río Negro</option>
      <option value="SALTA" ${IIBB === 'SALTA' && 'selected'}>Salta</option>
      <option value="CHACO" ${IIBB === 'CHACO' && 'selected'}>Chaco</option>
      <option value="NEU" ${IIBB === 'NEU' && 'selected'}>Neuquén</option>
      <option value="TFUE" ${IIBB === 'TFUE' && 'selected'}>Tierra del Fuego</option>
      <option value="NONE" ${IIBB === 'NONE' && 'selected'}>Otra</option>
    </select>
    <button class="btn btn-small" type="submit">Guardar</button>
  </form>
  <small>Elegí tu provincia para que el precio final sea más exacto.</small>
</section>
`);
}

export function collectionHeaderTemplate({ icon = '', title, filter = true }) {
  return (`
  <h2>${icon}${title}</h2>
  ${filter ?
  `<button id="sort-btn" class="sort-btn header-btn" aria-label="Ordenar y Filtrar">
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" stroke-width="2.3" fill="none" xmlns="http://www.w3.org/2000/svg" color="#FFF"><path d="M3 6h18M7 12h10M11 18h2" stroke="#9AA495" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>`
  : ''}`);
}

export function finanzasARGSection() {
  return (`
<hr>
<section class="finanzas-arg">
  <h2>Más aplicaciones para tus finanzas</h2>
  <a href="https://www.finanzasarg.com/" rel="nofollow noopener" target="_blank">
    <img
      src="/src/assets/finanzas-arg.webp"
      alt=""
      width="150"
      heigth="26"
      decoding="async"
      loading="lazy"
    />
  </a>
</section>
  `);
}

export function gameSkeletonTemplate() {
  return (`
<section class="section-skeleton">
  <div class="section-title skeleton"></div>
  <ul class="carousel">
    <li>
      <article class="game-preview game-preview-skeleton">
        <div>
          <div class="game-title skeleton"></div>
          <div class="game-by skeleton"></div>
          <div class="game-price skeleton"></div>
        </div>
        <span class="game-img skeleton" width="165px" height="165px"></span>
      </article>
    </li>
    <li>
      <article class="game-preview game-preview-skeleton">
        <div>
          <div class="game-title skeleton"></div>
          <div class="game-by skeleton"></div>
          <div class="game-price skeleton"></div>
        </div>
        <span class="game-img skeleton" width="165px" height="165px"></span>
      </article>
    </li>
    <li>
      <article class="game-preview game-preview-skeleton">
        <div>
          <div class="game-title skeleton"></div>
          <div class="game-by skeleton"></div>
          <div class="game-price skeleton"></div>
        </div>
        <span class="game-img skeleton" width="165px" height="165px"></span>
      </article>
    </li>
  </ul>
</section>
`);
}

export function catalogSection() {
  return (`
<section class="catalog">
  <h2>¡Explorá todo el catálogo de juegos!</h2>
  <ul>
    <li><a href="${basePath}/catalog/all" id="all" class="link">Todos</a></li>
    <li><a href="${basePath}/catalog/pc" id="pc" class="link">Solo en PC</a></li>
    <li><a href="${basePath}/catalog/shooter" id="shooter" class="link">Shooters</a></li>
    <li><a href="${basePath}/catalog/action_adventure" id="action_adventure" class="link">Acción y Aventura</a></li>
    <li><a href="${basePath}/catalog/role_playing" id="role_playing" class="link">Juegos de rol</a></li>
    <li><a href="${basePath}/catalog/platformer" id="platformer" class="link">Plataformeros</a></li>
    <li><a href="${basePath}/catalog/sports" id="sports" class="link">Deportes</a></li>
    <li><a href="${basePath}/catalog/racing_flying" id="racing_flying" class="link">Carreras</a></li>
    <li><a href="${basePath}/catalog/fighting" id="fighting" class="link">Pelea</a></li>
    <li><a href="${basePath}/catalog/strategy" id="strategy" class="link">Estrategia</a></li>
    <li><a href="${basePath}/catalog/simulation" id="simulation" class="link">Simuladores</a></li>
    <li><a href="${basePath}/catalog/puzzle_trivia" id="puzzle_trivia" class="link">Puzzles</a></li>
    <li><a href="${basePath}/catalog/family_kids" id="family_kids" class="link">Para la familia</a></li>
    <li><a href="${basePath}/catalog/classics" id="classics" class="link">Clásicos</a></li>
    <li><a href="${basePath}/catalog/music" id="music" class="link">Música</a></li>
    <li><a href="${basePath}/catalog/card_board" id="card_board" class="link">Cartas</a></li>
  </ul>
</section>
  `);
}

export function reviewsTemplate(section) {
  const stars = ['☆', '☆', '☆', '☆', '☆'];
  return (`
<section style="overflow:hidden;">
  <h2>${section.icon}${section.title}</h2>
  <ul class="carousel reviews" aria-roledescription="Carrusel" aria-label="${section.title}">
    ${section.list.map(review => `<li>
      <p><a class="link" href="/gamer/${review.userName}">${review.userName}</a> opinó:</p>
      <p>${review.title}<br/>${review.reviewText}</p>
      <p>
        <span class="visually-hidden">Lo valoró con ${review.rating}.</span>
        <span aria-hidden="true">${[...stars].fill('★', '0', review.rating).join('')}</span>
      </p>
    </li>`).join('')}
  </ul>
</section>
`);
}
