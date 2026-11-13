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
  var pauseOverlay = document.getElementById('pauseOverlay');
  var pauseBtn = document.getElementById('pauseBtn');
  var resumeBtn = document.getElementById('resumeBtn');
  var pauseRestartBtn = document.getElementById('pauseRestartBtn');
  var W = 0, H = 0;
  var TYPES = [
    { emoji: '🍉', color: '#ff5a5a' },
    { emoji: '🍎', color: '#e23b3b' },
    { emoji: '🍊', color: '#ff9f1c' },
    { emoji: '🍋', color: '#ffd60a' },
    { emoji: '🥝', color: '#8ac926' },
    { emoji: '🍓', color: '#ff4d6d' },
    { emoji: '🍇', color: '#9b5de5' },
    { emoji: '🍍', color: '#ffb703' }
  ];
  var fruits = [], halves = [], parts = [], pops = [], trail = [];
  var running = false, paused = false, score = 0, lives = 3, best = 0;
  var spawnIn = 0, flash = 0, shake = 0, last = 0;
  try { best = parseInt(localStorage.getItem('tinyarcade_fruit_best') || '0', 10) || 0; } catch (e) {}
  bestEl.textContent = best;

  function resize() {
    var wrap = canvas.parentElement;
    var fs = document.fullscreenElement === wrap || document.webkitFullscreenElement === wrap;
    W = wrap.clientWidth || window.innerWidth;
    if (fs) {
      H = wrap.clientHeight || window.innerHeight;
    } else {
      H = Math.round(Math.max(340, Math.min(560, W * 0.72)));
    }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  document.addEventListener('fullscreenchange', function () { requestAnimationFrame(resize); });
  document.addEventListener('webkitfullscreenchange', function () { requestAnimationFrame(resize); });
  resize();

  function rand(a, b) { return a + Math.random() * (b - a); }

  function spawn() {
    var bombs = 0, i;
    for (i = 0; i < fruits.length; i++) if (fruits[i].bomb) bombs++;
    var isBomb = Math.random() < 0.11 && bombs === 0;
    var r = rand(30, 44) * (W < 420 ? 0.85 : 1);
    var x = rand(W * 0.12, W * 0.88);
    var f = {
      x: x, y: H + r + 10,
      vx: (W / 2 - x) * 0.0016 + rand(-1.1, 1.1),
      vy: -(rand(10.5, 14.5) * (H / 500)),
      r: r, rot: rand(0, 6.28), vr: rand(-0.06, 0.06),
      bomb: isBomb, sliced: false
    };
    if (isBomb) { f.emoji = '💣'; f.color = '#222222'; }
    else { var t = TYPES[(Math.random() * TYPES.length) | 0]; f.emoji = t.emoji; f.color = t.color; }
    fruits.push(f);
  }

  function segDist(x1, y1, x2, y2, px, py) {
    var dx = x2 - x1, dy = y2 - y1;
    var l2 = dx * dx + dy * dy;
    var t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    var cx = x1 + t * dx, cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  }

  function sliceAt(x1, y1, x2, y2) {
    var hit = 0;
    for (var i = fruits.length - 1; i >= 0; i--) {
      var f = fruits[i];
      if (!f) continue;
      if (f.sliced) continue;
      if (segDist(x1, y1, x2, y2, f.x, f.y) < f.r) { doSlice(i); hit++; if (!running) break; }
    }
    if (hit > 1) { addPop(W / 2, H * 0.3, 'COMBO x' + hit + '  +' + (hit * 10)); score += hit * 10; updateHud(); }
  }

  function doSlice(i) {
    if (!running) return;
    var f = fruits.splice(i, 1)[0];
    if (!f) return;
    if (f.bomb) {
      lives = Math.max(0, lives - 1); flash = 14; shake = 10;
      fruits.length = 0; halves.length = 0;
      addPop(f.x, f.y, 'BOOM!');
      updateHud();
      if (lives <= 0) endGame();
      return;
    }
    score += 10;
    addPop(f.x, f.y, '+10');
    var s, p;
    for (s = 0; s < 2; s++) {
      halves.push({
        x: f.x, y: f.y, vx: f.vx + (s ? -2.4 : 2.4), vy: f.vy * 0.4 - 1.5,
        rot: f.rot, vr: (s ? -1 : 1) * rand(0.08, 0.16),
        emoji: f.emoji, r: f.r, side: s, life: 30
      });
    }
    for (p = 0; p < 14; p++) {
      var a = rand(0, 6.28), sp = rand(1, 4.5);
      parts.push({ x: f.x, y: f.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, life: rand(18, 34), color: f.color, size: rand(2.5, 5.5) });
    }
    updateHud();
  }

  function addPop(x, y, text) { pops.push({ x: x, y: y, text: text, life: 34 }); }
  function updateHud() { scoreEl.textContent = score; livesEl.textContent = Math.max(0, lives); bestEl.textContent = best; }

  function endGame() {
    if (!running) return;
    running = false;
    paused = false;
    pauseOverlay.classList.add('hidden');
    if (score > best) { best = score; try { localStorage.setItem('tinyarcade_fruit_best', String(best)); } catch (e) {} }
    bestEl.textContent = best;
    finalScore.textContent = score;
    finalBest.textContent = best;
    gameoverEl.classList.remove('hidden');
  }

  function start() {
    fruits = []; halves = []; parts = []; pops = []; trail = [];
    score = 0; lives = 3; spawnIn = 400; flash = 0; shake = 0;
    updateHud();
    overlay.classList.add('hidden');
    gameoverEl.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    running = true; paused = false;
    last = performance.now();
  }
  startBtn.addEventListener('click', start);
  restartBtn.addEventListener('click', start);

  function showPause() {
    if (!running || paused) return;
    paused = true;
    pauseOverlay.classList.remove('hidden');
  }
  function hidePause() {
    if (!paused) return;
    paused = false;
    pauseOverlay.classList.add('hidden');
    last = performance.now();
  }
  pauseBtn.addEventListener('click', showPause);
  resumeBtn.addEventListener('click', hidePause);
  pauseRestartBtn.addEventListener('click', function () { pauseOverlay.classList.add('hidden'); start(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { if (paused) hidePause(); else showPause(); }
  });

  function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

  canvas.addEventListener('pointerdown', function (e) {
    if (!running || paused) return;
    var p = pos(e);
    trail = [{ x: p.x, y: p.y, t: performance.now() }];
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!running || paused) return;
    if (e.pointerType === 'mouse' && !(e.buttons & 1)) return;
    var p = pos(e), now = performance.now();
    var prev = trail[trail.length - 1];
    trail.push({ x: p.x, y: p.y, t: now });
    if (prev) sliceAt(prev.x, prev.y, p.x, p.y);
  });
  canvas.addEventListener('pointerup', function () {});
  canvas.addEventListener('pointercancel', function () {});
  document.addEventListener('visibilitychange', function () { if (document.hidden) showPause(); });

  function step(now) {
    requestAnimationFrame(step);
    var dt = Math.min(2.5, Math.max(0.4, (now - last) / 16.667));
    last = now;
    if (!running) { draw(); return; }
    if (paused) { draw(); return; }
    var g = 0.22 * (H / 500);
    var i;
    spawnIn -= dt * 16.667;
    if (spawnIn <= 0) { spawn(); if (Math.random() < 0.3) spawn(); spawnIn = rand(520, 880); }
    for (i = fruits.length - 1; i >= 0; i--) {
      var f = fruits[i];
      f.vy += g * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
      if (f.y > H + f.r + 30 && f.vy > 0) {
        fruits.splice(i, 1);
        if (!f.bomb) {
          lives = Math.max(0, lives - 1); flash = 8; updateHud();
          if (lives <= 0) { endGame(); break; }
        }
      }
    }
    for (i = halves.length - 1; i >= 0; i--) {
      var ha = halves[i];
      ha.vy += g * dt; ha.x += ha.vx * dt; ha.y += ha.vy * dt; ha.rot += ha.vr * dt; ha.life -= dt;
      if (ha.life <= 0) halves.splice(i, 1);
    }
    for (i = parts.length - 1; i >= 0; i--) {
      var pa = parts[i];
      pa.vy += g * 0.6 * dt; pa.x += pa.vx * dt; pa.y += pa.vy * dt; pa.life -= dt;
      if (pa.life <= 0) parts.splice(i, 1);
    }
    for (i = pops.length - 1; i >= 0; i--) {
      pops[i].y -= 0.7 * dt; pops[i].life -= dt;
      if (pops[i].life <= 0) pops.splice(i, 1);
    }
    var cutoff = now - 110;
    while (trail.length && trail[0].t < cutoff) trail.shift();
    if (flash > 0) flash -= dt;
    if (shake > 0) shake -= dt;
    draw();
  }

  function draw() {
    var i, gx;
    ctx.save();
    if (shake > 0) ctx.translate(rand(-shake, shake) * 0.4, rand(-shake, shake) * 0.4);
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0d1230'); grad.addColorStop(1, '#070a1a');
    ctx.fillStyle = grad; ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (gx = 0; gx < W; gx += 48) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (i = 0; i < fruits.length; i++) drawFruit(fruits[i]);
    for (i = 0; i < halves.length; i++) drawHalf(halves[i]);
    for (i = 0; i < parts.length; i++) {
      var pa = parts[i];
      ctx.globalAlpha = Math.max(0, pa.life / 30);
      ctx.fillStyle = pa.color;
      ctx.beginPath(); ctx.arc(pa.x, pa.y, pa.size, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawTrail();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px system-ui, sans-serif'; ctx.textAlign = 'center';
    for (i = 0; i < pops.length; i++) {
      var po = pops[i];
      ctx.globalAlpha = Math.max(0, po.life / 34);
      ctx.fillText(po.text, po.x, po.y);
    }
    ctx.globalAlpha = 1;
    if (flash > 0) { ctx.fillStyle = 'rgba(255,69,69,' + (flash / 14 * 0.35) + ')'; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }

  function drawFruit(f) {
    ctx.save();
    ctx.translate(f.x, f.y); ctx.rotate(f.rot);
    ctx.font = (f.r * 2) + 'px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(f.emoji, 0, 2);
    ctx.restore();
  }

  function drawHalf(ha) {
    ctx.save();
    ctx.translate(ha.x, ha.y); ctx.rotate(ha.rot);
    ctx.globalAlpha = Math.max(0, Math.min(1, ha.life / 18));
    ctx.beginPath();
    if (ha.side === 0) ctx.rect(-ha.r, -ha.r, ha.r, ha.r * 2);
    else ctx.rect(0, -ha.r, ha.r, ha.r * 2);
    ctx.clip();
    ctx.font = (ha.r * 2) + 'px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ha.emoji, 0, 2);
    ctx.restore();
  }

  function drawTrail() {
    if (trail.length < 2) return;
    var now = performance.now();
    for (var i = 1; i < trail.length; i++) {
      var a = trail[i - 1], b = trail[i];
      var age = (now - b.t) / 110;
      if (age >= 1) continue;
      ctx.strokeStyle = 'rgba(0,221,235,' + (1 - age) + ')';
      ctx.lineWidth = 9 * (1 - age) + 2;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }

  requestAnimationFrame(function (now) { last = now; requestAnimationFrame(step); });
  draw();
})();
