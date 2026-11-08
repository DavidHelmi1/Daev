/* Aurora Glass enhancements — progressive, no dependencies, safe if elements are missing */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* 1. Aurora layer */
  var au = document.createElement('div');
  au.className = 'aurora'; au.setAttribute('aria-hidden', 'true');
  au.innerHTML = '<i></i><i></i><i></i>';
  document.body.insertBefore(au, document.body.firstChild);

  /* 2. Scroll progress */
  var bar = document.createElement('div');
  bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var ticking = false;
  function prog() {
    ticking = false;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(prog); } }, { passive: true });
  prog();

  /* 3. Cursor spotlight on glass cards */
  if (fine) {
    var SEL = '.glass,.tile,.pane,.school,.bring article';
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest(SEL);
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* 4. Hero: floating glass cards + gentle tilt */
  var con = $('.hero .console');
  if (con && con.parentNode) {
    var stage = document.createElement('div');
    stage.className = 'stage';
    con.parentNode.insertBefore(stage, con);
    stage.appendChild(con);
    stage.insertAdjacentHTML('beforeend',
      '<div class="fcard a" aria-hidden="true"><b>5+ years</b><small>IT infrastructure &amp; support</small></div>' +
      '<div class="fcard b" aria-hidden="true"><b>Healthcare &amp; Manufacturing</b><small>operational environments</small></div>');
    if (fine && !reduce) {
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        con.style.transform = 'perspective(1100px) rotateY(' + (x * 5).toFixed(2) + 'deg) rotateX(' + (-y * 4).toFixed(2) + 'deg)';
      });
      stage.addEventListener('pointerleave', function () { con.style.transform = ''; });
    }
  }

  /* 5. Interactive network nodes */
  var topo = $('#topo');
  if (topo) {
    var desc = {
      ENDPOINTS: 'Endpoints · Deployment · End-User Support',
      SWITCH: 'LAN / WAN · Network Administration',
      FIREWALL: 'Access Control · Fortinet NSE 3',
      SERVER: 'Windows Server · Ubuntu · VMware',
      NAS: 'Synology · File Sharing · Access Control',
      BACKUP: 'Backup & Recovery · Storage Monitoring'
    };
    var cap = document.createElement('div');
    cap.className = 'topo-cap'; cap.setAttribute('aria-live', 'polite');
    topo.insertAdjacentElement('afterend', cap);
    var groups = $$('#topo > g:not([fill])');
    var setNode = function (g) {
      groups.forEach(function (x) { x.classList.toggle('hot', x === g); });
      var t = g.querySelector('text'), k = t ? t.textContent.trim() : '';
      cap.innerHTML = '<b></b><span></span>';
      cap.firstChild.textContent = k;
      cap.lastChild.textContent = desc[k] || '';
    };
    groups.forEach(function (g) {
      g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
      var t = g.querySelector('text'); if (t) g.setAttribute('aria-label', t.textContent);
      g.addEventListener('mouseenter', function () { setNode(g); });
      g.addEventListener('focus', function () { setNode(g); });
      g.addEventListener('click', function () { setNode(g); });
    });
    if (groups[3]) setNode(groups[3]);
  }

  /* 6. Skills: category filter chips (uses existing <small> labels) */
  var tiles = $('.tiles');
  if (tiles) {
    var cats = [];
    $$('.tile', tiles).forEach(function (t) {
      var s = t.querySelector('small'); t.dataset.cat = s ? s.textContent.trim() : '';
      if (t.dataset.cat && cats.indexOf(t.dataset.cat) < 0) cats.push(t.dataset.cat);
    });
    var box = document.createElement('div');
    box.className = 'chips reveal'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Filter expertise by category');
    ['All'].concat(cats).forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip-btn'; b.textContent = c; b.dataset.c = c;
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      box.appendChild(b);
    });
    tiles.parentNode.insertBefore(box, tiles);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.chip-btn'); if (!b) return;
      $$('.chip-btn', box).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      $$('.tile', tiles).forEach(function (t) { t.classList.toggle('off', b.dataset.c !== 'All' && t.dataset.cat !== b.dataset.c); });
    });
    if ('IntersectionObserver' in window && !reduce) {
      var o = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { box.classList.add('in'); o.disconnect(); } });
      o.observe(box);
    } else { box.classList.add('in'); }
  }
})();
