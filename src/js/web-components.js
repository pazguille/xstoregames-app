class Loader extends HTMLElement {
  constructor() {
    super();
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        .x-loader {
          animation: xboxloader infinite 1.5s linear;
          border: #FFF 5px solid;
          border-radius:50%;
          box-sizing: border-box;
          height: 20px;
          opacity: 0;
          width: 20px;
          position: absolute;
          top: 50%;
          left: 50%;
          margin-left: -10px;
          z-index: 10;
        }

        @keyframes xboxloader {
          0% { transform: scale(0); opacity:0; }
          20% { opacity:1; }
          25% { transform: scale(1); opacity:1; }
          50% { border-width:0; opacity:0; transform: scale(1.3);  }
        }
      </style>
      <div class="x-loader"></div>`;

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.setAttribute('aria-label', 'Cargando');
  }

  show() {
    this.removeAttribute('hidden');
  }

  hide() {
    this.setAttribute('hidden', true);
  }
}
window.customElements.define('x-loader', Loader);

class ShareButton extends HTMLButtonElement {
  static observedAttributes = ['title', 'url'];

  constructor() {
    super();
    this.addEventListener('click', this._onClick.bind(this));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'title':
        this._title = newValue;
        break;

      case 'url':
        this._url = newValue;
        break;
    }
  }

  get title() { return this._title }
  set title(title) { this.setAttribute('title', title); }

  get url() { return this._url }
  set url(url) { this.setAttribute('url', url); }

  show({ title, url }) {
    if (url) {
      this.url = url;
    }

    if (title) {
      this.title = title;
    }

    this.removeAttribute('hidden');
  }

  hide() {
    this.setAttribute('hidden', true);
  }

  _onClick() {
    if ('share' in navigator) {
      navigator.share({
        title: this.title,
        url: this.url,
      });

    } else if ('clipboard' in navigator) {
      navigator.clipboard.writeText(this.url)
        .then(() => alert('¡Copiado al portapapeles!'));

    } else {
      alert(`Copiá la url: ${this.url}`);
    }
  }
}
window.customElements.define('share-button', ShareButton, { extends: 'button' });


class BackButton extends HTMLButtonElement {
  constructor() {
    super();
    this.addEventListener('click', this._onClick.bind(this));
  }

  attributeChangedCallback(name, oldValue, newValue) {}

  show() {
    this.removeAttribute('hidden');
  }

  hide() {
    this.setAttribute('hidden', true);
  }

  _onClick() {
    window.history.back();
  }
}
window.customElements.define('back-button', BackButton, { extends: 'button' });

class SwitchButton extends HTMLButtonElement {
  static observedAttributes = ['active'];
  static formAssociated = true;

  constructor() {
    super();
    this._active = null;
    this.setAttribute('role', 'switch');
    this.ariaChecked = false;
    this.addEventListener('click', this._onClick.bind(this));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this._active = ['on', 'true', ''].includes(newValue);
    this.ariaChecked = this._active;
    this._updateRendering();
  }

  get active() {
    return this._active;
  }

  set active(a) {
    this.toggleAttribute('active', Boolean(a));
  }

  show(a) {
    this.setAttribute('active', a);
    this.removeAttribute('hidden');
  }

  hide() {
    this.setAttribute('hidden', true);
  }

  _updateRendering() {
    this.classList[this._active ? 'add' : 'remove']('switch-on');
  }

  _onClick() {
    this._active = !this._active;
    this[this._active ? 'setAttribute' : 'removeAttribute']('active', '');
  }
}
window.customElements.define('switch-button', SwitchButton, { extends: 'button' });

class ToggleCollapse extends HTMLElement {
  constructor() {
    super();
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        .collapse:not([hidden]) {
          position: absolute;
          top: 0;
          right: 0;
          z-index: 2;
          height: 50px;
          background-color: var(--bg-xbox-dark-color);
          text-align: left;
          display: flex;
          align-items: center;
          margin: 0;
        }

        .close-btn {
          height: 50px;
          color: var(--txt-color);
          font-size: 16px;
          padding: 0 5px;
          background: none;
          border: none;
        }
      </style>
      <slot name="trigger"></slot>
      <div class="collapse" hidden>
        <slot name="content"></slot>
        <button class="close-btn">Cancelar</button>
      </div>`;

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.trigger.setAttribute('aria-expanded', false);
    this.trigger.setAttribute('aria-expanded', false);
    this.trigger.addEventListener('click', this.open.bind(this));
    this.closeBtn.addEventListener('click', this.close.bind(this));
    this.querySelector('[slot="content"]').removeAttribute('hidden');
  }

  get trigger() {
    return this.querySelector('[slot="trigger"]');
  }

  get content() {
    return this.shadowRoot.querySelector('.collapse');
  }

  get closeBtn() {
    return this.shadowRoot.querySelector('.close-btn');
  }

  open() {
    this.trigger.setAttribute('aria-expanded', true);
    this.content.removeAttribute('hidden');
  }

  close() {
    this.trigger.setAttribute('aria-expanded', false);
    this.content.setAttribute('hidden', true);
  }

  show() {
    this.removeAttribute('hidden');
  }

  hide() {
    this.close();
    this.setAttribute('hidden', true);
  }
}
window.customElements.define('x-toggle-collapse', ToggleCollapse);

class Price extends HTMLElement {
  static observedAttributes = ['amount', 'strike'];

  constructor() {
    super();
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        .visually-hidden {
          clip: rect(1px, 1px, 1px, 1px);
          clip-path: inset(50%);
          height: 1px;
          width: 1px;
          margin: -1px;
          overflow: hidden;
          padding: 0;
          position: absolute;
        }
      </style>
      <span class="price"></span>`;

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.formatter = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'amount':
        this._amount = newValue;
        break;

      case 'strike':
        this._strike = ['on', 'true', ''].includes(newValue);
        break;
    }
    this._updateRendering();
  }

  _updateRendering() {
    const amount = this._amount.split('.')[0].replace(/\,|\$/gi, '');
    const fraction = this._amount.split('.')[1];

    const txt = `${amount} pesos con ${fraction} centavos`;
    const a = this.formatter.format(this._amount);

    this.shadowRoot.querySelector('.price').innerHTML = this._strike ?
      this._strikeTemplate(a, txt) :
      this._amountTemplate(a, txt);
  }

  _strikeTemplate(amount, txt) {
    return `<span class="visually-hidden">Precio anterior: ${txt}</span>
      <s aria-hidden="true" class="amount">${amount}</s>`;
  }

  _amountTemplate(amount, txt) {
    return `<span class="visually-hidden">${txt}</span>
    <span aria-hidden="true" class="amount">${amount}</span>`;
  }

  get amount() { return this._amount; }
  set amount(a) { this.setAttribute('amount', a); }

  get strike() { return ['on', 'true', ''].includes(this._strike); }
  set strike(s) { this.setAttribute('strike', s); }
}
window.customElements.define('x-price', Price);
class NotificationPrompt extends HTMLElement {
  constructor() {
    super();
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host {
          display: block;
          margin: 15px;
          padding: 15px;
          border-radius: 10px;
          background: linear-gradient(210deg, #FF057C 0%, #8D0B93 50%, #321575 100%);
          width: auto;
        }

        p {
          margin: 0 0 10px;
          line-height: 1.4em;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: .9em;
          line-height: 1.5em;
          text-align: center;
          background-color: var(--txt-color);
          border: 1px solid var(--bg-highlight-color);
          padding: 0.5em 0.7em;
          cursor: pointer;
          border-radius: 4px;
          white-space: nowrap;
          box-sizing: border-box;
          text-decoration: none;
        }
      </style>
      <p>Enterate cuando tus juegos favoritos estén en oferta activando las notificaciones.</p>
      <button class="btn">
        <svg width="18" height="18"  viewBox="0 0 612 612" aria-hidden="true"><path d="M570 500c-65-29-67-155-67-158v-85c0-81-50-151-121-181a76 76 0 0 0-152 0 197 197 0 0 0-121 181v85c0 3-2 129-67 158a17 17 0 0 0 7 33h165c3 19 12 36 25 50a92 92 0 0 0 134 0c13-14 22-31 25-50h165a17 17 0 0 0 7-33zm-86-60c7 21 17 41 31 59H97c14-18 24-38 31-59h356zM306 35c19 0 35 12 40 30a197 197 0 0 0-80 0c5-18 21-30 40-30zM144 342v-85a162 162 0 0 1 324 0v85c0 2 0 30 7 63H137c7-33 7-61 7-63zm162 235c-26 0-49-19-57-44h114c-8 25-31 44-57 44z"/><path d="M306 119c-74 0-135 61-135 135a17 17 0 0 0 35 0c0-55 45-100 100-100a17 17 0 1 0 0-35z"/></svg>
        Activar notificaciones
      </button>`;

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.addEventListener('click', this._onClick.bind(this));
    this._permissions();
  }

  attributeChangedCallback(name, oldValue, newValue) {}

  show() {
    this.removeAttribute('hidden');
  }

  hide() {
    this.setAttribute('hidden', true);
  }

  _onClick() {
    window.Notification.requestPermission().then(async (result) => {
      if (result === 'granted') {
        this.hide();
      }
    });
  }

  async _permissions() {
    if (!navigator.permissions) { return; }

    const bsStatus = await navigator.permissions.query({ name: 'periodic-background-sync' });
    const notifStatus = await navigator.permissions.query({ name: 'notifications' });
    if (bsStatus.state === 'granted') {
      if (['denied', 'granted'].includes(notifStatus.state)) {
        this.hide();
      } else {
        this.show();
      }
    }
  }
}
window.customElements.define('notification-prompt', NotificationPrompt);

class InstallButton extends HTMLButtonElement {
  constructor() {
    super();
    this._deferredPrompt = null;

    this.addEventListener('click', this._onClick.bind(this));

    window.addEventListener('beforeinstallprompt', (eve) => {
      this._deferredPrompt = eve;
      this.show();
    });

    window.addEventListener('appinstalled', () => {
      this._deferredPrompt = null;
      this.hide();
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {}

  show() {
    if (this._deferredPrompt) {
      this.removeAttribute('hidden');
    }
  }

  hide() {
    this.setAttribute('hidden', true);
  }

  _onClick() {
    if (this._deferredPrompt) {
      this._deferredPrompt.prompt();
    }
  }
}
window.customElements.define('install-button', InstallButton, { extends: 'button' });


export class LiteYTEmbed extends HTMLElement{constructor(){super(),this.isIframeLoaded=!1,this.setupDom()}static get observedAttributes(){return["videoid","playlistid"]}connectedCallback(){this.addEventListener("pointerover",LiteYTEmbed.warmConnections,{once:!0}),this.addEventListener("click",(()=>this.addIframe()))}get videoId(){return encodeURIComponent(this.getAttribute("videoid")||"")}set videoId(t){this.setAttribute("videoid",t)}get playlistId(){return encodeURIComponent(this.getAttribute("playlistid")||"")}set playlistId(t){this.setAttribute("playlistid",t)}get videoTitle(){return this.getAttribute("videotitle")||"Video"}set videoTitle(t){this.setAttribute("videotitle",t)}get videoPlay(){return this.getAttribute("videoPlay")||"Play"}set videoPlay(t){this.setAttribute("videoPlay",t)}get videoStartAt(){return Number(this.getAttribute("videoStartAt")||"0")}set videoStartAt(t){this.setAttribute("videoStartAt",String(t))}get autoLoad(){return this.hasAttribute("autoload")}get noCookie(){return this.hasAttribute("nocookie")}get posterQuality(){return this.getAttribute("posterquality")||"hqdefault"}get posterLoading(){return this.getAttribute("posterloading")||"lazy"}get params(){return`start=${this.videoStartAt}&${this.getAttribute("params")}`}setupDom(){const t=this.attachShadow({mode:"open"});t.innerHTML='\n      <style>\n        :host {\n          contain: content;\n          display: block;\n          position: relative;\n          width: 100%;\n          padding-bottom: calc(100% / (16 / 9));\n          --lyt-animation: all 0.2s cubic-bezier(0, 0, 0.2, 1);\n          --lyt-play-btn-default: #212121;\n          --lyt-play-btn-hover: #f00;\n        }\n\n        #frame, #fallbackPlaceholder, iframe {\n          position: absolute;\n          width: 100%;\n          height: 100%;\n          left: 0;\n        }\n\n        #frame {\n          cursor: pointer;\n        }\n\n        #fallbackPlaceholder {\n          object-fit: cover;\n        }\n\n        #frame::before {\n          content: \'\';\n          display: block;\n          position: absolute;\n          top: 0;\n          background-image: linear-gradient(180deg, #111 -20%, transparent 90%);\n          height: 60px;\n          width: 100%;\n          transition: var(--lyt-animation);\n          z-index: 1;\n        }\n\n        #playButton {\n          width: 70px;\n          height: 46px;\n          background-color: var(--lyt-play-btn-hover);\n          z-index: 1;\n          opacity: 0.8;\n          border-radius: 14%;\n          transition: var(--lyt-animation);\n          border: 0;\n        }\n\n        #frame:hover > #playButton {\n          background-color: var(--lyt-play-btn-hover);\n          opacity: 1;\n        }\n\n        #playButton:before {\n          content: \'\';\n          border-style: solid;\n          border-width: 11px 0 11px 19px;\n          border-color: transparent transparent transparent #fff;\n        }\n\n        #playButton,\n        #playButton:before {\n          position: absolute;\n          top: 50%;\n          left: 50%;\n          transform: translate3d(-50%, -50%, 0);\n        }\n\n        /* Post-click styles */\n        .activated {\n          cursor: unset;\n        }\n\n        #frame.activated::before,\n        #frame.activated > #playButton {\n          display: none;\n        }\n      </style>\n      <div id="frame">\n        <picture>\n          <source id="webpPlaceholder" type="image/webp">\n          <source id="jpegPlaceholder" type="image/jpeg">\n          <img id="fallbackPlaceholder" referrerpolicy="origin">\n        </picture>\n        <button id="playButton"></button>\n      </div>\n    ',this.domRefFrame=t.querySelector("#frame"),this.domRefImg={fallback:t.querySelector("#fallbackPlaceholder"),webp:t.querySelector("#webpPlaceholder"),jpeg:t.querySelector("#jpegPlaceholder")},this.domRefPlayButton=t.querySelector("#playButton")}setupComponent(){this.initImagePlaceholder(),this.domRefPlayButton.setAttribute("aria-label",`${this.videoPlay}: ${this.videoTitle}`),this.setAttribute("title",`${this.videoPlay}: ${this.videoTitle}`),this.autoLoad&&this.initIntersectionObserver()}attributeChangedCallback(t,e,i){switch(t){case"videoid":case"playlistid":e!==i&&(this.setupComponent(),this.domRefFrame.classList.contains("activated")&&(this.domRefFrame.classList.remove("activated"),this.shadowRoot.querySelector("iframe").remove(),this.isIframeLoaded=!1))}}addIframe(t=!1){if(!this.isIframeLoaded){const e=t?0:1,i=this.noCookie?"-nocookie":"";let n;n=this.playlistId?`?listType=playlist&list=${this.playlistId}&`:`${this.videoId}?`;const o=`\n<iframe frameborder="0"\n  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen\n  src="https://www.youtube${i}.com/embed/${n}autoplay=${e}&${this.params}"\n></iframe>`;this.domRefFrame.insertAdjacentHTML("beforeend",o),this.domRefFrame.classList.add("activated"),this.isIframeLoaded=!0,this.dispatchEvent(new CustomEvent("liteYoutubeIframeLoaded",{detail:{videoId:this.videoId},bubbles:!0,cancelable:!0}))}}initImagePlaceholder(){LiteYTEmbed.addPrefetch("preconnect","https://i.ytimg.com/");const t=`https://i.ytimg.com/vi_webp/${this.videoId}/${this.posterQuality}.webp`,e=`https://i.ytimg.com/vi/${this.videoId}/${this.posterQuality}.jpg`;this.domRefImg.fallback.loading=this.posterLoading,this.domRefImg.webp.srcset=t,this.domRefImg.jpeg.srcset=e,this.domRefImg.fallback.src=e,this.domRefImg.fallback.setAttribute("aria-label",`${this.videoPlay}: ${this.videoTitle}`),this.domRefImg?.fallback?.setAttribute("alt",`${this.videoPlay}: ${this.videoTitle}`)}initIntersectionObserver(){new IntersectionObserver(((t,e)=>{t.forEach((t=>{t.isIntersecting&&!this.isIframeLoaded&&(LiteYTEmbed.warmConnections(),this.addIframe(!0),e.unobserve(this))}))}),{root:null,rootMargin:"0px",threshold:0}).observe(this)}static addPrefetch(t,e,i){const n=document.createElement("link");n.rel=t,n.href=e,i&&(n.as=i),n.crossOrigin="true",document.head.append(n)}static warmConnections(){LiteYTEmbed.isPreconnected||(LiteYTEmbed.addPrefetch("preconnect","https://s.ytimg.com"),LiteYTEmbed.addPrefetch("preconnect","https://www.youtube.com"),LiteYTEmbed.addPrefetch("preconnect","https://www.google.com"),LiteYTEmbed.addPrefetch("preconnect","https://googleads.g.doubleclick.net"),LiteYTEmbed.addPrefetch("preconnect","https://static.doubleclick.net"),LiteYTEmbed.isPreconnected=!0)}}LiteYTEmbed.isPreconnected=!1,customElements.define("lite-youtube",LiteYTEmbed);
