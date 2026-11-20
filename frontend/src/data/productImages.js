/**
 * Product image auto-detection.
 * Drop your ice cream images into  src/assets/product/  (sub-folders are fine) and they are picked up by FILE NAME.
 * No code changes needed. Anything missing falls back to the built-in SVG illustration.
 *
 *   <flavour>.png              main product image (bowl / cup / scoop, transparent PNG works best)
 *   <flavour>-hero.png         hero slider image (falls back to the main image)
 *   <flavour>-peek.png         front-on hover image in the showcase (falls back to the main image)
 *   <flavour>-photo-1/2/3.jpg  Quick View photos (4:5)   [or: -close, -ingredients]
 *   <flavour>-garnish-1/2/3    optional hero garnish pieces
 *   instagram-1 ... instagram-6, story, bag, room       (no flavour needed)
 *
 * Flavour words recognised in a file or folder name:
 *   vanilla · strawberry · blueberry (or lavender) · pistachio · mango · chocolate (or choco) · raspberry (or cone)
 */
const modules = import.meta.glob(
  ['/src/assets/product/**/*.{png,jpg,jpeg,webp,avif,svg}', '/src/product/**/*.{png,jpg,jpeg,webp,avif,svg}', '/product/**/*.{png,jpg,jpeg,webp,avif,svg}'],
  { eager: true, query: '?url', import: 'default' },
);

const FLAVOUR_WORDS = {
  vanilla: ['vanilla'], strawberry: ['strawberry'], blueberry: ['blueberry', 'lavender'], pistachio: ['pistachio'],
  mango: ['mango'], chocolate: ['chocolate', 'choco', 'cocoa'], raspberry: ['raspberry', 'cone'],
};
const has = (t, ...w) => w.some((x) => t.includes(x));

const store = { flavours: {}, insta: [], story: null, bag: null, room: null };
const slot = (id) => (store.flavours[id] ||= { bowl: null, hero: null, peek: null, photos: [], garnish: [] });

for (const [path, url] of Object.entries(modules)) {
  const after = path.split(/\/product\//i).pop();
  const t = after.replace(/\.[^.]+$/, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const num = (() => { const n = [...t].reverse().find((x) => /^\d+$/.test(x)); return n ? parseInt(n, 10) : 0; })();
  const flavour = Object.keys(FLAVOUR_WORDS).find((id) => has(t, ...FLAVOUR_WORDS[id]));

  if (has(t, 'instagram', 'insta', 'ig', 'social', 'feed')) { store.insta.push({ url, n: num }); continue; }
  if (!flavour) {
    if (has(t, 'story', 'about', 'founder', 'kitchen', 'team')) store.story = url;
    else if (has(t, 'bag', 'cart', 'box')) store.bag = url;
    else if (has(t, 'room', 'background', 'bg', 'counter', 'wall')) store.room = url;
    continue;
  }
  const f = slot(flavour);
  if (has(t, 'hero', 'slider', 'banner')) f.hero = url;
  else if (has(t, 'peek', 'front', 'hover')) f.peek = url;
  else if (has(t, 'garnish', 'topping', 'piece')) f.garnish.push({ url, n: num });
  else if (has(t, 'photo', 'detail', 'close', 'closeup', 'ingredients', 'ingredient', 'gallery', 'lifestyle') || num) {
    const n = has(t, 'close', 'closeup', 'detail') ? 2 : has(t, 'ingredients', 'ingredient') ? 3 : num || 1;
    f.photos[Math.min(Math.max(n, 1), 3) - 1] = url;
  } else f.bowl = url;
}
store.insta.sort((a, b) => a.n - b.n);

export const hasProductImages = Object.keys(modules).length > 0;
export const bowlImg = (id) => { const f = store.flavours[id]; return f ? f.bowl || f.hero || f.peek || f.photos.find(Boolean) || null : null; };
export const heroImg = (id) => { const f = store.flavours[id]; return f ? f.hero || f.bowl || f.peek || f.photos.find(Boolean) || null : null; };
export const peekImg = (id) => { const f = store.flavours[id]; return f ? f.peek || f.bowl || f.hero || f.photos.find(Boolean) || null : null; };
export const photoImgs = (id) => store.flavours[id]?.photos ?? [];
export const garnishImgs = (id) => (store.flavours[id]?.garnish ?? []).sort((a, b) => a.n - b.n).map((g) => g.url);
export const instaImgs = () => store.insta.map((i) => i.url);
export const storyImg = () => store.story;
export const bagImg = () => store.bag;
export const roomImg = () => store.room;
