/* Little Van Gogh Art School: Almond Blossom template.
   Class list, timetable and contact details live in ../shared/content.js
   and the brush-stroke painter in ../shared/paint.js */

const PROMPTS = [
  'a tree covered in pink popcorn',
  'the sky on the first day of spring',
  'a bee who is late for work',
  'your bedroom if Vincent tidied it',
  'a cockatoo wearing a flower crown',
  'the windiest tree in Bella Vista',
  'a bowl of fruit having an argument',
  'a cat asleep under a blossom tree',
];

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- hero: painted sky, blossom branch, click to grow more ---------- */
(function hero() {
  const canvas = document.getElementById('sky');
  const hint = document.querySelector('.hero-hint');
  const svg = document.getElementById('tree'), blooms = document.getElementById('blooms');
  const sky = new Painting(canvas, structuredClone(THEMES.almond));
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

  // one blossom: five outlined petals round a yellow middle
  const NS = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
  function bloom(x, y, size, animate) {
    const outer = make('g', { transform: `translate(${x} ${y}) rotate(${rand(0, 72)}) scale(${size})` });
    const inner = make('g', animate ? { class: 'bloom' } : {});
    const pink = Math.random() < 0.35;
    for (let i = 0; i < 5; i++) {
      inner.append(make('ellipse', { cx: 0, cy: -6.6, rx: 4.6, ry: 5.8, transform: `rotate(${i * 72})`,
        fill: pink ? '#ffd0da' : '#fffdfb', stroke: '#123f48', 'stroke-width': 1 }));
    }
    inner.append(make('circle', { r: 3.2, fill: pink ? '#ee7f96' : '#f5b914', stroke: '#123f48', 'stroke-width': 1 }));
    outer.append(inner); blooms.append(outer);
    return outer;
  }
  svg.querySelectorAll('#branches path').forEach(path => {
    const len = path.getTotalLength();
    for (let d = rand(20, 60); d < len; d += rand(40, 90)) {
      const p = path.getPointAtLength(d);
      bloom(p.x + rand(-16, 16), p.y + rand(-18, 18), rand(1.6, 3), false);
    }
  });

  const clicked = [];
  canvas.addEventListener('click', e => {
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(blooms.getScreenCTM().inverse());
    clicked.push(bloom(pt.x, pt.y, rand(2.6, 3.8), true));
    if (clicked.length > 30) clicked.shift().remove();
    hint && hint.classList.add('is-gone');
  });

  // a few drifting petals
  const heroEl = canvas.parentElement;
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('i');
    p.className = 'petal';
    p.style.cssText = `left:${rand(0, 100)}%; --dx:${rand(-160, 160)}px; animation-duration:${rand(16, 28)}s; animation-delay:${-rand(0, 28)}s; scale:${rand(0.7, 1.3)}`;
    heroEl.append(p);
  }

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
  const POTS = [[187, 60, 18], [345, 85, 78], [187, 55, 42], [45, 92, 52], [24, 77, 50], [9, 62, 48], [160, 39, 30], [173, 40, 69], [262, 40, 54], [25, 55, 25], [40, 100, 97]];
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

/* ---------- blossoms that turn to watch the cursor ---------- */
(function garden() {
  const el = document.getElementById('garden');
  const flower = (x, h, hue) => {
    const petals = Array.from({ length: 5 }, (_, i) =>
      `<ellipse cx="60" cy="30" rx="21" ry="27" transform="rotate(${i * 72} 60 60)"/>`).join('');
    return `<svg viewBox="0 0 120 300" style="--x:${x}%;--h:${h}px">
      <path d="M60 70c-8 70 10 150 0 232" fill="none" stroke="#2f7d5b" stroke-width="8" stroke-linecap="round"/>
      <path d="M58 170c-30-22-46-6-50 8 22 10 40 8 50-8zM62 215c28-24 46-10 52 4-22 12-40 10-52-4z" fill="#56a36c" stroke="#123f48" stroke-width="3" stroke-linejoin="round"/>
      <g class="head">
        <g fill="${hue}" stroke="#123f48" stroke-width="3">${petals}</g>
        <circle cx="60" cy="60" r="15" fill="#f5b914" stroke="#123f48" stroke-width="3"/>
        <circle cx="60" cy="60" r="7" fill="none" stroke="#ee7f96" stroke-width="3" stroke-dasharray="2 4"/>
      </g>
    </svg>`;
  };
  const spec = [[3, 190, '#fffdfb'], [15, 235, '#ffd0da'], [28, 170, '#fffdfb'], [43, 215, '#f9b4c2'], [57, 180, '#fffdfb'], [70, 240, '#ffd0da'], [83, 195, '#fffdfb'], [93, 160, '#f9b4c2']];
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
