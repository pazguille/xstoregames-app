import {
  chatWelcomeTemplate,
  chatMessageTemplate,
} from './templates.js';

import { loginURL } from './utils.js';

const $hector = document.querySelector('.hector');
const $chat = document.querySelector('.chat');
const $chatForm = document.querySelector('.chat-form');
const $chatMessages = document.querySelector('.chat-messages');
const $chatInput = document.querySelector('.chat-input');
const $chatModal = document.querySelector('.modal-chat-content');
const $chatFooter = document.querySelector('.chat footer');
const $hectorBtn = document.querySelector('.hector-btn');

let modalShowed = false;
let chatLoaded = false;
const chatHistory = new Set(
  JSON.parse(window.localStorage.getItem('chat'))
);

const gamer = JSON.parse(window.localStorage.getItem('gamer'));
// const wishlist = await new Promise((resolve) => {
//   window.db
//     .transaction('wishlist', 'readonly')
//     .objectStore('wishlist')
//     .getAll()
//     .onsuccess = async (eve) => {
//       const games = eve.target.result.map((g) => g.title).join(', ');
//       resolve(games);
//     }
// });

$chatMessages.insertAdjacentHTML('beforebegin', chatWelcomeTemplate(gamer?.displayName || ''));
const $chatWelcome = $chat.querySelector('.chat-welcome');

if (chatHistory.size === 0) {
  $chatWelcome.removeAttribute('hidden');
}

function showModal() {
  if (!gamer) {
    return window.location.href = loginURL();
  }

  $hector.removeAttribute('hidden');
  yieldToMain(() => $hector.classList.add('modal-on'));
  $chatMessages.scrollTop = $chatMessages.scrollHeight;
  $hectorBtn.classList.remove('notification');
  $chatInput.focus();
}

function closeModal() {
  $hector.toggleAttribute('hidden');
  $hector.classList.remove('modal-on');
}

$hectorBtn.addEventListener('click', (eve) => {
  eve.preventDefault();

  showModal();

  if (chatLoaded) {
    return;
  }

  chatHistory.forEach((message) => {
    yieldToMain(() => {
      $chatMessages.insertAdjacentHTML(
        'beforeend',
        chatMessageTemplate({
          role: message.role,
          text: message.parts.map(part => part.text).join(' '),
        }),
      );
    });
  });

  requestIdleCallback(() => {
    $chatMessages.scrollTop = $chatMessages.scrollHeight;
  });

  chatLoaded = true;
});

$hector.addEventListener('click', (eve) => {
  if (eve.target.classList.contains('link') || eve.target.nodeName === 'HEADER') {
    closeModal();
  }

  if (eve.target.nodeName === 'HEADER') {
    modalShowed = false;
  }

  if (eve.target.classList.contains('link')) {
    modalShowed = true;
  }
});

$chatForm.addEventListener('submit', async (eve) => {
  eve.preventDefault();
  eve.stopPropagation();

  $chatInput.focus();

  const message = eve.target.elements[0].value;

  $chatWelcome.setAttribute('hidden', 'true');
  $chatForm.reset();

  if (message === '') {
    return;
  }

  if (message === '/clean') {
    chatHistory.clear();
    window.localStorage.removeItem('chat');
    $chatWelcome.removeAttribute('hidden');
    $chatMessages.innerHTML = '';
    return;
  }

  $chatMessages.insertAdjacentHTML(
    'beforeend',
    chatMessageTemplate({
      role: 'user',
      text: message,
    })
  );

  $chatMessages.insertAdjacentHTML(
    'beforeend',
    chatMessageTemplate({
      role: 'skeleton',
      text: '•••',
    })
  );

  $chatMessages.scrollTop = $chatMessages.scrollHeight;

  const ctrl = new AbortController();
  // const response = await fetch('http://localhost:3031/api/hector-agent', {
  // const response = await fetch('http://localhost:3031/api/hector', {
  // const response = await fetch('https://fly.xstoregames.com/api/hector', {
  const response = await fetch('https://fly.xstoregames.com/api/hector-agent', {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history: Array.from(chatHistory),
      gamer: gamer?.gamertag,
      // wishlist,
      currentGame: window.currentGame,
    }),
    mode: 'cors',
    signal: ctrl.signal,
  })
  // .then(res => res.json());

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let firstEvent = true;
  let finalMessage = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      if (chunk.includes('[DONE]')) {
        break;
      }

      if (firstEvent) {
        firstEvent = false;
        $chatMessages.querySelector('.chat-message-skeleton').remove();
        $chatMessages.insertAdjacentHTML(
          'beforeend',
          chatMessageTemplate({
            role: 'model',
            text: '',
          })
        );
      }

      const lines = chunk
        .split('\n')
        .filter(line => line.startsWith('data:'))
        .map(line => line.replace(/^data:/, ''))
        .join('')

      const parsed = JSON.parse(lines);
      const message = parsed.content.parts.map(p => p.text).join(' ');
      finalMessage += message;
      const $lastMessage = $chatMessages.querySelector('.chat-message-model:last-child');
      $lastMessage.innerHTML = finalMessage;

    }

    chatHistory.add(
      {
        role: 'user',
        parts: [{ text: message }],
      }
    );
    chatHistory.add(
      {
        role: 'model',
        parts: [{ text: finalMessage }],
      }
    );

    window.localStorage.setItem('chat', JSON.stringify(Array.from(chatHistory)));

  } catch(err) {
    $chatMessages.insertAdjacentHTML(
      'beforeend',
      chatMessageTemplate({
        role: 'model',
        text: 'Ups, algo paso...',
      })
    );
    $chatMessages.insertAdjacentHTML(
      'beforeend',
      chatMessageTemplate({
        role: 'model',
        text: err,
      })
    );
    throw err;
  }

  if (!$hector.classList.contains('modal-on')) {
    $hectorBtn.classList.add('notification');
  }
});

document.body.addEventListener('keydown', (eve) => {
  if (eve.key === 'Escape' && $hector.classList.contains('modal-on')) {
    closeModal();
  }
});

window.addEventListener('popstate', (eve) => {
  if (eve.state === null && modalShowed) {
    showModal();
  } else if (modalShowed) {
    closeModal();
  }
});

const isIphone = navigator.userAgent.includes('iPhone');
if (isIphone) {
  let h = window.visualViewport.height;

  visualViewport.addEventListener('resize', (eve) => {
    if (h < window.visualViewport.height) {
      h = window.visualViewport.height

      $chatModal.style.transform = `translateY(0px)`;
      $chatModal.style.height = '82vh';
      $chat.removeAttribute('style');
      return;
    }

    h = window.visualViewport.height

    $chatModal.style.transform = `translateY(-305px)`;
    $chatModal.style.height = '50vh';
    $chat.style.height = '100%';
    window.scrollTo(0, 0);

    requestIdleCallback(() => {
      $chatMessages.scrollTop = $chatMessages.scrollHeight;
    });
  });
}

$hectorBtn.removeAttribute('hidden');
