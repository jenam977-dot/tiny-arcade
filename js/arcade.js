/* Tiny Arcade — shared site behaviour: theme, nav, favourites,
   recently played, fullscreen, search + filters, share links.
   No network calls. All state stays in the visitor's browser. */
(function () {
  'use strict';
  var favKey = 'tinyarcade_favs';
  var recentKey = 'tinyarcade_recent';
  var themeKey = 'tinyarcade_theme';

  function read(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  /* Theme toggle */
  var themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      var next = cur === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      write(themeKey, next);
      themeBtn.setAttribute('aria-label', next === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    });
  }

  /* Mobile nav */
  var menuBtn = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) {
        navLinks.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* Share links (filled with the current page URL at runtime) */
  (function () {
    var u = encodeURIComponent(location.href);
    var t = encodeURIComponent('Play free mini games at Tiny Arcade');
    var m = {
      whatsapp: 'https://wa.me/?text=' + t + '%20' + u,
      telegram: 'https://t.me/share/url?url=' + u + '&text=' + t,
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + u
    };
    var links = document.querySelectorAll('[data-share]');
    for (var i = 0; i < links.length; i++) {
      var k = links[i].getAttribute('data-share');
      if (m[k]) links[i].href = m[k];
    }
  })();

  /* Favourites */
  function getFavs() { return read(favKey, []); }
  function isFav(slug) { return getFavs().indexOf(slug) > -1; }
  function paintFavButtons() {
    var btns = document.querySelectorAll('[data-fav]');
    for (var i = 0; i < btns.length; i++) {
      var on = isFav(btns[i].getAttribute('data-fav'));
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      btns[i].setAttribute('aria-label', on ? 'Remove from favourites' : 'Add to favourites');
    }
  }
  function toggleFav(slug) {
    var favs = getFavs();
    var i = favs.indexOf(slug);
    if (i > -1) favs.splice(i, 1);
    else favs.push(slug);
    write(favKey, favs);
    paintFavButtons();
    renderFavourites();
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-fav]') : null;
    if (!btn) return;
    e.preventDefault();
    toggleFav(btn.getAttribute('data-fav'));
  });

  /* Recently played — recorded on first interaction with a game stage */
  function recordRecent(slug) {
    var list = read(recentKey, []);
    var i = list.indexOf(slug);
    if (i > -1) list.splice(i, 1);
    list.unshift(slug);
    write(recentKey, list.slice(0, 4));
  }
  var mainEl = document.querySelector('main[data-game]');
  if (mainEl) {
    var slug = mainEl.getAttribute('data-game');
    var stage = document.getElementById('stage');
    var recorded = false;
    var rec = function () {
      if (recorded) return;
      recorded = true;
      recordRecent(slug);
    };
    if (stage) {
      stage.addEventListener('pointerdown', rec);
      stage.addEventListener('keydown', rec);
    }
  }

  /* Fullscreen for the game stage */
  var fsBtn = document.querySelector('[data-fullscreen]');
  var stageEl = document.getElementById('stage');
  if (fsBtn && stageEl) {
    var supported = !!(stageEl.requestFullscreen || stageEl.webkitRequestFullscreen);
    if (!supported) {
      fsBtn.style.display = 'none';
    } else {
      fsBtn.addEventListener('click', function () {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } else if (stageEl.requestFullscreen) stageEl.requestFullscreen();
        else stageEl.webkitRequestFullscreen();
      });
      var onFs = function () {
        var on = !!(document.fullscreenElement || document.webkitFullscreenElement);
        fsBtn.setAttribute('aria-label', on ? 'Exit fullscreen' : 'Fullscreen');
        var label = fsBtn.querySelector('.fs-label');
        if (label) label.textContent = on ? 'Exit' : 'Fullscreen';
      };
      document.addEventListener('fullscreenchange', onFs);
      document.addEventListener('webkitfullscreenchange', onFs);
    }
  }

  /* Homepage: search + category filters */
  var grid = document.getElementById('gameGrid');
  if (grid) {
    var searchInput = document.getElementById('searchInput');
    var countEl = document.getElementById('resultCount');
    var noResults = document.getElementById('noResults');
    var activeFilter = 'all';
    var chips = document.querySelectorAll('[data-filter]');
    var applyDiscovery = function () {
      var q = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var cards = document.querySelectorAll('#gameGrid .card, #moreGrid .card');
      var shown = 0;
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var cat = c.getAttribute('data-category');
        var hay = (c.getAttribute('data-title') + ' ' + c.getAttribute('data-desc')).toLowerCase();
        var ok = (activeFilter === 'all' || cat === activeFilter) && (!q || hay.indexOf(q) > -1);
        c.classList.toggle('hidden', !ok);
        if (ok) shown++;
      }
      if (countEl) countEl.textContent = 'Showing ' + shown + ' of ' + cards.length + ' games';
      if (noResults) noResults.classList.toggle('hidden', shown > 0);
    };
    if (searchInput) searchInput.addEventListener('input', applyDiscovery);
    for (var ci = 0; ci < chips.length; ci++) {
      chips[ci].addEventListener('click', function () {
        activeFilter = this.getAttribute('data-filter');
        for (var j = 0; j < chips.length; j++) {
          chips[j].setAttribute('aria-pressed', chips[j] === this ? 'true' : 'false');
        }
        applyDiscovery();
      });
    }
    applyDiscovery();
  }

  /* Recently played + favourites sections (cloned from the main grid) */
  function cloneCard(slug) {
    if (!grid) return null;
    var src = document.querySelector('.card[data-slug="' + slug + '"]');
    if (!src) return null;
    var clone = src.cloneNode(true);
    clone.classList.remove('hidden');
    return clone;
  }
  function renderSection(containerId, emptyId, slugs) {
    var cont = document.getElementById(containerId);
    var empty = document.getElementById(emptyId);
    if (!cont) return;
    cont.innerHTML = '';
    var added = 0;
    for (var i = 0; i < slugs.length; i++) {
      var cl = cloneCard(slugs[i]);
      if (cl) { cont.appendChild(cl); added++; }
    }
    cont.classList.toggle('hidden', added === 0);
    if (empty) empty.classList.toggle('hidden', added > 0);
  }
  function renderRecent() { renderSection('recentGrid', 'recentEmpty', read(recentKey, [])); }
  function renderFavourites() { renderSection('favGrid', 'favEmpty', getFavs()); }
  renderRecent();
  renderFavourites();
  paintFavButtons();
})();
