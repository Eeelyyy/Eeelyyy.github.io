(() => {
  const art = document.getElementById('afterword-art');
  if (!art) return;

  const slider = art.querySelector('input');
  const marker = art.querySelector('.seam-marker');
  const hint = document.querySelector('label[for="artwork-seam"]');
  const update = () => {
    art.style.setProperty('--seam', slider.value + '%');
    slider.setAttribute('aria-valuetext', slider.value + '% original photograph');
  };

  update();
  slider.addEventListener('input', update);
  art.classList.add('has-seam');
  slider.hidden = marker.hidden = hint.hidden = false;
})();
