// Case study slide viewer: steps through exported slide images with buttons, arrow keys, or a swipe.
(function () {
  'use strict';

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function setup(viewer) {
    var src = viewer.getAttribute('data-src');
    var total = parseInt(viewer.getAttribute('data-count'), 10);
    var title = viewer.getAttribute('data-title');
    var img = viewer.querySelector('.slide-frame img');
    var count = viewer.querySelector('.slide-count');
    var prev = viewer.querySelector('.slide-prev');
    var next = viewer.querySelector('.slide-next');
    var current = 1;

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
      // load the next slide early so clicking forward feels instant
      if (current < total) {
        new Image().src = url(current + 1);
      }
    }

    prev.addEventListener('click', function () { show(current - 1); });
    next.addEventListener('click', function () { show(current + 1); });

    viewer.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(current - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { show(current + 1); e.preventDefault(); }
    });

    var startX = null;
    img.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    img.addEventListener('touchend', function (e) {
      if (startX === null) { return; }
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { show(dx < 0 ? current + 1 : current - 1); }
      startX = null;
    });

    show(1);
  }

  document.querySelectorAll('.slide-viewer').forEach(setup);
})();
