import {
  chatMessageTemplate,
} from './templates.js';

const $hector = document.querySelector('.hector');
const $chat = document.querySelector('.chat');
const $chatForm = document.querySelector('.chat-form');
const $chatMessages = document.querySelector('.chat-messages');
const $chatInput = document.querySelector('.chat-input');
const $chatModal = document.querySelector('.modal-chat-content');
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

function showModal() {
  $hector.removeAttribute('hidden');
  yieldToMain(() => $hector.classList.add('modal-on'));
  $chatMessages.scrollTop = $chatMessages.scrollHeight;
  $hectorBtn.classList.remove('notification');
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
  $chatForm.reset();

  if (message === '') {
    return;
  }

  if (message === '/clean') {
    chatHistory.clear();
    window.localStorage.removeItem('chat');
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

  // const response = await fetch('http://localhost:3031/api/hector', {
  const response = await fetch('https://fly.xstoregames.com/api/hector', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history: Array.from(chatHistory),
      gamer: gamer?.gamertag,
      // wishlist,
      // currentGame: window.currentGame,
    }),
    mode: 'cors',
  }).then(res => res.json());

  chatHistory.add(
    {
      role: 'user',
      parts: [{ text: message }],
    }
  );
  chatHistory.add(
    {
      role: 'model',
      parts: [{ text: response.message }],
    }
  );

  $chatMessages.querySelector('.chat-message-skeleton').remove();

  $chatMessages.insertAdjacentHTML(
    'beforeend',
    chatMessageTemplate({
      role: 'model',
      text: response.message,
    })
  );

  $chatMessages.scrollTop = $chatMessages.scrollHeight;

  window.localStorage.setItem('chat', JSON.stringify(Array.from(chatHistory)));

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

      // $chatModal.removeAttribute('style');
      $chatModal.style.height = '80vh';
      $chat.removeAttribute('style');
      return;
    }

    h = window.visualViewport.height

    $chatModal.style.height = `calc(${h}px - 65px)`;
    $chat.style.height = '100%';

    requestIdleCallback(() => {
      $chatMessages.scrollTop = $chatMessages.scrollHeight;
    });
  });
}

$hectorBtn.removeAttribute('hidden');
