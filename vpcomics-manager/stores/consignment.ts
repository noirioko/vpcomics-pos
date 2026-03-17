import { defineStore } from 'pinia'
import type { ConsignmentSession, ConsignmentItem, ConsignmentFee } from '~/composables/useDatabase'

export const useConsignmentStore = defineStore('consignment', () => {
  const { db } = useDatabase()

  const sessions = ref<ConsignmentSession[]>([])
  const currentSession = ref<ConsignmentSession | null>(null)
  const currentItems = ref<ConsignmentItem[]>([])

  // ─── Session management ───────────────────────────────────────────────────
  async function loadSessions() {
    const all = await db.consignmentSessions.toArray()
    sessions.value = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async function openSession(id: number) {
    currentSession.value = await db.consignmentSessions.get(id) ?? null
    if (currentSession.value) {
      currentItems.value = await db.consignmentItems.where('sessionId').equals(id).toArray()
    }
  }

  async function createSession(data: {
    name: string
    date: string
    currency: 'IDR' | 'SGD'
    platform?: string
    notes?: string
    artistId?: number
  }) {
    // Construct a plain object — avoids Dexie structured-clone issues with Vue Proxy
    const record: Omit<ConsignmentSession, 'id'> = {
      name: data.name,
      date: data.date,
      currency: data.currency,
      fees: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    if (data.platform) record.platform = data.platform
    if (data.notes) record.notes = data.notes
    if (data.artistId) record.artistId = data.artistId

    const id = await db.consignmentSessions.add(record as ConsignmentSession)
    await loadSessions()
    await openSession(id as number)
    return id as number
  }

  // Build a safe plain object from a session — no Vue proxies, no undefined values
  function plainSession(s: ConsignmentSession, overrides: Partial<ConsignmentSession> = {}): ConsignmentSession {
    const merged = { ...s, ...overrides }
    const out: ConsignmentSession = {
      id: merged.id,
      name: merged.name,
      date: merged.date,
      currency: merged.currency,
      fees: (merged.fees ?? []).map(f => ({ ...f })),
      status: merged.status,
      createdAt: merged.createdAt,
    }
    if (merged.platform)           out.platform           = merged.platform
    if (merged.notes)              out.notes              = merged.notes
    if (merged.invoiceId)          out.invoiceId          = merged.invoiceId
    if (merged.paidAt)             out.paidAt             = merged.paidAt
    if (merged.artistId)           out.artistId           = merged.artistId
    if (merged.payVia)             out.payVia             = merged.payVia
    if (merged.kursCurrency)       out.kursCurrency       = merged.kursCurrency
    if (merged.kursRate)           out.kursRate           = merged.kursRate
    if (merged.paymentFeePercent)  out.paymentFeePercent  = merged.paymentFeePercent
    if (merged.paymentFeeFixed !== undefined && merged.paymentFeeFixed !== null) out.paymentFeeFixed = merged.paymentFeeFixed
    return out
  }

  async function updateSession(data: {
    name?: string; date?: string; platform?: string; notes?: string
    currency?: 'IDR' | 'SGD'; artistId?: number; payVia?: string
    kursCurrency?: ConsignmentSession['kursCurrency']; kursRate?: number
    paymentFeePercent?: number; paymentFeeFixed?: number
  }) {
    if (!currentSession.value?.id) return
    const s = currentSession.value
    const updated = plainSession(s, {
      name:                data.name                ?? s.name,
      date:                data.date                ?? s.date,
      currency:            data.currency            ?? s.currency,
      platform:            data.platform            || undefined,
      notes:               data.notes               || undefined,
      artistId:            data.artistId            ?? s.artistId,
      payVia:              data.payVia              || undefined,
      kursCurrency:        data.kursCurrency        || undefined,
      kursRate:            data.kursRate            || undefined,
      paymentFeePercent:   data.paymentFeePercent !== undefined ? data.paymentFeePercent : s.paymentFeePercent,
      paymentFeeFixed:     data.paymentFeeFixed     !== undefined ? data.paymentFeeFixed   : s.paymentFeeFixed,
    })
    await db.consignmentSessions.put(updated)
    currentSession.value = updated
    await loadSessions()
  }

  async function updateSessionFees(fees: ConsignmentFee[]) {
    if (!currentSession.value?.id) return
    await db.consignmentSessions.update(currentSession.value.id, { fees })
    currentSession.value = { ...currentSession.value, fees }
  }

  async function addFee(fee: ConsignmentFee) {
    const fees = [...(currentSession.value?.fees ?? []), fee]
    await updateSessionFees(fees)
  }

  async function removeFee(feeId: string) {
    const fees = (currentSession.value?.fees ?? []).filter(f => f.id !== feeId)
    await updateSessionFees(fees)
  }

  async function setSessionStatus(status: ConsignmentSession['status']) {
    if (!currentSession.value?.id) return
    const s = currentSession.value
    // auto-stamp paidAt when marking paid; clear when going back
    const paidAt = status === 'paid' ? (s.paidAt ?? new Date().toISOString().split('T')[0]) : undefined
    const updated = plainSession(s, { status, paidAt })
    await db.consignmentSessions.put(updated)
    currentSession.value = updated
    await loadSessions()
  }

  async function setSessionInvoice(invoiceId: number | null) {
    if (!currentSession.value?.id) return
    await db.consignmentSessions.update(currentSession.value.id, { invoiceId: invoiceId ?? undefined })
    currentSession.value = { ...currentSession.value, invoiceId: invoiceId ?? undefined }
  }

  async function deleteSession(id: number) {
    await db.consignmentItems.where('sessionId').equals(id).delete()
    await db.consignmentSessions.delete(id)
    if (currentSession.value?.id === id) {
      currentSession.value = null
      currentItems.value = []
    }
    await loadSessions()
  }

  // ─── Item management ──────────────────────────────────────────────────────
  async function bulkAddItems(items: Array<Omit<ConsignmentItem, 'id' | 'sessionId'>>) {
    if (!currentSession.value?.id) return
    const sessionId = currentSession.value.id
    const records: ConsignmentItem[] = items.map(data => ({
      sessionId,
      itemCode: data.itemCode,
      itemName: data.itemName,
      quantityConsigned: data.quantityConsigned,
      quantitySold: data.quantitySold,
      sellingPrice: data.sellingPrice,
      printingCost: data.printingCost,
      profitSharePercent: data.profitSharePercent,
      ...(data.notes ? { notes: data.notes } : {}),
    }))
    await db.consignmentItems.bulkAdd(records)
    currentItems.value = await db.consignmentItems.where('sessionId').equals(sessionId).toArray()
  }

  async function addItem(data: Omit<ConsignmentItem, 'id' | 'sessionId'>) {
    if (!currentSession.value?.id) return
    const record: ConsignmentItem = {
      sessionId: currentSession.value.id,
      itemCode: data.itemCode,
      itemName: data.itemName,
      quantityConsigned: data.quantityConsigned,
      quantitySold: data.quantitySold,
      sellingPrice: data.sellingPrice,
      printingCost: data.printingCost,
      profitSharePercent: data.profitSharePercent,
    }
    if (data.notes) record.notes = data.notes
    const id = await db.consignmentItems.add(record)
    const item = await db.consignmentItems.get(id as number)
    if (item) currentItems.value.push(item)
  }

  async function updateItem(id: number, patch: Partial<ConsignmentItem>) {
    await db.consignmentItems.update(id, patch)
    const idx = currentItems.value.findIndex(i => i.id === id)
    if (idx !== -1) currentItems.value[idx] = { ...currentItems.value[idx], ...patch }
  }

  async function removeItem(id: number) {
    await db.consignmentItems.delete(id)
    currentItems.value = currentItems.value.filter(i => i.id !== id)
  }

  // ─── Calculations ─────────────────────────────────────────────────────────
  function calcItem(item: ConsignmentItem) {
    const grossRevenue = item.sellingPrice * item.quantitySold
    const totalPrintingCost = item.printingCost * item.quantitySold
    const netAfterPrinting = grossRevenue - totalPrintingCost

    // Fee allocation: prorate by item's share of gross revenue
    const totalGross = currentItems.value.reduce(
      (s, i) => s + i.sellingPrice * i.quantitySold, 0
    )
    const fees = currentSession.value?.fees ?? []
    let totalFeeAmount = 0

    for (const fee of fees) {
      if (fee.type === 'fixed') {
        // Prorate fixed fee by revenue share
        const share = totalGross > 0 ? grossRevenue / totalGross : 0
        totalFeeAmount += fee.value * share
      } else {
        // Percentage of this item's gross
        totalFeeAmount += (fee.value / 100) * grossRevenue
      }
    }

    const netAfterFees = netAfterPrinting - totalFeeAmount
    const artistPayout = netAfterFees * (item.profitSharePercent / 100)
    const platformCut = netAfterFees * (1 - item.profitSharePercent / 100)

    return {
      grossRevenue,
      totalPrintingCost,
      netAfterPrinting,
      feeAllocation: totalFeeAmount,
      netAfterFees,
      artistPayout,
      platformCut,
    }
  }

  const sessionTotals = computed(() => {
    let grossRevenue = 0
    let totalPrintingCost = 0
    let totalFees = 0
    let totalArtistPayout = 0
    let totalPlatformCut = 0
    let totalUnits = 0

    for (const item of currentItems.value) {
      const c = calcItem(item)
      grossRevenue += c.grossRevenue
      totalPrintingCost += c.totalPrintingCost
      totalFees += c.feeAllocation
      totalArtistPayout += c.artistPayout
      totalPlatformCut += c.platformCut
      totalUnits += item.quantitySold
    }

    return {
      grossRevenue,
      totalPrintingCost,
      netAfterPrinting: grossRevenue - totalPrintingCost,
      totalFees,
      netAfterFees: grossRevenue - totalPrintingCost - totalFees,
      totalArtistPayout,
      totalPlatformCut,
      totalUnits,
    }
  })

  return {
    sessions,
    currentSession,
    currentItems,
    sessionTotals,
    loadSessions,
    openSession,
    createSession,
    updateSessionFees,
    addFee,
    removeFee,
    setSessionStatus,
    deleteSession,
    updateSession,
    plainSession,
    bulkAddItems,
    addItem,
    updateItem,
    removeItem,
    calcItem,
    setSessionInvoice,
  }
})
