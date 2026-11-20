// Showcase flavours (slot 0 = vanilla). `garnish`: [kind, x, y, size, rotation] inside the 876x1168 sprite cell.
export const flavours = [
  { id: 'vanilla', name: 'Vanilla Bean', title: ['Vanilla', 'Bean'], tag: 'Classic flavour', price: 6.5, popular: true,
    tagline: 'A little scoop of something lovely.', description: 'Smooth and creamy vanilla ice cream made with real Madagascar vanilla beans.',
    color: '#F4E2AE', speckle: ['#5a3d28', 46, 3.6], garnish: [['vanillaPod', 10, 1030, 250, -6], ['vanillaFlower', 118, 970, 170, -8]] },
  { id: 'strawberry', name: 'Strawberry Cream', title: ['Strawberry', 'Cream'], tag: 'Fruit flavour', price: 6.5,
    tagline: 'Summer, in a spoon.', description: 'Sun-ripened strawberries folded through sweet cream with a ribbon of berry swirl.',
    color: '#F28FA3', speckle: ['#fff3f3', 26, 5], garnish: [['strawberryHalf', 40, 1000, 150, -10], ['strawberry', 170, 1020, 130, 14]] },
  { id: 'blueberry', name: 'Blueberry Lavender', title: ['Blueberry', 'Lavender'], tag: 'Signature flavour', price: 7, popular: true,
    tagline: 'Quiet, floral, a little bit dreamy.', description: 'Wild blueberries and a whisper of French lavender in velvety cream.',
    color: '#A084D6', speckle: ['#3f2b78', 30, 5.5], garnish: [['blueberry', 60, 1030, 100, 0], ['blueberry', 150, 1050, 90, 0], ['lavender', 220, 1010, 160, 24]] },
  { id: 'pistachio', name: 'Pistachio', title: ['Pistachio'], tag: 'Nutty flavour', price: 7.5,
    tagline: 'Green, gentle and golden.', description: 'Slow-roasted Sicilian pistachios churned into a silky, lightly salted base.',
    color: '#B9D58C', speckle: ['#6f8a46', 40, 4.5], garnish: [['pistachio', 50, 1020, 110, -20], ['pistachioShelled', 150, 1050, 80, 10], ['crumbs', 215, 1050, 90, 0]] },
  { id: 'mango', name: 'Mango Sunrise', title: ['Mango', 'Sunrise'], tag: 'Tropical flavour', price: 6.5,
    tagline: 'Sunshine you can scoop.', description: 'Alphonso mango pressed fresh and swirled with a little lime.',
    color: '#F7B733', speckle: ['#fde7a1', 20, 5], garnish: [['mangoCube', 50, 1000, 130, -8], ['mangoCube', 160, 1040, 100, 12]] },
  { id: 'chocolate', name: 'Dark Chocolate', title: ['Dark', 'Chocolate'], tag: 'Rich flavour', price: 7, popular: true,
    tagline: 'Deep, dark and decadent.', description: '70% single-origin cocoa melted into a dense, fudgy scoop.',
    color: '#6B3A2A', speckle: ['#a7714f', 26, 5], garnish: [['chocChunk', 60, 1020, 110, -12], ['chocChunk', 160, 1050, 80, 10], ['shaving', 215, 1040, 110, 0]] },
  { id: 'raspberry', name: 'Raspberry Cone', title: ['Raspberry', 'Cone'], tag: 'Seasonal flavour', price: 7.5,
    tagline: 'Sweet, tart and crunchy.', description: 'Tangy raspberry sorbet-cream in a hand-rolled waffle cone.',
    color: '#C2325A', speckle: ['#ffc2d3', 26, 4.5], cone: true, garnish: [['raspberry', 60, 1020, 110, 0], ['raspberry', 150, 1050, 85, 0]] },
];
export const sizes = [
  { id: 'small', name: 'Small', volume: '100ml', delta: -1 },
  { id: 'regular', name: 'Regular', volume: '150ml', delta: 0 },
  { id: 'large', name: 'Large', volume: '200ml', delta: 1 },
];
export const toppings = [
  { id: 'chips', name: 'Chocolate Chips', price: 0.5 },
  { id: 'sprinkles', name: 'Sprinkles', price: 0.5 },
  { id: 'caramel', name: 'Caramel Sauce', price: 0.5 },
];
export const unitPrice = (flavour, sizeId, toppingIds) =>
  flavour.price + (sizes.find((s) => s.id === sizeId)?.delta ?? 0) + toppingIds.reduce((sum, id) => sum + (toppings.find((t) => t.id === id)?.price ?? 0), 0);
