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
          background-color: var(--bg-xbox-color);
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
    this._deferredPrompt.prompt();
  }
}
window.customElements.define('install-button', InstallButton, { extends: 'button' });
