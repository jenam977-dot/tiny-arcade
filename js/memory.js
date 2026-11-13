(function () {
  'use strict';
  var board = document.getElementById('board');
  var movesEl = document.getElementById('moves');
  var timeEl = document.getElementById('time');
  var bestEl = document.getElementById('best');
  var overlay = document.getElementById('overlay');
  var gameoverEl = document.getElementById('gameover');
  var finalMoves = document.getElementById('finalMoves');
  var finalTime = document.getElementById('finalTime');
  var finalBest = document.getElementById('finalBest');
  var startBtn = document.getElementById('startBtn');
  var restartBtn = document.getElementById('restartBtn');
  var pauseOverlay = document.getElementById('pauseOverlay');
  var pauseBtn = document.getElementById('pauseBtn');
  var resumeBtn = document.getElementById('resumeBtn');
  var pauseRestartBtn = document.getElementById('pauseRestartBtn');
  var EMOJIS = ['🍕', '🚀', '🎸', '🐶', '🌈', '⚽', '🎁', '🦄'];
  var flipped = [], locked = false, moves = 0, matched = 0;
  var seconds = 0, timer = null, started = false, bestMoves = 0;
  var paused = false, won = false;
  try { bestMoves = parseInt(localStorage.getItem('tinyarcade_memory_best') || '0', 10) || 0; } catch (e) {}
  bestEl.textContent = bestMoves || '—';

  function fmt(s) {
    var m = Math.floor(s / 60), ss = s % 60;
    return m + ':' + (ss < 10 ? '0' : '') + ss;
  }

  function build() {
    board.innerHTML = '';
    var deck = EMOJIS.concat(EMOJIS);
    for (var i = deck.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0;
      var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    deck.forEach(function (e) {
      var d = document.createElement('div');
      d.className = 'mcard';
      d.setAttribute('data-emoji', e);
      var s = document.createElement('span');
      s.textContent = e;
      d.appendChild(s);
      d.addEventListener('click', function () { flip(d); });
      board.appendChild(d);
    });
  }

  function reset() {
    flipped = []; locked = false; moves = 0; matched = 0;
    seconds = 0; started = false;
    paused = false; won = false;
    clearInterval(timer); timer = null;
    movesEl.textContent = '0';
    timeEl.textContent = '0:00';
    overlay.classList.add('hidden');
    gameoverEl.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    build();
  }

  function startTimer() {
    if (started) return;
    started = true;
    timer = setInterval(function () {
      seconds++;
      timeEl.textContent = fmt(seconds);
    }, 1000);
  }

  function pauseGame() {
    if (!started || won || paused) return;
    paused = true;
    clearInterval(timer);
    timer = null;
    pauseOverlay.classList.remove('hidden');
  }
  function resumeGame() {
    if (!paused) return;
    paused = false;
    pauseOverlay.classList.add('hidden');
    timer = setInterval(function () {
      seconds++;
      timeEl.textContent = fmt(seconds);
    }, 1000);
  }
  pauseBtn.addEventListener('click', pauseGame);
  resumeBtn.addEventListener('click', resumeGame);
  pauseRestartBtn.addEventListener('click', reset);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { if (paused) resumeGame(); else pauseGame(); }
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) pauseGame(); });

  function flip(card) {
    if (locked || paused || won) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    startTimer();
    card.classList.add('flipped');
    flipped.push(card);
    if (flipped.length === 2) {
      moves++;
      movesEl.textContent = moves;
      var a = flipped[0], b = flipped[1];
      if (a.getAttribute('data-emoji') === b.getAttribute('data-emoji')) {
        a.classList.add('matched');
        b.classList.add('matched');
        flipped = [];
        matched += 2;
        if (matched === 16) win();
      } else {
        locked = true;
        setTimeout(function () {
          a.classList.remove('flipped');
          b.classList.remove('flipped');
          flipped = [];
          locked = false;
        }, 800);
      }
    }
  }

  function win() {
    won = true;
    paused = false;
    pauseOverlay.classList.add('hidden');
    clearInterval(timer);
    var isBest = !bestMoves || moves < bestMoves;
    if (isBest) {
      bestMoves = moves;
      try { localStorage.setItem('tinyarcade_memory_best', String(moves)); } catch (e) {}
    }
    bestEl.textContent = bestMoves;
    finalMoves.textContent = moves;
    finalTime.textContent = fmt(seconds);
    finalBest.textContent = bestMoves + (isBest ? ' — new best!' : '');
    gameoverEl.classList.remove('hidden');
  }

  startBtn.addEventListener('click', reset);
  restartBtn.addEventListener('click', reset);
  build();
})();
