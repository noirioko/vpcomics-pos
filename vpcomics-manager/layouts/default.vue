<template>
  <div class="min-h-screen bg-gray-950">
    <!-- Top nav bar -->
    <nav class="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div class="max-w-screen-xl mx-auto flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors">
          <span class="text-lg font-bold tracking-tight">VPCOMICS</span>
          <span class="text-xs text-gray-500 font-mono">Artist Manager</span>
        </NuxtLink>
        <div class="flex items-center gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            :class="isActive(link.to)
              ? 'bg-purple-900/60 text-purple-300'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'"
          >
            <img v-if="link.chibi" :src="link.chibi" :alt="link.label" class="w-5 h-5 object-contain shrink-0" />
            <FaIcon v-else :icon="link.icon" class="w-3.5 h-3.5 shrink-0" />
            {{ link.label }}
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Page content -->
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const navLinks = [
  { to: '/', label: 'Home', icon: 'house' },
  { to: '/pos', label: 'POS', icon: 'cash-register', chibi: '/images/ui/chibi_miyu_pos.png' },
  { to: '/items', label: 'Items', icon: 'table-list' },
  { to: '/inventory', label: 'Inventory', icon: 'boxes-stacked' },
  { to: '/consignment', label: 'Consignment', icon: 'clipboard-list', chibi: '/images/ui/chibi_kaito_consign.png' },
  { to: '/overview', label: 'Overview', icon: 'chart-line' },
  { to: '/archive', label: 'Archive', icon: 'folder-open' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
