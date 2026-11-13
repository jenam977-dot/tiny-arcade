'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const homeView = $('#homeView');
const gameView = $('#gameView');
const gameGrid = $('#gameGrid');
const backBtn = $('#backBtn');
const fsBtn = $('#fsBtn');
const bestChip = $('#bestChip');
const bestValue = $('#bestValue');
const playfield = $('#playfield');
const controls = $('#gameControls');
const messageEl = $('#gameMessage');
const scoreValue = $('#scoreValue');
const levelValue = $('#levelValue');

const games = [
  { id:'stack', icon:'▰', name:'Stack Snap', tag:'TIMING', desc:'Drop each block cleanly. One imperfect landing can end the tower.', psychology:'Mastery and visible progress' },
  { id:'orbit', icon:'◉', name:'Orbit Switch', tag:'REFLEX', desc:'Switch orbital lanes and slip past incoming hazards.', psychology:'Fast decisions and anticipation' },
  { id:'gravity', icon:'⇅', name:'Gravity Flip', tag:'ACTION', desc:'Run between floor and ceiling. Flip gravity before the next obstacle.', psychology:'Simple controls, rising challenge' },
  { id:'memory', icon:'▦', name:'Memory Pulse', tag:'MEMORY', desc:'Watch the sequence, then repeat it without missing a beat.', psychology:'Working memory and streaks' },
  { id:'pour', icon:'▥', name:'Perfect Pour', tag:'PRECISION', desc:'Hold to fill. Release inside the target zone without overflowing.', psychology:'Anticipation and precise feedback' },
  { id:'gate', icon:'◌', name:'Gatekeeper', tag:'TIMING', desc:'Tap when the moving pointer enters the opening. The gap keeps shrinking.', psychology:'Skill growth and focused attention' },
  { id:'maze', icon:'⌘', name:'Maze Dash', tag:'PUZZLE', desc:'Find the exit through a fresh maze. Use the shortest route you can.', psychology:'Autonomy and problem solving' },
  { id:'echo', icon:'✦', name:'Echo Hunt', tag:'MEMORY', desc:'Remember the tile that flashed, then find it in a larger grid.', psychology:'Visual recall and gradual learning' },
  { id:'color', icon:'●', name:'Color Rule', tag:'FOCUS', desc:'Follow the changing rule. Tap the right colors and protect your lives.', psychology:'Attention and cognitive flexibility' },
  { id:'second', icon:'◷', name:'One-Second Hero', tag:'INSTINCT', desc:'Estimate the target time by feel. Five attempts, one personal best.', psychology:'Self-challenge and measurable improvement' }
];

let currentGame = null;
let currentScore = 0;
let currentLevel = 1;
let rafId = 0;
let timers = [];
let cleanups = [];
let stopped = false;

function schedule(fn, ms) {
  const id = window.setTimeout(() => {
    timers = timers.filter(item => item !== id);
    if (!stopped) fn();
  }, ms);
  timers.push(id);
  return id;
}
function listen(target, event, handler, options) {
  target.addEventListener(event, handler, options);
  cleanups.push(() => target.removeEventListener(event, handler, options));
}
function stopLoops() {
  stopped = true;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  timers.forEach(clearTimeout);
  timers = [];
  cleanups.forEach(fn => fn());
  cleanups = [];
}
function setMessage(text) { messageEl.textContent = text; }
function setScore(value) {
  currentScore = Math.max(0, Math.floor(value));
  scoreValue.textContent = String(currentScore);
}
function setLevel(value) {
  currentLevel = Math.max(1, Math.floor(value));
  levelValue.textContent = `LEVEL ${currentLevel}`;
}
function bestKey(id) { return `tinyArcadeExtra.best.${id}`; }
function getBest(id) {
  try { return Number(localStorage.getItem(bestKey(id))) || 0; } catch (_) { return 0; }
}
function saveBest(id, value) {
  const old = getBest(id);
  if (value > old) {
    try { localStorage.setItem(bestKey(id), String(value)); } catch (_) { /* Storage may be unavailable. */ }
    return value;
  }
  return old;
}

function renderCards() {
  gameGrid.innerHTML = games.map((game, index) => `
    <button class="game-card" type="button" data-game="${game.id}" aria-label="Play ${game.name}">
      <span class="game-icon" aria-hidden="true">${game.icon}</span>
      <h3>${game.name}</h3>
      <p>${game.desc}</p>
      <span class="card-bottom"><span>${String(index + 1).padStart(2, '0')} · ${game.tag}</span><span class="card-best">BEST ${getBest(game.id)}</span></span>
    </button>`).join('');
  gameGrid.querySelectorAll('[data-game]').forEach(button => {
    button.addEventListener('click', () => launchGame(button.dataset.game));
  });
}

function showHome() {
  stopLoops();
  currentGame = null;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
  gameView.hidden = true;
  homeView.hidden = false;
  backBtn.hidden = true;
  bestChip.hidden = true;
  renderCards();
}

function launchGame(id) {
  stopLoops();
  stopped = false;
  currentGame = id;
  try { history.replaceState(null, '', '#' + id); } catch (_) {}
  try {
    var list = JSON.parse(localStorage.getItem('tinyarcade_recent') || '[]');
    if (!Array.isArray(list)) list = [];
    var slug = 'extra-' + id;
    var at = list.indexOf(slug);
    if (at > -1) list.splice(at, 1);
    list.unshift(slug);
    localStorage.setItem('tinyarcade_recent', JSON.stringify(list.slice(0, 4)));
  } catch (_) {}
  setScore(0);
  setLevel(1);
  const info = games.find(game => game.id === id);
  if (!info) return showHome();
  homeView.hidden = true;
  gameView.hidden = false;
  backBtn.hidden = false;
  bestChip.hidden = false;
  bestValue.textContent = String(getBest(id));
  $('#gameCategory').textContent = `${info.tag} · GAME ${String(games.findIndex(g => g.id === id) + 1).padStart(2, '0')}`;
  $('#gameTitle').textContent = info.name;
  $('#gameDescription').textContent = info.desc;
  playfield.innerHTML = '';
  controls.innerHTML = '';
  setMessage('Ready?');
  const start = {
    stack: gameStackSnap,
    orbit: gameOrbitSwitch,
    gravity: gameGravityFlip,
    memory: gameMemoryPulse,
    pour: gamePerfectPour,
    gate: gameGatekeeper,
    maze: gameMazeDash,
    echo: gameEchoHunt,
    color: gameColorRule,
    second: gameOneSecondHero
  }[id];
  if (start) start();
}

function finish(reason, score = currentScore) {
  if (stopped) return;
  const id = currentGame;
  const finalScore = Math.max(0, Math.floor(score));
  const isNewBest = finalScore > getBest(id);
  const best = saveBest(id, finalScore);
  stopLoops();
  bestValue.textContent = String(best);
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="overlay-card">
      <div class="result-icon">${finalScore >= best && finalScore > 0 ? '✦' : '◈'}</div>
      <h2>${isNewBest ? 'New best!' : 'Round complete'}</h2>
      <p>${reason}<br><strong style="color:#ffd36d">Score: ${finalScore}</strong> · Best: ${best}</p>
      <div class="overlay-actions">
        <button class="primary-btn" type="button" id="againBtn">Play again</button>
        <button class="secondary-btn" type="button" id="menuBtn">All games</button>
      </div>
    </div>`;
  playfield.appendChild(overlay);
  $('#againBtn', overlay).addEventListener('click', () => launchGame(id));
  $('#menuBtn', overlay).addEventListener('click', showHome);
}

function canvasField(width = 360, height = 440) {
  playfield.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.className = 'canvas-game';
  canvas.width = width;
  canvas.height = height;
  canvas.setAttribute('aria-label', 'Interactive game area');
  playfield.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  return { canvas, ctx, width, height };
}
function button(label, className = 'secondary-btn') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.textContent = label;
  controls.appendChild(btn);
  return btn;
}
function rand(min, max) { return Math.random() * (max - min) + min; }
function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

// 1. Stack Snap — timing, clean overlaps and visible mastery.
function gameStackSnap() {
  const { canvas, ctx, width: W, height: H } = canvasField();
  setMessage('Tap or click to drop the moving block. Keep the overlap.');
  let baseX = 90, baseW = 180, score = 0, x = 0, direction = 1, speed = 145;
  let last = performance.now();
  const layers = [{ x: baseX, w: baseW, y: 405 }];
  let activeY = 382;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < 28; i++) {
      const sx = (i * 73 + 19) % W, sy = (i * 47 + 23) % H;
      ctx.fillStyle = 'rgba(173,205,255,.22)'; ctx.fillRect(sx, sy, 2, 2);
    }
    const shift = Math.max(0, 270 - activeY);
    ctx.fillStyle = '#273b5c'; ctx.fillRect(55, 426 + shift, 250, 12);
    layers.forEach((layer, index) => {
      const y = layer.y + shift;
      if (y > -30 && y < H + 30) {
        ctx.fillStyle = index % 2 ? '#7e8cff' : '#58c9c4';
        ctx.fillRect(layer.x, y, layer.w, 19);
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(layer.x, y, layer.w, 3);
      }
    });
    ctx.fillStyle = '#ffd36d'; ctx.fillRect(x, activeY + shift, baseW, 19);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, activeY + shift, baseW, 3);
    ctx.fillStyle = '#aab9d1'; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('DROP THE BLOCK', W / 2, 28);
  }
  function drop() {
    const previous = layers[layers.length - 1];
    const left = Math.max(x, previous.x);
    const right = Math.min(x + baseW, previous.x + previous.w);
    const overlap = right - left;
    if (overlap < 8) return finish('The tower lost its balance. Try for a cleaner landing.');
    baseX = left; baseW = overlap; score += 1; setScore(score);
    layers.push({ x: baseX, w: baseW, y: activeY });
    activeY -= 23;
    x = direction > 0 ? -baseW : W;
    speed = Math.min(360, speed + 10);
    draw();
  }
  let lastDrop = 0;
  listen(canvas, 'pointerdown', event => {
    event.preventDefault();
    const now = performance.now();
    if (now - lastDrop < 120) return;
    lastDrop = now;
    drop();
  });
  function loop(now) {
    const dt = Math.min(.04, (now - last) / 1000); last = now;
    x += direction * speed * dt;
    if (x + baseW >= W) { x = W - baseW; direction = -1; }
    if (x <= 0) { x = 0; direction = 1; }
    draw();
    rafId = requestAnimationFrame(loop);
  }
  draw(); rafId = requestAnimationFrame(loop);
}

// 2. Orbit Switch — anticipation, lane switching and readable danger.
function gameOrbitSwitch() {
  const { canvas, ctx, width: W, height: H } = canvasField();
  setMessage('Tap anywhere to switch orbit. Avoid hazards on your lane.');
  const cx = W / 2, cy = H / 2, rings = [86, 143];
  let angle = -Math.PI / 2, lane = 0, elapsed = 0, spawn = 0, last = performance.now();
  const hazards = [];
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(104,224,223,.07)'; ctx.beginPath(); ctx.arc(cx, cy, 38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9fb2d0'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.fillText('SWITCH LANES', cx, cy + 4);
    rings.forEach(r => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(160,190,235,.2)'; ctx.lineWidth = 2; ctx.stroke(); });
    hazards.forEach(h => { const r = rings[h.lane]; ctx.beginPath(); ctx.arc(cx + Math.cos(h.a) * r, cy + Math.sin(h.a) * r, 10, 0, Math.PI * 2); ctx.fillStyle = '#ff777e'; ctx.shadowColor = '#ff777e'; ctx.shadowBlur = 13; ctx.fill(); ctx.shadowBlur = 0; });
    const px = cx + Math.cos(angle) * rings[lane], py = cy + Math.sin(angle) * rings[lane];
    ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fillStyle = '#68e0df'; ctx.shadowColor = '#68e0df'; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#8fa2c0'; ctx.font = '11px system-ui'; ctx.fillText(`${(elapsed).toFixed(1)}s SURVIVED`, cx, H - 25);
  }
  listen(canvas, 'pointerdown', e => { e.preventDefault(); lane = 1 - lane; });
  function loop(now) {
    const dt = Math.min(.04, (now - last) / 1000); last = now; elapsed += dt; angle = (angle + dt * 1.9) % (Math.PI * 2); spawn += dt;
    if (spawn > Math.max(.46, 1.05 - elapsed * .012)) {
      spawn = 0; hazards.push({ lane: Math.random() < .5 ? 0 : 1, a: (angle + rand(.45, 2.5)) % (Math.PI * 2), drift: rand(-.25, .25) });
    }
    hazards.forEach(h => { h.a = (h.a + h.drift * dt + Math.PI * 2) % (Math.PI * 2); });
    const collision = hazards.some(h => h.lane === lane && Math.abs(wrapAngle(h.a - angle)) < .13);
    setScore(Math.floor(elapsed * 10));
    if (collision) return finish('A hazard caught your orbit. Switch lanes a little earlier.');
    if (hazards.length > 14) hazards.splice(0, hazards.length - 14);
    draw(); rafId = requestAnimationFrame(loop);
  }
  draw(); rafId = requestAnimationFrame(loop);
}

// 3. Gravity Flip — one-button action with alternating safe lanes.
function gameGravityFlip() {
  const { canvas, ctx, width: W, height: H } = canvasField();
  setMessage('Tap to flip between floor and ceiling. Avoid the blocks.');
  const px = 82, topY = 92, floorY = 387;
  let side = 'floor', distance = 0, speed = 185, last = performance.now();
  let obstacles = [{ x: 410, side: 'ceiling' }, { x: 650, side: 'floor' }, { x: 900, side: 'ceiling' }];
  function flip() { side = side === 'floor' ? 'ceiling' : 'floor'; }
  listen(canvas, 'pointerdown', e => { e.preventDefault(); flip(); });
  listen(window, 'keydown', e => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flip(); } });
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(104,224,223,.17)'; ctx.fillRect(0, 58, W, 4); ctx.fillRect(0, 418, W, 4);
    ctx.fillStyle = '#8fa2c0'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('FLIP TO THE CLEAR SIDE', W / 2, 28);
    obstacles.forEach(o => {
      ctx.fillStyle = '#ff777e';
      if (o.side === 'ceiling') ctx.fillRect(o.x, 62, 28, 62);
      else ctx.fillRect(o.x, 354, 28, 62);
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      if (o.side === 'ceiling') ctx.fillRect(o.x, 62, 28, 4); else ctx.fillRect(o.x, 412, 28, 4);
    });
    const py = side === 'floor' ? floorY : topY;
    ctx.beginPath(); ctx.arc(px, py, 13, 0, Math.PI * 2); ctx.fillStyle = '#68e0df'; ctx.shadowColor = '#68e0df'; ctx.shadowBlur = 14; ctx.fill(); ctx.shadowBlur = 0;
  }
  function loop(now) {
    const dt = Math.min(.04, (now - last) / 1000); last = now; distance += speed * dt; speed = Math.min(310, 185 + distance * .025);
    obstacles.forEach(o => { o.x -= speed * dt; });
    const lastX = obstacles.reduce((m, o) => Math.max(m, o.x), 0);
    if (lastX < W - 130) obstacles.push({ x: W + rand(150, 260), side: Math.random() < .5 ? 'floor' : 'ceiling' });
    obstacles = obstacles.filter(o => o.x > -45);
    setScore(Math.floor(distance / 10));
    if (obstacles.some(o => o.side === side && o.x < px + 18 && o.x + 28 > px - 10)) return finish('You hit an obstacle. Watch the next lane and flip sooner.');
    draw(); rafId = requestAnimationFrame(loop);
  }
  draw(); rafId = requestAnimationFrame(loop);
}

// 4. Memory Pulse — sequence recall with steadily increasing length.
function gameMemoryPulse() {
  playfield.innerHTML = '<div class="pad-grid" id="memoryPads"><button class="memory-pad pad-0" data-pad="0" aria-label="Green pad"></button><button class="memory-pad pad-1" data-pad="1" aria-label="Pink pad"></button><button class="memory-pad pad-2" data-pad="2" aria-label="Blue pad"></button><button class="memory-pad pad-3" data-pad="3" aria-label="Gold pad"></button></div>';
  setMessage('Watch the lights. Repeat the sequence.');
  const pads = [...playfield.querySelectorAll('[data-pad]')];
  let sequence = [0, 2, 1], input = 0, accepting = false, round = 1;
  function flash(index, duration = 260) {
    pads[index].classList.add('active');
    schedule(() => pads[index].classList.remove('active'), duration);
  }
  function showSequence() {
    accepting = false; input = 0;
    setMessage(`Memorise ${sequence.length} lights…`);
    sequence.forEach((index, i) => {
      schedule(() => flash(index), 500 + i * 520);
    });
    schedule(() => { accepting = true; setMessage('Your turn — repeat the sequence.'); }, 500 + sequence.length * 520);
  }
  pads.forEach(pad => listen(pad, 'click', () => {
    if (!accepting || stopped) return;
    const chosen = Number(pad.dataset.pad);
    flash(chosen, 170);
    if (chosen !== sequence[input]) return finish('That sequence did not match. Try remembering the full pattern.');
    input++;
    if (input === sequence.length) {
      accepting = false; round++; setLevel(round); setScore((round - 1) * 10);
      setMessage('Perfect sequence. Get ready for the next one.');
      sequence.push(Math.floor(Math.random() * 4));
      schedule(showSequence, 850);
    }
  }));
  showSequence();
}

// 5. Perfect Pour — stop a rising meter inside a clear target zone.
function gamePerfectPour() {
  playfield.innerHTML = `
    <div class="pour-wrap">
      <div class="pour-track" id="pourTrack"><div class="pour-target" id="pourTarget"></div><div class="pour-fill" id="pourFill"></div></div>
      <div class="pour-labels"><span>TARGET ZONE</span><strong id="pourRange">55–68%</strong><span>Release inside the green band.</span></div>
    </div>`;
  setMessage('Press and hold to pour. Release inside the green band.');
  const fillEl = $('#pourFill'), targetEl = $('#pourTarget'), rangeEl = $('#pourRange');
  let fill = 0, low = 54, high = 68, pouring = false, last = performance.now();
  const pourBtn = button('HOLD TO POUR', 'primary-btn big-action');
  pourBtn.style.touchAction = 'none';
  function newTarget() {
    low = Math.floor(rand(43, 65)); high = low + Math.floor(rand(10, 15));
    fill = 0; fillEl.style.height = '0%'; targetEl.style.bottom = `${low}%`; targetEl.style.height = `${high - low}%`;
    rangeEl.textContent = `${low}–${high}%`;
  }
  function stopPour() {
    if (!pouring || stopped) return;
    pouring = false;
    if (fill >= low && fill <= high) {
      const quality = Math.max(1, Math.round(100 - Math.abs(fill - (low + high) / 2) * 5));
      setScore(currentScore + quality); setLevel(currentLevel + 1);
      setMessage(`Clean pour: ${Math.round(fill)}%. Next glass is ready.`);
      newTarget();
    } else if (fill < low) {
      finish(`Too early — you stopped at ${Math.round(fill)}%. Aim for ${low}–${high}%.`);
    } else {
      finish(`Overflow — you reached ${Math.round(fill)}%. Release before ${high}%.`);
    }
  }
  listen(pourBtn, 'pointerdown', e => { e.preventDefault(); pouring = true; last = performance.now(); try { pourBtn.setPointerCapture(e.pointerId); } catch (_) {} setMessage('Pouring… release in the green zone.'); });
  listen(pourBtn, 'pointerup', e => { e.preventDefault(); stopPour(); });
  listen(pourBtn, 'pointercancel', stopPour);
  listen(pourBtn, 'lostpointercapture', stopPour);
  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (pouring) {
      fill += 43 * dt;
      fillEl.style.height = `${Math.min(100, fill)}%`;
      if (fill >= 100) return finish('The glass overflowed. Release a little earlier next time.');
    }
    rafId = requestAnimationFrame(loop);
  }
  newTarget(); rafId = requestAnimationFrame(loop);
}

// 6. Gatekeeper — hit a shrinking timing window.
function gameGatekeeper() {
  const { canvas, ctx, width: W, height: H } = canvasField();
  setMessage('Tap when the pointer enters the green opening.');
  const cx = W / 2, cy = H / 2, radius = 112, target = -Math.PI / 2;
  let angle = Math.PI, speed = 2.35, opening = .43;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(173,198,235,.2)'; ctx.lineWidth = 15; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, radius, target - opening, target + opening); ctx.strokeStyle = '#88e8ab'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
    const px = cx + Math.cos(angle) * radius, py = cy + Math.sin(angle) * radius;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.strokeStyle = '#ffd36d'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fillStyle = '#ffd36d'; ctx.shadowColor = '#ffd36d'; ctx.shadowBlur = 14; ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(cx, cy, 27, 0, Math.PI * 2); ctx.fillStyle = 'rgba(104,224,223,.15)'; ctx.fill();
    ctx.fillStyle = '#c5d4ec'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('TAP THE GAP', cx, H - 28);
  }
  function attempt() {
    if (stopped) return;
    if (Math.abs(wrapAngle(angle - target)) <= opening) {
      setScore(currentScore + 1); setMessage('Perfect timing. The opening is getting smaller.');
      opening = Math.max(.105, opening * .91); speed = Math.min(6.2, speed + .18);
    } else finish('Missed the opening. Watch the pointer for one more moment before tapping.');
  }
  listen(canvas, 'pointerdown', e => { e.preventDefault(); attempt(); });
  let last = performance.now();
  function loop(now) { const dt = Math.min(.04, (now - last) / 1000); last = now; angle = (angle + speed * dt) % (Math.PI * 2); draw(); rafId = requestAnimationFrame(loop); }
  draw(); rafId = requestAnimationFrame(loop);
}

// 7. Maze Dash — generated mazes, clear navigation and shortest-route scoring.
function makeMaze(cols = 7, rows = 7) {
  const cells = Array.from({ length: cols * rows }, () => ({ walls: [true, true, true, true] }));
  const visited = new Set([0]), stack = [0];
  const directions = [
    { dx: 0, dy: -1, wall: 0, opposite: 2 },
    { dx: 1, dy: 0, wall: 1, opposite: 3 },
    { dx: 0, dy: 1, wall: 2, opposite: 0 },
    { dx: -1, dy: 0, wall: 3, opposite: 1 }
  ];
  while (stack.length) {
    const current = stack[stack.length - 1], x = current % cols, y = Math.floor(current / cols);
    const options = directions.map(d => ({ ...d, nx: x + d.dx, ny: y + d.dy }))
      .filter(d => d.nx >= 0 && d.nx < cols && d.ny >= 0 && d.ny < rows && !visited.has(d.ny * cols + d.nx));
    if (!options.length) { stack.pop(); continue; }
    const d = options[Math.floor(Math.random() * options.length)], next = d.ny * cols + d.nx;
    cells[current].walls[d.wall] = false; cells[next].walls[d.opposite] = false;
    visited.add(next); stack.push(next);
  }
  return cells;
}
function gameMazeDash() {
  const cols = 7, rows = 7, end = cols * rows - 1;
  let cells = makeMaze(cols, rows), position = 0, moves = 0, level = 1, mazeCleared = false;
  setMessage('Find the gold exit. Use the arrow keys or the on-screen pad.');
  function render() {
    const maze = document.createElement('div'); maze.className = 'maze'; maze.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    cells.forEach((cell, index) => {
      const el = document.createElement('div'); el.className = 'maze-cell';
      el.style.borderTop = cell.walls[0] ? '' : '0';
      el.style.borderRight = cell.walls[1] ? '' : '0';
      el.style.borderBottom = cell.walls[2] ? '' : '0';
      el.style.borderLeft = cell.walls[3] ? '' : '0';
      if (index === position) { el.classList.add('player'); el.textContent = '●'; }
      else if (index === end) { el.classList.add('goal'); el.textContent = '★'; }
      maze.appendChild(el);
    });
    playfield.innerHTML = ''; playfield.appendChild(maze);
  }
  function move(dx, dy) {
    if (stopped || mazeCleared) return;
    const x = position % cols, y = Math.floor(position / cols);
    let dir = -1;
    if (dy < 0) dir = 0; else if (dx > 0) dir = 1; else if (dy > 0) dir = 2; else if (dx < 0) dir = 3;
    if (dir < 0 || cells[position].walls[dir]) return;
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;
    position = ny * cols + nx; moves++; setScore(Math.max(0, currentScore));
    setMessage(`Moves: ${moves} · Reach the gold star.`); render();
    if (position === end) {
      mazeCleared = true;
      const earned = Math.max(20, 100 - moves * 2);
      setScore(currentScore + earned); level++; setLevel(level);
      setMessage(`Exit found in ${moves} moves. +${earned} points.`);
      schedule(() => {
        if (stopped) return;
        cells = makeMaze(cols, rows); position = 0; moves = 0; mazeCleared = false; render(); setMessage('New maze. Find the exit.');
      }, 900);
    }
  }
  const map = { ArrowUp:[0,-1], ArrowRight:[1,0], ArrowDown:[0,1], ArrowLeft:[-1,0], w:[0,-1], d:[1,0], s:[0,1], a:[-1,0] };
  listen(window, 'keydown', e => { const m = map[e.key]; if (m) { e.preventDefault(); move(m[0], m[1]); } });
  const dpad = document.createElement('div'); dpad.className = 'dpad';
  [['↑','up',0,-1],['←','left',-1,0],['↓','down',0,1],['→','right',1,0]].forEach(([label, cls, dx, dy]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = label; b.setAttribute('aria-label', `Move ${label}`);
    b.addEventListener('click', () => move(dx, dy)); dpad.appendChild(b);
  });
  controls.appendChild(dpad); render();
}

// 8. Echo Hunt — brief visual exposure and spatial recall.
function gameEchoHunt() {
  let level = 1, locked = true, targetIndex = 0, size = 3;
  setMessage('Remember the glowing tile. Then find it.');
  function round() {
    size = Math.min(5, 3 + Math.floor((level - 1) / 2));
    const total = size * size; targetIndex = Math.floor(Math.random() * total); locked = true;
    const grid = document.createElement('div'); grid.className = 'echo-grid'; grid.style.setProperty('--cols', size); grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    for (let i = 0; i < total; i++) {
      const tile = document.createElement('button'); tile.type = 'button'; tile.className = 'echo-tile'; tile.dataset.index = String(i);
      tile.setAttribute('aria-label', `Tile ${i + 1}`);
      tile.addEventListener('click', () => {
        if (locked || stopped) return;
        if (Number(tile.dataset.index) === targetIndex) {
          setScore(currentScore + 10); level++; setLevel(level); setMessage('Found it. The grid is getting bigger.');
          locked = true; schedule(round, 650);
        } else finish('Not that tile. Try to hold the position in your visual memory.');
      });
      grid.appendChild(tile);
    }
    playfield.innerHTML = ''; playfield.appendChild(grid);
    const target = grid.children[targetIndex];
    setMessage(`Memorise the glowing tile · ${size} × ${size}`);
    target.classList.add('target');
    schedule(() => target.classList.remove('target'), Math.max(420, 850 - level * 22));
    schedule(() => { locked = false; setMessage('Where was the glowing tile?'); }, Math.max(650, 1100 - level * 25));
  }
  round();
}

// 9. Color Rule — selective attention and rule switching.
function gameColorRule() {
  const palette = [
    { name:'RED', hex:'#f26778' }, { name:'BLUE', hex:'#5a9cf0' },
    { name:'GREEN', hex:'#55c79b' }, { name:'YELLOW', hex:'#f0c45f' }
  ];
  let lives = 3, timeLeft = 30, tick = 0, rule = null, correct = new Set(), boardLocked = false;
  setMessage('Read the rule. Tap every circle that follows it.');
  const hud = document.createElement('div'); hud.className = 'color-hud'; hud.style.cssText = 'position:absolute;top:10px;left:0;right:0;text-align:center;color:#bdcbe2;font-size:11px;font-weight:800';
  hud.id = 'colorHud'; playfield.appendChild(hud);
  function newBoard() {
    boardLocked = false;
    correct = new Set();
    const target = palette[Math.floor(Math.random() * palette.length)];
    const except = Math.random() < .5;
    rule = { target, except };
    const prompt = except ? `TAP EVERYTHING EXCEPT ${target.name}` : `TAP ONLY ${target.name}`;
    setMessage(prompt);
    const board = document.createElement('div'); board.className = 'color-board'; board.style.marginTop = '25px';
    const count = 12, values = [];
    const correctCount = Math.floor(rand(3, 6));
    const others = palette.filter(p => p.name !== target.name);
    const other = () => others[Math.floor(Math.random() * others.length)];
    for (let i = 0; i < count; i++) {
      const good = i < correctCount;
      const choice = good ? (except ? other() : target) : (except ? target : other());
      values.push(choice);
    }
    for (let i = values.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]]; }
    values.forEach((color, index) => {
      const dot = document.createElement('button'); dot.type = 'button'; dot.className = 'color-dot'; dot.style.background = color.hex; dot.setAttribute('aria-label', `${color.name} circle`);
      dot.addEventListener('click', () => {
        if (stopped || boardLocked || dot.classList.contains('done')) return;
        const isCorrect = except ? color.name !== target.name : color.name === target.name;
        if (isCorrect) {
          dot.classList.add('done'); correct.add(index); setScore(currentScore + 5);
          if (correct.size === correctCount) { boardLocked = true; setMessage('Rule cleared. New colors, new rule.'); schedule(newBoard, 350); }
        } else {
          lives--; setMessage(`Wrong color. ${lives} ${lives === 1 ? 'life' : 'lives'} left.`);
          if (lives <= 0) finish('You used all three lives. Slow down and read the rule first.');
        }
        updateHud();
      });
      board.appendChild(dot);
    });
    playfield.querySelector('.color-board')?.remove(); playfield.appendChild(board); updateHud();
  }
  function updateHud() { hud.textContent = `TIME ${Math.ceil(timeLeft)}s   ·   LIVES ${'♥'.repeat(lives)}`; }
  newBoard();
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now; tick += dt;
    if (tick >= .1) { timeLeft -= tick; tick = 0; updateHud(); }
    if (timeLeft <= 0) return finish('Time is up. Keep your attention on the rule, not just the colors.');
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);
}

// 10. One-Second Hero — internal time estimation across five attempts.
function gameOneSecondHero() {
  playfield.innerHTML = '<div class="timer-ring"><div><strong id="attemptNumber">01 / 05</strong><span id="targetTime">HOLD FOR 1.00s</span></div></div>';
  setMessage('Press and hold, then release when you think the target time has passed.');
  const targetEl = $('#targetTime'), attemptEl = $('#attemptNumber');
  const holdBtn = button('PRESS AND HOLD', 'primary-btn big-action');
  holdBtn.style.touchAction = 'none';
  let round = 1, target = 1, pressedAt = 0, holding = false, keyHolding = false;
  function nextRound() {
    target = Math.round(rand(.8, 1.6) * 100) / 100;
    targetEl.textContent = `HOLD FOR ${target.toFixed(2)}s`;
    attemptEl.textContent = `${String(round).padStart(2, '0')} / 05`;
    setMessage(`Attempt ${round} of 5. Feel the time; no clock will appear.`);
  }
  function startHold() { if (stopped || holding) return; holding = true; pressedAt = performance.now(); holdBtn.textContent = 'RELEASE WHEN READY'; }
  function releaseHold() {
    if (!holding || stopped) return;
    holding = false; holdBtn.textContent = 'PRESS AND HOLD';
    const elapsed = (performance.now() - pressedAt) / 1000;
    const diff = Math.abs(elapsed - target);
    let points = diff <= .07 ? 100 : diff <= .14 ? 75 : diff <= .25 ? 50 : diff <= .4 ? 25 : 0;
    setScore(currentScore + points);
    setMessage(`${elapsed.toFixed(2)}s recorded · target ${target.toFixed(2)}s · +${points} points`);
    if (round >= 5) { round = 5; schedule(() => finish('Five attempts complete. Try again and beat your timing score.'), 700); }
    else { round++; setLevel(round); schedule(nextRound, 750); }
  }
  listen(holdBtn, 'pointerdown', e => { e.preventDefault(); startHold(); try { holdBtn.setPointerCapture(e.pointerId); } catch (_) {} });
  listen(holdBtn, 'pointerup', e => { e.preventDefault(); releaseHold(); });
  listen(holdBtn, 'pointercancel', releaseHold);
  listen(window, 'keydown', e => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); keyHolding = true; startHold(); } });
  listen(window, 'keyup', e => { if (e.code === 'Space' && keyHolding) { e.preventDefault(); keyHolding = false; releaseHold(); } });
  nextRound();
}

backBtn.addEventListener('click', showHome);
renderCards();

/* Fullscreen for the whole page, so the header controls stay reachable
   while fullscreen (mirrors the main site's stage-fullscreen pattern). */
(function () {
  var root = document.documentElement;
  if (!(root.requestFullscreen || root.webkitRequestFullscreen)) { fsBtn.remove(); return; }
  fsBtn.addEventListener('click', function () {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else if (root.requestFullscreen) {
        var p = root.requestFullscreen();
        if (p && p.catch) p.catch(function () {});
      } else {
        root.webkitRequestFullscreen();
      }
    } catch (_) {}
  });
  function onFs() {
    var on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    fsBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
    fsBtn.setAttribute('title', on ? 'Exit full screen' : 'Full screen');
  }
  document.addEventListener('fullscreenchange', onFs);
  document.addEventListener('webkitfullscreenchange', onFs);
})();

(function () {
  var h = (location.hash || '').replace('#', '');
  if (games.some(function (g) { return g.id === h; })) launchGame(h);
})();
