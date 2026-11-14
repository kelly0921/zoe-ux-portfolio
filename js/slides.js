// Case study slide viewer: steps through exported slide images with buttons, arrow keys, or a swipe.
// Tapping a slide (or the expand button) opens it full screen, which helps most on phones.
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var ICONS = {
    prev: 'M15 6l-6 6 6 6',
    next: 'M9 6l6 6-6 6',
    close: 'M6 6l12 12M18 6L6 18',
    expand: 'M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7'
  };

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function iconButton(cls, label, icon) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('aria-label', label);
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', ICONS[icon]);
    svg.appendChild(path);
    b.appendChild(svg);
    return b;
  }

  // swipe left or right on an element to step through slides
  function onSwipe(el, step) {
    var startX = null;
    el.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (startX === null) { return; }
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) {
        e.preventDefault(); // a swipe is not a tap, so it should not also open full screen
        step(dx < 0 ? 1 : -1);
      }
    });
  }

  function setup(viewer) {
    var src = viewer.getAttribute('data-src');
    var total = parseInt(viewer.getAttribute('data-count'), 10);
    var title = viewer.getAttribute('data-title');
    var frame = viewer.querySelector('.slide-frame');
    var img = frame.querySelector('img');
    var count = viewer.querySelector('.slide-count');
    var prev = viewer.querySelector('.slide-prev');
    var next = viewer.querySelector('.slide-next');
    var current = 1;
    var box = null; // the full screen view, built the first time it opens

    function url(n) {
      return src + pad(n) + '.jpg';
    }

    function show(n) {
      current = Math.max(1, Math.min(total, n));
      img.src = url(current);
      img.alt = title + ', slide ' + current + ' of ' + total;
      count.textContent = current + ' / ' + total;
      prev.disabled = current === 1;
      next.disabled = current === total;
      if (box) {
        box.img.src = img.src;
        box.img.alt = img.alt;
        box.count.textContent = count.textContent;
        box.prev.disabled = prev.disabled;
        box.next.disabled = next.disabled;
      }
      // load the next slide early so clicking forward feels instant
      if (current < total) {
        new Image().src = url(current + 1);
      }
    }

    function step(d) { show(current + d); }

    function buildBox() {
      var el = document.createElement('div');
      el.className = 'slide-lightbox';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-label', title);
      el.hidden = true;

      var close = iconButton('slide-lightbox-close', 'Close full screen', 'close');
      var big = document.createElement('img');
      var controls = document.createElement('div');
      controls.className = 'slide-controls';
      var bPrev = iconButton('slide-prev', 'Previous slide', 'prev');
      var bNext = iconButton('slide-next', 'Next slide', 'next');
      var bCount = document.createElement('span');
      bCount.className = 'slide-count';
      controls.appendChild(bPrev);
      controls.appendChild(bCount);
      controls.appendChild(bNext);
      el.appendChild(close);
      el.appendChild(big);
      el.appendChild(controls);
      var hint = document.createElement('p');
      hint.className = 'slide-lightbox-hint';
      hint.textContent = 'Turn your phone sideways for a bigger view';
      el.appendChild(hint);
      document.body.appendChild(el);

      close.addEventListener('click', closeBox);
      bPrev.addEventListener('click', function () { step(-1); });
      bNext.addEventListener('click', function () { step(1); });
      // tapping the dark area around the slide closes it
      el.addEventListener('click', function (e) { if (e.target === el) { closeBox(); } });
      onSwipe(big, step);

      return { el: el, img: big, count: bCount, prev: bPrev, next: bNext, close: close };
    }

    function onBoxKey(e) {
      if (e.key === 'Escape') { closeBox(); }
      if (e.key === 'ArrowLeft') { step(-1); }
      if (e.key === 'ArrowRight') { step(1); }
    }

    function openBox() {
      if (!box) { box = buildBox(); }
      show(current);
      box.el.hidden = false;
      document.documentElement.classList.add('slide-lightbox-open');
      document.addEventListener('keydown', onBoxKey);
      box.close.focus();
    }

    function closeBox() {
      box.el.hidden = true;
      document.documentElement.classList.remove('slide-lightbox-open');
      document.removeEventListener('keydown', onBoxKey);
      expand.focus();
    }

    var expand = iconButton('slide-expand', 'View slides full screen', 'expand');
    frame.appendChild(expand);
    expand.addEventListener('click', openBox);
    // tapping the slide opens full screen on phones and tablets only; desktop keeps its plain viewer
    img.addEventListener('click', function () {
      if (window.matchMedia('(max-width: 991px)').matches) { openBox(); }
    });

    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });

    viewer.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
    });

    onSwipe(img, step);

    show(1);
  }

  document.querySelectorAll('.slide-viewer').forEach(setup);
})();
