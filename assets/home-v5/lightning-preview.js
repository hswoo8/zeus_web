/* Homepage interaction only. The approved showcase renderer is copied unchanged.
 * No automatic replay, audio, game state, network requests or stored preferences.
 */
(() => {
  'use strict';

  const demo = document.querySelector('[data-lightning-demo]');
  const effect = window.LightningHitV1;
  if (!demo || !effect || typeof effect.draw !== 'function') return;

  const canvas = demo.querySelector('canvas');
  const surface = demo.querySelector('[data-lightning-surface]');
  const controls = demo.querySelector('[data-lightning-controls]');
  const still = demo.querySelector('[data-lightning-still]');
  const replay = demo.querySelector('[data-lightning-replay]');
  const slow = demo.querySelector('[data-lightning-slow]');
  const quiet = demo.querySelector('[data-lightning-quiet]');
  let context;
  try { context = canvas.getContext('2d'); } catch (_) { return; }
  if (!context) return;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  quiet.checked = motionPreference.matches;
  let userSelectedQuiet = false;
  let age = 46;
  let speed = 1;
  let playing = false;
  let visible = true;
  let lastStamp = null;
  let frameRequest = 0;

  function render() {
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(bounds.width * ratio));
    const height = Math.max(1, Math.round(bounds.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, bounds.width, bounds.height);
    effect.draw(context, age, {
      x: bounds.width / 2,
      y: bounds.height / 2 - 10,
      scale: Math.min(bounds.width / 155, bounds.height / 130, 2.5),
      quiet: quiet.checked
    });
  }

  function stop() {
    playing = false;
    lastStamp = null;
    if (frameRequest) window.cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    demo.classList.remove('is-playing');
    replay.setAttribute('aria-disabled', 'false');
    surface.setAttribute('aria-disabled', 'false');
  }

  function tick(now) {
    frameRequest = 0;
    if (!playing || document.hidden || !visible) {
      stop();
      return;
    }
    const elapsed = lastStamp === null ? 0 : Math.min(100, now - lastStamp);
    lastStamp = now;
    age = Math.min(effect.durationMs, age + elapsed * speed);
    render();
    if (age >= effect.durationMs) stop();
    else frameRequest = window.requestAnimationFrame(tick);
  }

  function play() {
    // Keep one effect active at a time, even when the surface is tapped rapidly.
    if (playing || document.hidden) return;
    const bounds = surface.getBoundingClientRect();
    visible = bounds.bottom > 0 && bounds.top < window.innerHeight
      && bounds.right > 0 && bounds.left < window.innerWidth;
    if (!visible) return;
    age = 0;
    playing = true;
    lastStamp = null;
    demo.classList.add('is-playing');
    replay.setAttribute('aria-disabled', 'true');
    surface.setAttribute('aria-disabled', 'true');
    render();
    frameRequest = window.requestAnimationFrame(tick);
  }

  surface.addEventListener('click', play);
  replay.addEventListener('click', play);
  slow.addEventListener('click', () => {
    speed = speed === 1 ? 0.25 : 1;
    slow.setAttribute('aria-pressed', String(speed === 0.25));
  });
  quiet.addEventListener('change', () => {
    userSelectedQuiet = true;
    render();
  });
  const onMotionChange = event => {
    if (!userSelectedQuiet) {
      quiet.checked = event.matches;
      render();
    }
  };
  if (motionPreference.addEventListener) motionPreference.addEventListener('change', onMotionChange);
  else if (motionPreference.addListener) motionPreference.addListener(onMotionChange);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  window.addEventListener('pagehide', stop);

  try {
    surface.hidden = false;
    render();
    still.hidden = true;
    controls.hidden = false;
    demo.classList.add('is-ready');
  } catch (_) {
    stop();
    surface.hidden = true;
    still.hidden = false;
    controls.hidden = true;
    return;
  }

  if ('ResizeObserver' in window) {
    const sizeObserver = new ResizeObserver(render);
    sizeObserver.observe(surface);
  } else {
    window.addEventListener('resize', render, { passive: true });
  }
  if ('IntersectionObserver' in window) {
    const visibilityObserver = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) stop();
    });
    visibilityObserver.observe(surface);
  }
})();
