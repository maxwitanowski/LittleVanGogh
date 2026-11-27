/* Little Van Gogh Art School: Starry Night template.
   Class list, timetable and contact details live in ../shared/content.js
   and the brush-stroke painter in ../shared/paint.js */

const PROMPTS = [
  'a sunflower that drank too much red cordial',
  'the night sky, but it is made of spaghetti',
  'your bedroom if Vincent tidied it',
  'a cockatoo wearing a straw hat',
  'the windiest tree in Bella Vista',
  'a bowl of fruit having an argument',
  'your shoes, painted like they are famous',
  'a cat watching the stars swirl',
];

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pick = arr => arr[(Math.random() * arr.length) | 0];

/* ---------- hero sky ---------- */
(function hero() {
  const canvas = document.getElementById('sky');
  const hint = document.querySelector('.hero-hint');
  const sky = new Painting(canvas, structuredClone(THEMES.hero));
  const paintIn = () => { sky.cfg.speed = 2.2; sky.prepaint(110); sky.cfg.speed = 0.45; }; // fill fast, then drift slowly
  paintIn();

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  if (!reduceMotion) (function loop() { if (visible) sky.step(); requestAnimationFrame(loop); })();

  const at = e => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  canvas.addEventListener('pointermove', e => { sky.stir = { ...at(e), r: 0.16, spin: 1.6 }; });
  canvas.addEventListener('pointerleave', () => { sky.stir = null; });

  const base = sky.cfg.spots.length;
  canvas.addEventListener('click', e => {
    const spots = sky.cfg.spots;
    if (spots.length >= base + 6) spots.splice(base, 1); // oldest added star fades back into sky
    spots.push({ ...at(e), r: rand(0.05, 0.09), spin: Math.random() < 0.5 ? 1 : -1, ...STAR });
    hint && hint.classList.add('is-gone');
    if (reduceMotion) { sky.cfg.speed = 2.2; sky.prepaint(40); }
  });

  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { sky.resize(); paintIn(); }, 200); });
})();

/* ---------- gallery wall ---------- */
(function wall() {
  const wallEl = document.getElementById('wall');
  const tilts = [-2.2, 1.4, -1, 1.8, -1.6, 2.2];
  wallEl.innerHTML = CLASSES.map((c, i) => `
    <article class="art reveal" style="--tilt:${tilts[i % tilts.length]}deg">
      <div class="art-frame"><span class="tape"></span><canvas data-theme="${c.theme}" aria-hidden="true"></canvas></div>
      <div class="plaque">
        <span class="plaque-age">${c.age}</span>
        <h3>${c.name}</h3>
        <p>${c.blurb}</p>
        <div class="plaque-meta">${c.meta.map(m => `<span>${m}</span>`).join('')}</div>
        <a href="#book" data-pick="${c.id}">Book a trial</a>
      </div>
    </article>`).join('');

  // paint each picture the first time it scrolls into view
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      new Painting(e.target, structuredClone(THEMES[e.target.dataset.theme])).prepaint(70);
    }
  }, { rootMargin: '200px' });
  wallEl.querySelectorAll('canvas').forEach(c => io.observe(c));
})();

/* ---------- timetable ---------- */
(function timetable() {
  const list = document.getElementById('ttList');
  const tabs = document.querySelectorAll('.tt-tab');
  const byId = Object.fromEntries(CLASSES.map(c => [c.id, c]));
  const show = day => {
    list.innerHTML = TIMETABLE[day].map(([time, id], i) => {
      const c = byId[id];
      return `<li class="tt-row" style="--i:${i};--swatch:${c.swatch}">
        <span class="tt-time">${time}</span>
        <span class="tt-name">${c.name}</span>
        <span class="tt-age">${c.age}</span>
        <a class="btn btn-small" href="#book" data-pick="${id}">Trial this one</a>
      </li>`;
    }).join('');
  };
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => { t.classList.toggle('is-on', t === tab); t.setAttribute('aria-selected', t === tab); });
    show(tab.dataset.day);
  }));
  show('sat');
})();

/* ---------- booking form ---------- */
(function booking() {
  const form = document.getElementById('bookForm');
  const select = document.getElementById('klassSelect');
  const msg = document.getElementById('formMsg');
  select.innerHTML = `<option value="">Not sure yet, help me choose</option>` +
    CLASSES.map(c => `<option value="${c.id}">${c.name} (${c.age})</option>`).join('');

  // any "Book a trial" link with data-pick preselects that class
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-pick]');
    if (a) select.value = a.dataset.pick;
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(el => {
      const bad = !el.value.trim();
      el.classList.toggle('bad', bad);
      if (bad) ok = false;
    });
    msg.classList.toggle('is-err', !ok);
    if (!ok) { msg.textContent = 'Oops, a few boxes still need filling in.'; return; }
    // TODO: not connected to anything yet. Wire to email / a form service before going live.
    msg.textContent = `Thanks ${form.parent.value.trim().split(' ')[0]}! (Demo only: this form isn't hooked up yet.)`;
    form.reset();
  });
})();

/* ---------- easel ---------- */
(function easel() {
  const pad = document.getElementById('pad');
  const ctx = pad.getContext('2d');
  const POTS = [[226, 78, 21], [45, 92, 52], [24, 77, 50], [9, 62, 48], [160, 39, 30], [173, 40, 69], [262, 40, 54], [25, 55, 25], [40, 100, 97]];
  let color = POTS[0], size = 10, last = null;

  const blank = () => { ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, pad.width, pad.height); };
  blank();

  const pots = document.getElementById('pots');
  pots.innerHTML = POTS.map(([h, s, l], i) =>
    `<button type="button" class="pot${i ? '' : ' is-on'}" style="--c:hsl(${h} ${s}% ${l}%)" data-i="${i}" aria-label="Paint colour ${i + 1}"></button>`).join('');
  pots.addEventListener('click', e => {
    const b = e.target.closest('.pot'); if (!b) return;
    pots.querySelectorAll('.pot').forEach(p => p.classList.toggle('is-on', p === b));
    color = POTS[b.dataset.i];
  });
  document.querySelectorAll('.size').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.size').forEach(s => s.classList.toggle('is-on', s === b));
    size = +b.dataset.size;
  }));

  const pos = e => {
    const r = pad.getBoundingClientRect();
    return { x: (e.clientX - r.left) * pad.width / r.width, y: (e.clientY - r.top) * pad.height / r.height };
  };
  // one stroke = a fan of bristles, each a slightly different shade
  const stroke = (a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d, ny = dx / d;
    ctx.lineCap = 'round';
    for (let i = 0; i < size; i++) {
      const off = (i - size / 2) * 2.3 + rand(-1, 1);
      const [h, s, l] = color;
      ctx.strokeStyle = `hsl(${h} ${s}% ${l + rand(-9, 9)}%)`;
      ctx.lineWidth = rand(2, 4.2);
      ctx.beginPath();
      ctx.moveTo(a.x + nx * off, a.y + ny * off);
      ctx.lineTo(b.x + nx * off, b.y + ny * off);
      ctx.stroke();
    }
  };
  pad.addEventListener('pointerdown', e => { pad.setPointerCapture(e.pointerId); last = pos(e); stroke(last, { x: last.x + 0.5, y: last.y + 0.5 }); });
  pad.addEventListener('pointermove', e => { if (!last) return; const p = pos(e); stroke(last, p); last = p; });
  ['pointerup', 'pointercancel'].forEach(t => pad.addEventListener(t, () => { last = null; }));

  document.getElementById('clearBtn').addEventListener('click', blank);
  document.getElementById('saveBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = 'my-little-van-gogh.png';
    a.href = pad.toDataURL('image/png');
    a.click();
  });

  const promptText = document.getElementById('promptText');
  let pi = 0;
  document.getElementById('promptBtn').addEventListener('click', () => {
    pi = (pi + 1) % PROMPTS.length;
    promptText.textContent = PROMPTS[pi];
  });
})();

/* ---------- sunflowers that turn to watch the cursor ---------- */
(function garden() {
  const el = document.getElementById('garden');
  const flower = (x, h, hue) => {
    const petals = n => Array.from({ length: n }, (_, i) =>
      `<ellipse cx="60" cy="22" rx="9" ry="22" transform="rotate(${i * 360 / n} 60 60)"/>`).join('');
    return `<svg viewBox="0 0 120 300" style="--x:${x}%;--h:${h}px">
      <path d="M60 70c-8 70 10 150 0 232" fill="none" stroke="#2f6b56" stroke-width="8" stroke-linecap="round"/>
      <path d="M58 170c-30-22-46-6-50 8 22 10 40 8 50-8zM62 215c28-24 46-10 52 4-22 12-40 10-52-4z" fill="#3f8a5f" stroke="#14235c" stroke-width="3" stroke-linejoin="round"/>
      <g class="head">
        <g fill="${hue}" stroke="#14235c" stroke-width="3">${petals(14)}</g>
        <g fill="#f7cf52" stroke="#14235c" stroke-width="2.5" transform="rotate(13 60 60) translate(9 9) scale(.85)">${petals(14)}</g>
        <circle cx="60" cy="60" r="22" fill="#6b3f17" stroke="#14235c" stroke-width="3"/>
        <circle cx="60" cy="60" r="11" fill="none" stroke="#b9793d" stroke-width="3" stroke-dasharray="3 5"/>
      </g>
    </svg>`;
  };
  const spec = [[3, 190, '#f5b914'], [15, 235, '#f08a1d'], [28, 170, '#f5b914'], [43, 215, '#eeb41a'], [57, 180, '#f08a1d'], [70, 240, '#f5b914'], [83, 195, '#eeb41a'], [93, 160, '#f08a1d']];
  el.innerHTML = spec.map(s => flower(...s)).join('');

  const heads = [...el.querySelectorAll('.head')].map(node => ({ node, a: 0, target: 0 }));
  addEventListener('pointermove', e => {
    for (const h of heads) {
      const r = h.node.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      h.target = Math.max(-38, Math.min(38, dx / 14)) + (Math.abs(dy) < 160 ? dx / 30 : 0);
    }
  }, { passive: true });
  if (reduceMotion) return;
  (function sway(t) {
    for (const [i, h] of heads.entries()) {
      h.a += (h.target - h.a) * 0.07;
      h.node.style.transform = `rotate(${h.a + Math.sin(t / 900 + i) * 2.5}deg)`;
    }
    requestAnimationFrame(sway);
  })(0);
})();

/* ---------- scroll reveal ---------- */
(function reveal() {
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { threshold: 0.12 });
  // ?shot skips the fade-ins so full-page screenshots come out clean
  const shot = location.search.includes('shot');
  document.querySelectorAll('.reveal').forEach(el => shot ? el.classList.add('in') : io.observe(el));
})();
