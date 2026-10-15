const pages = [...document.querySelectorAll('.book-page')];
const dialog = document.querySelector('#media-viewer');
const stage = document.querySelector('#media-stage');
const status = document.querySelector('#media-status');
const zoom = document.querySelector('#zoom-toggle');
const select = document.querySelector('#chapter-select');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let opener;

function loadPage(page) {
  if (!page) return;
  const img = page.querySelector('.page-image');
  if (!img.dataset.src) return;
  img.addEventListener('load', () => {
    page.classList.add('is-ready');
    page.querySelector('.page-retry').hidden = true;
  }, { once: true });
  img.addEventListener('error', () => { page.querySelector('.page-retry').hidden = false; }, { once: true });
  img.src = img.dataset.src;
  delete img.dataset.src;
}
const loader = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { loadPage(entry.target); loader.unobserve(entry.target); } });
}, { rootMargin: '1000px 0px' });
pages.forEach(page => loader.observe(page));

// Track the reading position without intercepting native wheel or touch scrolling.
const current = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const page = entry.target;
    document.querySelector('#reading-position').textContent = page.dataset.position + ' / ' + pages.length;
    select.value = page.id;
    document.querySelectorAll('.reading-projects a').forEach(a => {
      if (a.dataset.project === page.dataset.project) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }
}, { rootMargin: '-64px 0px -65% 0px' });
pages.forEach(page => current.observe(page));

function prepareTarget() {
  const page = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (page?.classList.contains('book-page')) {
    loadPage(page);
    loadPage(pages[pages.indexOf(page) + 1]);
  }
}
window.addEventListener('hashchange', prepareTarget);
prepareTarget();
select.addEventListener('change', () => { location.hash = select.value; });

function openViewer(button, title) {
  opener = button;
  document.querySelector('#media-title').textContent = title;
  status.textContent = '';
  stage.replaceChildren();
  stage.classList.remove('actual-size');
  zoom.textContent = '原尺寸';
  zoom.setAttribute('aria-pressed', 'false');
  document.body.classList.add('media-open');
  dialog.showModal();
  document.dispatchEvent(new CustomEvent('reader:overlay', { detail: { open: true } }));
  document.querySelector('#media-close').focus();
}
document.addEventListener('click', event => {
  const retry = event.target.closest('.page-retry');
  if (retry) {
    const page = retry.closest('.book-page');
    page.querySelector('.page-image').dataset.src = retry.dataset.src;
    loadPage(page); return;
  }
  const videoButton = event.target.closest('[data-video]');
  if (videoButton) {
    openViewer(videoButton, videoButton.dataset.title);
    zoom.hidden = true;
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'none';
    video.poster = videoButton.dataset.poster;
    video.src = videoButton.dataset.video;
    video.setAttribute('aria-label', videoButton.dataset.title);
    video.addEventListener('error', () => { status.textContent = '视频暂时无法播放，请关闭后重试。'; });
    stage.append(video);
    // Attach and request media only after a deliberate play click.
    video.play().catch(() => { status.textContent = '点击视频中的播放按钮开始。'; });
    return;
  }
  const button = event.target.closest('[data-enlarge]');
  if (button) {
    openViewer(button, button.dataset.title);
    zoom.hidden = false;
    const img = new Image();
    img.src = button.dataset.enlarge;
    img.alt = button.dataset.title;
    img.width = 1920; img.height = 1080;
    stage.append(img);
  }
});
zoom.addEventListener('click', () => {
  const actual = stage.classList.toggle('actual-size');
  zoom.textContent = actual ? '适应窗口' : '原尺寸';
  zoom.setAttribute('aria-pressed', String(actual));
});
document.querySelector('#media-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  const video = stage.querySelector('video');
  if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
  stage.replaceChildren();
  document.body.classList.remove('media-open');
  opener?.focus({ preventScroll: true });
  document.dispatchEvent(new CustomEvent('reader:overlay', { detail: { open: false } }));
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stage.querySelector('video')?.pause();
});
window.addEventListener('pageshow', event => {
  if (event.persisted || performance.getEntriesByType('navigation')[0]?.type === 'back_forward') return;
  if (location.hash) {
    prepareTarget();
    document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: 'instant' });
  } else window.scrollTo({ top: 0, behavior: 'instant' });
});
window.addEventListener('beforeprint', () => pages.forEach(loadPage));
motion.addEventListener('change', () => { document.documentElement.style.scrollBehavior = motion.matches ? 'auto' : ''; });
