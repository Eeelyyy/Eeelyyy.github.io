// Let the illustration move while keeping the CV readable and independent of JavaScript.
const stage = document.querySelector('#stage');
const subject = document.querySelector('#subject');
const canvas = document.querySelector('#effects');
const help = document.querySelector('#play-help');
const status = document.querySelector('#play-status');

if (stage && subject && canvas) {
  const context = canvas.getContext('2d');
  const street = stage.querySelector('.street');
  const systemReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = document.querySelector('#motion-toggle');
  let pausedByUser = false;
  try { pausedByUser = window.localStorage.getItem('yl-motion') === 'off'; } catch { /* Storage may be unavailable. */ }
  let motionReduced = systemReducedMotion.matches || pausedByUser;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const motion = { x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0, tilt: 0 };
  const roadSlices = [];
  const stripeBands = [
    [1.7, 7.9, .56], [12.9, 19.7, -.76], [25.1, 31.5, .92], [37.2, 43.5, -.44],
    [49.5, 56, .72], [62.1, 68.8, -.94], [75, 82, .54], [88.3, 95.7, -.66],
  ];
  if (street) {
    const syncRoadImage = () => {
      stage.style.setProperty('--crossing-image', `url("${street.currentSrc || street.src}")`);
    };
    street.addEventListener('load', syncRoadImage);
    syncRoadImage();
  }
  stripeBands.forEach(([top, bottom, depth]) => {
    const slice = document.createElement('span');
    slice.className = 'crossing-slice';
    slice.setAttribute('aria-hidden', 'true');
    slice.style.setProperty('--slice-top', `${top}%`);
    slice.style.setProperty('--slice-bottom', `${100 - bottom}%`);
    stage.insertBefore(slice, subject);
    roadSlices.push({ element: slice, depth, x: '', y: '' });
  });

  const umbrella = subject.querySelector('.umbrella-layer');
  if (umbrella) {
    ['a', 'b'].forEach(name => {
      const echo = umbrella.cloneNode(false);
      echo.classList.remove('umbrella-layer');
      echo.classList.add('umbrella-echo', `umbrella-echo--${name}`);
      echo.alt = '';
      echo.setAttribute('aria-hidden', 'true');
      subject.insertBefore(echo, umbrella);
    });
  }

  let bounds;
  let frame = 0;
  let lastTime = 0;
  let pointer = null;
  let suppressClick = false;
  let effectStarted = 0;
  let statusTimer;
  let effectTimer;
  let visible = true;

  function measure() {
    subject.style.translate = '0px 0px';
    subject.style.rotate = '0deg';
    const stageRect = stage.getBoundingClientRect();
    const subjectRect = subject.getBoundingClientRect();
    bounds = {
      left: subjectRect.left - stageRect.left,
      top: subjectRect.top - stageRect.top,
      width: subject.offsetWidth,
      height: subject.offsetHeight,
      stageWidth: stage.clientWidth,
      stageHeight: stage.clientHeight,
    };

    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.stageWidth * scale);
    canvas.height = Math.round(bounds.stageHeight * scale);
    context?.setTransform(scale, 0, 0, scale, 0, 0);
    resetHome();
  }

  function drawSubject() {
    subject.style.translate = `${motion.x.toFixed(2)}px ${motion.y.toFixed(2)}px`;
    subject.style.rotate = `${motion.tilt.toFixed(2)}deg`;
    const engaged = Boolean(pointer) || Math.abs(motion.x) + Math.abs(motion.y)
      + Math.abs(motion.vx) + Math.abs(motion.vy) + Math.abs(motion.targetX) + Math.abs(motion.targetY) > .025;
    stage.classList.toggle('is-engaged', engaged);

    if (bounds) {
      const horizontal = clamp(motion.x / (bounds.stageWidth * .2 || 1), -1, 1);
      const vertical = clamp(motion.y / (bounds.stageHeight * .2 || 1), -1, 1);
      const maxX = clamp(bounds.stageWidth * .022, 6, 14);
      const maxY = clamp(bounds.stageHeight * .003, .7, 2);
      roadSlices.forEach(slice => {
        const x = `${(horizontal * maxX * slice.depth).toFixed(2)}px`;
        const y = `${(vertical * maxY * slice.depth).toFixed(2)}px`;
        if (slice.x !== x) slice.element.style.setProperty('--slice-x', slice.x = x);
        if (slice.y !== y) slice.element.style.setProperty('--slice-y', slice.y = y);
      });
    }
  }

  function movementLimits() {
    const stageRect = stage.getBoundingClientRect();
    const visibleRect = document.querySelector('.cross-cut')?.getBoundingClientRect() ?? stageRect;
    const visibleLeft = Math.max(stageRect.left, visibleRect.left + visibleRect.width * .16);
    const visibleTop = Math.max(stageRect.top, visibleRect.top);
    const visibleRight = Math.min(stageRect.right, visibleRect.right);
    const visibleBottom = Math.min(stageRect.bottom, visibleRect.bottom);
    const homeLeft = stageRect.left + bounds.left;
    const homeTop = stageRect.top + bounds.top;
    const minX = visibleLeft + 8 - homeLeft;
    const maxX = visibleRight - bounds.width - 8 - homeLeft;
    const minY = visibleTop + 8 - homeTop;
    const maxY = visibleBottom - bounds.height - 8 - homeTop;

    return {
      minX: maxX < minX ? (minX + maxX) / 2 : minX,
      maxX: maxX < minX ? (minX + maxX) / 2 : maxX,
      minY: maxY < minY ? (minY + maxY) / 2 : minY,
      maxY: maxY < minY ? (minY + maxY) / 2 : maxY,
    };
  }

  function clearEffect() {
    cancelAnimationFrame(frame);
    frame = 0;
    effectStarted = 0;
    context?.clearRect(0, 0, bounds.stageWidth, bounds.stageHeight);
    stage.classList.remove('is-reacting');
    subject.classList.remove('is-reacting');
    clearTimeout(effectTimer);
  }

  function resetHome() {
    if (pointer && subject.hasPointerCapture(pointer.id)) subject.releasePointerCapture(pointer.id);
    pointer = null;
    motion.x = motion.y = motion.vx = motion.vy = 0;
    motion.targetX = motion.targetY = motion.tilt = 0;
    subject.classList.remove('is-dragging', 'is-moving');
    drawSubject();
    clearEffect();
    clearTimeout(statusTimer);
    if (status) status.textContent = '';
  }

  function announce(message) {
    if (!status) return;
    clearTimeout(statusTimer);
    status.textContent = message;
    statusTimer = setTimeout(() => { status.textContent = ''; }, 1800);
  }

  function drawRain(now) {
    if (!context || !effectStarted) return false;

    const elapsed = (now - effectStarted) / 1000;
    const duration = motionReduced ? .65 : 1.15;
    context.clearRect(0, 0, bounds.stageWidth, bounds.stageHeight);

    const subjectLeft = bounds.left + motion.x;
    const subjectTop = bounds.top + motion.y;
    const centerX = subjectLeft + bounds.width / 2;
    const feetY = subjectTop + bounds.height * .96;
    const radius = Math.min(bounds.stageWidth * .18, 155);

    if (elapsed >= duration) {
      effectStarted = 0;
      context.clearRect(0, 0, bounds.stageWidth, bounds.stageHeight);
      return false;
    }
    for (let ring = 0; ring < 3; ring++) {
      const progress = clamp((elapsed / duration - ring * .14) / .72, 0, 1);
      if (progress >= 1) continue;
      const spread = motionReduced ? .34 : 1 - (1 - progress) ** 2;
      context.globalAlpha = motionReduced ? .58 : (1 - progress) ** 1.7 * .74;
      context.strokeStyle = ring === 1 ? '#e34a31' : '#f4d277';
      context.lineWidth = ring === 1 ? 1.2 : .8;
      context.setLineDash(ring === 1 ? [3, 5] : []);
      context.beginPath();
      const horizontal = 9 + radius * spread;
      const vertical = 3 + radius * .2 * spread;
      if (ring === 1) {
        // Flatten the middle field onto the road, in perspective with the rain.
        for (let side = 0; side < 8; side++) {
          const angle = (side + .5) * Math.PI / 4;
          const x = centerX + Math.cos(angle) * horizontal;
          const y = feetY + Math.sin(angle) * vertical;
          if (side === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.closePath();
      } else {
        context.ellipse(centerX, feetY, horizontal, vertical, 0, 0, Math.PI * 2);
      }
      context.stroke();
    }

    context.setLineDash([]);
    context.globalAlpha = 1;
    return true;
  }

  function wake() {
    if (frame || !visible || document.hidden || motionReduced) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function tick(now) {
    frame = 0;
    const dt = Math.min((now - lastTime) / 1000, .032);
    lastTime = now;

    if (pointer) {
      const follow = 1 - Math.exp(-23 * dt);
      motion.x += (motion.targetX - motion.x) * follow;
      motion.y += (motion.targetY - motion.y) * follow;
    } else if (!motionReduced) {
      for (let step = 0; step < 2; step++) {
        const slice = dt / 2;
        motion.vx += (-190 * (motion.x - motion.targetX) - 20 * motion.vx) * slice;
        motion.vy += (-190 * (motion.y - motion.targetY) - 20 * motion.vy) * slice;
        motion.x += motion.vx * slice;
        motion.y += motion.vy * slice;
      }
    }

    motion.tilt += ((pointer ? clamp((motion.targetX - motion.x) * .24, -9, 9) : clamp(motion.vx * .018, -7, 7)) - motion.tilt) * (1 - Math.exp(-15 * dt));
    drawSubject();

    const active = effectStarted ? drawRain(now) : false;
    const energy = Math.abs(motion.x - motion.targetX) + Math.abs(motion.y - motion.targetY)
      + Math.abs(motion.vx) + Math.abs(motion.vy) + Math.abs(motion.tilt);
    const moving = energy > .025;
    subject.classList.toggle('is-moving', moving);

    if (active || moving) frame = requestAnimationFrame(tick);
  }

  function play() {
    clearTimeout(effectTimer);
    clearEffect();
    stage.classList.remove('is-reacting');
    void stage.offsetWidth;
    stage.classList.add('is-reacting');
    subject.classList.add('is-reacting');
    announce('The umbrella tilts and ripples spread across the crossing.');

    if (motionReduced || !context) {
      effectStarted = performance.now();
      drawRain(effectStarted);
      effectTimer = setTimeout(clearEffect, 700);
      return;
    }

    effectStarted = performance.now();
    wake();
    effectTimer = setTimeout(() => {
      stage.classList.remove('is-reacting');
      subject.classList.remove('is-reacting');
    }, 760);
  }

  subject.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    pointer = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: motion.x,
      originY: motion.y,
      lastX: motion.x,
      lastY: motion.y,
      lastTime: performance.now(),
      speedX: 0,
      speedY: 0,
      moved: false,
    };
    motion.targetX = motion.x;
    motion.targetY = motion.y;
    motion.vx = motion.vy = 0;
    subject.setPointerCapture(event.pointerId);
    subject.classList.add('is-dragging');
    if (!motionReduced) wake();
  });
  subject.querySelectorAll('img').forEach(image => { image.draggable = false; });
  subject.addEventListener('dragstart', event => event.preventDefault());

  subject.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    pointer.moved ||= Math.hypot(dx, dy) > 6;

    const { minX, maxX, minY, maxY } = movementLimits();
    motion.targetX = clamp(pointer.originX + dx, minX, maxX);
    motion.targetY = clamp(pointer.originY + dy, minY, maxY);

    const now = performance.now();
    const slice = Math.max((now - pointer.lastTime) / 1000, .008);
    pointer.speedX = clamp((motion.targetX - pointer.lastX) / slice, -620, 620);
    pointer.speedY = clamp((motion.targetY - pointer.lastY) / slice, -620, 620);
    pointer.lastX = motion.targetX;
    pointer.lastY = motion.targetY;
    pointer.lastTime = now;

    if (motionReduced) {
      motion.x = motion.targetX;
      motion.y = motion.targetY;
      drawSubject();
    } else wake();
  });

  function release(event, cancelled = false) {
    if (!pointer || (event && event.pointerId !== pointer.id)) return;
    const gesture = pointer;
    pointer = null;
    suppressClick = gesture.moved || cancelled;
    if (subject.hasPointerCapture(gesture.id)) subject.releasePointerCapture(gesture.id);
    subject.classList.remove('is-dragging');
    motion.targetX = motion.targetY = 0;
    motion.vx = cancelled ? 0 : gesture.speedX * .3;
    motion.vy = cancelled ? 0 : gesture.speedY * .3;

    if (motionReduced) {
      motion.x = motion.y = motion.vx = motion.vy = motion.tilt = 0;
      drawSubject();
    } else wake();
  }

  subject.addEventListener('pointerup', event => release(event));
  subject.addEventListener('pointercancel', event => release(event, true));
  subject.addEventListener('lostpointercapture', event => release(event, true));
  subject.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) {
      suppressClick = false;
      return;
    }
    suppressClick = false;
    play();
  });

  subject.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      motion.x = motion.y = motion.targetX = motion.targetY = motion.vx = motion.vy = motion.tilt = 0;
      clearEffect();
      if (motionReduced) drawSubject(); else wake();
      announce('The figure has returned to its place.');
      return;
    }

    const direction = {
      ArrowLeft: [-26, 0],
      ArrowRight: [26, 0],
      ArrowUp: [0, -26],
      ArrowDown: [0, 26],
    }[event.key];
    if (!direction) return;
    event.preventDefault();

    const { minX, maxX, minY, maxY } = movementLimits();
    motion.targetX = clamp(motion.targetX + direction[0], minX, maxX);
    motion.targetY = clamp(motion.targetY + direction[1], minY, maxY);

    if (motionReduced) {
      motion.x = motion.targetX;
      motion.y = motion.targetY;
      drawSubject();
    } else wake();
  });

  subject.addEventListener('blur', () => {
    if (pointer) return;
    motion.targetX = motion.targetY = 0;
    if (motionReduced) {
      motion.x = motion.y = 0;
      drawSubject();
    } else wake();
  });

  function updateMotionControl() {
    motionReduced = systemReducedMotion.matches || pausedByUser;
    document.documentElement.classList.toggle('motion-off', motionReduced);
    if (!motionButton) return;
    motionButton.setAttribute('aria-pressed', String(motionReduced));
    motionButton.disabled = systemReducedMotion.matches;
    motionButton.textContent = systemReducedMotion.matches ? 'Reduced motion' : motionReduced ? 'Motion off' : 'Motion on';
  }

  window.addEventListener('blur', () => { if (pointer) release(null, true); });
  systemReducedMotion.addEventListener('change', () => {
    motionReduced = systemReducedMotion.matches || pausedByUser;
    document.documentElement.classList.toggle('motion-off', motionReduced);
    resetHome();
    updateMotionControl();
  });
  new ResizeObserver(measure).observe(stage);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) resetHome();
    }, { rootMargin: '48px' }).observe(stage);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) resetHome(); });

  subject.hidden = false;
  subject.disabled = false;
  if (help) help.hidden = false;
  if (motionButton) {
    motionButton.hidden = false;
    motionButton.setAttribute('aria-label', 'Pause animations');
    motionButton.addEventListener('click', () => {
      pausedByUser = !pausedByUser;
      try { window.localStorage.setItem('yl-motion', pausedByUser ? 'off' : 'on'); } catch { /* Keep this page’s setting in memory. */ }
      updateMotionControl();
      resetHome();
    });
  }
  updateMotionControl();
  measure();
}
