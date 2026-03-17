<template>
  <div class="max-w-5xl mx-auto p-6 space-y-6">

    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-100">Overview</h1>
      <p class="text-sm text-gray-500 mt-1">Financial summary across all sessions</p>
    </div>

    <div v-if="loading" class="text-gray-500 text-sm">Loading…</div>

    <template v-else>

      <!-- ── Lifetime stats ───────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="card p-4 text-center">
          <p class="text-xl font-bold text-emerald-400 font-mono">{{ fmt(lifetime.revenue) }}</p>
          <p class="text-xs text-gray-500 mt-1">Total Revenue</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-xl font-bold text-rose-400 font-mono">{{ fmt(lifetime.expenses) }}</p>
          <p class="text-xs text-gray-500 mt-1">Total Expenses</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-xl font-bold font-mono" :class="lifetime.net >= 0 ? 'text-emerald-400' : 'text-red-400'">
            {{ fmt(lifetime.net) }}
          </p>
          <p class="text-xs text-gray-500 mt-1">Net Profit</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-xl font-bold text-blue-400 font-mono">{{ lifetime.units }}</p>
          <p class="text-xs text-gray-500 mt-1">Total Units Sold</p>
        </div>
      </div>

      <!-- ── Sessions table ──────────────────────────────────────────────── -->
      <div class="card p-0 overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-200">Sessions</h2>
          <span class="text-xs text-gray-500">{{ rows.length }} sessions</span>
        </div>

        <div v-if="rows.length === 0" class="p-8 text-center text-gray-500 text-sm">
          No sessions yet. Start one from the POS page.
        </div>

        <table v-else class="table-base">
          <thead>
            <tr>
              <th>Session</th>
              <th>Status</th>
              <th class="text-right">Revenue</th>
              <th class="text-right">Expenses</th>
              <th class="text-right">Net Profit</th>
              <th class="text-right">Units</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.session.id">
              <td>
                <p class="font-medium text-gray-100">{{ row.session.name }}</p>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ row.session.date }}
                  <template v-if="row.session.location"> · {{ row.session.location }}</template>
                  · {{ row.session.currency }}
                </p>
              </td>
              <td>
                <span class="badge text-xs" :class="statusClass(row.session)">
                  {{ statusLabel(row.session) }}
                </span>
              </td>
              <td class="text-right font-mono text-emerald-400 text-sm">{{ fmt(row.revenue, row.session.currency) }}</td>
              <td class="text-right text-sm">
                <span v-if="row.expenses > 0" class="font-mono text-rose-400">−{{ fmt(row.expenses, row.session.currency) }}</span>
                <span v-else class="text-gray-700">—</span>
                <!-- Expense breakdown tooltip -->
                <div v-if="row.session.expenses?.length" class="text-xs text-gray-600 mt-0.5 space-y-0.5">
                  <div v-for="exp in row.session.expenses" :key="exp.id">{{ exp.label }}: {{ fmt(exp.amount, row.session.currency) }}</div>
                </div>
              </td>
              <td class="text-right font-mono font-semibold text-sm" :class="row.net >= 0 ? 'text-emerald-400' : 'text-red-400'">
                {{ fmt(row.net, row.session.currency) }}
              </td>
              <td class="text-right font-mono text-sm text-gray-400">{{ row.units }}</td>
              <td class="text-right">
                <button
                  v-if="row.session.status === 'ended' || row.session.status === 'active'"
                  class="btn btn-secondary btn-sm text-xs"
                  @click="openReport(row.session.id!)"
                >
                  Report
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </template>

    <!-- Report overlay -->
    <PosReport
      v-if="reportSessionId !== null"
      :session-id="reportSessionId"
      @close="reportSessionId = null"
    />

  </div>
</template>

<script setup lang="ts">
import type { Session, Sale, Item, Artist } from '~/composables/useDatabase'

const { db, ready } = useDatabase()

const loading = ref(true)
const sessions = ref<Session[]>([])
const allSales = ref<Sale[]>([])
const allItems = ref<Item[]>([])
const allArtists = ref<Artist[]>([])
const reportSessionId = ref<number | null>(null)

onMounted(async () => {
  await ready
  sessions.value = (await db.sessions.toArray()).sort((a, b) => b.date > a.date ? 1 : -1)
  allSales.value = await db.sales.toArray()
  allItems.value = await db.items.toArray()
  allArtists.value = await db.artists.toArray()
  loading.value = false
})

function openReport(id: number) {
  reportSessionId.value = id
}

// ─── Per-session computed row ──────────────────────────────────────────────
const rows = computed(() => {
  return sessions.value
    .filter(s => !s.archived)
    .map(session => {
      const currency = session.currency
      const sessionSales = allSales.value.filter(s => s.sessionId === session.id)
      let revenue = 0, cost = 0, units = 0

      for (const sale of sessionSales) {
        if (!sale.quantity) continue
        const item = allItems.value.find(i => i.code === sale.itemCode)
        if (!item) continue
        const artist = allArtists.value.find(a => a.id === item.artistId)
        const price = sale.customPrice ?? (currency === 'IDR' ? item.priceIDR : item.priceSGD)
        const itemCost = sale.customCost ?? (currency === 'IDR' ? item.costIDR : item.costSGD)
        const share = artist?.revenueShare ?? 1
        revenue += price * sale.quantity
        cost += itemCost * sale.quantity * share
        units += sale.quantity
      }

      const expenses = (session.expenses ?? []).reduce((s, e) => s + (e.amount || 0), 0)
      const profit = revenue - cost
      const net = profit - expenses

      return { session, revenue, cost, profit, expenses, net, units }
    })
})

// ─── Lifetime totals (IDR only — mixed currency sessions just sum) ─────────
const lifetime = computed(() => {
  return rows.value.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      expenses: acc.expenses + r.expenses,
      net: acc.net + r.net,
      units: acc.units + r.units,
    }),
    { revenue: 0, expenses: 0, net: 0, units: 0 }
  )
})

// ─── Helpers ──────────────────────────────────────────────────────────────
function fmt(n: number, currency?: 'IDR' | 'SGD'): string {
  const c = currency ?? 'IDR'
  if (c === 'IDR') return 'Rp' + Math.round(n).toLocaleString('id-ID')
  return '$' + n.toFixed(2)
}

function statusLabel(s: Session): string {
  const st = s.status ?? (s.active ? 'active' : s.endedAt ? 'ended' : 'draft')
  return { draft: 'Draft', ready: 'Ready', active: 'Active', ended: 'Ended' }[st] ?? st
}

function statusClass(s: Session): string {
  const st = s.status ?? (s.active ? 'active' : s.endedAt ? 'ended' : 'draft')
  return {
    draft: 'badge-blue',
    ready: 'badge-yellow',
    active: 'badge-green',
    ended: 'bg-gray-800 text-gray-400',
  }[st] ?? ''
}
</script>
