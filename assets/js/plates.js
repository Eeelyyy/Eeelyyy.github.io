// Reveal each photograph as a small set of sharp, draggable cut layers.
// The original images stay in the document for accessibility and as the
// stable surface underneath the temporary animation layers.
const screen = document.querySelector('#plate-screen');
if (screen) {
  const picker = document.querySelector('.plate-picker');
  const choices = [...picker.querySelectorAll('button')];
  const photographs = choices.map(button => document.getElementById(button.getAttribute('aria-controls')));
  const title = picker.querySelector('.plate-title');
  const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const sliceCount = 4;
  const sliceStagger = 0.045;
  let selected = Math.max(0, choices.findIndex(button => button.getAttribute('aria-pressed') === 'true'));
  let gesture = null;
  let activeMotion = null;
  let inView = isInsideViewport();

  function isInsideViewport() {
    const bounds = screen.getBoundingClientRect();
    return bounds.width > 0 && bounds.height > 0 && bounds.right > 0 && bounds.bottom > 0 &&
      bounds.left < window.innerWidth && bounds.top < window.innerHeight;
  }

  function motionAllowed() {
    return !systemMotion.matches &&
      !document.documentElement.classList.contains('motion-off') &&
      document.visibilityState === 'visible' && inView && isInsideViewport();
  }

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  function travelDistance() {
    return Math.max(1, screen.clientWidth + 12);
  }

  function positionFor(progress, direction, index) {
    const sliceProgress = clamp((progress - index * sliceStagger) / (1 - index * sliceStagger));
    const travel = direction * travelDistance() * (1 - sliceProgress);
    const shear = (index - (sliceCount - 1) / 2) * 3.2 * (1 - sliceProgress);
    return `translate3d(${travel.toFixed(2)}px, ${shear.toFixed(2)}px, 0)`;
  }

  function discardLayers(task = activeMotion) {
    if (!task) return;
    task.animations?.forEach(animation => animation.cancel());
    task.layers.forEach(layer => layer.remove());
    if (activeMotion === task) activeMotion = null;
  }

  function paintControls(index) {
    choices.forEach((button, position) => {
      button.setAttribute('aria-pressed', String(position === index));
    });
    title.textContent = choices[index].getAttribute('aria-label');
  }

  function paintVisual(index) {
    photographs.forEach((image, position) => {
      image.setAttribute('aria-hidden', String(position !== index));
      image.classList.toggle('active', position === index);
    });
  }

  function paintSelection(index) {
    paintControls(index);
    paintVisual(index);
  }

  function finishTransition() {
    discardLayers();
    paintSelection(selected);
  }

  function createLayers(index, direction) {
    const source = photographs[index];
    if (!motionAllowed() || !source.complete || !source.naturalWidth ||
        !CSS.supports('clip-path', 'polygon(0 0, 100% 0, 100% 100%)')) {
      return null;
    }
    const objectPosition = getComputedStyle(source).objectPosition;
    const layers = Array.from({ length: sliceCount }, (_, sliceIndex) => {
      const layer = document.createElement('img');
      layer.className = 'plate-slice';
      layer.dataset.slice = String(sliceIndex);
      layer.src = source.currentSrc || source.src;
      layer.alt = '';
      layer.draggable = false;
      layer.decoding = 'async';
      layer.setAttribute('aria-hidden', 'true');
      layer.style.objectPosition = objectPosition;
      layer.style.transform = positionFor(0, direction, sliceIndex);
      screen.append(layer);
      return layer;
    });
    const task = { index, direction, layers, animations: [], progress: 0, kind: 'preview' };
    activeMotion = task;
    return task;
  }

  function updatePreview(task, progress) {
    if (activeMotion !== task) return;
    task.progress = clamp(progress);
    task.layers.forEach((layer, index) => {
      layer.style.transform = positionFor(task.progress, task.direction, index);
    });
  }

  function settlePreview(task, shouldCommit) {
    if (activeMotion !== task) return;
    if (shouldCommit) {
      selected = task.index;
      paintControls(selected);
      photographs.forEach((image, index) => image.setAttribute('aria-hidden', String(index !== selected)));
    }
    if (!motionAllowed() || !task.layers[0]?.animate) {
      finishTransition();
      return;
    }

    task.kind = shouldCommit ? 'settle' : 'return';
    const targetProgress = shouldCommit ? 1 : 0;
    const distance = shouldCommit ? 1 - task.progress : task.progress;
    const duration = Math.max(155, 540 * distance);
    const promises = task.layers.map((layer, index) => {
      const animation = layer.animate(
        [
          { transform: layer.style.transform },
          { transform: positionFor(targetProgress, task.direction, index) }
        ],
        {
          duration,
          delay: shouldCommit ? index * 34 : (sliceCount - index - 1) * 22,
          easing: shouldCommit ? 'cubic-bezier(.18,.78,.2,1)' : 'cubic-bezier(.4,0,.8,.2)',
          fill: 'forwards'
        }
      );
      task.animations.push(animation);
      return animation.finished.catch(() => null);
    });

    Promise.all(promises).then(() => {
      if (activeMotion !== task) return;
      discardLayers(task);
      paintSelection(selected);
    });
  }

  function select(index, direction) {
    gesture = null;
    finishTransition();
    if (index === selected) return;
    selected = index;
    paintControls(selected);
    photographs.forEach((image, position) => image.setAttribute('aria-hidden', String(position !== selected)));
    const task = createLayers(index, direction);
    if (task) settlePreview(task, true);
    else paintVisual(selected);
  }

  choices.forEach((button, index) => {
    button.addEventListener('click', () => select(index, index >= selected ? 1 : -1));
    button.addEventListener('keydown', event => {
      let next = null;
      if (event.key === 'ArrowLeft') next = (index - 1 + choices.length) % choices.length;
      if (event.key === 'ArrowRight') next = (index + 1) % choices.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = choices.length - 1;
      if (next === null) return;
      event.preventDefault();
      select(next, next >= selected ? 1 : -1);
      choices[next].focus();
    });
  });

  function scrub(dx) {
    const step = dx < 0 ? 1 : -1;
    const next = (selected + step + choices.length) % choices.length;
    const progress = clamp(Math.abs(dx) / Math.max(96, Math.min(280, screen.clientWidth * .72)));
    if (activeMotion && activeMotion.index !== next) discardLayers();
    const preview = activeMotion || createLayers(next, step);
    if (preview) {
      updatePreview(preview, progress);
    }
    return { preview, progress, next, step };
  }

  screen.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('button, a')) return;
    finishTransition();
    gesture = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTime: performance.now(),
      horizontal: false
    };
  });

  window.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (!gesture.horizontal) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.25) {
        gesture = null;
        return;
      }
      if (Math.abs(dx) <= Math.abs(dy) * 1.25) return;
      gesture.horizontal = true;
      try {
        screen.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is an enhancement; the gesture can still finish normally.
      }
    }
    event.preventDefault();
    scrub(dx);
  }, { passive: false });

  function releaseGesture(event, cancelled = false) {
    if (!gesture || gesture.id !== event.pointerId) return;
    const current = gesture;
    gesture = null;
    if (!current.horizontal) return;
    if (cancelled) {
      if (activeMotion?.kind === 'preview') settlePreview(activeMotion, false);
      return;
    }
    const dx = event.clientX - current.startX;
    const elapsed = Math.max(1, performance.now() - current.startTime);
    const velocity = Math.abs(dx) / elapsed;
    const { preview, progress, next, step } = scrub(dx);
    const shouldCommit = progress >= .29 || (Math.abs(dx) >= 18 && velocity >= .58);
    if (preview) settlePreview(preview, shouldCommit);
    else if (shouldCommit) select(next, step);
  }

  window.addEventListener('pointerup', event => releaseGesture(event));
  window.addEventListener('pointercancel', event => releaseGesture(event, true));
  screen.addEventListener('lostpointercapture', event => releaseGesture(event, true));

  function stopOffscreenMotion() {
    if (gesture) {
      gesture = null;
      if (activeMotion?.kind === 'preview') discardLayers(activeMotion);
    }
    finishTransition();
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      inView = entry.isIntersecting;
      if (!inView) stopOffscreenMotion();
    });
    observer.observe(screen);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') stopOffscreenMotion();
  });
  if (systemMotion.addEventListener) systemMotion.addEventListener('change', stopOffscreenMotion);
  else systemMotion.addListener?.(stopOffscreenMotion);
  document.querySelector('#motion-toggle')?.addEventListener('click', () => stopOffscreenMotion());
  window.addEventListener('pagehide', stopOffscreenMotion, { once: true });
  paintSelection(selected);
  picker.hidden = false;
}
