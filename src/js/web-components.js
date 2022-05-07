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
  static observedAttributes = ['url', 'title'];

  constructor() {
    super();
    this.addEventListener('click', this._onClick.bind(this));
  }

  attributeChangedCallback(name, oldValue, newValue) {}

  get title() { return this.getAttribute('title'); }
  set title(title) { this.setAttribute('title', title); }

  get url() { return this.getAttribute('url'); }
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

  attributeChangedCallback() {
    this._updateRendering();
  }

  _updateRendering() {
    const amount = this.amount.split('.')[0].replace(/\,|\$/gi, '');
    const fraction = this.amount.split('.')[1];

    const txt = `${amount} pesos con ${fraction} centavos`;
    const a = this.formatter.format(this.getAttribute('amount'));

    this.shadowRoot.querySelector('.price').innerHTML = this.strike ?
      this._strikeTemplate(a, txt) :
      this._amountTemplate(a, txt);
  }

  _strikeTemplate(amount, txt) {
    return `<span class="visually-hidden sr-only">Precio anterior: ${txt}</span>
      <s aria-hidden="true" class="amount">${amount}</s>`;
  }

  _amountTemplate(amount, txt) {
    return `<span class="visually-hidden sr-only">${txt}</span>
    <span aria-hidden="true" class="amount">${amount}</span>`;
  }

  get amount() { return this.getAttribute('amount'); }
  set amount(a) { this.setAttribute('amount', a); }

  get strike() { return ['on', 'true', ''].includes(this.getAttribute('strike')); }
  set strike(s) { this.setAttribute('strike', s); }
}
window.customElements.define('x-price', Price);
