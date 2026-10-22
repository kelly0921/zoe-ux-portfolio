/* Hero bamboo grove: three stalks on the right of the landing page that grow
   as you scroll down and lean slightly toward the mouse. The Featured Projects cards
   grow into view the same way. Styles live in css/style.css. */
(function () {
  var hero = document.getElementById('header');
  if (!hero) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LEAF = 'M0 0 C 12 -9, 32 -9, 46 0 C 32 7, 12 7, 0 0 Z';

  // x position, stalk width, final height and starting height (share of the hero), growth rate
  var STALKS = [
    { x: 90, w: 18, max: 0.95, base: 0.55, rate: 0.6 },
    { x: 190, w: 14, max: 0.72, base: 0.4, rate: 0.7 },
    { x: 280, w: 16, max: 0.85, base: 0.48, rate: 0.6 }
  ];

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  var HERO_COLORS = { stalk: '#cfe6dc', joint: '#ffffff', leaf: '#e7f3ee', leafAlt: '#a9d3c0' };

  // Draws segments from the bottom up; returns the y of each joint.
  function drawStalk(g, x, w, bottom, top, seg, colors) {
    var joints = [];
    for (var y = bottom; y > top; y -= seg) {
      var t = Math.max(top, y - seg);
      if (y - t < 6) break; // skip a sliver of a segment at the very top
      // square segment ends (tiny rx) so the stalk looks cut, not rounded
      el('rect', { x: x - w / 2, y: t + 2, width: w, height: y - t - 2, rx: 1.5, fill: colors.stalk }, g);
      el('rect', { x: x - w / 2 - 2, y: t, width: w + 4, height: 4, rx: 2, fill: colors.joint }, g);
      joints.push(t);
    }
    return joints;
  }

  // A leaf growing out of (x, y). side = 1 points right, -1 points left.
  function addLeaf(parent, x, y, side, size, color) {
    var wrap = el('g', { transform: 'translate(' + x + ' ' + y + ')' }, parent);
    var leaf = el('g', { 'class': 'bamboo-leaf' }, wrap);
    el('path', {
      d: LEAF, fill: color, 'data-side': side, 'data-size': size,
      transform: 'scale(' + side * size + ' ' + size + ') rotate(-28)'
    }, leaf);
    return leaf;
  }

  // Two leaves per joint pattern, alternating sides; returns [{ el, y }].
  function addLeaves(parent, s, k, joints, colors) {
    var leaves = [];
    joints.forEach(function (y, i) {
      if (i < 1) return;
      var side = (i + k) % 2 ? 1 : -1;
      var size = s.leaf || 1;
      leaves.push({ el: addLeaf(parent, s.x + side * s.w / 2, y, side, 1.1 * size, colors.leaf), y: y });
      if (i % 3 === 0) leaves.push({ el: addLeaf(parent, s.x - side * s.w / 2, y + 5, -side, 0.85 * size, colors.leafAlt), y: y });
    });
    return leaves;
  }

  var box = document.createElement('div');
  box.className = 'bamboo-grove';
  box.setAttribute('aria-hidden', 'true');
  hero.appendChild(box);
  var stalks = [];

  // Phones: two short stalks on each side of the scroll-down button, kept below the social icons.
  function phoneStalks(W, H) {
    var heroBox = hero.getBoundingClientRect();
    var icons = hero.querySelector('.list-social');
    var arrow = hero.querySelector('.scroll-down');
    var room = icons ? heroBox.bottom - icons.getBoundingClientRect().bottom - 32 : H * 0.3;
    var f = Math.max(0.15, Math.min(0.4, room / H));
    var gapL = arrow ? arrow.getBoundingClientRect().left - heroBox.left - 8 : W * 0.35;
    var gapR = arrow ? arrow.getBoundingClientRect().right - heroBox.left + 8 : W * 0.65;
    return [
      { x: Math.round(gapL * 0.28), w: 12, max: f, base: f * 0.55, rate: f * 0.6 },
      { x: Math.round(gapL * 0.72), w: 10, max: f * 0.72, base: f * 0.4, rate: f * 0.5 },
      { x: Math.round(gapR + (W - gapR) * 0.28), w: 10, max: f * 0.8, base: f * 0.45, rate: f * 0.5 },
      { x: Math.round(gapR + (W - gapR) * 0.72), w: 12, max: f * 0.95, base: f * 0.5, rate: f * 0.6 }
    ].map(function (s) { s.leaf = 0.75; s.seg = 48; return s; });
  }

  function build() {
    box.innerHTML = '';
    var phone = window.innerWidth < 768;
    box.setAttribute('data-size', phone ? 'phone' : window.innerWidth < 1200 ? 'compact' : 'full');
    var W = phone ? hero.offsetWidth : 360, H = hero.offsetHeight;
    var specs = phone ? phoneStalks(W, H) : STALKS;
    var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, focusable: 'false' });
    box.appendChild(svg);
    var defs = el('defs', {}, svg);

    // "ground": trims anything that would poke below the bottom of the green hero
    el('rect', { x: -200, y: -200, width: W + 400, height: H + 200 }, el('clipPath', { id: 'bamboo-ground' }, defs));
    var ground = el('g', { 'clip-path': 'url(#bamboo-ground)' }, svg);

    stalks = specs.map(function (s, k) {
      // each stalk leans and sways from its own base, so the bottoms stay planted
      var lean = el('g', { 'class': 'bamboo-lean', style: 'transform-origin:' + s.x + 'px ' + H + 'px' }, ground);
      var sway = el('g', {
        'class': 'bamboo-sway',
        style: 'transform-origin:' + s.x + 'px ' + H + 'px; animation-delay:' + (-k * 1.3) + 's'
      }, lean);
      var clip = el('rect', { x: 0, y: H, width: W, height: H }, el('clipPath', { id: 'bamboo-clip-' + k }, defs));
      var g = el('g', { 'clip-path': 'url(#bamboo-clip-' + k + ')' }, sway);
      // start a little below the edge so a tilted base never shows a gap
      var joints = drawStalk(g, s.x, s.w, H + 8, H * (1 - s.max), s.seg || 70 + k * 8, HERO_COLORS);
      var leaves = addLeaves(sway, s, k, joints, HERO_COLORS);
      return { s: s, clip: clip, leaves: leaves, H: H };
    });
    update();
  }

  // Grow each stalk based on how far the hero has been scrolled.
  function update() {
    var p = Math.min(1, window.scrollY / (hero.offsetHeight * 0.9));
    stalks.forEach(function (st) {
      var f = reduceMotion ? st.s.max : Math.min(st.s.max, st.s.base + p * st.s.rate);
      var grown = f * st.H;
      st.clip.setAttribute('y', st.H - grown);
      st.leaves.forEach(function (l) { l.el.classList.toggle('on', l.y > st.H - grown + 6); });
    });
  }

  // Clicking the bamboo shakes loose a few leaves that drift down and fade away.
  var falling = document.createElement('div');
  falling.className = 'bamboo-falling';
  falling.setAttribute('aria-hidden', 'true');
  document.body.appendChild(falling);
  var LEAF_COLORS = ['#e7f3ee', '#cfe6dc', '#a9d3c0', '#ffffff'];

  function dropLeaves(x, y) {
    var count = reduceMotion ? 4 : 12;
    for (var i = 0; i < count && falling.childElementCount < 60; i++) {
      var leaf = document.createElementNS(NS, 'svg');
      leaf.setAttribute('viewBox', '0 -10 48 20');
      leaf.setAttribute('class', 'bamboo-falling-leaf');
      el('path', { d: LEAF, fill: LEAF_COLORS[i % LEAF_COLORS.length] }, leaf);
      leaf.style.left = x + 'px';
      leaf.style.top = y + 'px';
      falling.appendChild(leaf);

      var size = 0.6 + Math.random() * 0.6;
      var spin = Math.random() * 360;
      var anim;
      if (reduceMotion) {
        anim = leaf.animate([
          { transform: 'rotate(' + spin + 'deg) scale(' + size + ')', opacity: 1 },
          { transform: 'rotate(' + spin + 'deg) scale(' + size + ')', opacity: 0 }
        ], { duration: 600, easing: 'ease-out' });
      } else {
        var dx = (Math.random() - 0.5) * 240;
        var fall = 180 + Math.random() * 200;
        var sway = (Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * 30);
        var turn = (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360);
        anim = leaf.animate([
          { transform: 'translate(0, 0) rotate(' + spin + 'deg) scale(' + size + ')', opacity: 1 },
          { transform: 'translate(' + (dx * 0.4 + sway) + 'px, ' + fall * 0.4 + 'px) rotate(' + (spin + turn * 0.4) + 'deg) scale(' + size + ')', opacity: 1, offset: 0.4 },
          { transform: 'translate(' + (dx * 0.7 - sway) + 'px, ' + fall * 0.75 + 'px) rotate(' + (spin + turn * 0.75) + 'deg) scale(' + size + ')', opacity: 0.8, offset: 0.75 },
          { transform: 'translate(' + dx + 'px, ' + fall + 'px) rotate(' + (spin + turn) + 'deg) scale(' + size + ')', opacity: 0 }
        ], { duration: 1400 + Math.random() * 900, easing: 'cubic-bezier(0.25, 0.6, 0.4, 1)' });
      }
      anim.onfinish = (function (node) { return function () { node.remove(); }; })(leaf);
    }
  }

  // Leaves on the stalks can be picked up and dragged; let go and they flutter down and fade away.
  // The empty spot grows a new leaf a few seconds later.
  var drag = null;
  var justDragged = false;

  function placeHeld(d) {
    d.held.style.left = d.x + 'px';
    d.held.style.top = d.y + 'px';
    d.held.style.transform = 'rotate(' + d.angle.toFixed(1) + 'deg) scale(' + d.side * d.size + ', ' + d.size + ')';
  }

  box.addEventListener('pointerdown', function (e) {
    var path = e.target.closest ? e.target.closest('.bamboo-leaf path') : null;
    if (!path || e.button !== 0) return;
    e.preventDefault();
    drag = {
      group: path.parentNode, color: path.getAttribute('fill'),
      side: +path.getAttribute('data-side'), size: +path.getAttribute('data-size'),
      startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY,
      vx: 0, t: performance.now(), moved: false
    };
  });

  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (!drag.moved) {
      // a few pixels of movement turns a press into a drag (a plain click still drops a burst)
      if (Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) < 5) return;
      drag.moved = true;
      drag.group.classList.add('plucked');
      drag.held = document.createElementNS(NS, 'svg');
      drag.held.setAttribute('viewBox', '0 -10 48 20');
      drag.held.setAttribute('class', 'bamboo-falling-leaf');
      el('path', { d: LEAF, fill: drag.color }, drag.held);
      falling.appendChild(drag.held);
      drag.angle = drag.side * -28;
      document.documentElement.classList.add('bamboo-dragging');
    }
    var now = performance.now();
    drag.vx = (e.clientX - drag.x) / Math.max(16, now - drag.t) * 16;
    drag.x = e.clientX;
    drag.y = e.clientY;
    drag.t = now;
    // tilt with the direction you move it, easing back toward its resting angle
    var target = drag.side * -28 + Math.max(-50, Math.min(50, drag.vx * 3));
    drag.angle += (target - drag.angle) * 0.3;
    placeHeld(drag);
  });

  function releaseLeaf() {
    if (!drag) return;
    var d = drag;
    drag = null;
    if (!d.moved) return;
    justDragged = true;
    setTimeout(function () { justDragged = false; }, 0);
    document.documentElement.classList.remove('bamboo-dragging');

    var leaf = d.held, a = d.angle;
    var shape = ' scale(' + d.side * d.size + ', ' + d.size + ')';
    var anim;
    if (reduceMotion) {
      anim = leaf.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: 'ease-out' });
    } else {
      var drift = d.vx * 12 + (Math.random() - 0.5) * 80;
      var fall = 220 + Math.random() * 160;
      var sway = (Math.random() < 0.5 ? -1 : 1) * (25 + Math.random() * 25);
      var turn = (d.vx >= 0 ? 1 : -1) * (160 + Math.random() * 200);
      anim = leaf.animate([
        { transform: 'translate(0, 0) rotate(' + a + 'deg)' + shape, opacity: 1 },
        { transform: 'translate(' + (drift * 0.4 + sway) + 'px, ' + fall * 0.4 + 'px) rotate(' + (a + turn * 0.4) + 'deg)' + shape, opacity: 1, offset: 0.4 },
        { transform: 'translate(' + (drift * 0.75 - sway) + 'px, ' + fall * 0.75 + 'px) rotate(' + (a + turn * 0.75) + 'deg)' + shape, opacity: 0.8, offset: 0.75 },
        { transform: 'translate(' + drift + 'px, ' + fall + 'px) rotate(' + (a + turn) + 'deg)' + shape, opacity: 0 }
      ], { duration: 1800 + Math.random() * 700, easing: 'cubic-bezier(0.25, 0.6, 0.4, 1)' });
    }
    anim.onfinish = function () { leaf.remove(); };
    setTimeout(function () { d.group.classList.remove('plucked'); }, 4000);
  }

  window.addEventListener('pointerup', releaseLeaf);
  window.addEventListener('pointercancel', releaseLeaf);

  box.addEventListener('click', function (e) {
    if (justDragged) return;
    dropLeaves(e.clientX, e.clientY);
  });

  if (!reduceMotion) {
    hero.addEventListener('mousemove', function (e) {
      box.style.setProperty('--lean', ((e.clientX / window.innerWidth - 0.5) * 4).toFixed(2) + 'deg');
    });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { update(); ticking = false; });
  }, { passive: true });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 150);
  });

  build();

  /* ---------- Featured Projects: cards grow upward from their base as you arrive, like the stalks ---------- */
  var projects = document.getElementById('projects');
  var cards = projects ? [].slice.call(projects.querySelectorAll('.journal-block .journal-info')) : [];
  if (cards.length && !reduceMotion) {
    projects.classList.add('grow-ready');

    var growCards = function () {
      var vh = window.innerHeight;
      var lefts = [];
      cards.forEach(function (card) {
        var left = Math.round(card.getBoundingClientRect().left);
        if (lefts.indexOf(left) < 0) lefts.push(left);
      });
      lefts.sort(function (a, b) { return a - b; });
      cards.forEach(function (card) {
        var r = card.getBoundingClientRect();
        // start a little before the card reaches the screen, so the first row begins
        // growing as soon as the "Selected work" heading appears
        if (r.top < vh * 1.25) {
          if (!card.classList.contains('grown')) {
            // cards further right start a beat later, like stalks of different heights
            card.style.setProperty('--grow-delay', (lefts.indexOf(Math.round(r.left)) * 0.2) + 's');
            card.classList.add('grown');
          }
        } else if (r.top > vh * 1.4) {
          // scrolled well back above it: reset so it grows again next time
          card.classList.remove('grown');
        }
      });
    };

    window.addEventListener('scroll', growCards, { passive: true });
    window.addEventListener('resize', growCards);
    window.addEventListener('load', growCards);
    growCards();
  }
})();
