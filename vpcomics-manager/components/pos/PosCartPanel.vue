<template>
  <div class="flex flex-col h-full bg-gray-900 border-l border-gray-800 w-80 shrink-0">

    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-gray-100">Current Sale</span>
        <span v-if="pos.cartCount > 0" class="badge badge-purple text-xs">{{ pos.cartCount }} items</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="text-xs px-2 py-1 rounded transition-colors"
          :class="displayOpen
            ? 'bg-indigo-700/50 text-indigo-300 hover:bg-indigo-700'
            : 'text-gray-500 hover:text-indigo-300'"
          title="Display to customer"
          @click="openDisplay"
        >
          {{ displayOpen ? '📺 Live' : '📺' }}
        </button>
        <button
          v-if="pos.cartCount > 0"
          class="text-xs text-gray-500 hover:text-red-400 transition-colors"
          @click="pos.clearCart()"
        >
          Clear all
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="pos.cart.length === 0"
      class="flex-1 flex flex-col items-center justify-center text-gray-600 p-6 text-center"
    >
      <p class="text-4xl mb-3">🛒</p>
      <p class="text-sm font-medium text-gray-500">Cart is empty</p>
      <p class="text-xs text-gray-600 mt-1">Click on a product image<br>or press <span class="text-gray-500">Add to Cart</span></p>
    </div>

    <!-- Cart items -->
    <div v-else class="flex-1 overflow-y-auto">
      <div
        v-for="line in pos.cart"
        :key="line.itemCode"
        class="flex items-start gap-2.5 px-3 py-2.5 border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors"
      >
        <!-- Thumbnail -->
        <img
          v-if="line.item.image"
          :src="itemImageSrc(line.item.image)"
          :alt="line.item.name"
          class="w-10 h-10 object-contain rounded-lg bg-gray-800 shrink-0"
          @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
        />
        <div v-else class="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg shrink-0 text-lg leading-none">
          📦
        </div>

        <!-- Name + qty controls -->
        <div class="flex-1 min-w-0">
          <p class="text-xs text-gray-200 font-medium truncate leading-snug">{{ line.item.name }}</p>
          <div class="flex items-center gap-1 mt-1.5">
            <button
              class="w-5 h-5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs flex items-center justify-center shrink-0"
              @click="pos.setCartLineQty(line.itemCode, line.quantity - 1)"
            >−</button>
            <input
              :value="line.quantity"
              type="number"
              min="1"
              class="w-8 bg-gray-800 text-gray-100 font-mono text-xs text-center py-0.5 rounded outline-none focus:ring-1 focus:ring-purple-500"
              @change="(e) => pos.setCartLineQty(line.itemCode, Number((e.target as HTMLInputElement).value))"
            />
            <button
              class="w-5 h-5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs flex items-center justify-center shrink-0"
              @click="pos.setCartLineQty(line.itemCode, line.quantity + 1)"
            >+</button>
          </div>
        </div>

        <!-- Price column — fixed width so numbers align across all rows -->
        <div class="shrink-0 w-20 text-right">
          <p class="font-mono text-sm font-bold text-emerald-400">{{ fmt(line.unitPrice * line.quantity) }}</p>
          <!-- Editable unit price -->
          <input
            :value="rawPrice(line.unitPrice)"
            type="text"
            inputmode="numeric"
            title="Edit unit price"
            class="w-full bg-transparent text-gray-500 font-mono text-xs text-right outline-none focus:bg-gray-800 focus:rounded focus:px-1 focus:ring-1 focus:ring-purple-500 mt-0.5 cursor-text"
            @focus="(e) => (e.target as HTMLInputElement).select()"
            @blur="(e) => pos.setCartLinePrice(line.itemCode, parsePrice((e.target as HTMLInputElement).value))"
          />
          <p class="text-xs text-gray-600">each</p>
        </div>

        <!-- Remove -->
        <button
          class="text-gray-700 hover:text-red-400 transition-colors shrink-0 text-xs mt-0.5 pt-0.5"
          @click="pos.removeFromCart(line.itemCode)"
        >✕</button>
      </div>
    </div>

    <!-- Checkout section -->
    <div v-if="pos.cart.length > 0" class="shrink-0 border-t border-gray-800">

      <!-- Subtotal rows -->
      <div class="px-4 pt-3 pb-2 space-y-1.5">
        <div class="flex justify-between text-xs text-gray-500">
          <span>Subtotal ({{ pos.cartCount }} items)</span>
          <span class="font-mono">{{ fmt(pos.cartSubtotal) }}</span>
        </div>

        <!-- Discount row -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 flex-1">Discount</span>
          <div class="flex items-center gap-1">
            <span class="text-xs text-gray-600 font-mono">{{ currency === 'IDR' ? 'Rp' : '$' }}</span>
            <input
              :value="pos.cartDiscount || ''"
              type="number"
              min="0"
              placeholder="0"
              class="w-20 bg-gray-800 text-amber-400 font-mono text-xs text-right px-1.5 py-0.5 rounded outline-none focus:ring-1 focus:ring-purple-500"
              @change="(e) => pos.cartDiscount = parseFloat((e.target as HTMLInputElement).value) || 0"
            />
          </div>
        </div>
      </div>

      <!-- Total -->
      <div class="flex items-center justify-between px-4 py-2.5 bg-gray-800/40 border-t border-b border-gray-800">
        <span class="text-sm font-bold text-gray-100">Total</span>
        <span class="font-mono text-lg font-bold text-emerald-400">{{ fmt(pos.cartTotal) }}</span>
      </div>

      <!-- Payment method + paid/change -->
      <div class="px-4 py-3 space-y-2.5">
        <!-- Payment selector -->
        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="method in (['Cash', 'QRIS', 'EDC'] as const)"
            :key="method"
            class="text-xs py-2 rounded-lg font-semibold transition-colors"
            :class="paymentMethod === method
              ? 'bg-purple-700/70 text-purple-100 ring-1 ring-purple-500'
              : 'bg-gray-800 text-gray-400 hover:text-gray-200'"
            @click="paymentMethod = method"
          >
            {{ method }}
          </button>
        </div>

        <!-- Paid + change (cash only) -->
        <template v-if="paymentMethod === 'Cash'">
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400 flex-1">Paid</span>
            <span class="text-xs text-gray-600 font-mono">{{ currency === 'IDR' ? 'Rp' : '$' }}</span>
            <input
              v-model.number="pos.cartPaid"
              type="number"
              min="0"
              placeholder="0"
              class="w-24 bg-gray-800 text-gray-100 font-mono text-sm text-right px-2 py-1 rounded outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div class="flex items-center justify-between bg-gray-800/60 rounded-lg px-3 py-2">
            <span class="text-xs text-gray-400">Change</span>
            <span
              class="font-mono font-bold text-base"
              :class="pos.cartPaid >= pos.cartTotal ? 'text-emerald-400' : 'text-red-400'"
            >
              {{ fmt(pos.cartChange) }}
            </span>
          </div>
        </template>

        <!-- Complete button -->
        <button
          class="btn btn-success w-full text-sm font-bold py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="pos.cartCount === 0 || (paymentMethod === 'Cash' && pos.cartPaid < pos.cartTotal)"
          @click="completeSale"
        >
          ✓ Complete Sale
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
const pos = usePosStore()
const sessionStore = useSessionStore()
const { itemImageSrc } = useItemImage()

const paymentMethod = ref<'Cash' | 'QRIS' | 'EDC'>('Cash')
const currency = computed(() => sessionStore.currency)
const displayOpen = ref(false)

let displayChannel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel {
  if (!displayChannel) displayChannel = new BroadcastChannel('vpcomics-display')
  return displayChannel
}

function broadcastCart() {
  if (!displayOpen.value) return
  getChannel().postMessage({
    type: 'cart-update',
    cart: pos.cart,
    discount: pos.cartDiscount,
    subtotal: pos.cartSubtotal,
    total: pos.cartTotal,
    currency: currency.value,
    paymentMethod: pos.cart.length > 0 ? paymentMethod.value : '',
  })
}

// Broadcast whenever cart, discount, or payment method changes
watch(
  [() => pos.cart, () => pos.cartDiscount, () => paymentMethod.value],
  () => broadcastCart(),
  { deep: true }
)

function openDisplay() {
  if (!import.meta.client) return
  window.open('/display', 'vpcomics-display', 'width=1024,height=768,menubar=no,toolbar=no,location=no')
  displayOpen.value = true
  // Immediately broadcast current state so the new window catches up
  setTimeout(() => broadcastCart(), 300)
}

function fmt(n: number): string {
  if (currency.value === 'IDR') return 'Rp' + Math.round(n).toLocaleString('id-ID')
  return '$' + n.toFixed(2)
}

function rawPrice(n: number): string {
  return currency.value === 'IDR' ? String(Math.round(n)) : n.toFixed(2)
}

function parsePrice(s: string): number {
  return parseFloat(s.replace(/[^\d.-]/g, '')) || 0
}

async function completeSale() {
  const total = pos.cartTotal
  const change = pos.cartChange
  const method = paymentMethod.value
  await pos.completeTransaction(paymentMethod.value)
  paymentMethod.value = 'Cash'
  // Broadcast completion
  if (displayOpen.value) {
    getChannel().postMessage({
      type: 'sale-complete',
      total,
      change,
      paymentMethod: method,
      currency: currency.value,
    })
  }
}

onUnmounted(() => displayChannel?.close())
</script>
