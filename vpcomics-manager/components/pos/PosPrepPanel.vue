<template>
  <!-- Empty state -->
  <div v-if="mode === 'empty'" class="flex-1 flex items-center justify-center text-gray-600 bg-gray-950">
    <div class="text-center">
      <p class="text-5xl mb-4">🎪</p>
      <p class="font-semibold text-gray-500">Select a session to prepare</p>
      <p class="text-sm mt-1">or create a new draft →</p>
    </div>
  </div>

  <!-- Prep workspace -->
  <div v-else class="flex-1 flex flex-col overflow-hidden bg-gray-950">

    <!-- Header bar -->
    <div class="px-5 py-3 border-b border-gray-800 flex items-center gap-3 shrink-0 bg-gray-900">
      <div class="flex-1 min-w-0">
        <h2 class="text-sm font-semibold text-gray-200 truncate">
          {{ mode === 'new' ? 'New Session Draft' : (form.name || 'Untitled Session') }}
        </h2>
        <p v-if="mode === 'edit' && props.session?.date" class="text-xs text-gray-500 mt-0.5">
          {{ props.session.date }}<template v-if="props.session.location"> · {{ props.session.location }}</template>
        </p>
      </div>
      <span v-if="mode === 'edit'" class="badge text-xs shrink-0" :class="statusBadgeClass">
        {{ statusLabel }}
      </span>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-2xl mx-auto p-5 space-y-6">

        <!-- ── Session Info ── -->
        <section class="space-y-3">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Session Info</h3>

          <div>
            <label class="label">Event Name *</label>
            <input
              v-model="form.name"
              class="input"
              :disabled="isEnded"
              placeholder="e.g. COMIFURO XX 2025"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Date *</label>
              <input v-model="form.date" type="date" class="input" :disabled="isEnded" />
            </div>
            <div>
              <label class="label">Location</label>
              <input v-model="form.location" class="input" :disabled="isEnded" placeholder="e.g. JCC Hall" />
            </div>
          </div>

          <div>
            <label class="label">Currency</label>
            <div class="flex gap-2">
              <button
                class="btn flex-1 text-sm"
                :class="form.currency === 'IDR' ? 'btn-primary' : 'btn-secondary'"
                :disabled="isEnded"
                @click="form.currency = 'IDR'"
              >IDR (Rp)</button>
              <button
                class="btn flex-1 text-sm"
                :class="form.currency === 'SGD' ? 'btn-primary' : 'btn-secondary'"
                :disabled="isEnded"
                @click="form.currency = 'SGD'"
              >SGD ($)</button>
            </div>
          </div>
        </section>

        <!-- ── Convention Expenses ── -->
        <section v-if="!isEnded" class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Convention Expenses</h3>
            <span v-if="totalExpenses > 0" class="text-sm text-rose-400">
              −{{ form.currency === 'IDR'
                ? 'Rp' + totalExpenses.toLocaleString('id-ID')
                : '$' + totalExpenses.toFixed(2) }}
            </span>
          </div>

          <div v-if="form.expenses.length" class="space-y-2">
            <div v-for="(exp, i) in form.expenses" :key="exp.id" class="flex items-center gap-2">
              <input v-model="exp.label" class="input-sm flex-1" placeholder="Label (e.g. Booth Fee)" />
              <input
                v-model.number="exp.amount"
                type="number"
                min="0"
                placeholder="0"
                class="input-sm w-28 text-right"
              />
              <button
                class="text-gray-500 hover:text-red-400 shrink-0 transition-colors"
                @click="form.expenses.splice(i, 1)"
              >✕</button>
            </div>
          </div>

          <div class="flex gap-1.5 flex-wrap">
            <button
              v-for="preset in EXPENSE_PRESETS"
              :key="preset"
              class="btn btn-secondary btn-sm text-xs"
              @click="addExpense(preset)"
            >+ {{ preset }}</button>
            <button class="btn btn-secondary btn-sm text-xs" @click="addExpense()">+ Custom</button>
          </div>
        </section>

        <!-- ── Pack List ── -->
        <section v-if="!isEnded" class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Pack List</h3>
            <div class="flex items-center gap-2">
              <button class="text-xs text-gray-600 hover:text-gray-400 transition-colors" @click="clearPack">Clear all</button>
              <span class="text-xs text-gray-500">
                {{ bringList.size === 0 ? 'All items shown in POS' : bringList.size + ' selected' }}
              </span>
            </div>
          </div>

          <!-- Artist filter pills -->
          <div class="flex gap-1.5 flex-wrap">
            <button
              class="btn btn-sm text-xs px-2 py-0.5"
              :class="packArtistFilter === null ? 'btn-primary' : 'btn-secondary'"
              @click="packArtistFilter = null"
            >All</button>
            <button
              v-for="artist in allArtists"
              :key="artist.id"
              class="btn btn-sm text-xs px-2 py-0.5"
              :class="packArtistFilter === artist.id ? 'btn-primary' : 'btn-secondary'"
              @click="packArtistFilter = artist.id!"
            >{{ artist.emoji }} {{ artist.name }}</button>
          </div>

          <!-- Search -->
          <div class="relative">
            <input v-model="packSearch" class="input-sm w-full pr-7" placeholder="Search items…" />
            <button
              v-if="packSearch"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
              @click="packSearch = ''"
            >✕</button>
          </div>

          <!-- Dual panel: catalog left, bringing right -->
          <div class="flex gap-3 items-start">

            <!-- Left: catalog thumbnail grid -->
            <div class="flex-1 min-w-0">
              <p class="text-[10px] text-gray-600 uppercase tracking-wide mb-1.5">Catalog — click to add</p>
              <div v-if="packLoading" class="text-sm text-gray-600 text-center py-6">Loading…</div>
              <div
                v-else
                class="grid gap-1.5 max-h-80 overflow-y-auto pr-1"
                style="grid-template-columns: repeat(auto-fill, minmax(72px, 1fr))"
              >
                <button
                  v-for="item in packCatalogItems"
                  :key="item.code"
                  class="relative rounded-xl overflow-hidden border transition-all text-left"
                  :class="bringList.has(item.code)
                    ? 'border-emerald-500/60 bg-emerald-950/30'
                    : 'border-gray-800 bg-gray-800/40 hover:border-gray-600'"
                  :title="item.name"
                  @click="togglePackItem(item.code)"
                >
                  <!-- Thumbnail -->
                  <div class="h-16 flex items-center justify-center bg-gray-800/60 overflow-hidden">
                    <img
                      v-if="item.image"
                      :src="itemImageSrc(item.image)"
                      class="w-full h-full object-contain p-1"
                      @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
                    />
                    <span v-else class="text-lg text-gray-700">📦</span>
                  </div>
                  <!-- Name -->
                  <p class="text-[10px] text-gray-400 px-1 py-1 leading-tight line-clamp-2">{{ item.name }}</p>
                  <!-- Selected checkmark -->
                  <div
                    v-if="bringList.has(item.code)"
                    class="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
                  >
                    <span class="text-[9px] text-white font-bold">✓</span>
                  </div>
                  <!-- Stock badge -->
                  <div
                    v-if="item.stock !== undefined"
                    class="absolute top-1 left-1 text-[9px] px-1 rounded font-medium"
                    :class="item.stock === 0 ? 'bg-red-900/80 text-red-300' : 'bg-gray-900/80 text-gray-400'"
                  >{{ item.stock }}</div>
                </button>

                <div v-if="packCatalogItems.length === 0" class="col-span-full text-center py-4 text-gray-600 text-xs">
                  No items found
                </div>
              </div>
            </div>

            <!-- Right: bringing list with qty inputs -->
            <div class="w-48 shrink-0">
              <p class="text-[10px] text-gray-600 uppercase tracking-wide mb-1.5">Bringing ({{ bringList.size }})</p>

              <div v-if="bringList.size === 0" class="border border-dashed border-gray-800 rounded-xl p-4 text-center text-xs text-gray-700">
                Select items from the catalog
              </div>

              <div v-else class="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                <div
                  v-for="item in bringingItems"
                  :key="item.code"
                  class="flex items-center gap-1.5 bg-gray-800/50 rounded-lg p-1.5"
                >
                  <!-- Mini thumbnail -->
                  <div class="w-8 h-8 rounded bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      v-if="item.image"
                      :src="itemImageSrc(item.image)"
                      class="w-full h-full object-contain p-0.5"
                      @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
                    />
                    <span v-else class="text-xs">📦</span>
                  </div>
                  <!-- Name -->
                  <p class="text-xs text-gray-300 flex-1 min-w-0 truncate leading-tight">{{ item.name }}</p>
                  <!-- Qty -->
                  <input
                    type="number"
                    min="0"
                    :value="bringQty[item.code] ?? 0"
                    class="w-10 input-sm text-center text-xs px-1 shrink-0"
                    placeholder="0"
                    @change="setBringQty(item.code, $event)"
                    @click.stop
                  />
                  <!-- Remove -->
                  <button
                    class="text-gray-600 hover:text-red-400 transition-colors shrink-0 text-xs"
                    @click="togglePackItem(item.code)"
                  >✕</button>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- Ended: summary read-only -->
        <section v-if="isEnded && props.session?.expenses?.length" class="space-y-2">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Convention Expenses</h3>
          <div class="card p-3 space-y-1">
            <div v-for="exp in props.session.expenses" :key="exp.id" class="flex justify-between text-sm">
              <span class="text-gray-400">{{ exp.label }}</span>
              <span class="text-rose-400">
                −{{ form.currency === 'IDR'
                  ? 'Rp' + exp.amount.toLocaleString('id-ID')
                  : '$' + exp.amount.toFixed(2) }}
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>

    <!-- Footer Actions -->
    <div class="shrink-0 border-t border-gray-800 p-4 bg-gray-900 flex items-center gap-2 flex-wrap">

      <!-- New draft -->
      <template v-if="mode === 'new'">
        <button class="btn btn-secondary" @click="$emit('cancelled')">Cancel</button>
        <div class="flex-1"></div>
        <button
          class="btn btn-primary"
          :disabled="!form.name || !form.date || saving"
          @click="doCreate"
        >{{ saving ? 'Saving…' : 'Save Draft' }}</button>
      </template>

      <!-- Draft -->
      <template v-else-if="status === 'draft'">
        <button class="btn btn-danger btn-sm" @click="doDelete">Delete</button>
        <div class="flex-1"></div>
        <button class="btn btn-secondary" :disabled="saving" @click="doSave">
          {{ saving ? '…' : 'Save' }}
        </button>
        <button class="btn btn-primary" :disabled="saving" @click="doMarkReady">
          Mark Ready →
        </button>
      </template>

      <!-- Ready -->
      <template v-else-if="status === 'ready'">
        <button class="btn btn-danger btn-sm" @click="doDelete">Delete</button>
        <button class="btn btn-secondary btn-sm" @click="doSetDraft">← Draft</button>
        <div class="flex-1"></div>
        <button class="btn btn-secondary" :disabled="saving" @click="doSave">Save</button>
        <button class="btn btn-success" @click="doActivate">▶ Activate</button>
      </template>

      <!-- Active (shouldn't normally show, but handle gracefully) -->
      <template v-else-if="status === 'active'">
        <button class="btn btn-danger btn-sm" @click="doDelete">Delete</button>
        <div class="flex-1"></div>
        <button class="btn btn-success" @click="doActivate">▶ Resume POS</button>
      </template>

      <!-- Ended -->
      <template v-else-if="status === 'ended'">
        <button class="btn btn-danger btn-sm" @click="doDelete">Delete</button>
        <div class="flex-1"></div>
        <button class="btn btn-secondary" @click="$emit('view-report', props.session!.id!)">
          📊 View Report
        </button>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { Artist, Item, Session, SessionExpense } from '~/composables/useDatabase'

const props = defineProps<{
  mode: 'empty' | 'new' | 'edit'
  session?: Session | null
}>()

const emit = defineEmits<{
  created: [id: number]
  updated: []
  activated: [id: number]
  deleted: [id: number]
  cancelled: []
  'view-report': [id: number]
}>()

const sessionStore = useSessionStore()
const { db, ready } = useDatabase()
const { itemImageSrc } = useItemImage()

// ─── Form ──────────────────────────────────────────────────────────────────
const saving = ref(false)
const EXPENSE_PRESETS = ['Booth Fee', 'Flight', 'Hotel', 'Transport', 'Meals', 'Shipping']

const form = reactive({
  name: '',
  date: new Date().toISOString().split('T')[0],
  location: '',
  currency: 'IDR' as 'IDR' | 'SGD',
  expenses: [] as SessionExpense[],
})

function addExpense(label = '') {
  form.expenses.push({ id: crypto.randomUUID(), label, amount: 0 })
}

const totalExpenses = computed(() => form.expenses.reduce((s, e) => s + (e.amount || 0), 0))

// ─── Pack list ─────────────────────────────────────────────────────────────
const bringList = ref(new Set<string>())
const bringQty  = ref<Record<string, number>>({})
const packSearch = ref('')
const packArtistFilter = ref<number | null>(null)
const packLoading = ref(false)
const allArtists = ref<Artist[]>([])
const allItems = ref<Item[]>([])

function setBringQty(code: string, event: Event) {
  const val = Math.max(0, Number((event.target as HTMLInputElement).value) || 0)
  bringQty.value = { ...bringQty.value, [code]: val }
}

// Catalog items shown in the left grid (filtered by artist + search)
const packCatalogItems = computed(() => {
  const q = packSearch.value.trim().toLowerCase()
  let list = allItems.value
  if (packArtistFilter.value !== null) list = list.filter(i => i.artistId === packArtistFilter.value)
  if (q) list = list.filter(i => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q))
  return list
})

// Items currently in the bring list (right panel)
const bringingItems = computed(() =>
  allItems.value.filter(i => bringList.value.has(i.code))
)

// Keep these for the existing toggleArtist helpers
const filteredItemsByArtist = computed(() => {
  const result: Record<number, Item[]> = {}
  for (const artist of allArtists.value) {
    const items = allItems.value.filter(i => i.artistId === artist.id)
    if (items.length) result[artist.id!] = items
  }
  return result
})

const filteredArtists = computed(() =>
  allArtists.value.filter(a => filteredItemsByArtist.value[a.id!]?.length)
)

function isArtistAllChecked(artistId: number): boolean {
  const items = filteredItemsByArtist.value[artistId] ?? []
  return items.length > 0 && items.every(i => bringList.value.has(i.code))
}

function toggleArtist(artistId: number) {
  const items = filteredItemsByArtist.value[artistId] ?? []
  const next = new Set(bringList.value)
  if (isArtistAllChecked(artistId)) items.forEach(i => next.delete(i.code))
  else items.forEach(i => next.add(i.code))
  bringList.value = next
}

function togglePackItem(code: string) {
  const next = new Set(bringList.value)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  bringList.value = next
}

function selectAllPack() {
  bringList.value = new Set(allItems.value.map(i => i.code))
}

function clearPack() {
  bringList.value = new Set()
}

async function loadPackItems() {
  if (allItems.value.length > 0) return
  packLoading.value = true
  try {
    await ready
    allArtists.value = (await db.artists.toArray()).filter(a => !a.isSpecialTab)
    allItems.value = (await db.items.toArray()).filter(i => i.active !== false)
  } finally {
    packLoading.value = false
  }
}

// ─── Status ────────────────────────────────────────────────────────────────
const status = computed(() => {
  const s = props.session
  if (!s) return 'draft'
  if (s.status) return s.status
  if (s.active) return 'active'
  if (s.endedAt) return 'ended'
  return 'draft'
})

const isEnded = computed(() => status.value === 'ended')

const statusLabel = computed(() =>
  ({ draft: 'Draft', ready: 'Ready', active: 'Active', ended: 'Ended' }[status.value] ?? status.value)
)

const statusBadgeClass = computed(() =>
  ({
    draft: 'badge-blue',
    ready: 'badge-yellow',
    active: 'badge-green',
    ended: 'bg-gray-800 text-gray-400',
  }[status.value] ?? '')
)

// ─── Sync form from props ──────────────────────────────────────────────────
watch(
  [() => props.mode, () => props.session],
  async ([mode, session]) => {
    if (mode === 'empty') return

    if (session) {
      form.name     = session.name
      form.date     = session.date
      form.location = session.location ?? ''
      form.currency = session.currency
      form.expenses = (session.expenses ?? []).map(e => ({ ...e }))
      bringList.value = new Set(session.bringList ?? [])
      bringQty.value  = { ...(session.bringQuantities ?? {}) }
    } else {
      // New mode — blank form
      form.name     = ''
      form.date     = new Date().toISOString().split('T')[0]
      form.location = ''
      form.currency = 'IDR'
      form.expenses = []
      bringList.value = new Set()
      bringQty.value  = {}
    }

    await loadPackItems()
  },
  { immediate: true }
)

// ─── Actions ───────────────────────────────────────────────────────────────
function buildBringQuantities(): Record<string, number> {
  // Only keep quantities for checked items, strip zeroes
  const result: Record<string, number> = {}
  for (const code of bringList.value) {
    const qty = bringQty.value[code] ?? 0
    if (qty > 0) result[code] = qty
  }
  return result
}

async function doCreate() {
  saving.value = true
  try {
    const bl = bringList.value.size > 0 ? [...bringList.value] : undefined
    const expenses = form.expenses.filter(e => e.label && e.amount > 0)
    const bringQuantities = buildBringQuantities()
    const id = await sessionStore.createDraft({
      name:           form.name,
      date:           form.date,
      location:       form.location,
      currency:       form.currency,
      bringList:      bl,
      bringQuantities: Object.keys(bringQuantities).length ? bringQuantities : undefined,
      expenses:       expenses.length ? expenses : undefined,
    })
    emit('created', id as number)
  } finally {
    saving.value = false
  }
}

async function doSave() {
  if (!props.session?.id) return
  saving.value = true
  try {
    const bl = bringList.value.size > 0 ? [...bringList.value] : []
    const expenses = form.expenses.filter(e => e.label && e.amount > 0)
    const bringQuantities = buildBringQuantities()
    await sessionStore.updateDraft(props.session.id, {
      name:           form.name,
      date:           form.date,
      location:       form.location,
      currency:       form.currency,
      bringList:      bl,
      bringQuantities,
      expenses,
    })
    emit('updated')
  } finally {
    saving.value = false
  }
}

async function doMarkReady() {
  await doSave()
  if (props.session?.id) {
    await sessionStore.setReady(props.session.id)
    emit('updated')
  }
}

async function doSetDraft() {
  if (props.session?.id) {
    await sessionStore.setDraft(props.session.id)
    emit('updated')
  }
}

function doActivate() {
  if (props.session?.id) emit('activated', props.session.id)
}

async function doDelete() {
  if (!props.session?.id) {
    emit('cancelled')
    return
  }
  if (!confirm(`Delete "${props.session.name}"? This cannot be undone.`)) return
  await sessionStore.deleteSession(props.session.id)
  emit('deleted', props.session.id)
}
</script>
