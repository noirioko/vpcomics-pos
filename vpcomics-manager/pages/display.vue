<template>
  <div class="display-root" :class="state">

    <!-- IDLE state -->
    <Transition name="fade">
      <div v-if="state === 'idle'" class="screen idle-screen">
        <div class="store-logo">
          <span class="logo-emoji">🎨</span>
          <p class="logo-name">VPCOMICS</p>
          <p class="logo-sub">Artist Merchandise</p>
        </div>
      </div>
    </Transition>

    <!-- CART state -->
    <Transition name="fade">
      <div v-if="state === 'cart'" class="screen cart-screen">
        <!-- Header -->
        <div class="cart-header">
          <span class="header-label">Current Order</span>
          <span class="header-items">{{ cartCount }} item{{ cartCount !== 1 ? 's' : '' }}</span>
        </div>

        <!-- Items list -->
        <div class="cart-items">
          <TransitionGroup name="list">
            <div
              v-for="line in cartLines"
              :key="line.itemCode"
              class="cart-row"
            >
              <div class="row-qty">× {{ line.quantity }}</div>
              <div class="row-name">{{ line.item.name }}</div>
              <div class="row-price">{{ fmt(line.unitPrice * line.quantity) }}</div>
            </div>
          </TransitionGroup>
        </div>

        <!-- Footer totals -->
        <div class="cart-footer">
          <div v-if="cartDiscount > 0" class="total-row discount-row">
            <span>Discount</span>
            <span>− {{ fmt(cartDiscount) }}</span>
          </div>
          <div class="total-row grand-total">
            <span>Total</span>
            <span class="total-amount">{{ fmt(cartTotal) }}</span>
          </div>
          <div v-if="paymentMethod" class="payment-badge">
            {{ paymentMethod }}
          </div>
        </div>
      </div>
    </Transition>

    <!-- COMPLETE state -->
    <Transition name="fade">
      <div v-if="state === 'complete'" class="screen complete-screen">
        <div class="thank-you">
          <div class="checkmark">✓</div>
          <p class="thanks-title">Thank You!</p>
          <p class="thanks-amount">{{ fmt(completedTotal) }}</p>
          <p v-if="completedChange > 0 && completedMethod === 'Cash'" class="thanks-change">
            Change: {{ fmt(completedChange) }}
          </p>
          <p class="thanks-method">{{ completedMethod }}</p>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

type State = 'idle' | 'cart' | 'complete'

interface CartLine {
  itemCode: string
  item: { name: string; image?: string }
  quantity: number
  unitPrice: number
}

type Currency = 'IDR' | 'SGD'

const state = ref<State>('idle')
const cartLines = ref<CartLine[]>([])
const cartDiscount = ref(0)
const cartTotal = ref(0)
const paymentMethod = ref('')
const currency = ref<Currency>('IDR')

const completedTotal = ref(0)
const completedChange = ref(0)
const completedMethod = ref('')

const cartCount = computed(() => cartLines.value.reduce((s, l) => s + l.quantity, 0))

let completeTimer: ReturnType<typeof setTimeout> | null = null

function fmt(n: number): string {
  if (currency.value === 'IDR') return 'Rp' + Math.round(n).toLocaleString('id-ID')
  return '$' + n.toFixed(2)
}

onMounted(() => {
  if (!import.meta.client) return
  const ch = new BroadcastChannel('vpcomics-display')
  // Tell the POS panel we're ready to receive
  ch.postMessage({ type: 'display-ready' })
  ch.onmessage = (e) => {
    const msg = e.data
    if (msg.type === 'cart-update') {
      cartLines.value = msg.cart
      cartDiscount.value = msg.discount
      cartTotal.value = msg.total
      paymentMethod.value = msg.paymentMethod || ''
      currency.value = msg.currency || 'IDR'
      state.value = msg.cart.length > 0 ? 'cart' : 'idle'
      if (completeTimer) { clearTimeout(completeTimer); completeTimer = null }
    } else if (msg.type === 'sale-complete') {
      completedTotal.value = msg.total
      completedChange.value = msg.change
      completedMethod.value = msg.paymentMethod
      currency.value = msg.currency || 'IDR'
      state.value = 'complete'
      if (completeTimer) clearTimeout(completeTimer)
      completeTimer = setTimeout(() => { state.value = 'idle'; cartLines.value = [] }, 5000)
    } else if (msg.type === 'idle') {
      state.value = 'idle'
      cartLines.value = []
    }
  }
  onUnmounted(() => ch.close())
})
</script>

<style scoped>
.display-root {
  min-height: 100vh;
  background: #0f0f1a;
  color: #f1f5f9;
  font-family: 'Nunito', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* ── IDLE ─────────────────────────────────────────────── */
.idle-screen {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}
.store-logo {
  text-align: center;
  animation: breathe 4s ease-in-out infinite;
}
.logo-emoji { font-size: 5rem; display: block; margin-bottom: 1rem; }
.logo-name { font-size: 3rem; font-weight: 800; letter-spacing: 0.15em; color: #e2e8f0; margin: 0; }
.logo-sub  { font-size: 1.1rem; font-weight: 500; color: #7c85a2; letter-spacing: 0.2em; text-transform: uppercase; margin: 0.5rem 0 0; }

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.03); opacity: 0.9; }
}

/* ── CART ─────────────────────────────────────────────── */
.cart-screen {
  background: #0f0f1a;
  padding: 2.5rem 3rem;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  max-width: 760px;
  margin: 0 auto;
  width: 100%;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #2a2a3e;
  padding-bottom: 1rem;
  margin-bottom: 0.5rem;
}
.header-label { font-size: 1.1rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
.header-items { font-size: 1rem; color: #7c85a2; }

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
  min-height: 0;
}

.cart-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 0;
  border-bottom: 1px solid #1e1e30;
  font-size: 1.35rem;
}
.row-qty  { color: #7c85a2; font-size: 1rem; font-weight: 700; min-width: 2.5rem; text-align: right; }
.row-name { flex: 1; font-weight: 600; color: #e2e8f0; }
.row-price{ font-family: 'Nunito', monospace; font-weight: 800; color: #34d399; font-size: 1.4rem; text-align: right; }

.cart-footer {
  border-top: 2px solid #2a2a3e;
  padding-top: 1.25rem;
  margin-top: 0.5rem;
}
.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}
.discount-row { color: #f59e0b; }
.grand-total  { font-size: 2rem; font-weight: 800; color: #f1f5f9; margin-top: 0.5rem; }
.total-amount { font-family: 'Nunito', monospace; color: #34d399; font-size: 2.5rem; }
.payment-badge {
  display: inline-block;
  margin-top: 0.75rem;
  background: #312e81;
  color: #c4b5fd;
  padding: 0.3rem 1rem;
  border-radius: 99px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* ── COMPLETE ─────────────────────────────────────────── */
.complete-screen {
  background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
}
.thank-you {
  text-align: center;
  animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.checkmark {
  font-size: 5rem;
  color: #34d399;
  line-height: 1;
  margin-bottom: 1rem;
  animation: spin-check 0.5s ease-out 0.1s both;
}
.thanks-title  { font-size: 3.5rem; font-weight: 800; color: #ecfdf5; margin: 0 0 1rem; }
.thanks-amount { font-size: 2.5rem; font-weight: 800; color: #34d399; font-family: 'Nunito', monospace; margin: 0 0 0.5rem; }
.thanks-change { font-size: 1.5rem; color: #a7f3d0; margin: 0 0 0.5rem; }
.thanks-method { font-size: 1rem; color: #6ee7b7; letter-spacing: 0.1em; text-transform: uppercase; margin: 0; }

@keyframes pop-in {
  from { transform: scale(0.7); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}
@keyframes spin-check {
  from { transform: rotate(-90deg) scale(0); opacity: 0; }
  to   { transform: rotate(0deg)   scale(1); opacity: 1; }
}

/* ── Transitions ──────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.list-enter-active { transition: all 0.3s ease; }
.list-leave-active { transition: all 0.2s ease; }
.list-enter-from   { opacity: 0; transform: translateX(-20px); }
.list-leave-to     { opacity: 0; transform: translateX(20px); }
</style>
