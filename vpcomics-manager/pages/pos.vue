<template>
  <div class="flex flex-col h-[calc(100vh-52px)]">

    <!-- ── In-app Report overlay ──────────────────────────────────────────── -->
    <PosReport
      v-if="reportSessionId !== null"
      :session-id="reportSessionId"
      @close="reportSessionId = null"
    />

    <!-- ── ACTIVE SESSION: POS View ─────────────────────────────────────── -->
    <template v-if="sessionStore.hasActiveSession">

      <!-- Session bar -->
      <div class="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center gap-3 shrink-0">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
        <span class="text-sm font-medium text-gray-200">{{ sessionStore.activeSession?.name }}</span>
        <span class="text-xs text-gray-500">{{ sessionStore.activeSession?.date }}</span>
        <span class="badge badge-purple text-xs">{{ sessionStore.currency }}</span>

        <div class="flex items-center gap-2 ml-auto">
          <button
            class="btn btn-secondary btn-sm"
            @click="showPackList = true"
            :title="packListCount > 0 ? packListCount + ' items selected' : 'Show all items'"
          >
            🎒 Pack List{{ packListCount > 0 ? ' (' + packListCount + ')' : ' (all)' }}
          </button>
          <button
            class="btn btn-secondary btn-sm"
            :class="sessionStore.activeSession?.expenses?.length ? 'text-rose-300' : ''"
            @click="showExpenses = true"
          >
            ✈ Expenses{{ sessionStore.activeSession?.expenses?.length ? ' (' + sessionStore.activeSession.expenses.length + ')' : '' }}
          </button>
          <button class="btn btn-secondary btn-sm" @click="openReport">
            📊 Report
          </button>
          <button class="btn btn-danger btn-sm" @click="endSession">
            End Session
          </button>
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden">
        <!-- Left: Artist selection + session overview -->
        <div class="w-52 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
          <div class="p-2 text-xs font-medium text-gray-500 uppercase tracking-wider shrink-0">Artists</div>

          <!-- Scrollable artist list -->
          <div class="flex-1 overflow-y-auto">
            <!-- All button -->
            <button
              class="flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors w-full"
              :class="pos.currentArtistKey === '__all__'
                ? 'bg-purple-900/50 text-purple-300 border-r-2 border-purple-500'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'"
              @click="pos.currentArtistKey = '__all__'"
            >
              <span>🎪</span>
              <span class="truncate font-medium">All</span>
              <span v-if="pos.totals.units" class="ml-auto text-xs font-mono text-gray-500">
                {{ pos.totals.units }}
              </span>
            </button>
            <div class="border-t border-gray-800 mx-2 my-0.5"></div>

            <!-- Individual artists -->
            <button
              v-for="artist in pos.artists.filter(a => !a.isSpecialTab)"
              :key="artist.key"
              class="flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors w-full"
              :class="pos.currentArtistKey === artist.key
                ? 'bg-purple-900/50 text-purple-300 border-r-2 border-purple-500'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'"
              @click="pos.currentArtistKey = artist.key"
            >
              <span>{{ artist.emoji }}</span>
              <span class="truncate font-medium">{{ artist.name }}</span>
              <span v-if="artistUnitCount(artist.key)" class="ml-auto text-xs font-mono text-gray-500">
                {{ artistUnitCount(artist.key) }}
              </span>
            </button>
          </div>

          <!-- Session overview — pinned to bottom, only once there are sales -->
          <div v-if="pos.totals.units > 0" class="shrink-0 border-t border-gray-800 p-3">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2.5">Today</p>
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="text-gray-500">Revenue</span>
                <span class="font-mono text-emerald-400">{{ fmt(pos.totals.revenue) }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-gray-500">Cost</span>
                <span class="font-mono text-rose-400">{{ fmt(pos.totals.cost) }}</span>
              </div>
              <div class="flex justify-between text-xs font-semibold border-t border-gray-800/60 pt-1.5">
                <span class="text-gray-300">Profit</span>
                <span class="font-mono" :class="pos.totals.profit >= 0 ? 'text-emerald-400' : 'text-red-400'">
                  {{ fmt(pos.totals.profit) }}
                </span>
              </div>
              <div class="flex justify-between text-xs text-gray-600">
                <span>Units</span>
                <span class="font-mono">{{ pos.totals.units }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Products + totals -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Search bar -->
          <div class="px-4 py-2 border-b border-gray-800 flex items-center gap-3 shrink-0 bg-gray-950">
            <div class="relative flex-1 max-w-xs">
              <input
                v-model="pos.searchQuery"
                class="input-sm w-full pr-7"
                placeholder="Search products..."
              />
              <button
                v-if="pos.searchQuery"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
                @click="pos.searchQuery = ''"
              >✕</button>
            </div>
            <div v-if="pos.currentArtist" class="text-sm text-gray-400">
              {{ pos.currentArtist.emoji }} {{ pos.currentArtist.name }}
            </div>
            <div v-else-if="pos.currentArtistKey === '__all__'" class="text-sm text-gray-400">
              All Artists
            </div>
          </div>

          <!-- Product grid -->
          <div class="flex-1 overflow-y-auto p-4">
            <div v-if="!pos.currentArtistKey" class="flex items-center justify-center h-full text-gray-500">
              Select an artist or "All" to view products
            </div>

            <template v-else>
              <div
                v-for="(catItems, category) in pos.currentItemsByCategory"
                :key="category"
                class="mb-8"
              >
                <h3 class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                  <span>{{ formatCategory(String(category)) }}</span>
                  <span class="h-px flex-1 bg-gray-800"></span>
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  <PosProductCard
                    v-for="item in catItems"
                    :key="item.code"
                    :item="item"
                    :quantity="pos.getQuantity(item.code)"
                    :effective-price="pos.getEffectivePrice(item, sessionStore.currency)"
                    :effective-cost="pos.getEffectiveCost(item, sessionStore.currency)"
                    :custom-title="pos.getCustomTitle(item.code)"
                    :availability="pos.getAvailability(item.code) as any"
                    :currency="sessionStore.currency"
                    @add="(d) => pos.addQuantity(item, d)"
                    @set-qty="(q) => pos.setQuantity(item, q)"
                    @set-price="(p) => pos.setCustomPrice(item, p)"
                    @set-cost="(c) => pos.setCustomCost(item, c)"
                    @set-availability="(a) => pos.setAvailability(item, a)"
                    @add-to-cart="() => pos.addToCart(item)"
                  />
                </div>
              </div>
              <div v-if="Object.keys(pos.currentItemsByCategory).length === 0" class="text-center text-gray-500 py-12">
                No products found
              </div>
            </template>
          </div>
        </div>

        <!-- Cart panel -->
        <PosCartPanel />
      </div>

      <!-- Pack list modal (mid-event) -->
      <UiModal v-model="showPackList" title="Pack List — What are you bringing?" max-width="560px">
        <div class="space-y-3">
          <p class="text-sm text-gray-400">Only checked items will appear in POS. Uncheck all to show everything.</p>
          <div class="flex items-center gap-2">
            <input v-model="packSearch" class="input-sm flex-1" placeholder="Search…" />
            <button class="btn btn-secondary btn-sm" @click="packSelectAll">All</button>
            <button class="btn btn-secondary btn-sm" @click="packClearAll">None</button>
          </div>
          <div class="max-h-96 overflow-y-auto space-y-4 pr-1">
            <div v-for="artist in packArtists" :key="artist.key">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{{ artist.emoji }} {{ artist.name }}</span>
                <button class="text-xs text-purple-400 hover:text-purple-300 ml-auto" @click="packToggleArtist(artist.id!)">
                  {{ packIsArtistAllChecked(artist.id!) ? 'Uncheck all' : 'Check all' }}
                </button>
              </div>
              <div class="grid grid-cols-1 gap-0.5 pl-2">
                <label
                  v-for="item in packFilteredByArtist[artist.id!]"
                  :key="item.code"
                  class="flex items-center gap-3 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-gray-800 transition-colors"
                >
                  <input type="checkbox" class="w-4 h-4 rounded accent-purple-500"
                    :checked="localBringList.has(item.code)"
                    @change="packToggleItem(item.code)" />
                  <img v-if="item.image" :src="`/images/${item.image}`"
                    class="w-7 h-7 object-contain rounded bg-gray-800 shrink-0"
                    @error="(e) => (e.target as HTMLImageElement).style.display='none'" />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm text-gray-200 truncate">{{ item.name }}</p>
                    <p class="text-xs font-mono text-gray-500">{{ item.code }}</p>
                  </div>
                  <span v-if="(item as any).stock !== undefined" class="text-xs font-mono shrink-0"
                    :class="(item as any).stock === 0 ? 'text-red-500' : (item as any).stock <= 5 ? 'text-amber-400' : 'text-gray-500'">
                    {{ (item as any).stock }} left
                  </span>
                </label>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-600">{{ localBringList.size === 0 ? 'All items shown' : localBringList.size + ' selected' }}</p>
        </div>
        <template #footer>
          <button class="btn btn-secondary" @click="showPackList = false">Cancel</button>
          <button class="btn btn-primary" @click="savePackList">Save Pack List</button>
        </template>
      </UiModal>

    </template>

    <!-- ── NO ACTIVE SESSION: Split-panel prep workspace ───────────────── -->
    <template v-else>
      <div class="flex flex-1 overflow-hidden">

        <!-- Left: Sessions list -->
        <div class="w-72 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">

          <!-- Header -->
          <div class="px-4 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
            <h2 class="text-sm font-semibold text-gray-300">Sessions</h2>
            <button class="btn btn-primary btn-sm text-xs" @click="selectNew">+ New Draft</button>
          </div>

          <!-- Status flow hint -->
          <div class="px-3 py-2 border-b border-gray-800/60 shrink-0">
            <div class="flex items-center gap-1.5 text-xs text-gray-600">
              <span class="badge badge-blue py-0.5 px-1.5 text-[10px]">Draft</span>
              <span>→</span>
              <span class="badge badge-yellow py-0.5 px-1.5 text-[10px]">Ready</span>
              <span>→</span>
              <span class="badge badge-green py-0.5 px-1.5 text-[10px]">Active</span>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="sessionStore.sessions.length === 0" class="flex-1 flex items-center justify-center p-6">
            <div class="text-center text-gray-600">
              <p class="text-3xl mb-2">🎪</p>
              <p class="text-sm">No sessions yet</p>
              <p class="text-xs mt-1">Create a draft above</p>
            </div>
          </div>

          <!-- Session list -->
          <div v-else class="flex-1 overflow-y-auto">
            <button
              v-for="session in sessionStore.sessions"
              :key="session.id"
              class="w-full text-left px-4 py-3 border-b border-gray-800/40 transition-colors"
              :class="selectedPrepSession?.id === session.id && prepMode === 'edit'
                ? 'bg-purple-900/30 border-l-2 border-l-purple-500'
                : 'hover:bg-gray-800/50'"
              @click="selectSession(session)"
            >
              <div class="flex items-center gap-2 mb-1.5">
                <span class="badge text-xs shrink-0" :class="statusBadgeClass(session)">
                  {{ statusIcon(session) }} {{ statusLabel(session) }}
                </span>
              </div>
              <p class="text-sm font-semibold text-gray-200 truncate">{{ session.name }}</p>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ session.date }}
                <template v-if="session.location"> · {{ session.location }}</template>
                · {{ session.currency }}
              </p>
            </button>
          </div>
        </div>

        <!-- Right: Inline preparation panel -->
        <PosPrepPanel
          :mode="prepMode"
          :session="selectedPrepSession"
          @created="onPrepCreated"
          @updated="onPrepUpdated"
          @activated="onPrepActivated"
          @deleted="onPrepDeleted"
          @cancelled="prepMode = 'empty'; selectedPrepSession = null"
          @view-report="(id) => { reportSessionId = id }"
        />

      </div>
    </template>

    <!-- Expenses modal (active session) -->
    <UiModal v-model="showExpenses" title="Convention Expenses" max-width="480px">
      <div class="space-y-3">
        <p class="text-sm text-gray-400">Track booth, travel, hotel, and other costs for this event. Deducted in the Overview and reports.</p>

        <!-- Expense rows -->
        <div class="space-y-2">
          <div v-for="(exp, i) in localExpenses" :key="exp.id" class="flex items-center gap-2">
            <input v-model="exp.label" class="input-sm flex-1" placeholder="Label (e.g. Booth Fee)" />
            <input
              v-model.number="exp.amount"
              type="number" min="0" placeholder="0"
              class="input-sm w-28 font-mono text-right"
            />
            <button class="text-gray-500 hover:text-red-400 transition-colors shrink-0" @click="localExpenses.splice(i, 1)">✕</button>
          </div>
        </div>

        <!-- Total -->
        <div v-if="localExpenses.length > 0" class="flex justify-between text-sm font-semibold border-t border-gray-800 pt-2">
          <span class="text-gray-400">Total Expenses</span>
          <span class="font-mono text-rose-400">
            {{ sessionStore.currency === 'IDR' ? 'Rp' : '$' }}{{ sessionStore.currency === 'IDR'
              ? localExpenses.reduce((s,e) => s+(e.amount||0), 0).toLocaleString('id-ID')
              : localExpenses.reduce((s,e) => s+(e.amount||0), 0).toFixed(2) }}
          </span>
        </div>

        <!-- Preset buttons -->
        <div class="flex gap-1.5 flex-wrap">
          <button
            v-for="p in ['Booth Fee','Flight','Hotel','Transport','Meals','Shipping']"
            :key="p"
            class="btn btn-secondary btn-sm text-xs"
            @click="localExpenses.push({ id: crypto.randomUUID(), label: p, amount: 0 })"
          >+ {{ p }}</button>
          <button class="btn btn-secondary btn-sm text-xs" @click="localExpenses.push({ id: crypto.randomUUID(), label: '', amount: 0 })">+ Custom</button>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showExpenses = false">Cancel</button>
        <button class="btn btn-primary" @click="saveExpenses">Save Expenses</button>
      </template>
    </UiModal>


  </div>
</template>

<script setup lang="ts">
import type { Artist, Item, Session, SessionExpense } from '~/composables/useDatabase'

const sessionStore = useSessionStore()
const pos = usePosStore()
const { db, ready } = useDatabase()

// ─── Report overlay ────────────────────────────────────────────────────────
const reportSessionId = ref<number | null>(null)

function openReport() {
  if (sessionStore.activeSession?.id) reportSessionId.value = sessionStore.activeSession.id
}

// ─── Prep panel (no-session split panel) ───────────────────────────────────
const prepMode = ref<'empty' | 'new' | 'edit'>('empty')
const selectedPrepSession = ref<Session | null>(null)

function selectNew() {
  prepMode.value = 'new'
  selectedPrepSession.value = null
}

function selectSession(session: Session) {
  prepMode.value = 'edit'
  selectedPrepSession.value = session
}

async function onPrepCreated(id: number) {
  // createDraft already called loadAllSessions, but call again to guarantee the new
  // session is in the reactive array before we try to find it (timing safety)
  if (!sessionStore.sessions.find(s => s.id === id)) {
    await sessionStore.loadAllSessions()
  }
  const fresh = sessionStore.sessions.find(s => s.id === id) ?? null
  if (fresh) {
    prepMode.value = 'edit'
    selectedPrepSession.value = fresh
  }
  // If still not found (shouldn't happen), stay in 'new' mode — session will appear in list
}

function onPrepUpdated() {
  // Refresh selected session from the store (store already reloaded inside updateDraft / setReady etc.)
  if (selectedPrepSession.value?.id) {
    selectedPrepSession.value =
      sessionStore.sessions.find(s => s.id === selectedPrepSession.value?.id) ?? null
  }
}

async function onPrepActivated(sessionId: number) {
  await sessionStore.activateSession(sessionId)
  await pos.loadSessionData()
  pos.currentArtistKey = '__all__'
}

function onPrepDeleted(_id: number) {
  prepMode.value = 'empty'
  selectedPrepSession.value = null
}

function sessionStatus(s: Session): 'draft' | 'ready' | 'active' | 'ended' {
  if (s.status) return s.status
  if (s.active) return 'active'
  if (s.endedAt) return 'ended'
  return 'draft'
}

function statusLabel(s: Session): string {
  return { draft: 'Draft', ready: 'Ready', active: 'Active', ended: 'Ended' }[sessionStatus(s)]
}

function statusIcon(s: Session): string {
  return { draft: '📋', ready: '✈', active: '🟢', ended: '✓' }[sessionStatus(s)]
}

function statusBadgeClass(s: Session): string {
  return {
    draft: 'badge-blue',
    ready: 'badge-yellow',
    active: 'badge-green',
    ended: 'bg-gray-800 text-gray-400',
  }[sessionStatus(s)]
}

// ─── POS helpers ───────────────────────────────────────────────────────────
function fmt(amount: number): string {
  const c = sessionStore.currency
  if (c === 'IDR') return 'Rp' + Math.round(amount).toLocaleString('id-ID')
  return '$' + amount.toFixed(2)
}

function formatCategory(cat: string): string {
  return cat.replace(/_/g, ' ')
}

function artistUnitCount(key: string): number {
  return pos.artistTotals[key]?.units ?? 0
}

async function endSession() {
  if (!confirm('End the current session? This will deduct sold quantities from stock.')) return

  const sessionId = sessionStore.activeSession?.id
  await sessionStore.endSession()

  // Show in-app report
  if (sessionId) reportSessionId.value = sessionId

  // Offer consignment report
  if (pos.sales.some(s => s.quantity > 0)) {
    if (confirm('Session ended! Create a consignment report from this session?\n(You can also do this later from the Consignment page → "From POS Session")')) {
      await navigateTo('/consignment')
    }
  }
}

// ─── Expenses (mid-event) ──────────────────────────────────────────────────
const showExpenses = ref(false)
const localExpenses = ref<SessionExpense[]>([])

watch(showExpenses, (open) => {
  if (open) localExpenses.value = (sessionStore.activeSession?.expenses ?? []).map(e => ({ ...e }))
})

async function saveExpenses() {
  if (!sessionStore.activeSession?.id) return
  await sessionStore.updateExpenses(sessionStore.activeSession.id, localExpenses.value.filter(e => e.label && e.amount > 0))
  showExpenses.value = false
}

// ─── Pack list (mid-event) ─────────────────────────────────────────────────
const showPackList = ref(false)
const packSearch = ref('')
const localBringList = ref(new Set<string>())
const packArtists = ref<Artist[]>([])
const packAllItems = ref<Item[]>([])

const packListCount = computed(() => sessionStore.activeSession?.bringList?.length ?? 0)

const packFilteredByArtist = computed(() => {
  const q = packSearch.value.trim().toLowerCase()
  const result: Record<number, Item[]> = {}
  for (const artist of packArtists.value) {
    let items = packAllItems.value.filter(i => i.artistId === artist.id)
    if (q) items = items.filter(i => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q))
    if (items.length) result[artist.id!] = items
  }
  return result
})

watch(showPackList, async (open) => {
  if (!open) return
  await ready
  packAllItems.value = (await db.items.toArray()).filter(i => i.active)
  packArtists.value = (await db.artists.toArray()).filter(a => !a.isSpecialTab)
  const existing = sessionStore.activeSession?.bringList ?? []
  localBringList.value = new Set(existing)
})

function packToggleItem(code: string) {
  if (localBringList.value.has(code)) localBringList.value.delete(code)
  else localBringList.value.add(code)
}
function packIsArtistAllChecked(artistId: number) {
  const items = packFilteredByArtist.value[artistId] ?? []
  return items.length > 0 && items.every(i => localBringList.value.has(i.code))
}
function packToggleArtist(artistId: number) {
  const items = packFilteredByArtist.value[artistId] ?? []
  if (packIsArtistAllChecked(artistId)) items.forEach(i => localBringList.value.delete(i.code))
  else items.forEach(i => localBringList.value.add(i.code))
}
function packSelectAll() { packAllItems.value.forEach(i => localBringList.value.add(i.code)) }
function packClearAll() { localBringList.value.clear() }
async function savePackList() {
  await sessionStore.updateBringList(localBringList.value.size > 0 ? [...localBringList.value] : [])
  showPackList.value = false
}

// ─── Mount ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  await sessionStore.loadActiveSession()
  await sessionStore.loadAllSessions()
  await pos.loadSessionData()
  // Auto-show all products if a session is already active
  if (sessionStore.hasActiveSession && !pos.currentArtistKey) {
    pos.currentArtistKey = '__all__'
  }
})

// Reload sales when session changes
watch(() => sessionStore.activeSession, async (session) => {
  if (session?.id) await pos.loadSales(session.id)
})
</script>
