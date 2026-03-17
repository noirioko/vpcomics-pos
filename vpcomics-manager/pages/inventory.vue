<template>
  <div class="flex h-[calc(100vh-52px)]">

    <!-- ── Left: Locations sidebar ────────────────────────────────────────── -->
    <div class="w-64 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">

      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div>
          <h2 class="text-sm font-semibold text-gray-300">Locations</h2>
          <p class="text-xs text-gray-600 mt-0.5">{{ inv.totalStock }} items stored</p>
        </div>
        <button class="btn btn-primary btn-sm text-xs" @click="showAddLocation = true">+ New</button>
      </div>

      <!-- Scroll list -->
      <div class="flex-1 overflow-y-auto">

        <!-- All -->
        <button
          class="w-full text-left px-4 py-3 border-b border-gray-800/40 transition-colors"
          :class="selectedLocationId === null
            ? 'bg-purple-900/30 border-l-2 border-l-purple-500'
            : 'hover:bg-gray-800/50'"
          @click="selectedLocationId = null"
        >
          <p class="text-sm font-semibold text-gray-200">All</p>
          <p class="text-xs text-gray-500 mt-0.5">Total across all locations</p>
        </button>

        <!-- Individual locations — each is a drop zone -->
        <button
          v-for="loc in inv.locations.filter(l => l.active)"
          :key="loc.id"
          class="w-full text-left px-4 py-3 border-b border-gray-800/40 transition-all"
          :class="[
            selectedLocationId === loc.id && dragOverLocation !== loc.id
              ? 'bg-purple-900/30 border-l-2 border-l-purple-500'
              : '',
            dragOverLocation === loc.id
              ? 'bg-emerald-900/40 border-l-2 border-l-emerald-400 scale-[1.02]'
              : selectedLocationId !== loc.id ? 'hover:bg-gray-800/50' : ''
          ]"
          @click="selectedLocationId = loc.id!"
          @dragover.prevent="dragOverLocation = loc.id!"
          @dragleave="dragOverLocation = null"
          @drop.prevent="onDropToLocation(loc)"
        >
          <div class="flex items-center gap-2">
            <div class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: loc.color }"></div>
            <p class="text-sm font-semibold text-gray-200 flex-1 truncate">{{ loc.name }}</p>
            <span class="text-xs text-gray-500 shrink-0 tabular-nums">
              {{ locationTotal(loc.id!) }}
            </span>
          </div>
          <p class="text-xs text-gray-600 mt-0.5 pl-4">{{ loc.type }}</p>
        </button>

      </div>

      <!-- Drag hint -->
      <div
        class="shrink-0 px-4 py-2.5 border-t border-gray-800 transition-colors text-center text-xs"
        :class="draggingItem ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' : 'text-gray-700'"
      >
        {{ draggingItem ? '↑ Drop on a location to add' : 'Drag items onto locations to stock them' }}
      </div>
    </div>

    <!-- ── Right: Item explorer ───────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden bg-gray-950">

      <!-- Toolbar -->
      <div class="px-4 py-3 border-b border-gray-800 bg-gray-900 flex items-center gap-3 shrink-0 flex-wrap">
        <div class="relative min-w-0 w-56">
          <input
            v-model="inv.searchQuery"
            class="input-sm w-full pr-7"
            placeholder="Search items…"
          />
          <button
            v-if="inv.searchQuery"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
            @click="inv.searchQuery = ''"
          >✕</button>
        </div>

        <!-- Selected location info + actions -->
        <template v-if="selectedLocation">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: selectedLocation.color }"></div>
            <span class="text-sm font-semibold text-gray-300">{{ selectedLocation.name }}</span>
            <span class="text-xs text-gray-500">{{ selectedLocation.type }}</span>
          </div>
          <div class="flex items-center gap-2 ml-auto">
            <button class="btn btn-secondary btn-sm text-xs" @click="startEditLocation(selectedLocation)">Edit</button>
            <button class="btn btn-danger btn-sm text-xs" @click="confirmDeleteLocation(selectedLocation)">Delete</button>
          </div>
        </template>
        <template v-else>
          <span class="text-sm text-gray-500">
            {{ inv.filteredItems.length }} items · drag cards to a location
          </span>
        </template>
      </div>

      <!-- Item grid -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          <div
            v-for="item in inv.filteredItems"
            :key="item.code"
            class="card p-0 overflow-hidden cursor-grab active:cursor-grabbing transition-all select-none"
            :class="draggingItem?.code === item.code
              ? 'opacity-40 scale-95'
              : 'hover:border-gray-600 hover:shadow-lg'"
            draggable="true"
            @dragstart="onDragStart(item)"
            @dragend="onDragEnd"
          >
            <!-- Thumbnail -->
            <div class="bg-gray-800/60 h-28 flex items-center justify-center overflow-hidden relative group">
              <img
                v-if="item.image"
                :src="itemImageSrc(item.image)"
                :alt="item.name"
                class="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-150"
                @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
              />
              <span v-else class="text-2xl text-gray-700">📦</span>

              <!-- Qty badge — shows qty in selected location, or total if All -->
              <div
                class="absolute bottom-1.5 right-1.5 text-xs px-1.5 py-0.5 rounded-md font-semibold tabular-nums"
                :class="displayQty(item) > 0
                  ? 'bg-purple-800/90 text-purple-100'
                  : 'bg-gray-900/80 text-gray-600'"
              >
                {{ displayQty(item) }}
              </div>

              <!-- Drag hint -->
              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <span class="text-xs text-gray-300 bg-gray-900/70 px-2 py-1 rounded-full">drag to location</span>
              </div>
            </div>

            <!-- Name + stepper -->
            <div class="p-2">
              <p class="text-xs text-gray-300 truncate leading-tight mb-1.5">{{ item.name }}</p>

              <!-- Qty stepper — only when a location is selected -->
              <div v-if="selectedLocation" class="flex items-center gap-1">
                <button
                  class="w-5 h-5 rounded bg-gray-800 hover:bg-gray-700 text-xs flex items-center justify-center shrink-0 transition-colors"
                  @click.stop="inv.adjustQuantity(item.code, selectedLocation!.id!, -1)"
                >−</button>
                <span class="flex-1 text-center text-sm font-bold text-gray-100 tabular-nums">
                  {{ getQty(item.code, selectedLocation.id!) }}
                </span>
                <button
                  class="w-5 h-5 rounded bg-gray-800 hover:bg-gray-700 text-xs flex items-center justify-center shrink-0 transition-colors"
                  @click.stop="inv.adjustQuantity(item.code, selectedLocation!.id!, 1)"
                >+</button>
              </div>
              <!-- Total across all locations when no location selected -->
              <p v-else class="text-xs text-center text-gray-600 tabular-nums">
                {{ inv.getQuantityForItem(item.code) > 0 ? inv.getQuantityForItem(item.code) + ' in stock' : 'not stocked' }}
              </p>
            </div>
          </div>

          <div v-if="inv.filteredItems.length === 0" class="col-span-full text-center py-16 text-gray-600">
            <p class="text-3xl mb-2">📦</p>
            <p>No items found</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Add Location Modal ───────────────────────────────────────────────── -->
    <UiModal v-model="showAddLocation" title="Add Storage Location">
      <div class="space-y-4">
        <div>
          <label class="label">Name *</label>
          <input v-model="locForm.name" class="input" placeholder="e.g. Convention Box A" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Type</label>
            <select v-model="locForm.type" class="input">
              <option>Box</option>
              <option>Shelf</option>
              <option>Drawer</option>
              <option>Bag</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label class="label">Color</label>
            <input v-model="locForm.color" type="color" class="input h-10 p-1 cursor-pointer" />
          </div>
        </div>
        <div>
          <label class="label">Description</label>
          <input v-model="locForm.description" class="input" placeholder="Optional" />
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showAddLocation = false">Cancel</button>
        <button class="btn btn-primary" :disabled="!locForm.name" @click="addLocation">Add Location</button>
      </template>
    </UiModal>

    <!-- ── Edit Location Modal ─────────────────────────────────────────────── -->
    <UiModal v-model="showEditLocation" title="Edit Location">
      <div v-if="editingLocation" class="space-y-4">
        <div>
          <label class="label">Name *</label>
          <input v-model="editingLocation.name" class="input" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Type</label>
            <select v-model="editingLocation.type" class="input">
              <option>Box</option>
              <option>Shelf</option>
              <option>Drawer</option>
              <option>Bag</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label class="label">Color</label>
            <input v-model="editingLocation.color" type="color" class="input h-10 p-1 cursor-pointer" />
          </div>
        </div>
        <div>
          <label class="label">Description</label>
          <input v-model="editingLocation.description" class="input" placeholder="Optional" />
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showEditLocation = false">Cancel</button>
        <button class="btn btn-primary" :disabled="!editingLocation?.name" @click="saveEditLocation">Save Changes</button>
      </template>
    </UiModal>

  </div>
</template>

<script setup lang="ts">
import type { Item, Location } from '~/composables/useDatabase'

const inv = useInventoryStore()
const { itemImageSrc } = useItemImage()

// ─── Location selection ────────────────────────────────────────────────────
const selectedLocationId = ref<number | null>(null)

const selectedLocation = computed(() =>
  selectedLocationId.value !== null
    ? inv.locations.find(l => l.id === selectedLocationId.value) ?? null
    : null
)

function locationTotal(locationId: number): number {
  return inv.inventory
    .filter(e => e.locationId === locationId)
    .reduce((s, e) => s + e.quantity, 0)
}

function getQty(itemCode: string, locationId: number): number {
  return inv.inventory.find(e => e.itemCode === itemCode && e.locationId === locationId)?.quantity ?? 0
}

function displayQty(item: Item): number {
  if (selectedLocation.value) return getQty(item.code, selectedLocation.value.id!)
  return inv.getQuantityForItem(item.code)
}

// ─── Drag-and-drop ────────────────────────────────────────────────────────
const draggingItem = ref<Item | null>(null)
const dragOverLocation = ref<number | null>(null)

function onDragStart(item: Item) {
  draggingItem.value = item
}

function onDragEnd() {
  draggingItem.value = null
  dragOverLocation.value = null
}

async function onDropToLocation(loc: Location) {
  dragOverLocation.value = null
  if (!draggingItem.value || !loc.id) return
  await inv.adjustQuantity(draggingItem.value.code, loc.id, 1)
  draggingItem.value = null
  // Auto-select the location so user can see the item was added
  selectedLocationId.value = loc.id
}

// ─── Add location ──────────────────────────────────────────────────────────
const showAddLocation = ref(false)
const locForm = reactive({ name: '', type: 'Box', color: '#6366f1', description: '' })

async function addLocation() {
  await inv.addLocation({ ...locForm, active: true })
  Object.assign(locForm, { name: '', type: 'Box', color: '#6366f1', description: '' })
  showAddLocation.value = false
}

// ─── Edit location ─────────────────────────────────────────────────────────
const showEditLocation = ref(false)
const editingLocation = ref<Location | null>(null)

function startEditLocation(loc: Location) {
  editingLocation.value = { ...loc }
  showEditLocation.value = true
}

async function saveEditLocation() {
  if (!editingLocation.value?.id) return
  const { id, ...patch } = editingLocation.value
  await inv.updateLocation(id, patch)
  showEditLocation.value = false
}

// ─── Delete location ───────────────────────────────────────────────────────
async function confirmDeleteLocation(loc: Location) {
  if (!confirm(`Delete location "${loc.name}"? All stock entries for this location will be removed.`)) return
  if (selectedLocationId.value === loc.id) selectedLocationId.value = null
  await inv.deleteLocation(loc.id!)
}

onMounted(() => inv.load())
</script>
