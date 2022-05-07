const touchPassiveListener = { passive: true, capture: false, };
const $main = document.querySelector('main');
const threshold = 95;
let startOffsetY = 0;
let currentOffsetY = 0;
let startOffsetX = 0;
let currentOffsetX = 0;
let refresh = false;
let scrolling = false;

window.swipeToBack = false;

function resetTouchFn(eve) {
  refresh = false;
  scrolling = false;
  currentOffsetY = 0;
  currentOffsetX = 0;
  startOffsetY = eve.touches[0].pageY;
  startOffsetX = eve.touches[0].pageX;
}

function onTouchEndFn() {
  if (refresh && startOffsetY < threshold && $main.scrollTop <= 0) {
    window.location.reload();
  } else {
    if (!(scrolling && window.swipeToBack && currentOffsetX < 0)) {
      window.swipeToBack = false;
    }
    refresh = false;
    scrolling = false;
    this.style = undefined;
  }
};

function onTouchMoveFn(eve) {
  const dif_y = eve.touches[0].pageY - startOffsetY;
  const dif_x = eve.touches[0].pageX - startOffsetX;

  if (dif_x >= currentOffsetX) {
    window.swipeToBack = true;
  }
  currentOffsetX = dif_x;

  const touchAngle = (Math.atan2(Math.abs(dif_x), Math.abs(dif_y)) * 180) / Math.PI;
  const isScrolling = touchAngle > 45;
  if (isScrolling) {
    scrolling = true;
    return;
  }

  currentOffsetY = dif_y;

  if (window.location.pathname === '/') {
    if ($main.scrollTop <= 0 && startOffsetY < threshold && currentOffsetY < threshold) {
      this.style.transform = `translateY(${currentOffsetY}px)`;
    }

    if (dif_y > threshold) {
      refresh = true;
    }
  }
};

$main.addEventListener('touchstart', resetTouchFn, touchPassiveListener);
$main.addEventListener('touchmove', onTouchMoveFn, touchPassiveListener);
$main.addEventListener('touchend', onTouchEndFn, touchPassiveListener);
