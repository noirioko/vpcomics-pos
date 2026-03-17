import Dexie, { type Table } from 'dexie'

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface Artist {
  id?: number
  key: string
  name: string
  emoji: string
  description: string
  revenueShare: number
  isSpecialTab?: boolean
  sortOrder: number
}

export interface Item {
  id?: number
  code: string
  artistId: number
  category: string
  name: string
  image?: string
  priceIDR: number
  priceSGD: number
  costIDR: number
  costSGD: number
  notes?: string
  active: boolean
  stock?: number  // master stock count; auto-decremented on session end
}

export interface SessionExpense {
  id: string
  label: string
  amount: number
}

export interface Session {
  id?: number
  name: string
  date: string
  location: string
  currency: 'IDR' | 'SGD'
  startedAt: string
  endedAt?: string
  active: boolean
  archived?: boolean
  bringList?: string[]  // item codes selected for this event; undefined = show all
  bringQuantities?: Record<string, number>  // code → qty brought; for stock reconciliation
  expenses?: SessionExpense[]  // booth, travel, hotel, etc.
  status?: 'draft' | 'ready' | 'active' | 'ended'
}

export interface Transaction {
  id?: number
  sessionId: number
  completedAt: string
  paymentMethod: 'Cash' | 'QRIS' | 'EDC'
  subtotal: number
  discount: number
  total: number
  paid: number
  change: number
}

export interface TransactionLine {
  id?: number
  transactionId: number
  sessionId: number
  itemCode: string
  itemName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface Sale {
  id?: number
  sessionId: number
  itemCode: string
  artistId: number
  quantity: number
  customPrice?: number
  customCost?: number
  customTitle?: string
  availability?: 'available' | 'sold-out' | 'not-brought'
  notes?: string
}

export interface Location {
  id?: number
  name: string
  type: string
  description?: string
  color: string
  active: boolean
}

export interface InventoryEntry {
  id?: number
  itemCode: string
  locationId: number
  quantity: number
  notes?: string
  updatedAt: string
}

export interface ConsignmentSession {
  id?: number
  name: string
  date: string
  currency: 'IDR' | 'SGD'
  fees: ConsignmentFee[]
  notes?: string
  platform?: string   // who you consigned to: "Pesa21", "Klikmoo", etc.
  invoiceId?: number  // link to an Invoice in the archive for cross-reference
  paidAt?: string     // ISO date when artist payout was sent; undefined = unpaid
  artistId?: number   // artist this session belongs to (for per-artist archive)
  payVia?: string     // "Bank Transfer", "PayPal", "Wise"
  kursCurrency?: 'USD' | 'KRW' | 'EUR' | 'SGD'
  kursRate?: number   // IDR per 1 unit of kursCurrency
  paymentFeePercent?: number  // e.g. 4.4 for PayPal
  paymentFeeFixed?: number    // fixed fee in payout currency (USD for PayPal, IDR for bank)
  status: 'draft' | 'pending' | 'paid'
  createdAt: string
}

export interface ConsignmentFee {
  id: string
  name: string
  type: 'fixed' | 'percentage'
  value: number
}

export interface ConsignmentItem {
  id?: number
  sessionId: number
  itemCode: string
  itemName: string
  quantityConsigned: number
  quantitySold: number
  sellingPrice: number
  printingCost: number
  profitSharePercent: number
  channel?: string  // e.g. "Pesta Boneka", "Online Shop", "Group Order"
  notes?: string
}

export interface Invoice {
  id?: number
  refNumber: string      // e.g. "INV-2025-001", receipt/order number
  name: string           // description: "Pesta Boneka 2025 Table Fee"
  date: string           // ISO date
  channel: string        // "Pesta Boneka", "Klikmoo", "Online Shop", etc.
  type: 'income' | 'expense'
  amount: number
  currency: 'IDR' | 'SGD' | 'USD'
  notes?: string
  createdAt: string
}

// ─── Database Class ───────────────────────────────────────────────────────────

class VPComicsDB extends Dexie {
  items!: Table<Item>
  artists!: Table<Artist>
  sessions!: Table<Session>
  sales!: Table<Sale>
  locations!: Table<Location>
  inventory!: Table<InventoryEntry>
  consignmentSessions!: Table<ConsignmentSession>
  consignmentItems!: Table<ConsignmentItem>
  transactions!: Table<Transaction>
  transactionLines!: Table<TransactionLine>
  invoices!: Table<Invoice>

  constructor() {
    super('VPComicsDB')
    this.version(1).stores({
      items: '++id, code, artistId, category, active',
      artists: '++id, key, sortOrder',
      sessions: '++id, active, archived',
      sales: '++id, sessionId, itemCode, artistId',
      locations: '++id, active',
      inventory: '++id, itemCode, locationId',
      consignmentSessions: '++id, status',
      consignmentItems: '++id, sessionId, itemCode',
    })
    // v2: add transactions + transactionLines for cart checkout system
    this.version(2).stores({
      transactions: '++id, sessionId',
      transactionLines: '++id, transactionId, sessionId',
    })
    // v3: add invoices archive
    this.version(3).stores({
      invoices: '++id, date, channel, type',
    })
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let dbInstance: VPComicsDB | null = null
let seedPromise: Promise<void> | null = null

function getDB(): VPComicsDB {
  if (!dbInstance) {
    dbInstance = new VPComicsDB()
  }
  return dbInstance
}

// ─── Seed Logic ───────────────────────────────────────────────────────────────

async function seedIfEmpty(db: VPComicsDB) {
  const artistCount = await db.artists.count()
  if (artistCount > 0) return // already seeded

  console.log('[DB] Seeding database from JSON files...')

  // Import seed data
  const seedArtists = await import('~/data/seed-artists.json').then(m => m.default)
  const pesa21 = await import('~/data/seed-products/pesa21.json').then(m => m.default)
  const gentlecat = await import('~/data/seed-products/gentlecat.json').then(m => m.default)
  const others = await import('~/data/seed-products/others.json').then(m => m.default)

  await db.transaction('rw', db.artists, db.items, async () => {
    await db.artists.bulkAdd(seedArtists as Artist[])
    await db.items.bulkAdd([...pesa21, ...gentlecat, ...others] as Item[])
  })

  // Seed default locations
  const locationCount = await db.locations.count()
  if (locationCount === 0) {
    await db.locations.bulkAdd([
      { name: 'Convention Box A', type: 'Box', description: 'Large plastic box for conventions', color: '#FF6B6B', active: true },
      { name: 'Display Shelf', type: 'Shelf', description: 'Main display area', color: '#4ECDC4', active: true },
      { name: 'Storage Drawer 1', type: 'Drawer', description: 'Small items and accessories', color: '#45B7D1', active: true },
    ])
  }

  console.log('[DB] Seed complete.')
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useDatabase() {
  const db = getDB()

  // Start seed once; store the promise so callers can await it
  if (import.meta.client && !seedPromise) {
    seedPromise = seedIfEmpty(db).catch(console.error) as Promise<void>
  }

  return { db, ready: seedPromise ?? Promise.resolve() }
}
