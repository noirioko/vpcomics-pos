import { defineStore } from 'pinia'
import type { Location, InventoryEntry, Item } from '~/composables/useDatabase'

export const useInventoryStore = defineStore('inventory', () => {
  const { db } = useDatabase()

  const locations = ref<Location[]>([])
  const inventory = ref<InventoryEntry[]>([])
  const items = ref<Item[]>([])
  const searchQuery = ref('')
  const selectedLocationId = ref<number | null>(null)

  async function load() {
    locations.value = await db.locations.toArray()
    inventory.value = await db.inventory.toArray()
    items.value = (await db.items.toArray()).filter(i => i.active !== false)
  }

  // ─── Locations ────────────────────────────────────────────────────────────
  async function addLocation(data: Omit<Location, 'id'>) {
    const id = await db.locations.add(data)
    const loc = await db.locations.get(id)
    if (loc) locations.value.push(loc)
  }

  async function updateLocation(id: number, patch: Partial<Location>) {
    await db.locations.update(id, patch)
    const idx = locations.value.findIndex(l => l.id === id)
    if (idx !== -1) locations.value[idx] = { ...locations.value[idx], ...patch }
  }

  async function deleteLocation(id: number) {
    await db.locations.delete(id)
    locations.value = locations.value.filter(l => l.id !== id)
    // Remove inventory entries for this location
    await db.inventory.where('locationId').equals(id).delete()
    inventory.value = inventory.value.filter(e => e.locationId !== id)
  }

  // ─── Inventory entries ────────────────────────────────────────────────────
  async function setItemQuantity(itemCode: string, locationId: number, quantity: number, notes?: string) {
    const existing = inventory.value.find(
      e => e.itemCode === itemCode && e.locationId === locationId
    )
    const now = new Date().toISOString()

    if (existing?.id) {
      await db.inventory.update(existing.id, { quantity, notes, updatedAt: now })
      const idx = inventory.value.findIndex(e => e.id === existing.id)
      if (idx !== -1) inventory.value[idx] = { ...inventory.value[idx], quantity, notes: notes ?? existing.notes, updatedAt: now }
    } else {
      const id = await db.inventory.add({ itemCode, locationId, quantity, notes, updatedAt: now })
      const entry = await db.inventory.get(id)
      if (entry) inventory.value.push(entry)
    }
  }

  async function adjustQuantity(itemCode: string, locationId: number, delta: number) {
    const existing = inventory.value.find(
      e => e.itemCode === itemCode && e.locationId === locationId
    )
    const current = existing?.quantity ?? 0
    await setItemQuantity(itemCode, locationId, Math.max(0, current + delta))
  }

  // ─── Computed ─────────────────────────────────────────────────────────────
  const filteredItems = computed(() => {
    let list = items.value
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q))
    }
    return list
  })

  function getQuantityForItem(itemCode: string, locationId?: number): number {
    if (locationId) {
      return inventory.value.find(e => e.itemCode === itemCode && e.locationId === locationId)?.quantity ?? 0
    }
    return inventory.value
      .filter(e => e.itemCode === itemCode)
      .reduce((sum, e) => sum + e.quantity, 0)
  }

  function getEntriesForLocation(locationId: number): Array<{ item: Item; entry: InventoryEntry }> {
    const entries = inventory.value.filter(e => e.locationId === locationId && e.quantity > 0)
    return entries
      .map(entry => ({
        entry,
        item: items.value.find(i => i.code === entry.itemCode)!,
      }))
      .filter(x => x.item)
  }

  const totalStock = computed(() =>
    inventory.value.reduce((sum, e) => sum + e.quantity, 0)
  )

  return {
    locations,
    inventory,
    items,
    searchQuery,
    selectedLocationId,
    filteredItems,
    totalStock,
    load,
    addLocation,
    updateLocation,
    deleteLocation,
    setItemQuantity,
    adjustQuantity,
    getQuantityForItem,
    getEntriesForLocation,
  }
})
