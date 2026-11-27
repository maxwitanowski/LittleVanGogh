/* Shared placeholder content for every Little Van Gogh template.
   Change it here once and all the templates update. */

// PLACEHOLDER contact details until the real ones are confirmed.
const CONTACT = {
  phone: '04XX XXX XXX',
  email: 'xxxxx@gmail.com',
};

// PLACEHOLDER class list: names, ages, lengths and group sizes are examples.
const CLASSES = [
  { id: 'sunflowers', name: 'Tiny Sunflowers', age: 'Ages 4 to 6', swatch: '#f5b914', theme: 'sunflowers',
    blurb: 'First brushes, fat crayons and finger paint. Colour mixing, shapes and plenty of happy mess.',
    meta: ['60 min', 'Max 8 kids'] },
  { id: 'sketchers', name: 'Starry Sketchers', age: 'Ages 7 to 9', swatch: '#2447a8', theme: 'starry',
    blurb: 'Drawing from life and imagination, then turning sketches into bold acrylic paintings.',
    meta: ['75 min', 'Max 10 kids'] },
  { id: 'painters', name: 'Studio Painters', age: 'Ages 10 to 13', swatch: '#2f6b56', theme: 'wheat',
    blurb: 'Proper technique: light and shadow, perspective, composition, and painting on stretched canvas.',
    meta: ['90 min', 'Max 10 kids'] },
  { id: 'teens', name: 'Teen Portfolio', age: 'Ages 14+', swatch: '#7b5bb8', theme: 'irises',
    blurb: 'For teens building a body of work for school, selective programs or just for themselves.',
    meta: ['105 min', 'Max 8 teens'] },
  { id: 'holidays', name: 'Holiday Workshops', age: 'Ages 5 to 13', swatch: '#8fcfc6', theme: 'blossom',
    blurb: 'One big project across a school-holiday morning. Come once or come every day.',
    meta: ['3 hours', 'School holidays'] },
  { id: 'parties', name: 'Painting Parties', age: 'Any age', swatch: '#e2711d', theme: 'cafe',
    blurb: 'A birthday where everyone leaves with their own canvas. We set up and we clean up.',
    meta: ['2 hours', 'Up to 16 guests'] },
];

// PLACEHOLDER timetable.
const TIMETABLE = {
  sat: [
    ['9:00am', 'sunflowers'], ['10:15am', 'sketchers'], ['11:45am', 'painters'],
    ['1:30pm', 'sketchers'], ['3:00pm', 'painters'], ['4:45pm', 'teens'],
  ],
  sun: [
    ['9:00am', 'sketchers'], ['10:30am', 'sunflowers'], ['11:45am', 'painters'],
    ['1:30pm', 'sunflowers'], ['2:45pm', 'sketchers'], ['4:45pm', 'teens'],
  ],
};

// Fill every <span data-c="phone"> / data-c="email" with the contact details above.
function fillContact() {
  document.querySelectorAll('[data-c]').forEach(el => { el.textContent = CONTACT[el.dataset.c] || ''; });
}

// Scrolling banner: repeat the items until the strip is wider than any screen,
// then double it so the loop never shows a gap. Items must be spaced with
// margin-right (not flex gap) so the two halves are exactly equal.
function fillMarquee(track, pxPerSecond = 45) {
  const set = [...track.children];
  const need = Math.max(screen.width, innerWidth, 2000) + 400;
  let guard = 0;
  while (track.scrollWidth < need && guard++ < 40) set.forEach(n => track.append(n.cloneNode(true)));
  [...track.children].forEach(n => track.append(n.cloneNode(true)));
  track.style.animationDuration = (track.scrollWidth / 2 / pxPerSecond) + 's';
}

// "All designs" button back to the picker page. Demo only: delete this block
// once one template is chosen.
(function backButton() {
  const a = document.createElement('a');
  a.href = '../';
  a.textContent = '← All designs';
  a.style.cssText = 'position:fixed;z-index:60;left:16px;bottom:16px;padding:11px 18px;border-radius:999px;' +
    'font:700 .95rem/1 var(--body, sans-serif);text-decoration:none;color:var(--ink,#111);background:var(--white,#fff);' +
    'border:3px solid var(--ink,#111);box-shadow:4px 4px 0 var(--ink,#111)';
  document.body.append(a);
})();

// Add ?shot to any template URL to skip intro animations (used for screenshots).
if (location.search.includes('shot')) {
  document.head.insertAdjacentHTML('beforeend', '<style>* { animation-delay: -30s !important; }</style>');
}
