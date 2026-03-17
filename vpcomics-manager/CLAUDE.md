# VPCOMICS Artist Manager — Developer Guide for Claude

## What this app is
A local-first desktop web app for managing artist merchandise at conventions.
Three main tools:
1. **POS** — point-of-sale during events (select artist → track quantities sold, custom prices, availability)
2. **Inventory** — home stock management (locations + item quantities)
3. **Consignment** — calculate artist payouts after consigning goods to a third-party event (gross revenue → printing costs → fees → profit split)

A fourth page **Items** is the master product catalog (CRUD for all items per artist).

---

## Tech stack
| Layer | Choice |
|---|---|
| Framework | Nuxt 3, SPA mode (`ssr: false`) |
| Styling | Tailwind CSS via `@nuxtjs/tailwindcss` |
| State | Pinia (`@pinia/nuxt`) |
| DB | Dexie.js v4 (IndexedDB wrapper) |
| Utils | VueUse (`@vueuse/nuxt`) |
| PWA | `@vite-pwa/nuxt` |

---

## Running the app

```bash
# Development (live reload, hot module replacement)
npm run dev           # starts at localhost:3000

# Production (what the owner actually uses day-to-day)
npm run generate      # builds static files to .output/public
npm run start         # serves .output/public at localhost:4173

# Or just double-click:
BUILD-AND-START.bat   # generates + serves (run after code changes)
START.bat             # serves existing build (fast daily launch)
```

`.npmrc` sets `--max-old-space-size=4096` for all npm scripts to prevent OOM crashes during dev HMR restarts on Windows.

---

## Project structure

```
vpcomics-manager/
├── assets/css/main.css          ← Dark theme + all component classes (.card, .btn, .input, etc.)
├── components/
│   ├── ui/
│   │   ├── Modal.vue            ← Reusable modal (teleport + transition, slots: default/header/footer)
│   │   └── Stepper.vue          ← +/− stepper for quantity inputs (v-model compatible)
│   └── pos/
│       ├── ProductCard.vue      ← POS item card (qty, price/cost inputs, availability toggle, stock badge)
│       └── SessionModal.vue     ← Start session + Step 2: Pack List (bring list item selection)
├── composables/
│   ├── useDatabase.ts           ← Dexie schema, seed logic, useDatabase() composable
│   └── useExport.ts             ← CSV + PDF export for POS and consignment reports
├── data/
│   ├── seed-artists.json        ← 11 artists seeded on first load
│   └── seed-products/
│       ├── pesa21.json          ← Products for artist pesa21 (artistId: 2)
│       ├── gentlecat.json
│       └── others.json
├── layouts/default.vue          ← Top nav (Home, POS, Items, Inventory, Consignment)
├── pages/
│   ├── index.vue                ← Home / dashboard
│   ├── pos.vue                  ← POS page
│   ├── items.vue                ← Master product catalog (per-artist CRUD)
│   ├── inventory.vue            ← Home stock (locations + qty)
│   └── consignment.vue          ← Consignment session tool
├── stores/
│   ├── session.ts               ← Active POS session (start/end, bringList, stock deduction)
│   ├── pos.ts                   ← Sales data, custom prices/costs, artist/item filtering
│   ├── inventory.ts             ← Locations + inventory entries
│   └── consignment.ts           ← Consignment sessions, items, fee calculations
├── public/
│   ├── images/                  ← Product images (123 files, served at /images/filename.png)
│   ├── pwa-192.png / pwa-512.png ← PWA icons (purple squares — replace with proper art later)
│   └── favicon.ico
├── nuxt.config.ts
├── .npmrc                       ← node-options=--max-old-space-size=4096
├── START.bat                    ← Daily launch (no rebuild)
└── BUILD-AND-START.bat          ← Rebuild then launch
```

---

## Database schema (Dexie / IndexedDB)

Database name: `VPComicsDB`, version 1.

### `artists`
```
++id | key (string) | name | emoji | description | revenueShare (0–1) | isSpecialTab | sortOrder
```
- `key` is the short identifier: `"pesa21"`, `"gentlecat"`, etc.
- `revenueShare: 0.5` = artist gets 50% of net profit
- `isSpecialTab: true` for admin (hidden from most UI)
- Seeded from `data/seed-artists.json` on first load

### `items`
```
++id | code (string, unique) | artistId (→ artists.id) | category | name | image? | priceIDR | priceSGD | costIDR | costSGD | notes? | active (boolean) | stock? (number)
```
- `code` is the item identifier, e.g. `"P21-ORV-PCD-SET-01-LE"`
- `stock` is the master count; auto-decremented when a POS session ends
- `active: false` hides the item from POS and pickers
- Images served from `/images/filename.png`
- Seeded from `data/seed-products/*.json` on first load

### `sessions`
```
++id | name | date | location | currency ('IDR'|'SGD') | startedAt | endedAt? | active (boolean) | archived? | bringList? (string[])
```
- Only one session can be `active: true` at a time
- `bringList` = array of item codes selected for this event; if undefined/empty, POS shows all items
- When `endSession()` is called, sold quantities are deducted from `items.stock`

### `sales`
```
++id | sessionId | itemCode | artistId | quantity | customPrice? | customCost? | customTitle? | availability ('available'|'sold-out'|'not-brought') | notes?
```
- One row per item per session (upserted via `pos.ts upsertSale()`)
- Custom price/cost override the catalog defaults for that session only

### `locations` + `inventory`
```
locations: ++id | name | type | description? | color | active
inventory:  ++id | itemCode | locationId | quantity | notes? | updatedAt
```

### `consignmentSessions`
```
++id | name | date | currency | fees (JSON array) | notes? | status ('draft'|'active'|'settled') | createdAt
```
- `fees` is an array of `{ id, name, type: 'fixed'|'percentage', value }`

### `consignmentItems`
```
++id | sessionId | itemCode | itemName | quantityConsigned | quantitySold | sellingPrice | printingCost | profitSharePercent | notes?
```

---

## Key patterns & gotchas

### Seed timing — CRITICAL
`useDatabase()` starts the seed asynchronously and returns a `ready` promise.
Stores **must** call `useDatabase()` fresh inside each loader function — NOT rely on the promise captured at store init time (which may run before `import.meta.client` is true):

```typescript
// ✅ CORRECT — called inside the async function
async function loadItems() {
  const { ready } = useDatabase()
  await ready
  items.value = (await db.items.toArray()).filter(i => i.active !== false)
}

// ❌ WRONG — ready captured at store setup, may be pre-hydration Promise.resolve()
const { ready } = useDatabase()
async function loadItems() {
  await ready  // might resolve before seed runs
  ...
}
```

### Boolean active field
Use `i.active !== false` not `i.active` — more permissive, handles edge cases where the field is missing or stored as a number.

Never use `where('active').equals(1)` for boolean fields in Dexie 4 — boolean `true` does not equal number `1` in IndexedDB key comparison.

### Dexie + Vue reactive proxies
**Never** pass a Vue `reactive()` or `ref()` object directly to Dexie `.add()` or `.update()`. Dexie 4 uses structured clone internally which fails on Proxy objects.
Always construct a plain object:
```typescript
const record = { name: data.name, date: data.date }  // ✅
await db.table.add(data)  // ❌ if data is reactive
```

### `orderBy()` only works on indexed fields
The Dexie schema `'++id, status'` means only `id` and `status` are indexed. Sorting by `createdAt` requires fetching all + `.sort()` in JS.

---

## Consignment payout formula
```
grossRevenue      = sellingPrice × quantitySold
totalPrintingCost = printingCost × quantitySold
netAfterPrinting  = grossRevenue − totalPrintingCost
feeAllocation     = for each fee:
                    fixed  → fee.value × (itemGross / totalGross)  [prorated by revenue share]
                    percent → fee.value/100 × itemGross
netAfterFees      = netAfterPrinting − feeAllocation
artistPayout      = netAfterFees × (profitSharePercent / 100)
platformCut       = netAfterFees × (1 − profitSharePercent / 100)
```

---

## POS Pack List (bring list)
When starting a session, Step 2 of SessionModal lets the user check which items they're physically bringing. Selected codes are saved to `session.bringList`. POS then filters `currentItems` to only show those. Empty/undefined bringList = show all.
The "🎒 Pack List" button in the POS session bar lets the user update the list mid-event.

---

## Artists
| key | name | revenueShare |
|---|---|---|
| admin | ADMIN | 1.0 |
| pesa21 | PESA 21 | 0.5 |
| gentlecat | GENTLECAT | 0.7 |
| limsera | LIMSERA | 0.6 |
| discounted | DISCOUNTED | 1.0 |
| blindbox | BLINDBOX | 1.0 |
| erebun | EREBUN | 0.7 |
| bags | BAGS | 1.0 |
| kouwarra | KOUWARRA | 0.7 |
| krom | KROM | 0.6 |
| kisspage | KISSPAGE | 0.6 |

---

## Currency
IDR (Indonesian Rupiah) and SGD (Singapore Dollar) are supported everywhere. Each session picks one currency. Product catalog stores both `priceIDR/priceSGD` and `costIDR/costSGD`. The active session's currency determines which values are used in POS and consignment calculations.

---

## What's NOT implemented yet (future work)
- Firebase sync for cross-device access
- Tauri (.exe) packaging
- Inventory integration with POS (location-based stock deduction)
- Sales history / reporting across multiple sessions
- Import existing data from old vanilla JS app
