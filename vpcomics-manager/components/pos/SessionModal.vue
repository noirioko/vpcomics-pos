<template>
  <UiModal
    v-model="show"
    :title="step === 1
      ? (editSession ? 'Edit Session' : 'New Session Draft')
      : 'Pack List — What are you bringing?'"
    max-width="600px"
  >

    <!-- Step 1: Session details -->
    <div v-if="step === 1" class="space-y-4">
      <div>
        <label class="label">Event Name *</label>
        <input v-model="form.name" class="input" placeholder="e.g. COMIFURO XX 2025" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Date *</label>
          <input v-model="form.date" type="date" class="input" />
        </div>
        <div>
          <label class="label">Location</label>
          <input v-model="form.location" class="input" placeholder="Convention Center" />
        </div>
      </div>
      <div>
        <label class="label">Currency</label>
        <div class="flex gap-2">
          <button
            class="btn flex-1 text-sm"
            :class="form.currency === 'IDR' ? 'btn-primary' : 'btn-secondary'"
            @click="form.currency = 'IDR'"
          >
            IDR (Rp)
          </button>
          <button
            class="btn flex-1 text-sm"
            :class="form.currency === 'SGD' ? 'btn-primary' : 'btn-secondary'"
            @click="form.currency = 'SGD'"
          >
            SGD ($)
          </button>
        </div>
      </div>

      <!-- Convention expenses -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="label mb-0">Convention Expenses</label>
          <span v-if="totalExpenses > 0" class="text-xs text-rose-400 font-mono">
            −{{ form.currency === 'IDR' ? 'Rp' : '$' }}{{ form.currency === 'IDR' ? totalExpenses.toLocaleString('id-ID') : totalExpenses.toFixed(2) }}
          </span>
        </div>

        <!-- Existing expense rows -->
        <div class="space-y-2 mb-2">
          <div v-for="(exp, i) in form.expenses" :key="exp.id" class="flex items-center gap-2">
            <input
              v-model="exp.label"
              class="input-sm flex-1"
              placeholder="Label (e.g. Booth Fee)"
            />
            <input
              v-model.number="exp.amount"
              type="number"
              min="0"
              placeholder="0"
              class="input-sm w-28 font-mono text-right"
            />
            <button class="text-gray-500 hover:text-red-400 transition-colors shrink-0" @click="removeExpense(i)">✕</button>
          </div>
        </div>

        <!-- Quick-add presets -->
        <div class="flex gap-1.5 flex-wrap">
          <button
            v-for="preset in EXPENSE_PRESETS"
            :key="preset"
            class="btn btn-secondary btn-sm text-xs"
            @click="addExpense(preset)"
          >
            + {{ preset }}
          </button>
          <button class="btn btn-secondary btn-sm text-xs" @click="addExpense()">+ Custom</button>
        </div>
      </div>
    </div>

    <!-- Step 2: Pack list -->
    <div v-else class="space-y-3">
      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-400">Check off what you're bringing. Leave all unchecked to show everything.</span>
      </div>
      <div class="flex items-center gap-2 mb-2">
        <input v-model="packSearch" class="input-sm flex-1" placeholder="Search items…" />
        <button class="btn btn-secondary btn-sm" @click="selectAll">All</button>
        <button class="btn btn-secondary btn-sm" @click="clearAll">None</button>
      </div>

      <div class="max-h-96 overflow-y-auto space-y-4 pr-1">
        <div v-for="artist in packArtists" :key="artist.key">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {{ artist.emoji }} {{ artist.name }}
            </span>
            <button
              class="text-xs text-purple-400 hover:text-purple-300 ml-auto"
              @click="toggleArtist(artist.id!)"
            >
              {{ isArtistAllChecked(artist.id!) ? 'Uncheck all' : 'Check all' }}
            </button>
          </div>
          <div class="grid grid-cols-1 gap-1 pl-2">
            <label
              v-for="item in packItemsByArtist[artist.id!]"
              :key="item.code"
              class="flex items-center gap-3 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-gray-800 transition-colors"
            >
              <input
                type="checkbox"
                class="w-4 h-4 rounded accent-purple-500"
                :checked="bringList.has(item.code)"
                @change="toggleItem(item.code)"
              />
              <img
                v-if="item.image"
                :src="`/images/${item.image}`"
                class="w-7 h-7 object-contain rounded bg-gray-800 shrink-0"
                @error="(e) => (e.target as HTMLImageElement).style.display='none'"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm text-gray-200 truncate">{{ item.name }}</p>
                <p class="text-xs font-mono text-gray-500">{{ item.code }}</p>
              </div>
              <span v-if="item.stock !== undefined" class="text-xs font-mono shrink-0"
                :class="item.stock === 0 ? 'text-red-500' : item.stock <= 5 ? 'text-amber-400' : 'text-gray-500'">
                {{ item.stock }} left
              </span>
            </label>
          </div>
        </div>
      </div>

      <p class="text-xs text-gray-600">
        {{ bringList.size === 0 ? 'No items selected — all items will show in POS' : bringList.size + ' item(s) selected' }}
      </p>
    </div>

    <template #footer>
      <template v-if="step === 1">
        <button class="btn btn-secondary" @click="show = false">Cancel</button>
        <button class="btn btn-primary" :disabled="!form.name || !form.date" @click="goToPackList">
          Next: Pack List →
        </button>
      </template>
      <template v-else>
        <button class="btn btn-secondary" @click="step = 1">← Back</button>
        <button class="btn btn-primary" :disabled="saving" @click="submit">
          {{ saving ? 'Saving…' : editSession ? 'Update Draft' : 'Save Draft' }}
        </button>
      </template>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { Artist, Item, Session, SessionExpense } from '~/composables/useDatabase'

const show = defineModel<boolean>({ default: false })
const props = defineProps<{ editSession?: Session | null }>()

const sessionStore = useSessionStore()
const { db, ready } = useDatabase()

const step = ref(1)
const saving = ref(false)
const packSearch = ref('')
const bringList = ref(new Set<string>())
const packArtists = ref<Artist[]>([])
const packItemsByArtist = ref<Record<number, Item[]>>({})

const form = reactive({
  name: '',
  date: new Date().toISOString().split('T')[0],
  location: '',
  currency: 'IDR' as 'IDR' | 'SGD',
  expenses: [] as SessionExpense[],
})

const EXPENSE_PRESETS = ['Booth Fee', 'Flight', 'Hotel', 'Transport', 'Meals', 'Shipping']

function addExpense(label = '') {
  form.expenses.push({ id: crypto.randomUUID(), label, amount: 0 })
}

function removeExpense(i: number) {
  form.expenses.splice(i, 1)
}

const totalExpenses = computed(() =>
  form.expenses.reduce((s, e) => s + (e.amount || 0), 0)
)

// Pre-fill when editing or reset when creating
watch([show, () => props.editSession], ([isOpen, editSess]) => {
  if (!isOpen) {
    step.value = 1
    packSearch.value = ''
    bringList.value = new Set()
    return
  }
  if (editSess) {
    form.name = editSess.name
    form.date = editSess.date
    form.location = editSess.location ?? ''
    form.currency = editSess.currency
    form.expenses = editSess.expenses ? editSess.expenses.map(e => ({ ...e })) : []
    bringList.value = new Set(editSess.bringList ?? [])
  } else {
    form.name = ''
    form.date = new Date().toISOString().split('T')[0]
    form.location = ''
    form.currency = 'IDR'
    form.expenses = []
    bringList.value = new Set()
  }
}, { immediate: true })

watch(packSearch, filterPackItems)

async function goToPackList() {
  if (!form.name || !form.date) return
  step.value = 2
  await loadPackItems()
}

async function loadPackItems() {
  await ready
  const artists = (await db.artists.toArray()).filter(a => !a.isSpecialTab)
  const items = (await db.items.toArray()).filter(i => i.active)

  const byArtist: Record<number, Item[]> = {}
  for (const item of items) {
    if (!byArtist[item.artistId]) byArtist[item.artistId] = []
    byArtist[item.artistId].push(item)
  }

  packArtists.value = artists.filter(a => byArtist[a.id!]?.length)
  packItemsByArtist.value = byArtist
}

function filterPackItems() {
  const q = packSearch.value.trim().toLowerCase()
  if (!q) {
    loadPackItems()
    return
  }
  const filtered: Record<number, Item[]> = {}
  for (const [artistId, items] of Object.entries(packItemsByArtist.value)) {
    const matches = items.filter(i =>
      i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)
    )
    if (matches.length) filtered[Number(artistId)] = matches
  }
  packItemsByArtist.value = filtered
  packArtists.value = packArtists.value.filter(a => filtered[a.id!])
}

function toggleItem(code: string) {
  if (bringList.value.has(code)) bringList.value.delete(code)
  else bringList.value.add(code)
}

function isArtistAllChecked(artistId: number): boolean {
  const items = packItemsByArtist.value[artistId] ?? []
  return items.length > 0 && items.every(i => bringList.value.has(i.code))
}

function toggleArtist(artistId: number) {
  const items = packItemsByArtist.value[artistId] ?? []
  if (isArtistAllChecked(artistId)) items.forEach(i => bringList.value.delete(i.code))
  else items.forEach(i => bringList.value.add(i.code))
}

function selectAll() {
  for (const items of Object.values(packItemsByArtist.value)) {
    items.forEach(i => bringList.value.add(i.code))
  }
}

function clearAll() {
  bringList.value.clear()
}

async function submit() {
  saving.value = true
  try {
    const bl = bringList.value.size > 0 ? [...bringList.value] : []
    const expenses = form.expenses.filter(e => e.label && e.amount > 0)
    if (props.editSession?.id) {
      await sessionStore.updateDraft(props.editSession.id, { ...form, bringList: bl, expenses })
    } else {
      await sessionStore.createDraft({ ...form, bringList: bl.length ? bl : undefined, expenses: expenses.length ? expenses : undefined })
    }
    show.value = false
  } finally {
    saving.value = false
  }
}
</script>
