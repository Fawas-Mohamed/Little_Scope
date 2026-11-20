// Hero slider flavours. Add an entry here and the tabs, wipe and wrap-around follow.
// `crop`: item boxes [x,y,w,h] in the 2048x2048 hero sheet (item 0 = cup, 1-3 = garnish).
// `cup`: placement in the 1440x900 design frame. `garnish`: art kinds used for items 1-3 until real sheets exist.
const crop = [[0, 0, 1024, 1024], [1024, 0, 1024, 1024], [0, 1024, 1024, 1024], [1024, 1024, 1024, 1024]];
const cup = { x: 510, y: 125, w: 380, h: 583 };
export const heroFlavours = [
  { id: 'vanilla', name: 'Vanilla', color: '#F6E3B4', scoop: '#F4E2AE', band: '#E8B96A', garnish: ['vanillaFlower', 'vanillaPod', 'vanillaFlower'] },
  { id: 'strawberry', name: 'Strawberry', color: '#F4B6C2', scoop: '#F28FA3', band: '#E5566F', garnish: ['strawberry', 'strawberryHalf', 'strawberry'] },
  { id: 'pistachio', name: 'Pistachio', color: '#C9DFA0', scoop: '#B3D184', band: '#6FA04B', garnish: ['pistachio', 'pistachioShelled', 'crumbs'] },
  { id: 'chocolate', name: 'Chocolate', color: '#CDA58F', scoop: '#6B3A2A', band: '#4A2518', garnish: ['chocChunk', 'cocoaBean', 'shaving'] },
].map((f) => ({ ...f, crop, cup }));
