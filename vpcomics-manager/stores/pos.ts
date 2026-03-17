import { defineStore } from 'pinia'
import type { Item, Artist, Sale, Transaction, TransactionLine } from '~/composables/useDatabase'

export interface CartLine {
  itemCode: string
  item: Item
  quantity: number
  unitPrice: number
}

export const usePosStore = defineStore('pos', () => {
  const { db, ready } = useDatabase()
  const sessionStore = useSessionStore()

  // ─── State ────────────────────────────────────────────────────────────────
  const artists = ref<Artist[]>([])
  const items = ref<Item[]>([])
  const sales = ref<Sale[]>([])
  const currentArtistKey = ref<string>('')
  const searchQuery = ref('')

  // Cart state
  const cart = ref<CartLine[]>([])
  const cartDiscount = ref(0)
  const cartPaid = ref(0)

  // ─── Loaders ──────────────────────────────────────────────────────────────
  async function loadArtists() {
    // Call useDatabase() fresh here to get the current ready promise —
    // the store-level `ready` may have been captured before client hydration
    const { ready: seedReady } = useDatabase()
    await seedReady
    artists.value = await db.artists.orderBy('sortOrder').toArray()
  }

  async function loadItems() {
    const { ready: seedReady } = useDatabase()
    await seedReady
    // `!== false` is intentionally permissive: handles boolean true, number 1, and missing field
    items.value = (await db.items.toArray()).filter(i => i.active !== false)
  }

  async function loadSales(sessionId: number) {
    sales.value = await db.sales.where('sessionId').equals(sessionId).toArray()
  }

  async function loadSessionData() {
    await loadArtists()
    await loadItems()
    if (sessionStore.activeSession?.id) {
      await loadSales(sessionStore.activeSession.id)
    }
  }

  // ─── Computed ─────────────────────────────────────────────────────────────
  const currentArtist = computed(() => {
    if (currentArtistKey.value === '__all__') return null
    return artists.value.find(a => a.key === currentArtistKey.value) ?? null
  })

  const currentItems = computed(() => {
    let list: Item[]
    if (currentArtistKey.value === '__all__') {
      list = [...items.value]
    } else {
      const artistObj = currentArtist.value
      if (!artistObj) return []
      list = items.value.filter(i => i.artistId === artistObj.id)
    }
    // If session has a bring list, only show those items
    const bringList = sessionStore.activeSession?.bringList
    if (bringList && bringList.length > 0) {
      list = list.filter(i => bringList.includes(i.code))
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      list = list.filter(
        i => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)
      )
    }
    return list
  })

  const currentItemsByCategory = computed(() => {
    const groups: Record<string, Item[]> = {}
    if (currentArtistKey.value === '__all__') {
      // Group by artist name when showing all
      for (const item of currentItems.value) {
        const artist = artists.value.find(a => a.id === item.artistId)
        const key = artist ? `${artist.emoji} ${artist.name}` : 'Other'
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      }
    } else {
      for (const item of currentItems.value) {
        if (!groups[item.category]) groups[item.category] = []
        groups[item.category].push(item)
      }
    }
    return groups
  })

  // ─── Sale helpers ─────────────────────────────────────────────────────────
  function getSaleForItem(itemCode: string): Sale | undefined {
    if (!sessionStore.activeSession?.id) return undefined
    return sales.value.find(
      s => s.itemCode === itemCode && s.sessionId === sessionStore.activeSession!.id
    )
  }

  function getQuantity(itemCode: string): number {
    return getSaleForItem(itemCode)?.quantity ?? 0
  }

  function getCustomPrice(itemCode: string): number | undefined {
    return getSaleForItem(itemCode)?.customPrice
  }

  function getCustomCost(itemCode: string): number | undefined {
    return getSaleForItem(itemCode)?.customCost
  }

  function getCustomTitle(itemCode: string): string | undefined {
    return getSaleForItem(itemCode)?.customTitle
  }

  function getAvailability(itemCode: string): Sale['availability'] {
    return getSaleForItem(itemCode)?.availability ?? 'available'
  }

  function getEffectivePrice(item: Item, currency: 'IDR' | 'SGD'): number {
    const custom = getCustomPrice(item.code)
    if (custom !== undefined) return custom
    return currency === 'IDR' ? item.priceIDR : item.priceSGD
  }

  function getEffectiveCost(item: Item, currency: 'IDR' | 'SGD'): number {
    const custom = getCustomCost(item.code)
    if (custom !== undefined) return custom
    return currency === 'IDR' ? item.costIDR : item.costSGD
  }

  // ─── Mutations ────────────────────────────────────────────────────────────
  async function upsertSale(itemCode: string, artistId: number, patch: Partial<Sale>) {
    if (!sessionStore.activeSession?.id) return
    const sessionId = sessionStore.activeSession.id

    const existing = sales.value.find(
      s => s.itemCode === itemCode && s.sessionId === sessionId
    )

    if (existing?.id) {
      await db.sales.update(existing.id, patch)
      const idx = sales.value.findIndex(s => s.id === existing.id)
      if (idx !== -1) sales.value[idx] = { ...sales.value[idx], ...patch }
    } else {
      const id = await db.sales.add({
        sessionId,
        itemCode,
        artistId,
        quantity: 0,
        ...patch,
      })
      const newSale = await db.sales.get(id)
      if (newSale) sales.value.push(newSale)
    }
  }

  async function setQuantity(item: Item, quantity: number) {
    await upsertSale(item.code, item.artistId!, { quantity: Math.max(0, quantity) })
  }

  async function addQuantity(item: Item, delta: number) {
    const current = getQuantity(item.code)
    await setQuantity(item, current + delta)
  }

  async function setCustomPrice(item: Item, price: number | undefined) {
    await upsertSale(item.code, item.artistId!, { customPrice: price })
  }

  async function setCustomCost(item: Item, cost: number | undefined) {
    await upsertSale(item.code, item.artistId!, { customCost: cost })
  }

  async function setCustomTitle(item: Item, title: string | undefined) {
    await upsertSale(item.code, item.artistId!, { customTitle: title })
  }

  async function setAvailability(item: Item, availability: Sale['availability']) {
    await upsertSale(item.code, item.artistId!, { availability })
  }

  async function setNotes(item: Item, notes: string) {
    await upsertSale(item.code, item.artistId!, { notes })
  }

  // ─── Cart ─────────────────────────────────────────────────────────────────

  const cartSubtotal = computed(() => cart.value.reduce((s, l) => s + l.unitPrice * l.quantity, 0))
  const cartTotal = computed(() => Math.max(0, cartSubtotal.value - cartDiscount.value))
  const cartChange = computed(() => Math.max(0, cartPaid.value - cartTotal.value))
  const cartCount = computed(() => cart.value.reduce((s, l) => s + l.quantity, 0))

  function addToCart(item: Item) {
    const currency = sessionStore.currency
    const existing = cart.value.find(l => l.itemCode === item.code)
    if (existing) {
      existing.quantity++
    } else {
      const unitPrice = getEffectivePrice(item, currency)
      cart.value.push({ itemCode: item.code, item, quantity: 1, unitPrice })
    }
  }

  function removeFromCart(itemCode: string) {
    const idx = cart.value.findIndex(l => l.itemCode === itemCode)
    if (idx !== -1) cart.value.splice(idx, 1)
  }

  function setCartLineQty(itemCode: string, qty: number) {
    if (qty <= 0) { removeFromCart(itemCode); return }
    const line = cart.value.find(l => l.itemCode === itemCode)
    if (line) line.quantity = qty
  }

  function setCartLinePrice(itemCode: string, price: number) {
    const line = cart.value.find(l => l.itemCode === itemCode)
    if (line) line.unitPrice = price
  }

  function clearCart() {
    cart.value = []
    cartDiscount.value = 0
    cartPaid.value = 0
  }

  async function completeTransaction(paymentMethod: 'Cash' | 'QRIS' | 'EDC') {
    if (!sessionStore.activeSession?.id || cart.value.length === 0) return null
    const { db } = useDatabase()
    const sessionId = sessionStore.activeSession.id

    const txId = await db.transactions.add({
      sessionId,
      completedAt: new Date().toISOString(),
      paymentMethod,
      subtotal: cartSubtotal.value,
      discount: cartDiscount.value,
      total: cartTotal.value,
      paid: cartPaid.value,
      change: cartChange.value,
    } as Transaction)

    for (const line of cart.value) {
      await db.transactionLines.add({
        transactionId: txId as number,
        sessionId,
        itemCode: line.itemCode,
        itemName: line.item.name,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.unitPrice * line.quantity,
      } as TransactionLine)
      await addQuantity(line.item, line.quantity)
    }

    clearCart()
    return txId as number
  }

  // ─── Totals ───────────────────────────────────────────────────────────────
  const totals = computed(() => {
    const currency = sessionStore.currency
    let revenue = 0
    let cost = 0
    let units = 0

    for (const sale of sales.value) {
      if (sale.quantity === 0) continue
      const item = items.value.find(i => i.code === sale.itemCode)
      if (!item) continue

      const artist = artists.value.find(a => a.id === item.artistId)
      const price = sale.customPrice ?? (currency === 'IDR' ? item.priceIDR : item.priceSGD)
      const itemCost = sale.customCost ?? (currency === 'IDR' ? item.costIDR : item.costSGD)
      const share = artist?.revenueShare ?? 1.0

      revenue += price * sale.quantity
      cost += itemCost * sale.quantity * share
      units += sale.quantity
    }

    const profit = revenue - cost
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0

    return { revenue, cost, profit, margin, units }
  })

  const artistTotals = computed(() => {
    const currency = sessionStore.currency
    const result: Record<string, { revenue: number; cost: number; profit: number; units: number }> = {}

    for (const sale of sales.value) {
      if (sale.quantity === 0) continue
      const item = items.value.find(i => i.code === sale.itemCode)
      if (!item) continue

      const artist = artists.value.find(a => a.id === item.artistId)
      if (!artist) continue

      const price = sale.customPrice ?? (currency === 'IDR' ? item.priceIDR : item.priceSGD)
      const itemCost = sale.customCost ?? (currency === 'IDR' ? item.costIDR : item.costSGD)
      const share = artist.revenueShare

      if (!result[artist.key]) result[artist.key] = { revenue: 0, cost: 0, profit: 0, units: 0 }
      result[artist.key].revenue += price * sale.quantity
      result[artist.key].cost += itemCost * sale.quantity * share
      result[artist.key].profit = result[artist.key].revenue - result[artist.key].cost
      result[artist.key].units += sale.quantity
    }

    return result
  })

  return {
    artists,
    items,
    sales,
    currentArtistKey,
    searchQuery,
    currentArtist,
    currentItems,
    currentItemsByCategory,
    totals,
    artistTotals,
    // Cart
    cart,
    cartDiscount,
    cartPaid,
    cartSubtotal,
    cartTotal,
    cartChange,
    cartCount,
    loadArtists,
    loadItems,
    loadSales,
    loadSessionData,
    getSaleForItem,
    getQuantity,
    getCustomPrice,
    getCustomCost,
    getCustomTitle,
    getAvailability,
    getEffectivePrice,
    getEffectiveCost,
    setQuantity,
    addQuantity,
    setCustomPrice,
    setCustomCost,
    setCustomTitle,
    setAvailability,
    setNotes,
    addToCart,
    removeFromCart,
    setCartLineQty,
    setCartLinePrice,
    clearCart,
    completeTransaction,
  }
})
