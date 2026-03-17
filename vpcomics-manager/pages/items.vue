<template>
  <div class="flex h-[calc(100vh-52px)]">

    <!-- Artist sidebar -->
    <div class="w-44 shrink-0 bg-gray-900 border-r border-gray-800 overflow-y-auto flex flex-col">
      <div class="p-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Artists</div>
      <button
        class="flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors w-full"
        :class="selectedArtistKey === '__all__'
          ? 'bg-purple-900/50 text-purple-300 border-r-2 border-purple-500'
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'"
        @click="selectArtist('__all__')"
      >
        <span>🎪</span>
        <span class="flex-1 truncate font-medium text-xs">All Artists</span>
        <span class="text-xs font-mono text-gray-600">{{ allItems.length }}</span>
      </button>
      <button
        v-for="artist in artists"
        :key="artist.key"
        class="flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors w-full"
        :class="selectedArtistKey === artist.key
          ? 'bg-purple-900/50 text-purple-300 border-r-2 border-purple-500'
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'"
        @click="selectArtist(artist.key)"
      >
        <span>{{ artist.emoji }}</span>
        <span class="flex-1 truncate font-medium text-xs">{{ artist.name }}</span>
        <span class="text-xs font-mono text-gray-600">{{ itemCountByArtist[artist.id!] ?? 0 }}</span>
      </button>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <div v-if="!selectedArtistKey" class="flex items-center justify-center h-full text-gray-500">
        Select an artist to manage their items
      </div>

      <template v-else>
        <!-- Header bar -->
        <div class="px-5 py-3 border-b border-gray-800 flex items-center gap-3 shrink-0 bg-gray-950">
          <div>
            <h1 class="text-lg font-bold text-gray-100">
              {{ selectedArtistKey === '__all__' ? '🎪 All Artists' : `${selectedArtist?.emoji} ${selectedArtist?.name}` }}
            </h1>
            <p class="text-xs text-gray-500">
              {{ filteredItems.length }} items{{ selectedArtistKey === '__all__' ? ` across ${artists.length} artists` : ` · ${selectedArtist?.description}` }}
            </p>
          </div>
          <div class="ml-auto flex items-center gap-2">
            <input v-model="search" class="input-sm w-48" placeholder="Search…" />
            <button v-if="selectedArtistKey !== '__all__'" class="btn btn-primary btn-sm" @click="openAdd">+ Add Item</button>
          </div>
        </div>

        <!-- Category tabs -->
        <div class="px-5 pt-3 flex gap-2 flex-wrap shrink-0 border-b border-gray-800 pb-0">
          <button
            class="px-3 py-1.5 text-xs rounded-t-lg font-medium transition-colors border-b-2"
            :class="selectedCategory === ''
              ? 'border-purple-500 text-purple-300 bg-purple-900/20'
              : 'border-transparent text-gray-500 hover:text-gray-300'"
            @click="selectedCategory = ''"
          >
            All ({{ filteredItems.length }})
          </button>
          <button
            v-for="cat in categories"
            :key="cat"
            class="px-3 py-1.5 text-xs rounded-t-lg font-medium transition-colors border-b-2"
            :class="selectedCategory === cat
              ? 'border-purple-500 text-purple-300 bg-purple-900/20'
              : 'border-transparent text-gray-500 hover:text-gray-300'"
            @click="selectedCategory = cat"
          >
            {{ formatCat(cat) }} ({{ itemsByCategory[cat]?.length ?? 0 }})
          </button>
        </div>

        <!-- Item cards -->
        <div class="flex-1 overflow-y-auto p-5">
          <!-- Empty state -->
          <div v-if="displayedItems.length === 0" class="flex items-center justify-center h-48 text-gray-500 text-sm">
            No items{{ search ? ' matching "' + search + '"' : '' }}
          </div>

          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div
              v-for="item in displayedItems"
              :key="item.id"
              class="bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden transition-all hover:border-gray-700 group"
              :class="{ 'opacity-40': !item.active }"
            >
              <!-- Image -->
              <div class="bg-gray-800/60 h-40 flex items-center justify-center overflow-hidden relative">
                <img
                  v-if="item.image"
                  :src="itemImageSrc(item.image)"
                  :alt="item.name"
                  class="w-full h-full object-contain p-2"
                  @error="(e: Event) => (e.target as HTMLImageElement).style.display='none'"
                />
                <span v-else class="text-3xl text-gray-700">📦</span>
                <!-- Category badge -->
                <span class="absolute top-2 left-2 badge badge-blue text-xs">{{ formatCat(item.category) }}</span>
                <!-- Inactive badge -->
                <span v-if="!item.active" class="absolute top-2 right-2 badge badge-yellow text-xs">hidden</span>
              </div>

              <!-- Info -->
              <div class="p-3 flex flex-col gap-2 flex-1">
                <div>
                  <p class="font-semibold text-gray-100 text-sm leading-tight line-clamp-2">{{ item.name }}</p>
                  <p class="text-xs font-mono text-gray-500 mt-0.5 truncate">{{ item.code }}</p>
                  <p v-if="selectedArtistKey === '__all__'" class="text-xs text-purple-400 mt-0.5">{{ artistById[item.artistId]?.emoji }} {{ artistById[item.artistId]?.name }}</p>
                  <p v-if="(item as any).notes" class="text-xs text-amber-400 mt-0.5">{{ (item as any).notes }}</p>
                </div>

                <!-- Prices -->
                <div class="bg-gray-800/50 rounded-lg p-2 space-y-1">
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">Price</span>
                    <div class="text-right">
                      <p class="text-xs font-mono text-emerald-400">Rp {{ item.priceIDR.toLocaleString('id-ID') }}</p>
                      <p class="text-xs font-mono text-emerald-300">${{ item.priceSGD }}</p>
                    </div>
                  </div>
                  <div class="flex justify-between items-center border-t border-gray-700/50 pt-1">
                    <span class="text-xs text-gray-500">Cost</span>
                    <div class="text-right">
                      <p class="text-xs font-mono text-rose-400">Rp {{ item.costIDR.toLocaleString('id-ID') }}</p>
                      <p class="text-xs font-mono text-rose-300">${{ item.costSGD }}</p>
                    </div>
                  </div>
                </div>

                <!-- Stock + controls -->
                <div class="flex items-center justify-between mt-auto pt-1">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs text-gray-500">Stock</span>
                    <UiStepper
                      :model-value="item.stock ?? 0"
                      color-code
                      min-width="1.75rem"
                      @update:model-value="setStock(item, $event)"
                    />
                  </div>
                  <!-- Active toggle -->
                  <button
                    class="w-8 h-4 rounded-full transition-colors relative shrink-0"
                    :class="item.active ? 'bg-emerald-600' : 'bg-gray-700'"
                    :title="item.active ? 'Shown in POS' : 'Hidden from POS'"
                    @click="toggleActive(item)"
                  >
                    <span
                      class="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all"
                      :class="item.active ? 'right-0.5' : 'left-0.5'"
                    ></span>
                  </button>
                </div>

                <!-- Edit / Delete (always visible on card) -->
                <div class="flex gap-1.5 pt-1 border-t border-gray-800">
                  <button class="btn btn-secondary btn-sm flex-1 text-xs" @click="openEdit(item)">Edit</button>
                  <button class="btn btn-danger btn-sm text-xs" @click="deleteItem(item)">✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Add / Edit modal -->
    <UiModal v-model="showForm" :title="editingItem ? 'Edit Item' : 'Add Item'" max-width="640px">
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="label">Product Name *</label>
          <input v-model="form.name" class="input" placeholder="e.g. ORV Postcard set 01 LIMITED EDITION" />
        </div>
        <div>
          <label class="label">Item Code *</label>
          <input v-model="form.code" class="input font-mono text-sm" placeholder="e.g. P21-ORV-PCD-SET-01-LE" :disabled="!!editingItem" />
          <p v-if="editingItem" class="text-xs text-gray-600 mt-1">Code cannot be changed after creation</p>
        </div>
        <div>
          <label class="label">Category</label>
          <input v-model="form.category" class="input" :placeholder="existingCategories[0] ?? 'e.g. postcards'" list="cat-list" />
          <datalist id="cat-list">
            <option v-for="c in existingCategories" :key="c" :value="c" />
          </datalist>
        </div>
        <div>
          <label class="label">Price IDR</label>
          <input v-model.number="form.priceIDR" type="number" min="0" class="input font-mono" placeholder="150000" />
        </div>
        <div>
          <label class="label">Price SGD</label>
          <input v-model.number="form.priceSGD" type="number" min="0" step="0.5" class="input font-mono" placeholder="10" />
        </div>
        <div>
          <label class="label">Cost IDR</label>
          <input v-model.number="form.costIDR" type="number" min="0" class="input font-mono" placeholder="30000" />
        </div>
        <div>
          <label class="label">Cost SGD</label>
          <input v-model.number="form.costSGD" type="number" min="0" step="0.1" class="input font-mono" placeholder="2" />
        </div>
        <div>
          <label class="label">Stock <span class="text-gray-600">(master count)</span></label>
          <div class="flex items-center gap-2">
            <UiStepper :model-value="form.stock" color-code min-width="3rem" @update:model-value="form.stock = $event" />
            <input v-model.number="form.stock" type="number" min="0" class="input font-mono w-28 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0" />
          </div>
          <p class="text-xs text-gray-600 mt-1">Auto-deducted when a POS session ends</p>
        </div>
        <div></div>
        <div class="col-span-2">
          <label class="label">Image</label>
          <div class="flex gap-2">
            <input
              v-if="!form.image?.startsWith('data:')"
              v-model="form.image"
              class="input font-mono text-sm flex-1"
              placeholder="P21-ORV-PCD-SET-01.png"
              list="img-list"
            />
            <span v-else class="input text-xs text-gray-400 flex-1 truncate flex items-center">Uploaded image</span>
            <datalist id="img-list">
              <option v-for="img in imageFiles" :key="img" :value="img" />
            </datalist>
            <!-- Upload button -->
            <label class="btn btn-secondary btn-sm shrink-0 cursor-pointer">
              📎 Upload
              <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
            </label>
            <!-- Preview -->
            <div v-if="form.image" class="w-10 h-10 rounded bg-gray-800 overflow-hidden shrink-0">
              <img
                :src="itemImageSrc(form.image)"
                class="w-full h-full object-cover"
                @error="(e: Event) => (e.target as HTMLImageElement).style.display='none'"
              />
            </div>
            <!-- Clear -->
            <button v-if="form.image" class="btn btn-danger btn-sm shrink-0" @click="form.image = ''">✕</button>
          </div>
          <p class="text-xs text-gray-600 mt-1">Upload an image file, or type a filename from the /images/ folder.</p>
        </div>
        <div class="col-span-2">
          <label class="label">Notes <span class="text-gray-600">(optional, e.g. "$8 for 2")</span></label>
          <input v-model="form.notes" class="input" placeholder="Optional sale notes" />
        </div>
        <div class="col-span-2 flex items-center gap-3">
          <label class="label mb-0">Active</label>
          <button
            class="w-10 h-5 rounded-full transition-colors relative shrink-0"
            :class="form.active ? 'bg-emerald-600' : 'bg-gray-700'"
            @click="form.active = !form.active"
          >
            <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
              :class="form.active ? 'right-0.5' : 'left-0.5'"></span>
          </button>
          <span class="text-xs text-gray-500">{{ form.active ? 'Shown in POS' : 'Hidden from POS' }}</span>
        </div>
        <p v-if="formError" class="col-span-2 text-sm text-red-400 bg-red-900/30 rounded-lg px-3 py-2">
          ⚠ {{ formError }}
        </p>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showForm = false">Cancel</button>
        <button class="btn btn-primary" :disabled="!form.name || !form.code || saving" @click="saveItem">
          {{ saving ? 'Saving…' : (editingItem ? 'Save Changes' : 'Add Item') }}
        </button>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { Artist, Item } from '~/composables/useDatabase'

const { db } = useDatabase()
const { itemImageSrc } = useItemImage()

// ─── State ───────────────────────────────────────────────────────────────────
const artists = ref<Artist[]>([])
const allItems = ref<Item[]>([])
const selectedArtistKey = ref('')
const search = ref('')
const selectedCategory = ref('')
const showForm = ref(false)
const editingItem = ref<Item | null>(null)
const saving = ref(false)
const formError = ref('')

// Image files list for autocomplete (fetched from server)
const imageFiles = ref<string[]>([])

const blankForm = () => ({
  name: '',
  code: '',
  category: '',
  priceIDR: 0,
  priceSGD: 0,
  costIDR: 0,
  costSGD: 0,
  stock: 0,
  image: '',
  notes: '',
  active: true,
})
const form = reactive(blankForm())

// ─── Load ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  artists.value = await db.artists.orderBy('sortOrder').toArray()
  allItems.value = await db.items.toArray()

  // Try to load image list from public folder manifest (just filenames from known seed data)
  const knownImages = new Set(allItems.value.map(i => i.image).filter(Boolean) as string[])
  imageFiles.value = [...knownImages].sort()

  // Auto-select first non-admin artist
  const first = artists.value.find(a => !a.isSpecialTab)
  if (first) selectArtist(first.key)
})

// ─── Computed ─────────────────────────────────────────────────────────────────
const selectedArtist = computed(() => {
  if (selectedArtistKey.value === '__all__') return null
  return artists.value.find(a => a.key === selectedArtistKey.value) ?? null
})

const artistById = computed(() => {
  const m: Record<number, Artist> = {}
  for (const a of artists.value) if (a.id) m[a.id] = a
  return m
})

const artistItems = computed(() => {
  if (selectedArtistKey.value === '__all__') return allItems.value
  if (!selectedArtist.value) return []
  return allItems.value.filter(i => i.artistId === selectedArtist.value!.id)
})

const categories = computed(() => [...new Set(artistItems.value.map(i => i.category))].sort())

const existingCategories = computed(() => categories.value)

const filteredItems = computed(() => {
  let list = artistItems.value
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(i => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q))
  }
  return list
})

const itemsByCategory = computed(() => {
  const groups: Record<string, Item[]> = {}
  for (const item of filteredItems.value) {
    if (!groups[item.category]) groups[item.category] = []
    groups[item.category].push(item)
  }
  return groups
})

const displayedItems = computed(() => {
  if (!selectedCategory.value) return filteredItems.value
  return itemsByCategory.value[selectedCategory.value] ?? []
})

const itemCountByArtist = computed(() => {
  const counts: Record<number, number> = {}
  for (const item of allItems.value) {
    counts[item.artistId] = (counts[item.artistId] ?? 0) + 1
  }
  return counts
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { form.image = ev.target?.result as string }
  reader.readAsDataURL(file)
}

function formatCat(cat: string) {
  return cat.replace(/_/g, ' ')
}

function selectArtist(key: string) {
  selectedArtistKey.value = key
  selectedCategory.value = ''
  search.value = ''
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────
function openAdd() {
  editingItem.value = null
  formError.value = ''
  Object.assign(form, blankForm())
  // Pre-fill category with first existing category
  if (categories.value.length > 0) form.category = categories.value[0]
  showForm.value = true
}

function openEdit(item: Item) {
  editingItem.value = item
  formError.value = ''
  Object.assign(form, {
    name: item.name,
    code: item.code,
    category: item.category,
    priceIDR: item.priceIDR,
    priceSGD: item.priceSGD,
    costIDR: item.costIDR,
    costSGD: item.costSGD,
    stock: item.stock ?? 0,
    image: item.image ?? '',
    notes: (item as any).notes ?? '',
    active: item.active,
  })
  showForm.value = true
}

async function saveItem() {
  formError.value = ''
  if (!form.name.trim() || !form.code.trim()) {
    formError.value = 'Name and Code are required.'
    return
  }
  saving.value = true
  try {
    const payload: Omit<Item, 'id'> = {
      code: form.code.trim(),
      artistId: selectedArtist.value!.id!,
      category: form.category.trim() || 'general',
      name: form.name.trim(),
      priceIDR: form.priceIDR,
      priceSGD: form.priceSGD,
      costIDR: form.costIDR,
      costSGD: form.costSGD,
      stock: form.stock,
      active: form.active,
    }
    if (form.image.trim()) payload.image = form.image.trim()
    if (form.notes.trim()) (payload as any).notes = form.notes.trim()

    if (editingItem.value?.id) {
      await db.items.update(editingItem.value.id, payload)
      const idx = allItems.value.findIndex(i => i.id === editingItem.value!.id)
      if (idx !== -1) allItems.value[idx] = { ...allItems.value[idx], ...payload }
    } else {
      // Check for duplicate code
      const exists = allItems.value.find(i => i.code === payload.code)
      if (exists) {
        formError.value = `Code "${payload.code}" already exists.`
        saving.value = false
        return
      }
      const id = await db.items.add(payload as Item)
      const newItem = await db.items.get(id as number)
      if (newItem) allItems.value.push(newItem)
      // Add to autocomplete list
      if (newItem?.image && !imageFiles.value.includes(newItem.image)) {
        imageFiles.value.push(newItem.image)
      }
    }

    showForm.value = false
  } catch (err: any) {
    console.error('[items] saveItem error:', err)
    formError.value = err?.message ?? 'Save failed. See console.'
  } finally {
    saving.value = false
  }
}

async function setStock(item: Item, value: number) {
  const stock = Math.max(0, value)
  await db.items.update(item.id!, { stock })
  const idx = allItems.value.findIndex(i => i.id === item.id)
  if (idx !== -1) allItems.value[idx] = { ...allItems.value[idx], stock }
}

async function toggleActive(item: Item) {
  const newVal = !item.active
  await db.items.update(item.id!, { active: newVal })
  const idx = allItems.value.findIndex(i => i.id === item.id)
  if (idx !== -1) allItems.value[idx] = { ...allItems.value[idx], active: newVal }
}

async function deleteItem(item: Item) {
  if (!confirm(`Delete "${item.name}"?\n\nThis cannot be undone.`)) return
  await db.items.delete(item.id!)
  allItems.value = allItems.value.filter(i => i.id !== item.id)
}
</script>
