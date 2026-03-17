<template>
  <div class="fixed inset-0 z-50 bg-gray-950 flex flex-col">

    <!-- Sticky header -->
    <div class="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
      <div>
        <h2 class="text-lg font-bold text-gray-100">{{ session?.name ?? 'Session Report' }}</h2>
        <p class="text-xs text-gray-400 mt-0.5">
          {{ session?.date }} · {{ session?.location }} · {{ session?.currency }}
          <span v-if="session?.status" class="ml-2 badge" :class="session.status === 'active' ? 'badge-green' : 'bg-gray-800 text-gray-400'">
            {{ session.status }}
          </span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn btn-secondary btn-sm" @click="downloadPDF">⬇ Download PDF</button>
        <button class="btn btn-secondary btn-sm" @click="$emit('close')">✕ Close</button>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="flex items-center justify-center h-64 text-gray-500">
        Loading report…
      </div>

      <div v-else class="max-w-4xl mx-auto p-6 space-y-6">

        <!-- ── Summary cards ───────────────────────────────────────────────── -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="card p-4 text-center">
            <p class="text-2xl font-bold text-emerald-400 font-mono">{{ fmt(totals.revenue) }}</p>
            <p class="text-xs text-gray-500 mt-1">Total Revenue</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-2xl font-bold font-mono" :class="totals.profit >= 0 ? 'text-emerald-400' : 'text-red-400'">{{ fmt(totals.profit) }}</p>
            <p class="text-xs text-gray-500 mt-1">Profit</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-2xl font-bold text-purple-400 font-mono">{{ transactions.length }}</p>
            <p class="text-xs text-gray-500 mt-1">Transactions</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-2xl font-bold text-blue-400 font-mono">{{ totals.units }}</p>
            <p class="text-xs text-gray-500 mt-1">Units Sold</p>
          </div>
        </div>

        <!-- ── Payment breakdown ──────────────────────────────────────────── -->
        <div class="card">
          <h3 class="text-sm font-semibold text-gray-300 mb-3">Payment Methods</h3>
          <div class="grid grid-cols-3 gap-3">
            <div v-for="method in ['Cash', 'QRIS', 'EDC']" :key="method" class="bg-gray-800/60 rounded-xl p-3 text-center">
              <p class="text-xs text-gray-500 mb-1">{{ method }}</p>
              <p class="font-mono font-bold text-gray-100">{{ fmt(paymentTotals[method] ?? 0) }}</p>
              <p class="text-xs text-gray-600 mt-0.5">{{ paymentCounts[method] ?? 0 }} tx</p>
            </div>
          </div>
        </div>

        <!-- ── Finance reconciliation ─────────────────────────────────────── -->
        <div class="card">
          <h3 class="text-sm font-semibold text-gray-300 mb-3">Finance Reconciliation</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">Cash sales received</span>
              <span class="font-mono text-emerald-400">+ {{ fmt(paymentTotals['Cash'] ?? 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Change given back</span>
              <span class="font-mono text-rose-400">− {{ fmt(totalChange) }}</span>
            </div>
            <div class="flex justify-between font-semibold border-t border-gray-800 pt-2">
              <span class="text-gray-200">Expected cash in wallet</span>
              <span class="font-mono text-emerald-400">{{ fmt(expectedCash) }}</span>
            </div>
            <div class="flex items-center gap-3 mt-2">
              <span class="text-gray-400 text-sm">Actual cash counted</span>
              <div class="flex items-center gap-1.5 ml-auto">
                <span class="text-xs text-gray-500 font-mono">{{ session?.currency === 'IDR' ? 'Rp' : '$' }}</span>
                <input
                  v-model.number="actualCash"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="w-32 bg-gray-800 text-gray-100 font-mono text-sm text-right px-2 py-1 rounded outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
            <div v-if="actualCash > 0" class="flex justify-between text-sm font-semibold">
              <span class="text-gray-400">Difference</span>
              <span class="font-mono" :class="cashDiff === 0 ? 'text-emerald-400' : cashDiff > 0 ? 'text-amber-400' : 'text-red-400'">
                {{ cashDiff >= 0 ? '+' : '' }}{{ fmt(cashDiff) }}
                {{ cashDiff === 0 ? '✓' : cashDiff > 0 ? '(surplus)' : '(short)' }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── Item breakdown ─────────────────────────────────────────────── -->
        <div class="card">
          <h3 class="text-sm font-semibold text-gray-300 mb-3">Items Sold</h3>
          <div v-if="itemBreakdown.length === 0" class="text-sm text-gray-500">No sales recorded.</div>
          <table v-else class="table-base w-full">
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Revenue</th>
                <th class="text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in itemBreakdown" :key="row.code">
                <td>
                  <p class="text-gray-200 text-xs font-medium">{{ row.name }}</p>
                  <p class="text-gray-600 text-xs font-mono">{{ row.code }}</p>
                </td>
                <td class="text-right font-mono text-sm">{{ row.qty }}</td>
                <td class="text-right font-mono text-sm text-emerald-400">{{ fmt(row.revenue) }}</td>
                <td class="text-right font-mono text-sm" :class="row.profit >= 0 ? 'text-emerald-400' : 'text-red-400'">{{ fmt(row.profit) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── By Artist ──────────────────────────────────────────────────── -->
        <div v-if="artistBreakdown.length > 0" class="card">
          <h3 class="text-sm font-semibold text-gray-300 mb-3">By Artist</h3>
          <table class="table-base w-full">
            <thead>
              <tr>
                <th>Artist</th>
                <th class="text-right">Units</th>
                <th class="text-right">Revenue</th>
                <th class="text-right">Profit (our share)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in artistBreakdown" :key="row.key">
                <td>
                  <span class="mr-1.5">{{ row.emoji }}</span>
                  <span class="text-gray-200 text-sm">{{ row.name }}</span>
                </td>
                <td class="text-right font-mono text-sm">{{ row.units }}</td>
                <td class="text-right font-mono text-sm text-emerald-400">{{ fmt(row.revenue) }}</td>
                <td class="text-right font-mono text-sm text-emerald-400">{{ fmt(row.profit) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── Transaction list ───────────────────────────────────────────── -->
        <div v-if="transactions.length > 0" class="card">
          <h3 class="text-sm font-semibold text-gray-300 mb-3">Transaction Log ({{ transactions.length }})</h3>
          <div class="space-y-2">
            <div
              v-for="(tx, i) in transactions"
              :key="tx.id"
              class="bg-gray-800/40 rounded-xl p-3"
            >
              <div class="flex items-center gap-3 mb-1.5">
                <span class="text-xs text-gray-500 font-mono">#{{ i + 1 }}</span>
                <span class="badge text-xs" :class="methodBadge(tx.paymentMethod)">{{ tx.paymentMethod }}</span>
                <span class="text-xs text-gray-500 ml-auto">{{ formatTime(tx.completedAt) }}</span>
                <span class="font-mono font-bold text-emerald-400 text-sm">{{ fmt(tx.total) }}</span>
              </div>
              <div v-if="tx.discount > 0" class="text-xs text-amber-400 mb-1">Discount: −{{ fmt(tx.discount) }}</div>
              <div v-if="linesByTx[tx.id!]" class="space-y-0.5">
                <div v-for="line in linesByTx[tx.id!]" :key="line.id" class="flex justify-between text-xs text-gray-400">
                  <span class="truncate">{{ line.itemName }} × {{ line.quantity }}</span>
                  <span class="font-mono shrink-0 ml-2">{{ fmt(line.lineTotal) }}</span>
                </div>
              </div>
              <div v-if="tx.paymentMethod === 'Cash' && tx.change > 0" class="text-xs text-gray-500 mt-1">
                Paid {{ fmt(tx.paid) }} · Change {{ fmt(tx.change) }}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Session, Sale, Transaction, TransactionLine, Item, Artist } from '~/composables/useDatabase'

const props = defineProps<{
  sessionId: number
}>()

defineEmits<{ close: [] }>()

const { db, ready } = useDatabase()

// ─── State ────────────────────────────────────────────────────────────────
const loading = ref(true)
const session = ref<Session | null>(null)
const sales = ref<Sale[]>([])
const allItems = ref<Item[]>([])
const allArtists = ref<Artist[]>([])
const transactions = ref<Transaction[]>([])
const transactionLines = ref<TransactionLine[]>([])
const actualCash = ref(0)

// ─── Load data ────────────────────────────────────────────────────────────
async function loadData() {
  loading.value = true
  await ready
  session.value = await db.sessions.get(props.sessionId) ?? null
  sales.value = await db.sales.where('sessionId').equals(props.sessionId).toArray()
  allItems.value = await db.items.toArray()
  allArtists.value = await db.artists.toArray()
  transactions.value = await db.transactions.where('sessionId').equals(props.sessionId).toArray()
  const txIds = transactions.value.map(t => t.id!)
  if (txIds.length > 0) {
    transactionLines.value = await db.transactionLines.where('sessionId').equals(props.sessionId).toArray()
  }
  loading.value = false
}

onMounted(loadData)

// ─── Computed ─────────────────────────────────────────────────────────────
const currency = computed(() => session.value?.currency ?? 'IDR')

function fmt(n: number): string {
  if (currency.value === 'IDR') return 'Rp' + Math.round(n).toLocaleString('id-ID')
  return '$' + n.toFixed(2)
}

const totals = computed(() => {
  let revenue = 0, cost = 0, units = 0
  for (const sale of sales.value) {
    if (!sale.quantity) continue
    const item = allItems.value.find(i => i.code === sale.itemCode)
    if (!item) continue
    const artist = allArtists.value.find(a => a.id === item.artistId)
    const price = sale.customPrice ?? (currency.value === 'IDR' ? item.priceIDR : item.priceSGD)
    const itemCost = sale.customCost ?? (currency.value === 'IDR' ? item.costIDR : item.costSGD)
    const share = artist?.revenueShare ?? 1
    revenue += price * sale.quantity
    cost += itemCost * sale.quantity * share
    units += sale.quantity
  }
  return { revenue, cost, profit: revenue - cost, units }
})

const paymentTotals = computed(() => {
  const result: Record<string, number> = {}
  for (const tx of transactions.value) {
    result[tx.paymentMethod] = (result[tx.paymentMethod] ?? 0) + tx.total
  }
  return result
})

const paymentCounts = computed(() => {
  const result: Record<string, number> = {}
  for (const tx of transactions.value) {
    result[tx.paymentMethod] = (result[tx.paymentMethod] ?? 0) + 1
  }
  return result
})

const totalChange = computed(() =>
  transactions.value.filter(t => t.paymentMethod === 'Cash').reduce((s, t) => s + t.change, 0)
)

const expectedCash = computed(() => (paymentTotals.value['Cash'] ?? 0) - totalChange.value)
const cashDiff = computed(() => actualCash.value - expectedCash.value)

const linesByTx = computed(() => {
  const result: Record<number, TransactionLine[]> = {}
  for (const line of transactionLines.value) {
    if (!result[line.transactionId]) result[line.transactionId] = []
    result[line.transactionId].push(line)
  }
  return result
})

const itemBreakdown = computed(() => {
  const map: Record<string, { code: string; name: string; qty: number; revenue: number; profit: number }> = {}
  for (const sale of sales.value) {
    if (!sale.quantity) continue
    const item = allItems.value.find(i => i.code === sale.itemCode)
    if (!item) continue
    const artist = allArtists.value.find(a => a.id === item.artistId)
    const price = sale.customPrice ?? (currency.value === 'IDR' ? item.priceIDR : item.priceSGD)
    const itemCost = sale.customCost ?? (currency.value === 'IDR' ? item.costIDR : item.costSGD)
    const share = artist?.revenueShare ?? 1
    if (!map[sale.itemCode]) map[sale.itemCode] = { code: sale.itemCode, name: item.name, qty: 0, revenue: 0, profit: 0 }
    map[sale.itemCode].qty += sale.quantity
    map[sale.itemCode].revenue += price * sale.quantity
    map[sale.itemCode].profit += (price - itemCost * share) * sale.quantity
  }
  return Object.values(map).sort((a, b) => b.revenue - a.revenue)
})

const artistBreakdown = computed(() => {
  const map: Record<string, { key: string; name: string; emoji: string; units: number; revenue: number; profit: number }> = {}
  for (const sale of sales.value) {
    if (!sale.quantity) continue
    const item = allItems.value.find(i => i.code === sale.itemCode)
    if (!item) continue
    const artist = allArtists.value.find(a => a.id === item.artistId)
    if (!artist) continue
    const price = sale.customPrice ?? (currency.value === 'IDR' ? item.priceIDR : item.priceSGD)
    const itemCost = sale.customCost ?? (currency.value === 'IDR' ? item.costIDR : item.costSGD)
    const share = artist.revenueShare
    if (!map[artist.key]) map[artist.key] = { key: artist.key, name: artist.name, emoji: artist.emoji, units: 0, revenue: 0, profit: 0 }
    map[artist.key].units += sale.quantity
    map[artist.key].revenue += price * sale.quantity
    map[artist.key].profit += (price - itemCost * share) * sale.quantity
  }
  return Object.values(map).sort((a, b) => b.revenue - a.revenue)
})

// ─── Helpers ──────────────────────────────────────────────────────────────
function methodBadge(method: string): string {
  return { Cash: 'badge-green', QRIS: 'badge-blue', EDC: 'badge-purple' }[method] ?? 'badge-yellow'
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function downloadPDF() {
  if (!session.value) return
  exportPosPDF({
    session: session.value as any,
    sales: sales.value,
    items: allItems.value,
    artists: allArtists.value,
  })
}
</script>
