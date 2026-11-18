/* Progressive enhancement: all academic content remains available without JS. */
const $ = selector => document.querySelector(selector);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
let userPaused = false;
try { userPaused = localStorage.getItem('yl-motion') === 'off'; } catch { /* Storage is optional. */ }
let reduced = systemMotion.matches || userPaused;

const motionButton = $('#motion-toggle');
const motionLabel = $('#motion-label');
motionButton.hidden = false;
motionButton.setAttribute('aria-label', 'Pause animations');
function syncMotion() {
  reduced = systemMotion.matches || userPaused;
  document.documentElement.classList.toggle('motion-off', reduced);
  motionButton.setAttribute('aria-pressed', String(reduced));
  motionButton.disabled = systemMotion.matches;
  motionLabel.textContent = systemMotion.matches ? 'SYSTEM: REDUCED' : reduced ? 'MOTION OFF' : 'MOTION ON';
  motionButton.title = systemMotion.matches ? 'Following your system’s reduced-motion preference' : 'Toggle decorative animation';
  if (reduced) document.querySelectorAll('[data-pending]').forEach(element => element.removeAttribute('data-pending'));
}
syncMotion();
motionButton.addEventListener('click', () => {
  userPaused = !userPaused;
  try { localStorage.setItem('yl-motion', userPaused ? 'off' : 'on'); } catch { /* Keep the in-memory setting. */ }
  syncMotion();
  resetCompanion();
});
systemMotion.addEventListener('change', () => { syncMotion(); resetCompanion(); });
$('#year').textContent = String(new Date().getFullYear());

// Reveal only elements that start below the fold, and only once.
if ('IntersectionObserver' in window) {
  const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.removeAttribute('data-pending');
    reveals.unobserve(entry.target);
  }), { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(element => {
    if (!reduced && element.getBoundingClientRect().top > innerHeight) element.dataset.pending = '';
    reveals.observe(element);
  });
  const navLinks = [...document.querySelectorAll('.main-nav a')];
  const sections = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => {
      if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }), { rootMargin: '-15% 0px -55% 0px' });
  document.querySelectorAll('main > section').forEach(section => sections.observe(section));
}

const progress = $('.reading-progress');
let progressFrame = 0;
function updateProgress() {
  progressFrame = 0;
  const height = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${height > 0 ? clamp(scrollY / height, 0, 1) : 0})`;
}
addEventListener('scroll', () => { if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress); }, { passive: true });
addEventListener('resize', updateProgress, { passive: true });
updateProgress();

// Native <details> keeps keyboard and no-script behavior. Animate its actual height.
document.querySelectorAll('.research-detail').forEach(details => {
  const summary = details.querySelector('summary');
  let animation;
  let desiredOpen = details.open;
  summary.addEventListener('click', event => {
    if (reduced || !details.animate) return;
    event.preventDefault();
    const startHeight = details.getBoundingClientRect().height;
    animation?.cancel();
    desiredOpen = !desiredOpen;
    details.open = true;
    const endHeight = desiredOpen ? details.scrollHeight : summary.getBoundingClientRect().height;
    details.style.overflow = 'hidden';
    animation = details.animate([{ height: `${startHeight}px` }, { height: `${endHeight}px` }], { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' });
    animation.onfinish = () => {
      details.open = desiredOpen;
      details.style.overflow = '';
      animation = null;
      updateProgress();
    };
  });
  details.addEventListener('toggle', () => {
    if (!animation) desiredOpen = details.open;
    updateProgress();
  });
});

const stage = $('#playground');
const art = $('#art-window');
const companion = $('#nailong');
const character = $('.nailong-character');
const canvas = $('#field-canvas');
const ctx = canvas.getContext('2d');
const liveStatus = $('#play-status');
companion.hidden = false;
$('.play-controls').hidden = false;
document.body.classList.add('has-interactions');

let bounds = { width: 1, height: 1, left: 0, top: 0, mascotWidth: 128, mascotHeight: 150 };
const state = { x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0, rotation: 0, pop: 0, eyeX: 0, eyeY: 0, eyeTargetX: 0, eyeTargetY: 0, px: 0, py: 0, ptx: 0, pty: 0 };
let drag = null;
let suppressClick = false;
let frame = 0;
let previousTime = 0;
let visible = true;
let fields = [];
let labelTimeout;
let playTimeout;
let lastActivation = -Infinity;

function measure() {
  bounds = { width: stage.clientWidth, height: stage.clientHeight, left: companion.offsetLeft, top: companion.offsetTop, mascotWidth: companion.offsetWidth, mascotHeight: companion.offsetHeight };
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * dpr);
  canvas.height = Math.round(bounds.height * dpr);
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  resetCompanion();
}
const limits = () => ({ minX: -bounds.left + 4, maxX: bounds.width - bounds.left - bounds.mascotWidth - 4, minY: -bounds.top + 4, maxY: bounds.height - bounds.top - bounds.mascotHeight - 4 });

function wake() {
  if (!frame && visible && !document.hidden) {
    previousTime = performance.now();
    frame = requestAnimationFrame(tick);
  }
}
function render() {
  companion.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) rotate(${state.rotation.toFixed(2)}deg)`;
  character.style.transform = `translateY(${-state.pop * 16}px) scale(${1 - state.pop * .05}, ${1 + state.pop * .06})`;
  companion.style.setProperty('--eye-x', `${state.eyeX.toFixed(2)}px`);
  companion.style.setProperty('--eye-y', `${state.eyeY.toFixed(2)}px`);
  art.style.setProperty('--parallax-x', `${state.px.toFixed(2)}px`);
  art.style.setProperty('--parallax-y', `${state.py.toFixed(2)}px`);
}
function resetCompanion() {
  if (drag && companion.hasPointerCapture(drag.id)) companion.releasePointerCapture(drag.id);
  drag = null;
  for (const key of Object.keys(state)) state[key] = 0;
  fields = [];
  companion.classList.remove('is-dragging');
  stage.classList.remove('is-playing', 'field-active');
  clearTimeout(labelTimeout);
  clearTimeout(playTimeout);
  cancelAnimationFrame(frame);
  frame = 0;
  ctx?.clearRect(0, 0, bounds.width, bounds.height);
  render();
}

function hexagon(x, y, radius, rotation) {
  ctx.beginPath();
  for (let side = 0; side < 6; side++) {
    const angle = rotation + side * Math.PI / 3;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (side === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}
function drawFields(now) {
  if (!ctx) return;
  ctx.clearRect(0, 0, bounds.width, bounds.height);
  fields = fields.filter(field => now - field.start < 1400);
  for (const field of fields) {
    const age = (now - field.start) / 1000;
    for (let ring = 0; ring < 6; ring++) {
      const progress = clamp((age - ring * .065) / .95, 0, 1);
      if (progress <= 0 || progress >= 1) continue;
      const radius = 18 + (1 - (1 - progress) ** 3) * Math.min(bounds.width * .53, 260);
      ctx.globalAlpha = (1 - progress) ** 1.4 * .85;
      ctx.strokeStyle = ring % 2 ? '#ffd335' : '#e9623d';
      ctx.lineWidth = ring % 2 ? 1 : 1.8;
      hexagon(field.x, field.y, radius, Math.PI / 6 + ring * .018);
      ctx.stroke();
    }
    for (const particle of field.particles) {
      const p = age / particle.life;
      if (p > 1) continue;
      ctx.globalAlpha = (1 - p) ** 1.5;
      ctx.fillStyle = particle.color;
      ctx.save();
      ctx.translate(field.x + particle.vx * age, field.y + particle.vy * age + 95 * age * age);
      ctx.rotate(particle.angle + age * 2);
      ctx.fillRect(-particle.size / 2, -1, particle.size, 2);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}
function tick(now) {
  frame = 0;
  const dt = Math.min((now - previousTime) / 1000, .032);
  previousTime = now;
  if (reduced) { render(); return; }
  const ease = 1 - Math.exp(-17 * dt);
  if (drag) {
    state.x += (state.targetX - state.x) * ease;
    state.y += (state.targetY - state.y) * ease;
  } else {
    // Substeps keep the damped spring stable after slow frames.
    for (let i = 0; i < 2; i++) {
      const step = dt / 2;
      state.vx += (-185 * (state.x - state.targetX) - 19 * state.vx) * step;
      state.vy += (-185 * (state.y - state.targetY) - 19 * state.vy) * step;
      state.x += state.vx * step;
      state.y += state.vy * step;
    }
  }
  const limit = limits();
  state.x = clamp(state.x, limit.minX, limit.maxX);
  state.y = clamp(state.y, limit.minY, limit.maxY);
  state.rotation += ((drag ? clamp((state.targetX - state.x) * .35, -13, 13) : clamp(state.vx * .025, -12, 12)) - state.rotation) * ease;
  state.pop *= Math.exp(-6 * dt);
  state.eyeX += (state.eyeTargetX - state.eyeX) * ease;
  state.eyeY += (state.eyeTargetY - state.eyeY) * ease;
  state.px += (state.ptx - state.px) * ease;
  state.py += (state.pty - state.py) * ease;
  render();
  drawFields(now);
  const energy = Math.abs(state.x - state.targetX) + Math.abs(state.y - state.targetY) + Math.abs(state.vx) + Math.abs(state.vy) + Math.abs(state.rotation) + state.pop + Math.abs(state.eyeX - state.eyeTargetX) + Math.abs(state.eyeY - state.eyeTargetY) + Math.abs(state.px - state.ptx) + Math.abs(state.py - state.pty);
  if (drag || energy > .025 || fields.length) frame = requestAnimationFrame(tick);
}

function activate() {
  const now = performance.now();
  if (now - lastActivation < 220) return;
  lastActivation = now;
  stage.classList.add('field-active', 'is-playing');
  clearTimeout(labelTimeout);
  clearTimeout(playTimeout);
  liveStatus.textContent = 'Nailong activated an A.T. field!';
  labelTimeout = setTimeout(() => { stage.classList.remove('field-active', 'is-playing'); liveStatus.textContent = ''; }, 1600);
  if (reduced) return;
  state.pop = 1;
  if (ctx) fields.push({
    start: now,
    x: bounds.left + state.x + bounds.mascotWidth / 2,
    y: bounds.top + state.y + bounds.mascotHeight * .48,
    particles: Array.from({ length: 22 }, (_, i) => {
      const angle = i / 22 * Math.PI * 2;
      const speed = 65 + Math.random() * 95;
      return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 60, angle, life: .75 + Math.random() * .5, size: 3 + Math.random() * 5, color: i % 3 ? '#ffd335' : '#e9623d' };
    }),
  });
  fields = fields.slice(-3);
  wake();
}

companion.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  const now = performance.now();
  suppressClick = false;
  drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, originX: state.x, originY: state.y, lastX: state.x, lastY: state.y, lastTime: now, speedX: 0, speedY: 0, moved: false };
  state.targetX = state.x;
  state.targetY = state.y;
  state.vx = state.vy = 0;
  companion.setPointerCapture(event.pointerId);
  companion.classList.add('is-dragging');
  stage.classList.add('is-playing');
  wake();
});
companion.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  if (Math.hypot(dx, dy) > 5) drag.moved = true;
  const limit = limits();
  state.targetX = clamp(drag.originX + dx, limit.minX, limit.maxX);
  state.targetY = clamp(drag.originY + dy, limit.minY, limit.maxY);
  const now = performance.now();
  const dt = Math.max((now - drag.lastTime) / 1000, .008);
  drag.speedX = clamp((state.targetX - drag.lastX) / dt, -650, 650);
  drag.speedY = clamp((state.targetY - drag.lastY) / dt, -650, 650);
  drag.lastX = state.targetX; drag.lastY = state.targetY; drag.lastTime = now;
  if (reduced) { state.x = state.targetX; state.y = state.targetY; render(); }
  else wake();
});
function endDrag(event, cancelled = false) {
  if (!drag || (event && event.pointerId !== drag.id)) return;
  const previous = drag;
  drag = null;
  suppressClick = previous.moved || cancelled;
  if (companion.hasPointerCapture(previous.id)) companion.releasePointerCapture(previous.id);
  companion.classList.remove('is-dragging');
  state.targetX = state.targetY = 0;
  state.vx = cancelled ? 0 : previous.speedX * .35;
  state.vy = cancelled ? 0 : previous.speedY * .35;
  if (reduced) { state.x = state.y = state.vx = state.vy = 0; render(); }
  else wake();
  clearTimeout(playTimeout);
  playTimeout = setTimeout(() => stage.classList.remove('is-playing'), 1100);
}
companion.addEventListener('pointerup', event => endDrag(event));
companion.addEventListener('pointercancel', event => endDrag(event, true));
companion.addEventListener('lostpointercapture', event => endDrag(event, true));
companion.addEventListener('click', event => {
  if (suppressClick && event.detail !== 0) { suppressClick = false; return; }
  activate();
});
companion.addEventListener('keydown', event => {
  if (event.key === 'Escape') { resetCompanion(); liveStatus.textContent = 'Nailong is back home.'; return; }
  const keys = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] };
  if (!keys[event.key]) return;
  event.preventDefault();
  const limit = limits();
  state.targetX = clamp(state.targetX + keys[event.key][0], limit.minX, limit.maxX);
  state.targetY = clamp(state.targetY + keys[event.key][1], limit.minY, limit.maxY);
  if (reduced) { state.x = state.targetX; state.y = state.targetY; render(); } else wake();
});
companion.addEventListener('blur', () => {
  if (drag) return;
  state.targetX = state.targetY = 0;
  if (reduced) { state.x = state.y = 0; render(); } else wake();
});

stage.addEventListener('pointermove', event => {
  if (reduced || event.pointerType === 'touch') return;
  const rect = stage.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - .5;
  const y = (event.clientY - rect.top) / rect.height - .5;
  state.ptx = x * -7; state.pty = y * -7;
  state.eyeTargetX = clamp(x * 6, -3, 3); state.eyeTargetY = clamp(y * 4, -2, 2);
  wake();
}, { passive: true });
stage.addEventListener('pointerleave', () => { state.ptx = state.pty = state.eyeTargetX = state.eyeTargetY = 0; wake(); });

const sceneNames = ['The crossing.', 'The red shore.', 'Light and shadow.'];
let scene = 0;
function selectScene(index) {
  scene = (index + sceneNames.length) % sceneNames.length;
  document.querySelectorAll('.art-scene').forEach((element, i) => {
    element.classList.toggle('is-active', i === scene);
    element.setAttribute('aria-hidden', String(i !== scene));
    element.inert = i !== scene;
  });
  document.querySelectorAll('[data-select-scene]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === scene)));
  $('#scene-number').textContent = String(scene + 1).padStart(2, '0');
  $('#scene-name').textContent = sceneNames[scene];
  liveStatus.textContent = `Scene ${scene + 1} of 3: ${sceneNames[scene]}`;
}
document.querySelectorAll('[data-select-scene]').forEach(button => button.addEventListener('click', () => selectScene(Number(button.dataset.selectScene))));
// Horizontal art swipes change scenes; vertical touch gestures keep native page scrolling.
let swipe = null;
art.addEventListener('pointerdown', event => {
  if (event.isPrimary && event.button === 0) swipe = { x: event.clientX, y: event.clientY, id: event.pointerId };
});
art.addEventListener('pointerup', event => {
  if (!swipe || event.pointerId !== swipe.id) return;
  const dx = event.clientX - swipe.x;
  const dy = event.clientY - swipe.y;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) selectScene(scene + (dx < 0 ? 1 : -1));
  swipe = null;
});
art.addEventListener('pointercancel', () => { swipe = null; });

new ResizeObserver(measure).observe(stage);
if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  if (!visible) resetCompanion();
}, { rootMargin: '80px' }).observe(stage);
document.addEventListener('visibilitychange', () => { if (document.hidden) resetCompanion(); });
addEventListener('blur', () => { if (drag) endDrag(null, true); });
measure();
