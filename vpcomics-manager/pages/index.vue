<template>
  <div class="max-w-screen-lg mx-auto px-4 py-12">
    <!-- Header -->
    <div class="text-center mb-12">
      <div class="text-5xl mb-4">🎨</div>
      <h1 class="text-3xl font-bold text-gray-100 mb-2">VPCOMICS Artist Manager</h1>
      <p class="text-gray-400">Convention POS · Inventory · Consignment Tracking</p>
    </div>

    <!-- Main nav cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <NuxtLink to="/pos" class="card group hover:border-purple-700 transition-colors cursor-pointer flex flex-col">
        <div class="flex-1 flex items-center gap-4">
          <img src="/images/ui/chibi_miyu_pos.png" alt="POS" class="w-16 h-16 object-contain shrink-0" />
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-gray-100 group-hover:text-purple-300 transition-colors">
              POS System
            </h2>
            <p class="text-gray-400 text-sm mt-1">
              Track sales at conventions. Multi-artist, multi-currency, real-time profit calc.
            </p>
          </div>
          <span class="text-gray-600 group-hover:text-purple-400 transition-colors text-xl">→</span>
        </div>
      </NuxtLink>

      <NuxtLink to="/consignment" class="card group hover:border-purple-700 transition-colors cursor-pointer flex flex-col">
        <div class="flex-1 flex items-center gap-4">
          <img src="/images/ui/chibi_kaito_consign.png" alt="Consignment" class="w-16 h-16 object-contain shrink-0" />
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-gray-100 group-hover:text-purple-300 transition-colors">
              Consignment Tool
            </h2>
            <p class="text-gray-400 text-sm mt-1">
              Pesa21 session-based tool. Calculate printing costs, fees, and payout reports.
            </p>
            <span class="badge badge-purple mt-2">NEW</span>
          </div>
          <span class="text-gray-600 group-hover:text-purple-400 transition-colors text-xl">→</span>
        </div>
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <NuxtLink to="/inventory" class="card group hover:border-blue-700 transition-colors cursor-pointer block">
        <div class="flex items-center gap-3">
          <div class="text-2xl">📦</div>
          <div>
            <h3 class="font-semibold text-gray-200 group-hover:text-blue-300 transition-colors">Inventory</h3>
            <p class="text-gray-500 text-xs mt-0.5">Storage locations & stock</p>
          </div>
        </div>
      </NuxtLink>

      <!-- Active session status -->
      <div class="card md:col-span-2">
        <div v-if="sessionStore.hasActiveSession" class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
          <div>
            <p class="text-sm font-medium text-gray-200">{{ sessionStore.activeSession?.name }}</p>
            <p class="text-xs text-gray-500">
              {{ sessionStore.activeSession?.date }} · {{ sessionStore.activeSession?.currency }}
            </p>
          </div>
          <NuxtLink to="/pos" class="btn btn-primary btn-sm ml-auto">
            Continue →
          </NuxtLink>
        </div>
        <div v-else class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-gray-600 shrink-0"></div>
          <p class="text-sm text-gray-500">No active session</p>
          <NuxtLink to="/pos" class="btn btn-secondary btn-sm ml-auto">
            Start Session
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const sessionStore = useSessionStore()
onMounted(() => sessionStore.loadActiveSession())
</script>
