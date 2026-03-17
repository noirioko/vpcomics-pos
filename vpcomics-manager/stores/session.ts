import { defineStore } from 'pinia'
import type { Session, SessionExpense } from '~/composables/useDatabase'

export const useSessionStore = defineStore('session', () => {
  const activeSession = ref<Session | null>(null)
  const sessions = ref<Session[]>([])

  // ─── Loaders ──────────────────────────────────────────────────────────────

  async function loadActiveSession() {
    const { ready, db } = useDatabase()
    await ready
    const all = await db.sessions.toArray()
    activeSession.value = all.find(s => s.active) ?? null
  }

  async function loadAllSessions() {
    const { ready, db } = useDatabase()
    await ready
    const all = await db.sessions.toArray()
    sessions.value = all
      .filter(s => !s.archived)
      .sort((a, b) => {
        // Active first, then by date desc
        if (a.active && !b.active) return -1
        if (!a.active && b.active) return 1
        return b.date > a.date ? 1 : b.date < a.date ? -1 : 0
      })
  }

  // ─── Draft / Preparation ──────────────────────────────────────────────────

  async function createDraft(data: {
    name: string
    date: string
    location: string
    currency: 'IDR' | 'SGD'
    bringList?: string[]
    bringQuantities?: Record<string, number>
    expenses?: SessionExpense[]
  }) {
    const { ready, db } = useDatabase()
    await ready
    const record: Omit<Session, 'id'> = {
      name: data.name,
      date: data.date,
      location: data.location,
      currency: data.currency,
      startedAt: new Date().toISOString(),
      active: false,
      status: 'draft',
    }
    // Clone to avoid Vue reactive proxy → Dexie structured-clone errors
    if (data.bringList?.length) record.bringList = [...data.bringList]
    if (data.bringQuantities && Object.keys(data.bringQuantities).length) {
      record.bringQuantities = { ...data.bringQuantities }
    }
    if (data.expenses?.length) record.expenses = data.expenses.map(e => ({ ...e }))
    const id = await db.sessions.add(record as Session)
    await loadAllSessions()
    return id as number
  }

  async function updateDraft(id: number, data: {
    name?: string
    date?: string
    location?: string
    currency?: 'IDR' | 'SGD'
    bringList?: string[]
    bringQuantities?: Record<string, number>
    expenses?: SessionExpense[]
  }) {
    const { db } = useDatabase()
    const patch: Partial<Session> = {}
    if (data.name !== undefined) patch.name = data.name
    if (data.date !== undefined) patch.date = data.date
    if (data.location !== undefined) patch.location = data.location
    if (data.currency !== undefined) patch.currency = data.currency
    if (data.bringList !== undefined) patch.bringList = [...data.bringList]
    if (data.bringQuantities !== undefined) patch.bringQuantities = { ...data.bringQuantities }
    if (data.expenses !== undefined) patch.expenses = data.expenses.map(e => ({ ...e }))
    await db.sessions.update(id, patch)
    if (activeSession.value?.id === id) {
      activeSession.value = { ...activeSession.value, ...patch }
    }
    await loadAllSessions()
  }

  async function setReady(id: number) {
    const { db } = useDatabase()
    await db.sessions.update(id, { status: 'ready' })
    await loadAllSessions()
  }

  async function setDraft(id: number) {
    const { db } = useDatabase()
    await db.sessions.update(id, { status: 'draft' })
    await loadAllSessions()
  }

  // ─── Activate (go live at event) ──────────────────────────────────────────

  async function activateSession(id: number) {
    const { ready, db } = useDatabase()
    await ready
    // Deactivate any currently active session (don't deduct stock — not ended)
    await db.sessions.filter(s => !!s.active).modify({ active: false })
    await db.sessions.update(id, {
      active: true,
      status: 'active',
      startedAt: new Date().toISOString(),
    })
    const session = await db.sessions.get(id)
    activeSession.value = session ?? null
    await loadAllSessions()
  }

  // ─── Expenses (editable any time) ─────────────────────────────────────────

  async function updateExpenses(sessionId: number, expenses: SessionExpense[]) {
    const { db } = useDatabase()
    await db.sessions.update(sessionId, { expenses })
    if (activeSession.value?.id === sessionId) {
      activeSession.value = { ...activeSession.value, expenses }
    }
    await loadAllSessions()
  }

  // ─── Pack list (mid-event update) ─────────────────────────────────────────

  async function updateBringList(codes: string[]) {
    if (!activeSession.value?.id) return
    const { db } = useDatabase()
    await db.sessions.update(activeSession.value.id, { bringList: codes })
    activeSession.value = { ...activeSession.value, bringList: codes }
    await loadAllSessions()
  }

  // ─── End session ──────────────────────────────────────────────────────────

  async function endSession() {
    if (!activeSession.value?.id) return
    const { db } = useDatabase()
    const sessionId = activeSession.value.id

    // Deduct sold quantities from item master stock
    const sessionSales = await db.sales.where('sessionId').equals(sessionId).toArray()
    const soldMap: Record<string, number> = {}
    for (const sale of sessionSales) {
      if (sale.quantity > 0) {
        soldMap[sale.itemCode] = (soldMap[sale.itemCode] ?? 0) + sale.quantity
      }
    }
    for (const [code, qty] of Object.entries(soldMap)) {
      await db.items.where('code').equals(code).modify((item: any) => {
        item.stock = Math.max(0, (item.stock ?? 0) - qty)
      })
    }

    await db.sessions.update(sessionId, {
      active: false,
      status: 'ended',
      endedAt: new Date().toISOString(),
    })
    const ended = await db.sessions.get(sessionId)
    activeSession.value = null
    await loadAllSessions()
    return ended  // returned so caller can auto-generate report
  }

  // ─── Delete (drafts / ready only) ─────────────────────────────────────────

  async function deleteSession(id: number) {
    const { db } = useDatabase()
    await db.sessions.delete(id)
    await db.sales.where('sessionId').equals(id).delete()
    await db.transactions.where('sessionId').equals(id).delete()
    await db.transactionLines.where('sessionId').equals(id).delete()
    if (activeSession.value?.id === id) activeSession.value = null
    await loadAllSessions()
  }

  // ─── Computed ─────────────────────────────────────────────────────────────

  const currency = computed(() => activeSession.value?.currency ?? 'IDR')
  const hasActiveSession = computed(() => !!activeSession.value?.active)

  return {
    activeSession,
    sessions,
    currency,
    hasActiveSession,
    loadActiveSession,
    loadAllSessions,
    createDraft,
    updateDraft,
    setReady,
    setDraft,
    activateSession,
    updateExpenses,
    updateBringList,
    endSession,
    deleteSession,
  }
})
