// Slide the adjacent photographic plate under the diagonal cut. Vertical
// touch gestures remain available to the page.
const screen = document.querySelector('#plate-screen');
const picker = document.querySelector('.plate-picker');
const choices = [...picker.querySelectorAll('button')];
const photographs = choices.map(button => document.getElementById(button.getAttribute('aria-controls')));
const title = picker.querySelector('.plate-title');
const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
let selected = 0;
let gesture;
let transition;

function stopped() {
  return systemMotion.matches || document.documentElement.classList.contains('motion-off');
}

function cutAt(fraction, direction) {
  // A slanted leading edge stays parallel to the cut on the title panel.
  const edge = fraction * 123 - 23;
  if (direction > 0) {
    return `polygon(0 0, ${edge + 23}% 0, ${edge}% 100%, 0 100%)`;
  }
  return `polygon(${100 - edge}% 0, 100% 0, 100% 100%, ${77 - edge}% 100%)`;
}

function finishTransition() {
  transition?.cancel();
  transition = null;
  photographs.forEach((image, index) => {
    image.classList.toggle('active', index === selected);
    image.style.removeProperty('clip-path');
    image.style.removeProperty('z-index');
  });
}

function select(index, direction, fraction = 0) {
  const previous = selected;
  finishTransition();
  if (previous === index) return;
  selected = index;
  const photo = photographs[index];
  choices.forEach((button, position) => {
    button.setAttribute('aria-pressed', String(position === index));
    photographs[position].setAttribute('aria-hidden', String(position !== index));
  });
  title.textContent = choices[index].getAttribute('aria-label');
  photo.classList.add('active');

  if (stopped() || !photo.animate) {
    finishTransition();
    return;
  }
  photo.style.zIndex = '1';
  transition = photo.animate(
    [{ clipPath: cutAt(fraction, direction) }, { clipPath: cutAt(1, direction) }],
    { duration: 480 * (1 - fraction), easing: 'cubic-bezier(.2,.75,.2,1)' }
  );
  transition.onfinish = finishTransition;
}

choices.forEach((button, index) => {
  button.addEventListener('click', () => select(index, index >= selected ? 1 : -1));
  button.addEventListener('keydown', event => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + choices.length) % choices.length;
    select(next, step);
    choices[next].focus();
  });
});

screen.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  finishTransition();
  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, next: selected, fraction: 0, direction: 1 };
  screen.setPointerCapture(event.pointerId);
});

screen.addEventListener('pointermove', event => {
  if (gesture?.id !== event.pointerId) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  if (Math.abs(dx) < 6 || Math.abs(dy) > Math.abs(dx) * 1.25) return;
  const direction = dx > 0 ? 1 : -1;
  const next = (selected - direction + choices.length) % choices.length;
  if (next !== gesture.next) finishTransition();
  gesture.next = next;
  gesture.direction = direction;
  gesture.fraction = Math.min(1, Math.abs(dx) / screen.clientWidth);
  if (stopped()) return;
  const photo = photographs[next];
  photo.classList.add('active');
  photo.style.zIndex = '1';
  photo.style.clipPath = cutAt(gesture.fraction, direction);
});

function release(event) {
  if (gesture?.id !== event.pointerId) return;
  const { next, fraction, direction } = gesture;
  gesture = null;
  if (event.type === 'pointerup' && fraction > .1) select(next, direction, fraction);
  else finishTransition();
}
screen.addEventListener('pointerup', release);
screen.addEventListener('pointercancel', release);
screen.addEventListener('lostpointercapture', release);
systemMotion.addEventListener('change', finishTransition);
document.querySelector('#motion-toggle')?.addEventListener('click', finishTransition);
picker.hidden = false;
