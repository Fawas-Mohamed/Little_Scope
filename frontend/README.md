# Little Scoop (React, frontend only)

```
npm install
npm run dev
```

Page order: Header · Hero · Our Story · Flavour showcase (product section) · Reviews · Instagram · Footer.

## Your ice cream images
Put them in **`src/assets/product/`** (sub-folders are fine). They are detected by file name, no code changes needed.
Anything missing falls back to the built-in illustration, so the site always looks complete.

| File name | Used for |
|---|---|
| `vanilla.png` (also strawberry, blueberry, pistachio, mango, chocolate, raspberry) | main product image: showcase bowl, hero cup, cart, Quick View |
| `vanilla-hero.png` | hero slider version (hero flavours: vanilla, strawberry, pistachio, chocolate) |
| `vanilla-peek.png` | front-on hover version in the showcase |
| `vanilla-photo-1.jpg`, `-2`, `-3` (or `-close`, `-ingredients`) | Quick View photos (4:5) |
| `vanilla-garnish-1.png` … | optional hero garnish pieces |
| `instagram-1.jpg` … `instagram-6.jpg` | Instagram grid |
| `story.jpg`, `bag.png`, `room.jpg` | Our Story photo, cart bag, showcase background |

Transparent PNGs work best for the product images (cut-outs standing on a baseline).

## Structure
- `src/components/Header` real header with scroll-spy and mobile menu
- `Hero`, `Story`, `Showcase`, `QuickView`, `Reviews`, `Instagram`, `Footer`, `CartDrawer`, `Flights`, `Toast`
- `src/styles/tokens.css` colours and units · `sections.css` shared section styles
- `src/data/flavours.js` flavours, sizes, toppings · `heroFlavours.js` hero flavours
- Reviews text, footer address and the Instagram handle are placeholders: edit them in `Reviews.jsx`, `Footer.jsx`, `Instagram.jsx`.

## Showcase behaviour
Wheel/arrow-key browsing starts once the showcase is snapped to the top of the screen; at the first or last flavour the wheel is handed back to the page.

## Admin panel (frontend only, mock data)
Open `/#/admin` (or the "Admin" link in the footer).

- Demo login: `admin@littlescoop.com` / `admin123` (change it in Settings > Account)
- Pages: Dashboard (KPIs, revenue chart, status donut, top flavours, low stock), Orders (filters, sorting, bulk actions, detail drawer, status flow, CSV export, print), Products (table/grid, add/edit/delete, image upload, stock +/-), Customers (detail drawer, block/unblock), Reviews (approve, hide, reply, delete), Coupons (create/edit/pause/delete), Settings (store, delivery & tax, notifications, account, export/reset data)
- All data is generated in `src/admin/store/seed.js` and saved in the browser (`localStorage`, key `ls.admin.v1`). Settings > Data > Reset restores the samples.
- The storefront checkout (cart drawer > Checkout) writes a real order into this data, so it appears in Orders straight away.
- No backend: to connect one later, replace the reducer actions in `src/admin/store/AdminStore.jsx` with API calls.
