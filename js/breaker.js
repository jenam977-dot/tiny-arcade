(function () {
  'use strict';
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var scoreEl = document.getElementById('score');
  var livesEl = document.getElementById('lives');
  var bestEl = document.getElementById('best');
  var overlay = document.getElementById('overlay');
  var gameoverEl = document.getElementById('gameover');
  var finalScore = document.getElementById('finalScore');
  var finalBest = document.getElementById('finalBest');
  var startBtn = document.getElementById('startBtn');
  var restartBtn = document.getElementById('restartBtn');
  var W = 0, H = 0, lastW = 0;
  var COLS = 8, BRICK_GAP = 6, TOP = 64, BRICK_H = 22;
  var ROW_COLORS = ['#ff2e9b', '#ff9f1c', '#ffd60a', '#38d996', '#00ddeb'];
  var paddle, ball, bricks;
  var score = 0, lives = 3, level = 1, best = 0;
  var running = false, stuck = true, last = 0, msg = '', msgUntil = 0;
  var keys = {};
  try { best = parseInt(localStorage.getItem('tinyarcade_breaker_best') || '0', 10) || 0; } catch (e) {}
  best = best || 0;

  function resize() {
    var wrap = canvas.parentElement;
    W = wrap.clientWidth;
    H = Math.round(Math.max(420, Math.min(600, W * 1.15)));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (paddle) {
      paddle.w = Math.max(64, W * 0.18);
      paddle.y = H - 34;
      paddle.x = Math.max(paddle.w / 2, Math.min(W - paddle.w / 2, paddle.x));
    }
    if (Math.abs(W - lastW) > 40) {
      lastW = W;
      if (bricks) buildLevel(false);
      if (stuck && ball && paddle) stickBall();
    }
  }

  function buildLevel(resetBall) {
    var bw = (W - (COLS + 1) * BRICK_GAP) / COLS;
    bricks = [];
    var rows = Math.min(5, 3 + level);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < COLS; c++) {
        bricks.push({
          x: BRICK_GAP + c * (bw + BRICK_GAP),
          y: TOP + r * (BRICK_H + BRICK_GAP),
          w: bw, h: BRICK_H,
          color: ROW_COLORS[r % ROW_COLORS.length],
          alive: true
        });
      }
    }
    if (resetBall) stickBall();
  }

  function stickBall() {
    stuck = true;
    ball.x = paddle.x;
    ball.y = paddle.y - ball.r - 1;
    ball.vx = 0;
    ball.vy = 0;
  }

  function ballSpeed() {
    return (4.2 + level * 0.4) * Math.max(0.8, Math.min(1.2, W / 480));
  }

  function launch() {
    if (!stuck || !running) return;
    var sp = ballSpeed();
    ball.vx = sp * 0.35 * (Math.random() < 0.5 ? -1 : 1);
    ball.vy = -sp;
    stuck = false;
  }

  function setup() {
    paddle = { x: W / 2, w: Math.max(64, W * 0.18), h: 12, y: H - 34 };
    ball = { x: W / 2, y: 0, r: 8, vx: 0, vy: 0 };
    level = 1;
    buildLevel(true);
    updateHud();
  }

  function start() {
    score = 0; lives = 3; level = 1;
    setup();
    overlay.classList.add('hidden');
    gameoverEl.classList.add('hidden');
    running = true;
    last = performance.now();
  }

  function updateHud() { scoreEl.textContent = score; livesEl.textContent = lives; bestEl.textContent = best; }

  function endGame() {
    running = false;
    if (score > best) {
      best = score;
      try { localStorage.setItem('tinyarcade_breaker_best', String(best)); } catch (e) {}
    }
    finalScore.textContent = score;
    finalBest.textContent = best;
    gameoverEl.classList.remove('hidden');
  }

  function addMsg(text) { msg = text; msgUntil = performance.now() + 1400; }

  function step(now) {
    requestAnimationFrame(step);
    if (!running) { draw(); return; }
    var dt = Math.min(2.5, Math.max(0.4, (now - last) / 16.667));
    last = now;
    if (keys.left) paddle.x -= 7 * dt;
    if (keys.right) paddle.x += 7 * dt;
    paddle.x = Math.max(paddle.w / 2, Math.min(W - paddle.w / 2, paddle.x));
    if (stuck) {
      ball.x = paddle.x;
      ball.y = paddle.y - ball.r - 1;
    } else {
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
      if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); }
      if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }
      if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y + ball.r <= paddle.y + paddle.h + 8 &&
          ball.x >= paddle.x - paddle.w / 2 && ball.x <= paddle.x + paddle.w / 2) {
        var rel = (ball.x - paddle.x) / (paddle.w / 2);
        var sp = Math.hypot(ball.vx, ball.vy);
        var ang = rel * 1.05;
        ball.vx = sp * Math.sin(ang);
        ball.vy = -Math.abs(sp * Math.cos(ang));
        ball.y = paddle.y - ball.r - 1;
      }
      for (var i = 0; i < bricks.length; i++) {
        var b = bricks[i];
        if (!b.alive) continue;
        if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
            ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
          b.alive = false;
          score += 10;
          var prevX = ball.x - ball.vx * dt, prevY = ball.y - ball.vy * dt;
          var fromSide = (prevX + ball.r <= b.x) || (prevX - ball.r >= b.x + b.w);
          if (fromSide) ball.vx *= -1; else ball.vy *= -1;
          break;
        }
      }
      var cleared = true;
      for (var j = 0; j < bricks.length; j++) if (bricks[j].alive) { cleared = false; break; }
      if (cleared) {
        level++;
        score += 50;
        buildLevel(true);
        addMsg('Level ' + level);
      }
      if (ball.y - ball.r > H) {
        lives--;
        if (lives <= 0) { updateHud(); endGame(); }
        else stickBall();
      }
      updateHud();
    }
    draw();
  }

  function rr(x, y, w, h, r) {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
    else ctx.fillRect(x, y, w, h);
  }

  function draw() {
    var i;
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0d1230'); grad.addColorStop(1, '#070a1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    if (!bricks) return;
    for (i = 0; i < bricks.length; i++) {
      var b = bricks[i];
      if (!b.alive) continue;
      ctx.fillStyle = b.color;
      rr(b.x, b.y, b.w, b.h, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(b.x + 3, b.y + 3, b.w - 6, 4);
    }
    ctx.fillStyle = '#f2f4ff';
    rr(paddle.x - paddle.w / 2, paddle.y, paddle.w, paddle.h, 6);
    ctx.fillStyle = '#00ddeb';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    if (performance.now() < msgUntil) ctx.fillText(msg, W / 2, H / 2);
    if (stuck && running) {
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillStyle = '#a7b2d8';
      ctx.fillText('Tap or press Space to launch', W / 2, H - 70);
    }
  }

  function posX(e) {
    var r = canvas.getBoundingClientRect();
    return e.clientX - r.left;
  }
  canvas.addEventListener('pointermove', function (e) {
    if (!running) return;
    paddle.x = posX(e);
  });
  canvas.addEventListener('pointerdown', function () { launch(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = true; e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; e.preventDefault(); }
    else if (e.key === ' ') {
      if (!running) start();
      else launch();
      e.preventDefault();
    }
  });
  document.addEventListener('keyup', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  });

  startBtn.addEventListener('click', start);
  restartBtn.addEventListener('click', start);
  window.addEventListener('resize', resize);
  resize();
  lastW = W;
  setup();
  requestAnimationFrame(function (now) { last = now; requestAnimationFrame(step); });
  draw();
})();
