/* Painting: a canvas that fills itself with short thick brush strokes
   following a flow field. "bands" are horizontal regions of colour,
   "spots" are swirls (stars, flower heads) the strokes wrap around. */

const rand = (a, b) => a + Math.random() * (b - a);

class Painting {
  constructor(canvas, cfg) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cfg = cfg;
    this.stir = null; // optional pointer swirl
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const r = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.lineCap = 'round';
    this.ctx.fillStyle = this.cfg.bg;
    this.ctx.fillRect(0, 0, this.w, this.h);
    this.unit = Math.min(this.w, this.h);
    const n = Math.round((this.cfg.density || 1) * this.w * this.h / 900);
    this.parts = Array.from({ length: Math.min(n, 2200) }, () => this.spawn({}));
  }

  spawn(p) {
    p.x = rand(0, this.w);
    p.y = rand(0, this.h);
    // life is in pixels of travel, so strokes stay the same length at any speed
    p.life = rand(50, 150);
    p.ci = (Math.random() * 97) | 0;
    p.wd = rand(...this.cfg.width) * (this.unit / 500 + 0.45);
    return p;
  }

  bandAt(x, y) {
    const t = y / this.h + Math.sin(x / this.w * 7 + 1.3) * 0.025;
    const bands = this.cfg.bands;
    for (const b of bands) if (t <= b.to) return b;
    return bands[bands.length - 1];
  }

  flow(p) {
    const { x, y } = p;
    const band = this.bandAt(x, y);
    const a = band.dir + Math.sin(x * 0.006 + y * 0.004) * band.wobble + Math.cos(y * 0.011 - x * 0.002) * band.wobble * 0.6;
    let vx = Math.cos(a), vy = Math.sin(a);
    let color = null;

    const swirl = (s, paint) => {
      const r = s.r * this.unit;
      const dx = x - s.x * this.w, dy = y - s.y * this.h;
      const d = Math.hypot(dx, dy) || 1;
      const k = d / r;
      if (k > 3) return;
      const pull = (s.spin || 1) * 2.4 / (0.35 + k * k);
      vx += (-dy / d) * pull;
      vy += (dx / d) * pull;
      if (!paint) return;
      if (k < 0.34) color = s.core[p.ci % s.core.length];
      else if (k < 1 && (p.ci % 10) / 10 > k - 0.25) color = s.ring[p.ci % s.ring.length];
    };

    for (const s of this.cfg.spots) swirl(s, true);
    if (this.stir) swirl(this.stir, false);

    const m = Math.hypot(vx, vy) || 1;
    p.vx = vx / m;
    p.vy = vy / m;
    return color || band.colors[p.ci % band.colors.length];
  }

  step() {
    const ctx = this.ctx, speed = this.cfg.speed || 2.2;
    for (const p of this.parts) {
      const color = this.flow(p);
      const nx = p.x + p.vx * speed, ny = p.y + p.vy * speed;
      ctx.strokeStyle = color;
      ctx.lineWidth = p.wd;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      p.x = nx; p.y = ny;
      p.life -= speed;
      if (p.life < 0 || nx < -10 || ny < -10 || nx > this.w + 10 || ny > this.h + 10) this.spawn(p);
    }
  }

  prepaint(steps) { for (let i = 0; i < steps; i++) this.step(); }

  // Fill the canvas quickly, then keep drifting at a gentle speed while on screen.
  live(slowSpeed = 0.45, fillSteps = 110) {
    const fill = () => { this.cfg.speed = 2.2; this.prepaint(fillSteps); this.cfg.speed = slowSpeed; };
    fill();
    let visible = true, t;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(this.canvas);
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { this.resize(); fill(); }, 200); });
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const loop = () => { if (visible) this.step(); requestAnimationFrame(loop); };
    loop();
  }
}

// Paint a still picture the first time its canvas scrolls into view.
function paintWhenSeen(canvas, themeName, steps = 70) {
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    new Painting(canvas, structuredClone(THEMES[themeName])).prepaint(steps);
  }, { rootMargin: '300px' });
  io.observe(canvas);
}

const BLUES = ['#16307a', '#1d3f97', '#2447a8', '#2f5fc4', '#3f78d2', '#5d8fd6', '#1a2a66', '#8fb6e6'];
const STAR = { core: ['#fff6d6', '#fde58a', '#f5b914'], ring: ['#f5b914', '#f7cf52', '#e2711d', '#cfe0f5'] };
const FLOWER = { core: ['#6b3f17', '#8a5520', '#4d2c10'], ring: ['#f5b914', '#f08a1d', '#e2711d', '#fde58a'] };

const THEMES = {
  // full-width hero skies
  hero: {
    bg: '#2447a8', density: 1.15, width: [2.2, 5.5],
    bands: [{ to: 1, colors: BLUES, dir: -0.12, wobble: 0.75 }],
    spots: [
      { x: 0.84, y: 0.2, r: 0.2, spin: 1.2, core: ['#f7cf52', '#f5b914', '#e2711d'], ring: ['#f5b914', '#fde58a', '#e2711d', '#cfe0f5'] },
      { x: 0.56, y: 0.36, r: 0.24, spin: -1.3, core: ['#cfe0f5', '#8fb6e6', '#fff6d6'], ring: ['#8fb6e6', '#5d8fd6', '#cfe0f5', '#f7cf52'] },
      { x: 0.66, y: 0.1, r: 0.07, ...STAR },
      { x: 0.42, y: 0.12, r: 0.06, ...STAR },
      { x: 0.93, y: 0.52, r: 0.07, ...STAR },
      { x: 0.2, y: 0.09, r: 0.05, ...STAR },
    ],
  },
  vase: {
    bg: '#7fcfc9', density: 1.6, width: [2, 4.6],
    bands: [
      { to: 0.74, colors: ['#7fcfc9', '#69bdbb', '#96dbd2', '#58a9ad', '#b4e6dc', '#4f9da6'], dir: 0.5, wobble: 0.9 },
      { to: 1, colors: ['#f2c230', '#eeb41a', '#f7d661', '#e2a53a', '#d9992a'], dir: 0.05, wobble: 0.25 },
    ],
    spots: [
      { x: 0.3, y: 0.24, r: 0.2, ...FLOWER },
      { x: 0.68, y: 0.2, r: 0.17, spin: -1, ...FLOWER },
      { x: 0.5, y: 0.46, r: 0.21, ...FLOWER },
      { x: 0.2, y: 0.56, r: 0.14, spin: -1, ...FLOWER },
      { x: 0.8, y: 0.52, r: 0.15, ...FLOWER },
    ],
  },
  orchard: {
    bg: '#6fc3c9', density: 1.1, width: [2.2, 5.2],
    bands: [{ to: 1, colors: ['#6fc3c9', '#7fd0d1', '#5cb3bd', '#93dbd8', '#4ea5b3', '#a9e4de'], dir: 0.35, wobble: 0.95 }],
    spots: [
      { x: 0.16, y: 0.3, r: 0.22, spin: -1, core: ['#a9e4de', '#93dbd8'], ring: ['#93dbd8', '#7fd0d1', '#c4eee8'] },
      { x: 0.86, y: 0.72, r: 0.26, core: ['#a9e4de', '#c4eee8'], ring: ['#93dbd8', '#5cb3bd', '#c4eee8'] },
    ],
  },
  almond: {
    bg: '#3fa3b5', density: 1.15, width: [2.2, 5.5],
    bands: [{ to: 1, colors: ['#3fa3b5', '#56b5c0', '#2f8fa6', '#6cc4c9', '#2a7f98', '#8bd3d2', '#48adb9'], dir: 0.3, wobble: 0.9 }],
    spots: [
      { x: 0.12, y: 0.22, r: 0.2, spin: -1, core: ['#8bd3d2', '#6cc4c9'], ring: ['#6cc4c9', '#56b5c0', '#a9e4de'] },
      { x: 0.6, y: 0.7, r: 0.24, core: ['#a9e4de', '#8bd3d2'], ring: ['#6cc4c9', '#2f8fa6', '#a9e4de'] },
      { x: 0.93, y: 0.82, r: 0.14, spin: -1, core: ['#8bd3d2'], ring: ['#56b5c0', '#8bd3d2'] },
    ],
  },
  field: {
    bg: '#f2c230', density: 1.15, width: [2.2, 5.5],
    bands: [{ to: 1, colors: ['#f2c230', '#f7d661', '#eeb41a', '#f9e08a', '#e9c84a', '#f5b914', '#f4cd4c'], dir: -0.15, wobble: 0.8 }],
    spots: [
      { x: 0.86, y: 0.17, r: 0.2, spin: 1.2, core: ['#fffaf0', '#fff1b8', '#fde58a'], ring: ['#fff1b8', '#fffaf0', '#f08a1d', '#f9e08a'] },
      { x: 0.4, y: 0.6, r: 0.22, spin: -1, core: ['#f9e08a', '#f7d661'], ring: ['#f7d661', '#eeb41a', '#fff1b8'] },
      { x: 0.08, y: 0.2, r: 0.12, core: ['#f9e08a'], ring: ['#f7d661', '#fff1b8'] },
    ],
  },

  // class pictures
  starry: {
    bg: '#2447a8', density: 2.2, width: [1.6, 3.4],
    bands: [{ to: 1, colors: BLUES, dir: -0.1, wobble: 0.8 }],
    spots: [
      { x: 0.72, y: 0.3, r: 0.3, ...STAR },
      { x: 0.26, y: 0.5, r: 0.26, spin: -1, core: ['#cfe0f5', '#fff6d6'], ring: ['#8fb6e6', '#cfe0f5', '#f7cf52'] },
      { x: 0.15, y: 0.14, r: 0.1, ...STAR }, { x: 0.5, y: 0.85, r: 0.1, ...STAR },
    ],
  },
  sunflowers: {
    bg: '#f2c230', density: 2.2, width: [1.6, 3.4],
    bands: [
      { to: 0.68, colors: ['#f2c230', '#f7d661', '#eeb41a', '#f9e08a', '#e9c84a'], dir: 0.4, wobble: 0.9 },
      { to: 1, colors: ['#d9992a', '#c98522', '#e2a53a', '#b97a1e'], dir: 0, wobble: 0.2 },
    ],
    spots: [
      { x: 0.3, y: 0.36, r: 0.3, core: ['#6b3f17', '#8a5520', '#4d2c10'], ring: ['#e2711d', '#f08a1d', '#d9591a', '#f5b914'] },
      { x: 0.68, y: 0.3, r: 0.25, spin: -1, core: ['#6b3f17', '#2f6b56', '#8a5520'], ring: ['#f08a1d', '#e2711d', '#fde58a'] },
      { x: 0.54, y: 0.66, r: 0.2, core: ['#4d2c10', '#8a5520'], ring: ['#d9591a', '#e2711d', '#f5b914'] },
    ],
  },
  wheat: {
    bg: '#e9b93a', density: 2.2, width: [1.6, 3.4],
    bands: [
      { to: 0.42, colors: ['#3f78d2', '#5d8fd6', '#8fb6e6', '#cfe0f5', '#2f5fc4', '#fffaf0'], dir: -0.15, wobble: 0.9 },
      { to: 0.52, colors: ['#2f6b56', '#3f8a5f', '#1f4d40', '#6fa56a'], dir: 0, wobble: 0.3 },
      { to: 1, colors: ['#e9b93a', '#f5d266', '#d99a22', '#f2c230', '#c98522', '#e2711d'], dir: -1.1, wobble: 0.5 },
    ],
    spots: [{ x: 0.24, y: 0.18, r: 0.18, core: ['#fffaf0', '#cfe0f5'], ring: ['#cfe0f5', '#fffaf0', '#8fb6e6'] }],
  },
  irises: {
    bg: '#3f8a5f', density: 2.2, width: [1.6, 3.4],
    bands: [
      { to: 0.3, colors: ['#e9b93a', '#f5d266', '#d99a22', '#f2c230'], dir: 0.1, wobble: 0.5 },
      { to: 1, colors: ['#2f6b56', '#3f8a5f', '#56a36c', '#1f4d40', '#7fbf7a'], dir: -1.35, wobble: 0.45 },
    ],
    spots: [
      { x: 0.2, y: 0.46, r: 0.15, core: ['#f5b914', '#fffaf0'], ring: ['#5a3fa8', '#7b5bb8', '#3b2a8a', '#9a84d6'] },
      { x: 0.47, y: 0.36, r: 0.17, spin: -1, core: ['#f5b914', '#fffaf0'], ring: ['#3b2a8a', '#5a3fa8', '#7b5bb8'] },
      { x: 0.76, y: 0.5, r: 0.16, core: ['#f5b914'], ring: ['#7b5bb8', '#9a84d6', '#3b2a8a'] },
      { x: 0.6, y: 0.74, r: 0.12, spin: -1, core: ['#fffaf0'], ring: ['#5a3fa8', '#7b5bb8'] },
    ],
  },
  blossom: {
    bg: '#7fc4c0', density: 2.2, width: [1.6, 3.4],
    bands: [{ to: 1, colors: ['#7fc4c0', '#8fcfc6', '#6db5b3', '#a5dcd3', '#5aa5a8'], dir: 0.5, wobble: 1 }],
    spots: [[.16, .2], [.34, .34], [.52, .2], [.7, .38], [.86, .2], [.26, .64], [.48, .58], [.66, .76], [.84, .62], [.1, .84]].map(
      ([x, y], i) => ({ x, y, r: 0.085, spin: i % 2 ? 1 : -1, core: ['#e58a9a', '#f5b914'], ring: ['#fffaf0', '#fde3e3', '#f7c6cf'] })),
  },
  cafe: {
    bg: '#1d3f97', density: 2.2, width: [1.6, 3.4],
    bands: [
      { to: 0.5, colors: ['#16307a', '#1d3f97', '#2447a8', '#1a2a66', '#2f5fc4'], dir: 0.2, wobble: 0.7 },
      { to: 1, colors: ['#f5b914', '#f7cf52', '#e2711d', '#f08a1d', '#fde58a', '#d9591a'], dir: 1.2, wobble: 0.7 },
    ],
    spots: [[.14, .14], [.36, .26], [.58, .12], [.8, .24], [.92, .08]].map(
      ([x, y]) => ({ x, y, r: 0.075, core: ['#fffaf0'], ring: ['#fde58a', '#fffaf0', '#f5b914'] })),
  },
};
