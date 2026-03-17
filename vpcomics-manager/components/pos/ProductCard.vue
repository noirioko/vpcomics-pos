<template>
  <div
    class="card relative flex flex-col transition-all p-0 overflow-hidden"
    :class="{
      'opacity-40': availability === 'not-brought',
      'border-red-800': availability === 'sold-out',
    }"
  >
    <!-- Image — click to add to cart -->
    <div
      class="bg-gray-800/60 h-40 flex items-center justify-center overflow-hidden relative shrink-0 cursor-pointer group"
      @click="$emit('add-to-cart')"
    >
      <img
        v-if="item.image"
        :src="itemImageSrc(item.image)"
        :alt="item.name"
        class="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-150"
        @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
      />
      <span v-else class="text-3xl text-gray-700">📦</span>
      <!-- Hover overlay -->
      <div class="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors flex items-end justify-center pb-2">
        <span class="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-emerald-300 bg-gray-900/80 px-2 py-0.5 rounded-full">+ Add to Cart</span>
      </div>
      <span
        v-if="item.stock !== undefined"
        class="absolute top-2 right-2 text-xs font-mono font-medium px-1.5 py-0.5 rounded"
        :class="item.stock === 0 ? 'bg-red-900/80 text-red-300' : item.stock <= 5 ? 'bg-amber-900/80 text-amber-300' : 'bg-gray-800/80 text-gray-400'"
      >
        {{ item.stock === 0 ? 'OUT' : item.stock + ' left' }}
      </span>
    </div>

    <!-- Info + controls -->
    <div class="flex flex-col gap-2.5 p-3 flex-1">
      <!-- Name + code -->
      <div>
        <p class="text-xs font-mono text-gray-500 truncate">{{ item.code }}</p>
        <p class="text-sm font-semibold text-gray-100 leading-tight mt-0.5 line-clamp-2">{{ customTitle || item.name }}</p>
        <p v-if="item.notes" class="text-xs text-amber-400 mt-0.5">{{ item.notes }}</p>
      </div>

      <!-- Price / Cost — one box, price big, cost below -->
      <div class="bg-gray-800 rounded-xl p-3">
        <div>
          <p class="text-xs text-gray-500 mb-0.5">Selling Price</p>
          <div class="flex items-baseline gap-1">
            <span class="text-sm text-gray-400 font-mono">{{ currency === 'IDR' ? 'Rp' : '$' }}</span>
            <input
              :value="priceDisplay"
              type="text"
              inputmode="numeric"
              class="flex-1 bg-transparent text-emerald-400 font-mono font-bold text-lg outline-none min-w-0"
              @focus="(e) => (e.target as HTMLInputElement).select()"
              @blur="(e) => $emit('set-price', parseAmt((e.target as HTMLInputElement).value))"
            />
          </div>
        </div>
        <div class="border-t border-gray-700 mt-2 pt-2">
          <p class="text-xs text-gray-500 mb-0.5">Cost</p>
          <div class="flex items-baseline gap-1">
            <span class="text-xs text-gray-500 font-mono">{{ currency === 'IDR' ? 'Rp' : '$' }}</span>
            <input
              :value="costDisplay"
              type="text"
              inputmode="numeric"
              class="flex-1 bg-transparent text-rose-400 font-mono text-sm outline-none min-w-0"
              @focus="(e) => (e.target as HTMLInputElement).select()"
              @blur="(e) => $emit('set-cost', parseAmt((e.target as HTMLInputElement).value))"
            />
          </div>
        </div>
      </div>

      <!-- Add to Cart button -->
      <button
        class="btn btn-success btn-sm w-full mt-auto"
        @click="$emit('add-to-cart')"
      >
        🛒 Add to Cart
      </button>

      <!-- Qty tally (all-day count) -->
      <div class="flex items-center gap-1.5">
        <button class="btn btn-secondary btn-sm w-7 h-7 p-0 shrink-0" @click="$emit('add', -1)">−</button>
        <input
          :value="quantity"
          type="number"
          min="0"
          class="input-sm text-center flex-1 font-mono font-bold min-w-0"
          @change="(e) => $emit('set-qty', Number((e.target as HTMLInputElement).value))"
        />
        <button class="btn btn-secondary btn-sm w-7 h-7 p-0 shrink-0" @click="$emit('add', 1)">+</button>
        <span class="text-xs text-gray-600 ml-0.5">sold</span>
      </div>

      <!-- Availability — compact 3-state -->
      <div class="flex gap-1">
        <button
          v-for="opt in availabilityOptions"
          :key="opt.value"
          class="flex-1 text-center text-xs py-1 rounded-lg font-semibold transition-colors"
          :class="availability === opt.value ? opt.activeClass : 'bg-gray-800/60 text-gray-600 hover:text-gray-400'"
          :title="opt.label"
          @click="$emit('set-availability', opt.value)"
        >
          {{ opt.icon }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item } from '~/composables/useDatabase'
const { itemImageSrc } = useItemImage()

const props = defineProps<{
  item: Item
  quantity: number
  effectivePrice: number
  effectiveCost: number
  customTitle?: string
  availability: 'available' | 'sold-out' | 'not-brought'
  currency: 'IDR' | 'SGD'
}>()

defineEmits<{
  add: [delta: number]
  'set-qty': [qty: number]
  'set-price': [price: number]
  'set-cost': [cost: number]
  'set-availability': [val: 'available' | 'sold-out' | 'not-brought']
  'add-to-cart': []
}>()

function formatAmt(n: number, currency: string) {
  if (currency === 'IDR') return n.toLocaleString('id-ID')   // 200.000
  return n.toFixed(2)                                         // 10.00
}

function parseAmt(s: string) {
  // Strip thousand separators (dots in IDR, commas in SGD) then parse
  return parseFloat(s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0
}

const priceDisplay = computed(() => formatAmt(props.effectivePrice, props.currency))
const costDisplay  = computed(() => formatAmt(props.effectiveCost,  props.currency))

const availabilityOptions = [
  { value: 'available',   label: 'Available',   icon: '✓', activeClass: 'bg-emerald-700/60 text-emerald-300' },
  { value: 'sold-out',    label: 'Sold Out',    icon: '✕', activeClass: 'bg-red-700/60 text-red-300' },
  { value: 'not-brought', label: 'Not Brought', icon: '—', activeClass: 'bg-amber-700/60 text-amber-400' },
]
</script>
