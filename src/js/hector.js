import {
  chatMessageTemplate,
} from './templates.js';

const $hector = document.querySelector('.hector');
const $chatForm = document.querySelector('.chat-form');
const $chatMessages = document.querySelector('.chat-messages');
const $chatWriting = document.querySelector('.chat-writing');
const $chatInput = document.querySelector('.chat-input');
const $chatModal = document.querySelector('.modal-chat-content');
const $hectorBtn = document.querySelector('.hector-btn');

let chatLoaded = false;
const chatHistory = new Set(
  JSON.parse(window.localStorage.getItem('chat'))
);

function showModal() {
  $hector.removeAttribute('hidden');
  yieldToMain(() => $hector.classList.add('modal-on'));
  $chatMessages.scrollTop = $chatMessages.scrollHeight;
}

function closeModal() {
  $hector.toggleAttribute('hidden');
  $hector.classList.remove('modal-on')
}

$hectorBtn.addEventListener('click', (eve) => {
  eve.preventDefault();

  $hector.removeAttribute('hidden');

  yieldToMain(() => $hector.classList.add('modal-on'));

  $hectorBtn.classList.remove('notification');

  $chatMessages.scrollTop = $chatMessages.scrollHeight;

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
        })
      );
    });
  });

  $chatMessages.scrollTop = $chatMessages.scrollHeight;

  chatLoaded = true;
});

$hector.addEventListener('click', (eve) => {
  if (eve.target.classList.contains('link') || eve.target.nodeName === 'HEADER') {
    closeModal();
  }
});

$chatForm.addEventListener('submit', async (eve) => {
  eve.preventDefault();
  eve.stopPropagation();

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

  $chatMessages.scrollTop = $chatMessages.scrollHeight;

  $chatWriting.removeAttribute('hidden');
  // const response = await fetch('http://localhost:3031/api/hector', {
  const response = await fetch('https://fly.xstoregames.com/api/hector', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history: Array.from(chatHistory),
    }),
    mode: 'cors',
  }).then(res => res.json());
  $chatWriting.setAttribute('hidden', true);
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

const isIphone = navigator.userAgent.includes('iPhone');
if (isIphone) {
  $chatInput.addEventListener('focus', (eve) => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      $chatModal.style.height = `calc(100% - ${window.visualViewport.height + 30}px)`;
      $chatModal.style.bottom = 'auto';
      $chatModal.style.top = '50px';
    }, 500);
  });

  $chatInput.addEventListener('blur', (eve) => {
    setTimeout(() => {
      $chatModal.removeAttribute('style');
    }, 250);
  });
}


$hectorBtn.removeAttribute('hidden');
