(function () {
  'use strict';
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var N = 20, CELL = 20;
  canvas.width = N * CELL;
  canvas.height = N * CELL;
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var overlay = document.getElementById('overlay');
  var gameoverEl = document.getElementById('gameover');
  var finalScore = document.getElementById('finalScore');
  var finalBest = document.getElementById('finalBest');
  var startBtn = document.getElementById('startBtn');
  var restartBtn = document.getElementById('restartBtn');
  var snake, dir, queue, food, score, best, timer, alive, started, speed;
  try { best = parseInt(localStorage.getItem('tinyarcade_snake_best') || '0', 10) || 0; } catch (e) {}
  best = best || 0;

  function setup() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = { x: 1, y: 0 };
    queue = [];
    score = 0;
    speed = 140;
    alive = false;
    started = false;
    placeFood();
    updateHud();
  }

  function reset() {
    setup();
    alive = true;
    started = true;
    overlay.classList.add('hidden');
    gameoverEl.classList.add('hidden');
    clearTimeout(timer);
    timer = setTimeout(tick, speed);
  }

  function placeFood() {
    while (true) {
      var f = { x: (Math.random() * N) | 0, y: (Math.random() * N) | 0 };
      var clash = false;
      for (var i = 0; i < snake.length; i++) {
        if (snake[i].x === f.x && snake[i].y === f.y) { clash = true; break; }
      }
      if (!clash) { food = f; return; }
    }
  }

  function setDir(x, y) {
    var last = queue.length ? queue[queue.length - 1] : dir;
    if (x === -last.x && y === -last.y) return;
    if (x === last.x && y === last.y) return;
    if (queue.length < 3) queue.push({ x: x, y: y });
  }

  function press(x, y) {
    if (!started || !alive) { reset(); }
    setDir(x, y);
  }

  function tick() {
    if (!alive) return;
    if (queue.length) dir = queue.shift();
    var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    var dead = head.x < 0 || head.y < 0 || head.x >= N || head.y >= N;
    if (!dead) {
      for (var i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) { dead = true; break; }
      }
    }
    if (dead) {
      alive = false;
      gameOver();
      draw();
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      if (speed > 70) speed -= 4;
      placeFood();
    } else {
      snake.pop();
    }
    updateHud();
    draw();
    timer = setTimeout(tick, speed);
  }

  function updateHud() { scoreEl.textContent = score; bestEl.textContent = best; }

  function gameOver() {
    if (score > best) {
      best = score;
      try { localStorage.setItem('tinyarcade_snake_best', String(best)); } catch (e) {}
    }
    finalScore.textContent = score;
    finalBest.textContent = best;
    gameoverEl.classList.remove('hidden');
  }

  function rr(x, y, w, h, r) {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
    else ctx.fillRect(x, y, w, h);
  }

  function draw() {
    var i;
    ctx.fillStyle = '#0a0f24';
    ctx.fillRect(0, 0, N * CELL, N * CELL);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (i = 1; i < N; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, N * CELL); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(N * CELL, i * CELL); ctx.stroke();
    }
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.36, 0, 6.283);
    ctx.fill();
    for (i = 0; i < snake.length; i++) {
      var seg = snake[i];
      var pad = i === 0 ? 2 : 3;
      ctx.fillStyle = i === 0 ? '#38d996' : '#2f9e44';
      rr(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 5);
    }
  }

  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') { press(0, -1); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 's' || k === 'S') { press(0, 1); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { press(-1, 0); e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { press(1, 0); e.preventDefault(); }
    else if (k === ' ' || k === 'Enter') { if (!started || !alive) reset(); e.preventDefault(); }
  });

  var padBtns = document.querySelectorAll('[data-dir]');
  for (var b = 0; b < padBtns.length; b++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var d = btn.getAttribute('data-dir');
        if (d === 'up') press(0, -1);
        else if (d === 'down') press(0, 1);
        else if (d === 'left') press(-1, 0);
        else if (d === 'right') press(1, 0);
      });
    })(padBtns[b]);
  }

  var touchX = 0, touchY = 0;
  canvas.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0];
    touchX = t.clientX; touchY = t.clientY;
  }, { passive: true });
  canvas.addEventListener('touchend', function (e) {
    var t = e.changedTouches[0];
    var dx = t.clientX - touchX, dy = t.clientY - touchY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) press(dx > 0 ? 1 : -1, 0);
    else press(0, dy > 0 ? 1 : -1);
  }, { passive: true });

  startBtn.addEventListener('click', reset);
  restartBtn.addEventListener('click', reset);
  setup();
  draw();
})();
