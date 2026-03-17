<template>
  <div class="max-w-screen-xl mx-auto px-4 py-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-100">Invoice Archive</h1>
        <p class="text-gray-500 text-sm mt-0.5">Receipts, invoices, and financial records across all channels</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">+ Add Record</button>
    </div>

    <!-- Filter bar -->
    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <input v-model="searchQuery" class="input-sm w-56" placeholder="Search name or ref…" />

      <!-- Channel filter -->
      <div class="flex gap-1.5 flex-wrap">
        <button
          class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
          :class="channelFilter === null ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
          @click="channelFilter = null"
        >All Channels</button>
        <button
          v-for="ch in allChannels"
          :key="ch"
          class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
          :class="channelFilter === ch ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
          @click="channelFilter = channelFilter === ch ? null : ch"
        >{{ ch }}</button>
      </div>

      <!-- Type filter -->
      <div class="flex gap-1.5 ml-auto">
        <button
          class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
          :class="typeFilter === null ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
          @click="typeFilter = null"
        >All</button>
        <button
          class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
          :class="typeFilter === 'income' ? 'bg-emerald-800 text-emerald-200' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
          @click="typeFilter = typeFilter === 'income' ? null : 'income'"
        >Income</button>
        <button
          class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
          :class="typeFilter === 'expense' ? 'bg-red-900 text-red-200' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
          @click="typeFilter = typeFilter === 'expense' ? null : 'expense'"
        >Expense</button>
      </div>
    </div>

    <!-- Summary strip -->
    <div class="grid grid-cols-3 gap-3 mb-5">
      <div class="card text-center py-3">
        <p class="text-xs text-gray-500 mb-0.5">Income</p>
        <p class="text-base font-bold text-emerald-400">{{ fmtTotal('income') }}</p>
      </div>
      <div class="card text-center py-3">
        <p class="text-xs text-gray-500 mb-0.5">Expenses</p>
        <p class="text-base font-bold text-rose-400">{{ fmtTotal('expense') }}</p>
      </div>
      <div class="card text-center py-3">
        <p class="text-xs text-gray-500 mb-0.5">Net</p>
        <div v-for="(val, cur) in netByCurrency" :key="cur">
          <p class="text-sm font-bold" :class="val >= 0 ? 'text-purple-400' : 'text-red-400'">
            {{ fmtAmount(Math.abs(val), cur as any) }}{{ val < 0 ? ' deficit' : '' }}
          </p>
        </div>
        <p v-if="Object.keys(netByCurrency).length === 0" class="text-base font-bold text-gray-600">—</p>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filtered.length === 0" class="card text-center py-16 text-gray-500">
      <p class="text-4xl mb-3">🗂</p>
      <p class="font-medium text-gray-400">No records found</p>
      <p class="text-sm mt-1 mb-4">Add your first invoice or receipt record</p>
      <button class="btn btn-primary" @click="openCreate">+ Add Record</button>
    </div>

    <!-- Table -->
    <div v-else class="card overflow-x-auto p-0">
      <table class="table-base">
        <thead>
          <tr>
            <th>Ref #</th>
            <th>Name</th>
            <th>Date</th>
            <th>Channel</th>
            <th>Type</th>
            <th class="text-right">Amount</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in filtered" :key="inv.id" class="group">
            <td class="font-mono text-xs text-gray-400">{{ inv.refNumber || '—' }}</td>
            <td class="font-medium text-gray-200">{{ inv.name }}</td>
            <td class="text-sm text-gray-400 tabular-nums">{{ inv.date }}</td>
            <td>
              <span class="text-xs bg-gray-800 rounded px-2 py-0.5 text-gray-300">{{ inv.channel }}</span>
            </td>
            <td>
              <span
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="inv.type === 'income' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'"
              >{{ inv.type }}</span>
            </td>
            <td class="text-right font-mono text-sm tabular-nums"
              :class="inv.type === 'income' ? 'text-emerald-400' : 'text-rose-400'">
              {{ inv.type === 'expense' ? '−' : '+' }}{{ fmtAmount(inv.amount, inv.currency) }}
            </td>
            <td class="text-xs text-gray-500 max-w-xs truncate">{{ inv.notes || '' }}</td>
            <td>
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  v-if="consignmentByInvoice[inv.id!]"
                  class="btn btn-secondary btn-sm text-xs"
                  @click="openConsignmentReport(consignmentByInvoice[inv.id!])"
                >📋 Report</button>
                <button class="btn btn-secondary btn-sm text-xs" @click="openEdit(inv)">Edit</button>
                <button class="btn btn-danger btn-sm" @click="deleteInvoice(inv)">✕</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Add / Edit Modal ──────────────────────────────────────────────── -->
    <UiModal v-model="showModal" :title="editingId ? 'Edit Record' : 'Add Invoice / Receipt'">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Ref # / Order ID</label>
            <input v-model="form.refNumber" class="input" placeholder="INV-2025-001" />
          </div>
          <div>
            <label class="label">Date *</label>
            <input v-model="form.date" type="date" class="input" />
          </div>
        </div>
        <div>
          <label class="label">Name / Description *</label>
          <input v-model="form.name" class="input" placeholder="e.g. Pesta Boneka table fee" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Channel / Source *</label>
            <input v-model="form.channel" class="input" list="channel-suggestions" placeholder="e.g. Pesta Boneka, Tokopedia" />
            <datalist id="channel-suggestions">
              <option v-for="ch in allChannels" :key="ch" :value="ch" />
            </datalist>
          </div>
          <div>
            <label class="label">Type *</label>
            <select v-model="form.type" class="input">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Amount *</label>
            <input v-model.number="form.amount" type="number" min="0" class="input" placeholder="0" />
          </div>
          <div>
            <label class="label">Currency</label>
            <select v-model="form.currency" class="input">
              <option value="IDR">IDR</option>
              <option value="SGD">SGD</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">Notes</label>
          <input v-model="form.notes" class="input" placeholder="Optional" />
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showModal = false">Cancel</button>
        <button
          class="btn btn-primary"
          :disabled="!form.name || !form.date || !form.channel || !form.amount"
          @click="saveRecord"
        >{{ editingId ? 'Save Changes' : 'Add Record' }}</button>
      </template>
    </UiModal>

    <!-- ── Consignment Report Overlay ───────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showConsignmentReport && cs.currentSession" class="fixed inset-0 z-50 bg-gray-950 overflow-y-auto">
        <div class="max-w-2xl mx-auto px-4 py-8">
          <div class="flex items-start justify-between mb-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-100">{{ cs.currentSession.name }}</h1>
              <p class="text-gray-500 text-sm mt-0.5">{{ cs.currentSession.date }}<span v-if="cs.currentSession.platform"> · {{ cs.currentSession.platform }}</span></p>
            </div>
            <button class="btn btn-secondary btn-sm" @click="showConsignmentReport = false; cs.currentSession = null; cs.currentItems = []">✕ Close</button>
          </div>

          <!-- Items -->
          <div class="card overflow-x-auto p-0 mb-6">
            <table class="table-base text-sm">
              <thead><tr>
                <th>Item</th>
                <th class="text-right">Sold</th>
                <th class="text-right">Gross</th>
                <th class="text-right">Print</th>
                <th class="text-right">Fees</th>
                <th class="text-right text-purple-400">Payout</th>
              </tr></thead>
              <tbody>
                <tr v-for="item in cs.currentItems" :key="item.id">
                  <td>
                    <div class="flex items-center gap-2">
                      <img v-if="reportImageMap[item.itemCode]" :src="`/images/${reportImageMap[item.itemCode]}`" class="w-8 h-8 object-contain rounded bg-gray-800 shrink-0" @error="(e) => (e.target as HTMLImageElement).style.display='none'" />
                      <div>
                        <p class="font-medium text-gray-200">{{ item.itemName }}</p>
                        <p v-if="item.channel" class="text-xs text-gray-500">{{ item.channel }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="text-right tabular-nums text-gray-400">× {{ item.quantitySold }}</td>
                  <td class="text-right tabular-nums text-emerald-400">{{ rFmt(cs.calcItem(item).grossRevenue) }}</td>
                  <td class="text-right tabular-nums text-rose-400">{{ rFmt(cs.calcItem(item).totalPrintingCost) }}</td>
                  <td class="text-right tabular-nums text-amber-400">{{ rFmt(cs.calcItem(item).feeAllocation) }}</td>
                  <td class="text-right tabular-nums font-bold text-purple-400">{{ rFmt(cs.calcItem(item).artistPayout) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Financial summary -->
          <div class="card p-0 mb-6 overflow-hidden">
            <div class="px-5 py-4 space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-gray-400">Gross Revenue</span><span class="font-mono text-emerald-400">{{ rFmt(cs.sessionTotals.grossRevenue) }}</span></div>
              <div class="flex justify-between"><span class="text-gray-400">− Printing Costs</span><span class="font-mono text-rose-400">{{ rFmt(cs.sessionTotals.totalPrintingCost) }}</span></div>
              <div class="flex justify-between border-t border-gray-800 pt-2"><span class="text-gray-300">= Net after Printing</span><span class="font-mono text-gray-200">{{ rFmt(cs.sessionTotals.netAfterPrinting) }}</span></div>
              <template v-if="cs.currentSession.fees.length > 0">
                <div class="flex justify-between"><span class="text-gray-400">− Session Fees</span><span class="font-mono text-amber-400">{{ rFmt(cs.sessionTotals.totalFees) }}</span></div>
                <div class="flex justify-between border-t border-gray-800 pt-2"><span class="text-gray-300">= Net after Fees</span><span class="font-mono text-gray-200">{{ rFmt(cs.sessionTotals.netAfterFees) }}</span></div>
              </template>
              <div class="flex justify-between pt-1"><span class="text-gray-400">Artist Payout</span><span class="font-mono font-bold text-purple-400">{{ rFmt(cs.sessionTotals.totalArtistPayout) }}</span></div>
            </div>
            <template v-if="cs.currentSession.payVia">
              <div class="bg-gray-900/60 border-t border-gray-800 px-5 py-4 space-y-2 text-sm">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment via {{ cs.currentSession.payVia }}</p>
                <template v-if="cs.currentSession.kursRate && cs.currentSession.kursCurrency">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Kurs (1 {{ cs.currentSession.kursCurrency }} = {{ rFmt(cs.currentSession.kursRate) }})</span>
                    <span class="font-mono text-amber-400">≈ {{ rFmtForeign(cs.sessionTotals.totalArtistPayout / cs.currentSession.kursRate, cs.currentSession.kursCurrency) }} {{ cs.currentSession.kursCurrency }}</span>
                  </div>
                  <template v-if="cs.currentSession.paymentFeePercent || cs.currentSession.paymentFeeFixed">
                    <div v-if="cs.currentSession.paymentFeePercent" class="flex justify-between text-xs">
                      <span class="text-gray-500 pl-3">· Fee {{ cs.currentSession.paymentFeePercent }}%</span>
                      <span class="font-mono text-gray-500">− {{ rFmtForeign((cs.sessionTotals.totalArtistPayout / cs.currentSession.kursRate) * (cs.currentSession.paymentFeePercent / 100), cs.currentSession.kursCurrency) }}</span>
                    </div>
                    <div v-if="cs.currentSession.paymentFeeFixed" class="flex justify-between text-xs">
                      <span class="text-gray-500 pl-3">· Fixed fee</span>
                      <span class="font-mono text-gray-500">− {{ rFmtForeign(cs.currentSession.paymentFeeFixed, cs.currentSession.kursCurrency) }}</span>
                    </div>
                  </template>
                  <div class="flex justify-between border-t border-gray-700 pt-2">
                    <span class="font-semibold text-gray-200">Artist Receives</span>
                    <span class="font-mono font-bold text-emerald-400 text-base">
                      {{ rFmtForeign((cs.sessionTotals.totalArtistPayout / cs.currentSession.kursRate) - ((cs.sessionTotals.totalArtistPayout / cs.currentSession.kursRate) * ((cs.currentSession.paymentFeePercent ?? 0) / 100)) - (cs.currentSession.paymentFeeFixed ?? 0), cs.currentSession.kursCurrency) }} {{ cs.currentSession.kursCurrency }}
                    </span>
                  </div>
                </template>
                <template v-else-if="cs.currentSession.paymentFeeFixed">
                  <div class="flex justify-between border-t border-gray-700 pt-2">
                    <span class="font-semibold text-gray-200">Artist Receives</span>
                    <span class="font-mono font-bold text-emerald-400">{{ rFmt(cs.sessionTotals.totalArtistPayout - cs.currentSession.paymentFeeFixed) }}</span>
                  </div>
                </template>
                <p v-else class="text-xs text-amber-400">⚠ Enter exchange rate in the consignment session to see conversion</p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import type { Invoice } from '~/composables/useDatabase'

const { db, ready } = useDatabase()
const cs = useConsignmentStore()

// ─── Consignment report overlay ────────────────────────────────────────────
const showConsignmentReport = ref(false)
const reportImageMap = ref<Record<string, string>>({})

async function openConsignmentReport(sessionId: number) {
  await cs.openSession(sessionId)
  // Load images for items
  const allItems = await db.items.toArray()
  const map: Record<string, string> = {}
  for (const item of allItems) { if (item.image) map[item.code] = item.image }
  reportImageMap.value = map
  showConsignmentReport.value = true
}

function rFmt(amount: number): string {
  const c = cs.currentSession?.currency ?? 'IDR'
  return c === 'IDR' ? 'Rp' + Math.round(amount).toLocaleString('id-ID') : 'S$' + amount.toFixed(2)
}

function rFmtForeign(amount: number, currency: string): string {
  if (currency === 'IDR') return 'Rp' + Math.round(amount).toLocaleString('id-ID')
  if (currency === 'KRW') return '₩' + Math.round(amount).toLocaleString('ko-KR')
  const s: Record<string, string> = { USD: '$', EUR: '€', SGD: 'S$' }
  return (s[currency] ?? '') + amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── State ─────────────────────────────────────────────────────────────────
const invoices = ref<Invoice[]>([])
const searchQuery = ref('')
const channelFilter = ref<string | null>(null)
const typeFilter = ref<'income' | 'expense' | null>(null)

// ─── Modal / form ──────────────────────────────────────────────────────────
const showModal = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  refNumber: '',
  name: '',
  date: new Date().toISOString().split('T')[0],
  channel: '',
  type: 'expense' as 'income' | 'expense',
  amount: 0,
  currency: 'IDR' as 'IDR' | 'SGD',
  notes: '',
})

// Map: invoiceId → consignmentSession.id (for "View Report" links)
const consignmentByInvoice = ref<Record<number, number>>({})

// ─── Load ──────────────────────────────────────────────────────────────────
async function load() {
  await ready
  const all = await db.invoices.toArray()
  invoices.value = all.sort((a, b) => b.date.localeCompare(a.date))
  // Build reverse map: invoiceId → consignmentSessionId
  const sessions = await db.consignmentSessions.toArray()
  const map: Record<number, number> = {}
  for (const s of sessions) {
    if (s.invoiceId && s.id) map[s.invoiceId] = s.id
  }
  consignmentByInvoice.value = map
}

// ─── Computed ──────────────────────────────────────────────────────────────
const allChannels = computed(() => {
  const s = new Set(invoices.value.map(i => i.channel).filter(Boolean))
  return [...s].sort()
})

const filtered = computed(() => {
  let list = invoices.value
  if (typeFilter.value) list = list.filter(i => i.type === typeFilter.value)
  if (channelFilter.value) list = list.filter(i => i.channel === channelFilter.value)
  const q = searchQuery.value.trim().toLowerCase()
  if (q) list = list.filter(i => i.name.toLowerCase().includes(q) || (i.refNumber ?? '').toLowerCase().includes(q))
  return list
})

// Net per currency
const netByCurrency = computed(() => {
  const totals: Record<string, number> = {}
  for (const inv of invoices.value) {
    totals[inv.currency] = (totals[inv.currency] ?? 0) + (inv.type === 'income' ? inv.amount : -inv.amount)
  }
  return totals
})

const netTotal = computed(() => netByCurrency.value['IDR'] ?? 0)

function fmtTotal(type: 'income' | 'expense'): string {
  const byType = invoices.value.filter(i => i.type === type)
  const parts: string[] = []
  const idr = byType.filter(i => i.currency === 'IDR').reduce((s, i) => s + i.amount, 0)
  const sgd = byType.filter(i => i.currency === 'SGD').reduce((s, i) => s + i.amount, 0)
  const usd = byType.filter(i => i.currency === 'USD').reduce((s, i) => s + i.amount, 0)
  if (idr) parts.push('Rp' + Math.round(idr).toLocaleString('id-ID'))
  if (sgd) parts.push('S$' + sgd.toFixed(2))
  if (usd) parts.push('$' + usd.toFixed(2))
  return parts.join(' + ') || '—'
}

function fmtAmount(amount: number, currency: 'IDR' | 'SGD' | 'USD'): string {
  if (currency === 'SGD') return 'S$' + amount.toFixed(2)
  if (currency === 'USD') return '$' + amount.toFixed(2)
  return 'Rp' + Math.round(amount).toLocaleString('id-ID')
}

// ─── CRUD ──────────────────────────────────────────────────────────────────
function openCreate() {
  editingId.value = null
  Object.assign(form, {
    refNumber: '',
    name: '',
    date: new Date().toISOString().split('T')[0],
    channel: '',
    type: 'expense',
    amount: 0,
    currency: 'IDR',
    notes: '',
  })
  showModal.value = true
}

function openEdit(inv: Invoice) {
  editingId.value = inv.id!
  Object.assign(form, {
    refNumber: inv.refNumber ?? '',
    name: inv.name,
    date: inv.date,
    channel: inv.channel,
    type: inv.type,
    amount: inv.amount,
    currency: inv.currency,
    notes: inv.notes ?? '',
  })
  showModal.value = true
}

async function saveRecord() {
  const record = {
    refNumber: form.refNumber,
    name: form.name,
    date: form.date,
    channel: form.channel,
    type: form.type,
    amount: form.amount,
    currency: form.currency,
    notes: form.notes || undefined,
    createdAt: new Date().toISOString(),
  }
  if (editingId.value) {
    await db.invoices.update(editingId.value, record)
  } else {
    await db.invoices.add(record as Invoice)
  }
  showModal.value = false
  await load()
}

async function deleteInvoice(inv: Invoice) {
  if (!confirm(`Delete "${inv.name}"?`)) return
  await db.invoices.delete(inv.id!)
  await load()
}

onMounted(load)
</script>
