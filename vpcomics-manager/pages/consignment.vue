<template>
  <div class="max-w-screen-xl mx-auto px-4 py-6">

    <!-- ── SESSION LIST VIEW ──────────────────────────────────────────────── -->
    <template v-if="!cs.currentSession">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-100">Consignment Tool</h1>
          <p class="text-gray-500 text-sm mt-0.5">Track consigned sales, fees, and artist payouts</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary" @click="openFromPOS">📥 From POS Session</button>
          <button class="btn btn-primary" @click="showCreate = true">+ New Session</button>
        </div>
      </div>

      <div v-if="cs.sessions.length === 0" class="card text-center py-16 text-gray-500">
        <p class="text-4xl mb-4">📋</p>
        <p class="font-medium text-gray-400">No consignment sessions yet</p>
        <p class="text-sm mt-1 mb-4">Create a session manually or import from a POS session</p>
        <div class="flex gap-2 justify-center">
          <button class="btn btn-secondary" @click="openFromPOS">📥 From POS Session</button>
          <button class="btn btn-primary" @click="showCreate = true">Create New Session</button>
        </div>
      </div>

      <!-- Artist filter -->
      <div v-if="cs.sessions.length > 0" class="flex gap-2 flex-wrap mb-4">
        <button
          class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
          :class="artistFilter === null ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
          @click="artistFilter = null"
        >All</button>
        <button
          v-for="artist in sessionArtists"
          :key="artist.id"
          class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
          :class="artistFilter === artist.id ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
          @click="artistFilter = artistFilter === artist.id ? null : artist.id!"
        >{{ artist.emoji }} {{ artist.name }}</button>
      </div>

      <div v-else class="space-y-3"><!-- never shown, just structural --></div>
      <div v-if="cs.sessions.length > 0" class="space-y-3">
        <div
          v-for="session in filteredSessions"
          :key="session.id"
          class="card flex items-center gap-4 cursor-pointer hover:border-purple-700 transition-colors"
          @click="cs.openSession(session.id!)"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-semibold text-gray-200">{{ session.name }}</h3>
              <span class="badge" :class="statusBadge(session.status)">{{ statusLabel(session.status) }}</span>
              <span v-if="session.paidAt" class="text-xs text-emerald-600">{{ session.paidAt }}</span>
              <span v-if="session.artistId && artistMap[session.artistId]" class="text-xs bg-gray-800 rounded px-2 py-0.5 text-gray-300">
                {{ artistMap[session.artistId].emoji }} {{ artistMap[session.artistId].name }}
              </span>
              <span v-if="session.platform" class="text-xs text-gray-500 bg-gray-800 rounded px-2 py-0.5">
                📍 {{ session.platform }}
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-0.5">{{ session.date }} · {{ session.currency }}</p>
            <p v-if="session.notes" class="text-xs text-gray-600 mt-1">{{ session.notes }}</p>
          </div>
          <div class="text-right text-sm text-gray-500">
            {{ session.fees.length }} fee{{ session.fees.length !== 1 ? 's' : '' }}
          </div>
          <button class="btn btn-danger btn-sm" @click.stop="deleteSession(session.id!)">Delete</button>
          <span class="text-gray-600">→</span>
        </div>
      </div>
    </template>

    <!-- ── SESSION DETAIL VIEW ────────────────────────────────────────────── -->
    <template v-else>
      <!-- Header -->
      <div class="flex items-start gap-4 mb-6 flex-wrap">
        <button class="btn btn-secondary btn-sm shrink-0 mt-1" @click="cs.currentSession = null; cs.currentItems = []">
          ← Back
        </button>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-xl font-bold text-gray-100">{{ cs.currentSession.name }}</h1>
            <button class="text-gray-600 hover:text-gray-300 transition-colors" title="Edit session details" @click="openEditSession">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <span class="badge" :class="statusBadge(cs.currentSession.status)">{{ statusLabel(cs.currentSession.status) }}</span>
            <span v-if="cs.currentSession.artistId && artistMap[cs.currentSession.artistId]" class="text-xs bg-purple-900/40 text-purple-300 rounded px-2 py-0.5">
              {{ artistMap[cs.currentSession.artistId].emoji }} {{ artistMap[cs.currentSession.artistId].name }}
            </span>
            <span v-if="cs.currentSession.platform" class="text-xs text-gray-400 bg-gray-800 rounded px-2 py-0.5">
              📍 {{ cs.currentSession.platform }}
            </span>
          </div>
          <p class="text-gray-500 text-sm mt-0.5">{{ cs.currentSession.date }} · {{ cs.currentSession.currency }}</p>
          <!-- Invoice link -->
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs text-gray-600">Invoice ref:</span>
            <select
              class="input-sm text-xs py-0.5"
              :value="cs.currentSession.invoiceId ?? ''"
              @change="(e) => cs.setSessionInvoice(Number((e.target as HTMLSelectElement).value) || null)"
            >
              <option value="">— none —</option>
              <option v-for="inv in invoiceList" :key="inv.id" :value="inv.id">
                {{ inv.refNumber ? inv.refNumber + ' · ' : '' }}{{ inv.name }}
              </option>
            </select>
            <button class="btn btn-secondary btn-sm text-xs" title="Create new invoice record" @click="openQuickInvoice">＋</button>
          </div>
        </div>
        <div class="flex gap-2 flex-wrap shrink-0">
          <button class="btn btn-success btn-sm" @click="exportCSV">Export CSV</button>
          <button class="btn btn-primary btn-sm" @click="showReport = true; archiveSent = false; archiveError = ''">📊 View Report</button>
        </div>
      </div>

      <!-- Totals summary -->
      <div class="grid grid-cols-4 gap-3 mb-4">
        <div class="card text-center">
          <p class="text-xs text-gray-500 mb-1">Gross Revenue</p>
          <p class="text-lg font-bold font-mono text-emerald-400">{{ fmt(cs.sessionTotals.grossRevenue) }}</p>
        </div>
        <div class="card text-center">
          <p class="text-xs text-gray-500 mb-1">Printing Costs</p>
          <p class="text-lg font-bold font-mono text-rose-400">{{ fmt(cs.sessionTotals.totalPrintingCost) }}</p>
        </div>
        <div class="card text-center cursor-pointer hover:border-amber-700/60 transition-colors group" @click="showFees = true">
          <p class="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
            Fees
            <span class="text-amber-600 group-hover:text-amber-400 transition-colors text-[10px]">✏</span>
          </p>
          <p class="text-lg font-bold font-mono text-amber-400">{{ fmt(cs.sessionTotals.totalFees) }}</p>
          <p class="text-[10px] text-gray-600 mt-0.5">
            {{ cs.currentSession.fees.length === 0 ? 'click to add' : cs.currentSession.fees.length + ' fee' + (cs.currentSession.fees.length !== 1 ? 's' : '') }}
          </p>
        </div>
        <div class="card text-center">
          <p class="text-xs text-gray-500 mb-1">Artist Payout</p>
          <p class="text-lg font-bold font-mono text-purple-400">{{ fmt(cs.sessionTotals.totalArtistPayout) }}</p>
          <template v-if="cs.currentSession.kursRate && cs.currentSession.kursCurrency">
            <p class="text-sm text-amber-400 mt-1 font-mono font-semibold">
              ≈ {{ ({ USD: '$', KRW: '₩', EUR: '€', SGD: 'S$' }[cs.currentSession.kursCurrency]) }}{{ (cs.sessionTotals.totalArtistPayout / cs.currentSession.kursRate).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ cs.currentSession.kursCurrency }}
            </p>
            <p class="text-[10px] text-gray-600">@ Rp{{ cs.currentSession.kursRate.toLocaleString('id-ID') }}</p>
          </template>
          <template v-if="artistPayoutAfterFees">
            <div class="border-t border-gray-700/50 mt-2 pt-2">
              <p class="text-[10px] text-gray-500">after {{ cs.currentSession.payVia }} fees</p>
              <p class="text-sm font-bold font-mono text-emerald-400">
                {{ artistPayoutAfterFees.symbol }}{{ artistPayoutAfterFees.isIDR ? Math.round(artistPayoutAfterFees.amount).toLocaleString('id-ID') : artistPayoutAfterFees.amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ artistPayoutAfterFees.currency }}
              </p>
            </div>
          </template>
        </div>
      </div>

      <!-- Payment + Status row -->
      <div class="card mb-5 flex flex-wrap gap-6 items-start">

        <!-- Payout status -->
        <div class="shrink-0">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payout Status</p>
          <div class="flex gap-2">
            <button
              v-for="stage in PAYOUT_STAGES"
              :key="stage.value"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
              :class="cs.currentSession.status === stage.value
                ? stage.activeClass
                : 'border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'"
              @click="cs.setSessionStatus(stage.value)"
            >{{ stage.label }}</button>
          </div>
          <p v-if="cs.currentSession.paidAt" class="text-xs text-emerald-600 mt-1.5">Paid on {{ cs.currentSession.paidAt }}</p>
        </div>

        <div class="w-px bg-gray-800 self-stretch shrink-0 hidden sm:block"></div>

        <!-- Payment method -->
        <div class="flex-1 min-w-0 space-y-3">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment Method</p>
          <div class="flex gap-2">
            <button
              v-for="method in ['Bank Transfer', 'PayPal', 'Wise']"
              :key="method"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
              :class="cs.currentSession.payVia === method
                ? 'border-purple-600 bg-purple-900/40 text-purple-300'
                : 'border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'"
              @click="selectPaymentMethod(method)"
            >{{ method }}</button>
          </div>

          <!-- Kurs — shown when pay via is international -->
          <template v-if="isInternationalPayVia">
            <div class="flex items-end gap-3 flex-wrap">
              <div>
                <label class="label">Convert to</label>
                <select
                  v-model="localKursCurrency"
                  class="input w-28"
                  @change="savePaymentKurs(localKursCurrency, localKursRate || undefined)"
                >
                  <option value="USD">USD ($)</option>
                  <option value="KRW">KRW (₩)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="SGD">SGD (S$)</option>
                </select>
              </div>
              <div>
                <label class="label">IDR per 1 {{ localKursCurrency }}</label>
                <input
                  v-model.number="localKursRate"
                  type="number"
                  min="0"
                  class="input w-36"
                  placeholder="e.g. 15600"
                  @blur="savePaymentKurs(localKursCurrency, localKursRate || undefined)"
                />
              </div>
              <div v-if="localKursRate && localKursCurrency" class="pb-2">
                <p class="text-sm text-amber-400 font-mono font-semibold">
                  = {{ ({ USD: '$', KRW: '₩', EUR: '€', SGD: 'S$' }[localKursCurrency]) }}{{ (cs.sessionTotals.totalArtistPayout / localKursRate).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ localKursCurrency }}
                </p>
                <p class="text-xs text-gray-500">artist payout converted</p>
              </div>
            </div>
          </template>

          <!-- Payment fees -->
          <template v-if="cs.currentSession.payVia">
            <div class="flex items-end gap-3 flex-wrap">
              <div v-if="isInternationalPayVia">
                <label class="label">Fee %</label>
                <input
                  v-model.number="localFeePercent"
                  type="number" min="0" step="0.1" class="input w-24"
                  placeholder="e.g. 4.4"
                />
              </div>
              <div>
                <label class="label">Fixed fee ({{ isInternationalPayVia ? (cs.currentSession.kursCurrency ?? 'USD') : cs.currentSession.currency }})</label>
                <input
                  v-model.number="localFeeFixed"
                  type="number" min="0" step="0.01" class="input w-28"
                  placeholder="e.g. 0.30"
                />
              </div>
              <button
                class="btn pb-2 text-xs px-3 transition-colors"
                :class="feesSaved ? 'btn-success' : 'btn-secondary'"
                @click="saveFeesWithFeedback"
              >{{ feesSaved ? '✓ Saved' : 'Save' }}</button>
            </div>
          </template>
        </div>

      </div>

      <!-- Action bar -->
      <div class="flex gap-2 mb-4 flex-wrap">
        <button class="btn btn-primary" @click="openPicker">+ Add Items</button>
        <button class="btn btn-secondary" @click="openImportFromPOS">📥 Import from POS</button>
      </div>

      <!-- ── Multi-select item picker ─────────────────────────────────────── -->
      <div v-if="showPicker" class="card space-y-4 mb-4">
        <div class="flex items-center gap-3">
          <h3 class="font-medium text-gray-200 text-sm">Add Items to Session</h3>
          <button class="text-xs text-purple-400 hover:text-purple-300 transition-colors" @click="selectAllVisible">Select All</button>
          <button class="text-xs text-gray-500 hover:text-gray-400 transition-colors" @click="pickerSelection.clear(); pickerSelection = new Set()">Clear</button>
          <button class="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors" @click="closePicker">✕ Cancel</button>
        </div>

        <input
          ref="searchInputRef"
          v-model="itemSearch"
          class="input"
          placeholder="Search by name or code…"
        />

        <!-- Artist filter chips -->
        <div class="flex gap-2 flex-wrap">
          <button
            class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
            :class="pickerArtistFilter === null ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
            @click="pickerArtistFilter = null"
          >All</button>
          <button
            v-for="artist in pickerArtists"
            :key="artist.id"
            class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
            :class="pickerArtistFilter === artist.id ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
            @click="pickerArtistFilter = pickerArtistFilter === artist.id ? null : artist.id"
          >{{ artist.emoji }} {{ artist.name }}</button>
        </div>

        <!-- Items with checkboxes -->
        <div class="max-h-72 overflow-y-auto space-y-0.5 pr-1">
          <label
            v-for="item in filteredPickerItems"
            :key="item.code"
            class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
            :class="isAlreadyAdded(item.code) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-800'"
          >
            <input
              type="checkbox"
              class="w-4 h-4 accent-purple-500 shrink-0"
              :checked="pickerSelection.has(item.code)"
              :disabled="isAlreadyAdded(item.code)"
              @change="togglePickerItem(item.code)"
            />
            <img
              v-if="item.image"
              :src="`/images/${item.image}`"
              class="w-10 h-10 object-contain rounded bg-gray-900 shrink-0"
              @error="(e) => (e.target as HTMLImageElement).style.display='none'"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-200 truncate">{{ item.name }}</p>
              <p class="text-xs font-mono text-gray-500">{{ item.code }}</p>
            </div>
            <span class="text-xs font-mono text-emerald-500 shrink-0">
              {{ cs.currentSession?.currency === 'SGD' ? '$' + item.priceSGD?.toFixed(2) : 'Rp' + item.priceIDR?.toLocaleString('id-ID') }}
            </span>
            <span v-if="isAlreadyAdded(item.code)" class="text-xs text-gray-600 shrink-0">added</span>
          </label>
          <div v-if="filteredPickerItems.length === 0" class="text-center text-gray-500 py-6 text-sm">
            No products match your search
          </div>
        </div>

        <!-- Picker footer -->
        <div class="flex items-center justify-between border-t border-gray-800 pt-3">
          <span class="text-sm text-gray-400">
            {{ pickerSelection.size }} item{{ pickerSelection.size !== 1 ? 's' : '' }} selected
          </span>
          <div class="flex gap-2">
            <button class="btn btn-secondary" @click="closePicker">Cancel</button>
            <button class="btn btn-primary" :disabled="pickerSelection.size === 0" @click="addSelectedItems">
              Add {{ pickerSelection.size > 0 ? pickerSelection.size + ' Items' : 'Items' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Import from POS panel ────────────────────────────────────────── -->
      <div v-if="showImportPanel" class="card space-y-4 mb-4">
        <div class="flex items-center gap-3">
          <h3 class="font-medium text-gray-200 text-sm">Import from POS Session</h3>
          <button class="ml-auto text-xs text-gray-500 hover:text-gray-300" @click="closeImportPanel">✕ Cancel</button>
        </div>

        <!-- Step 1: pick POS session -->
        <template v-if="!importSelectedSession">
          <p class="text-sm text-gray-400">Select an ended POS session to import its sales:</p>
          <div v-if="importPOSSessions.length === 0" class="text-center py-6 text-gray-500 text-sm">
            No ended POS sessions found.
          </div>
          <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
            <button
              v-for="sess in importPOSSessions"
              :key="sess.id"
              class="w-full text-left flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 transition-colors"
              @click="selectPOSSessionForImport(sess)"
            >
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-200 truncate">{{ sess.name }}</p>
                <p class="text-xs text-gray-500">{{ sess.date }} · {{ sess.currency }}</p>
              </div>
              <span class="text-gray-500 text-sm">→</span>
            </button>
          </div>
        </template>

        <!-- Step 2: review items to import -->
        <template v-else>
          <div class="flex items-center gap-3 flex-wrap">
            <button class="text-xs text-gray-500 hover:text-gray-300 transition-colors" @click="importSelectedSession = null">← Back</button>
            <span class="text-sm font-medium text-gray-200">{{ importSelectedSession.name }}</span>
            <span class="text-xs text-gray-500">{{ importSales.length }} item{{ importSales.length !== 1 ? 's' : '' }} sold</span>
            <button class="ml-auto text-xs text-purple-400 hover:text-purple-300" @click="importSelectAll">All</button>
            <button class="text-xs text-gray-500 hover:text-gray-400" @click="importSelection = new Set()">None</button>
          </div>

          <div v-if="cs.currentSession?.currency !== importSelectedSession.currency"
            class="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/40 rounded-lg px-3 py-2">
            ⚠ Currency mismatch: POS used {{ importSelectedSession.currency }}, this session is {{ cs.currentSession?.currency }}. Prices import as-is.
          </div>

          <div class="max-h-64 overflow-y-auto space-y-0.5 pr-1">
            <label
              v-for="sale in importSales"
              :key="sale.itemCode"
              class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
              :class="isAlreadyAdded(sale.itemCode) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-800'"
            >
              <input
                type="checkbox"
                class="w-4 h-4 accent-purple-500 shrink-0"
                :checked="importSelection.has(sale.itemCode)"
                :disabled="isAlreadyAdded(sale.itemCode)"
                @change="toggleImportItem(sale.itemCode)"
              />
              <img
                v-if="importItemMap[sale.itemCode]?.image"
                :src="`/images/${importItemMap[sale.itemCode]?.image}`"
                class="w-8 h-8 object-contain rounded bg-gray-800 shrink-0"
                @error="(e) => (e.target as HTMLImageElement).style.display='none'"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-200 truncate">{{ importItemMap[sale.itemCode]?.name ?? sale.itemCode }}</p>
                <p class="text-xs font-mono text-gray-500">{{ sale.itemCode }}</p>
              </div>
              <span class="text-sm font-mono font-medium text-gray-300 shrink-0">×{{ sale.quantity }}</span>
              <span v-if="isAlreadyAdded(sale.itemCode)" class="text-xs text-gray-600 shrink-0">in session</span>
            </label>
          </div>

          <div class="flex items-center justify-between border-t border-gray-800 pt-3">
            <span class="text-sm text-gray-400">{{ importSelection.size }} item{{ importSelection.size !== 1 ? 's' : '' }} to import</span>
            <div class="flex gap-2">
              <button class="btn btn-secondary" @click="closeImportPanel">Cancel</button>
              <button class="btn btn-primary" :disabled="importSelection.size === 0 || importing" @click="doImport">
                {{ importing ? 'Importing…' : 'Import ' + importSelection.size + ' Items' }}
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- ── Consignment table ────────────────────────────────────────────── -->
      <div class="card overflow-x-auto p-0">
        <table class="table-base">
          <thead>
            <tr>
              <th>Product</th>
              <th class="text-right">Consigned</th>
              <th class="text-right">Sold</th>
              <th class="text-right">Price</th>
              <th class="text-right">Print Cost</th>
              <th class="text-right">Share%</th>
              <th class="text-right">Gross</th>
              <th class="text-right">Net</th>
              <th class="text-right text-purple-400">Artist Payout</th>
              <th class="text-gray-500">Event/Channel</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cs.currentItems.length === 0">
              <td colspan="11" class="text-center text-gray-500 py-8">
                No items yet. Click "+ Add Items" or "📥 Import from POS".
              </td>
            </tr>
            <tr v-for="item in cs.currentItems" :key="item.id" class="group">
              <td>
                <div class="flex items-center gap-2">
                  <img
                    v-if="itemImageMap[item.itemCode]"
                    :src="`/images/${itemImageMap[item.itemCode]}`"
                    class="w-8 h-8 object-contain rounded bg-gray-800 shrink-0"
                    @error="(e) => (e.target as HTMLImageElement).style.display='none'"
                  />
                  <div>
                    <p class="font-medium text-gray-200 text-sm">{{ item.itemName }}</p>
                    <p class="text-xs text-gray-600 font-mono">{{ item.itemCode }}</p>
                  </div>
                </div>
              </td>
              <td class="text-right">
                <div class="flex justify-end">
                  <UiStepper :model-value="item.quantityConsigned" min-width="2rem"
                    @update:model-value="cs.updateItem(item.id!, { quantityConsigned: $event })" />
                </div>
              </td>
              <td class="text-right">
                <div class="flex justify-end">
                  <UiStepper :model-value="item.quantitySold" min-width="2rem"
                    @update:model-value="cs.updateItem(item.id!, { quantitySold: $event })" />
                </div>
              </td>
              <td class="text-right">
                <input :value="item.sellingPrice" type="number" min="0" class="input-sm w-24 text-right font-mono"
                  @change="(e) => cs.updateItem(item.id!, { sellingPrice: Number((e.target as HTMLInputElement).value) })" />
              </td>
              <td class="text-right">
                <input :value="item.printingCost" type="number" min="0" class="input-sm w-24 text-right font-mono"
                  @change="(e) => cs.updateItem(item.id!, { printingCost: Number((e.target as HTMLInputElement).value) })" />
              </td>
              <td class="text-right">
                <input :value="item.profitSharePercent" type="number" min="0" max="100" class="input-sm w-16 text-right"
                  @change="(e) => cs.updateItem(item.id!, { profitSharePercent: Number((e.target as HTMLInputElement).value) })" />
              </td>
              <td class="text-right font-mono text-sm text-emerald-400">{{ fmt(cs.calcItem(item).grossRevenue) }}</td>
              <td class="text-right font-mono text-sm text-blue-400">{{ fmt(cs.calcItem(item).netAfterFees) }}</td>
              <td class="text-right font-mono text-sm font-bold text-purple-400">{{ fmt(cs.calcItem(item).artistPayout) }}</td>
              <td>
                <input
                  :value="item.channel ?? ''"
                  type="text"
                  class="input-sm w-32 text-xs"
                  placeholder="e.g. Pesta Boneka"
                  @change="(e) => cs.updateItem(item.id!, { channel: (e.target as HTMLInputElement).value || undefined })"
                />
              </td>
              <td>
                <button class="btn btn-danger btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  @click="cs.removeItem(item.id!)">✕</button>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="cs.currentItems.length > 0">
            <tr class="bg-gray-900/80">
              <td class="font-bold text-gray-300">TOTAL</td>
              <td class="text-right font-mono text-gray-400">{{ cs.currentItems.reduce((s, i) => s + i.quantityConsigned, 0) }}</td>
              <td class="text-right font-mono text-gray-400">{{ cs.sessionTotals.totalUnits }}</td>
              <td colspan="3"></td>
              <td class="text-right font-mono font-bold text-emerald-400">{{ fmt(cs.sessionTotals.grossRevenue) }}</td>
              <td class="text-right font-mono font-bold text-blue-400">{{ fmt(cs.sessionTotals.netAfterFees) }}</td>
              <td class="text-right font-mono font-bold text-purple-400">{{ fmt(cs.sessionTotals.totalArtistPayout) }}</td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

    <!-- ── Quick invoice create ──────────────────────────────────────────── -->
    <UiModal v-model="showQuickInvoice" title="New Invoice Record" max-width="400px">
      <div class="space-y-3">
        <div class="bg-gray-800/60 rounded-lg px-4 py-3 text-sm space-y-1">
          <p class="text-gray-400">This will create an archive record from this session:</p>
          <p class="text-gray-200 font-medium">{{ cs.currentSession?.name }}</p>
          <p class="text-gray-500 text-xs">{{ cs.currentSession?.date }} · {{ fmt(cs.sessionTotals.totalArtistPayout) }} artist payout · income</p>
        </div>
        <div>
          <label class="label">Ref # <span class="text-gray-600 font-normal">(optional)</span></label>
          <input v-model="quickInvoiceForm.refNumber" class="input" placeholder="e.g. INV-2025-001" />
        </div>
        <p v-if="quickInvoiceError" class="text-sm text-red-400">⚠ {{ quickInvoiceError }}</p>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showQuickInvoice = false">Cancel</button>
        <button class="btn btn-primary" @click="saveQuickInvoice">Save & Link</button>
      </template>
    </UiModal>

    <!-- ── Edit session modal ────────────────────────────────────────────── -->
    <UiModal v-model="showEditSession" title="Edit Session">
      <div class="space-y-4">
        <div>
          <label class="label">Session Name *</label>
          <input v-model="editSessionForm.name" class="input" placeholder="e.g. COMIFURO XX — Pesa21" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Date</label>
            <input v-model="editSessionForm.date" type="date" class="input" />
          </div>
          <div>
            <label class="label">Currency</label>
            <select v-model="editSessionForm.currency" class="input">
              <option value="IDR">IDR</option>
              <option value="SGD">SGD</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">Platform / Venue</label>
          <input v-model="editSessionForm.platform" class="input" placeholder="e.g. Klikmoo, Comifuro Table B" />
        </div>
        <div>
          <label class="label">Artist</label>
          <select v-model="editSessionForm.artistId" class="input">
            <option :value="null">— none —</option>
            <option v-for="a in allArtistsList" :key="a.id" :value="a.id">{{ a.emoji }} {{ a.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Notes</label>
          <input v-model="editSessionForm.notes" class="input" placeholder="Optional notes" />
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showEditSession = false">Cancel</button>
        <button class="btn btn-primary" :disabled="!editSessionForm.name" @click="saveEditSession">Save Changes</button>
      </template>
    </UiModal>

    <!-- ── Create session modal ───────────────────────────────────────────── -->
    <UiModal v-model="showCreate" title="New Consignment Session">
      <div class="space-y-4">
        <div>
          <label class="label">Session Name *</label>
          <input v-model="createForm.name" class="input" placeholder="e.g. COMIFURO XX — Pesa21" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Date *</label>
            <input v-model="createForm.date" type="date" class="input" />
          </div>
          <div>
            <label class="label">Currency</label>
            <select v-model="createForm.currency" class="input">
              <option value="IDR">IDR</option>
              <option value="SGD">SGD</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">Platform / Venue</label>
          <input v-model="createForm.platform" class="input" placeholder="e.g. Klikmoo, Comifuro Table B, Tokopedia" />
        </div>
        <div>
          <label class="label">Artist</label>
          <select v-model="createForm.artistId" class="input">
            <option :value="null">— none —</option>
            <option v-for="a in allArtistsList" :key="a.id" :value="a.id">{{ a.emoji }} {{ a.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Notes</label>
          <input v-model="createForm.notes" class="input" placeholder="Optional notes" />
        </div>
        <p v-if="createError" class="text-sm text-red-400 bg-red-900/30 rounded-lg px-3 py-2">⚠ {{ createError }}</p>
      </div>
      <template #footer>
        <button class="btn btn-secondary" :disabled="creating" @click="showCreate = false">Cancel</button>
        <button class="btn btn-primary" :disabled="!createForm.name || !createForm.date || creating" @click="createSession">
          {{ creating ? 'Creating…' : 'Create Session' }}
        </button>
      </template>
    </UiModal>

    <!-- ── "From POS Session" modal (create new consignment from POS) ──────── -->
    <UiModal v-model="showFromPOSModal" title="Create from POS Session" max-width="560px">
      <!-- Step 1: pick session -->
      <div v-if="fromPOSStep === 1" class="space-y-3">
        <p class="text-sm text-gray-400">Select an ended POS session to create a consignment report from:</p>
        <div v-if="importPOSSessions.length === 0" class="text-center py-8 text-gray-500 text-sm">
          No ended POS sessions found. End a POS session first.
        </div>
        <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
          <button
            v-for="sess in importPOSSessions"
            :key="sess.id"
            class="w-full text-left flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 transition-colors"
            @click="selectFromPOSSession(sess)"
          >
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-200 truncate">{{ sess.name }}</p>
              <p class="text-xs text-gray-500">{{ sess.date }} · {{ sess.currency }}</p>
            </div>
            <span class="badge badge-blue text-xs">{{ sess.currency }}</span>
            <span class="text-gray-500 text-sm">→</span>
          </button>
        </div>
      </div>

      <!-- Step 2: confirm session details -->
      <div v-else-if="fromPOSStep === 2" class="space-y-4">
        <div class="flex items-center gap-2 mb-2">
          <button class="text-xs text-gray-500 hover:text-gray-300" @click="fromPOSStep = 1">← Back</button>
          <span class="text-sm text-gray-400">Confirm session details</span>
        </div>
        <div>
          <label class="label">Session Name *</label>
          <input v-model="createForm.name" class="input" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Date</label>
            <input v-model="createForm.date" type="date" class="input" />
          </div>
          <div>
            <label class="label">Currency</label>
            <select v-model="createForm.currency" class="input">
              <option value="IDR">IDR</option>
              <option value="SGD">SGD</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">Platform / Venue</label>
          <input v-model="createForm.platform" class="input" placeholder="e.g. Klikmoo, Comifuro Table B" />
        </div>
        <div>
          <label class="label">Artist</label>
          <select v-model="createForm.artistId" class="input">
            <option :value="null">— none —</option>
            <option v-for="a in allArtistsList" :key="a.id" :value="a.id">{{ a.emoji }} {{ a.name }}</option>
          </select>
        </div>
        <div class="bg-gray-800/60 rounded-lg px-4 py-3 text-sm text-gray-400">
          Will import <strong class="text-gray-200">{{ importSales.length }}</strong> sold item{{ importSales.length !== 1 ? 's' : '' }}
          from <strong class="text-gray-200">{{ fromPOSSelectedSession?.name }}</strong>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-secondary" @click="showFromPOSModal = false">Cancel</button>
        <button v-if="fromPOSStep === 2"
          class="btn btn-primary" :disabled="!createForm.name || creating" @click="createFromPOS">
          {{ creating ? 'Creating…' : 'Create & Import' }}
        </button>
      </template>
    </UiModal>

    <!-- ── Fees editor modal ─────────────────────────────────────────────── -->
    <UiModal v-model="showFees" title="Session Fees" max-width="480px">
      <div class="space-y-3">
        <div v-if="cs.currentSession?.fees.length === 0" class="text-sm text-gray-500 text-center py-4">
          No fees configured. Add fees below.
        </div>
        <div v-for="fee in cs.currentSession?.fees" :key="fee.id"
          class="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-200">{{ fee.name }}</p>
            <p class="text-xs text-gray-500">
              {{ fee.type === 'fixed' ? fmt(fee.value) : fee.value + '%' }} of gross revenue
            </p>
          </div>
          <button class="text-red-500 hover:text-red-400 text-sm" @click="cs.removeFee(fee.id)">✕</button>
        </div>
        <div class="border-t border-gray-800 pt-4 space-y-3">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Add Fee</p>
          <div>
            <label class="label">Fee Name</label>
            <input v-model="newFee.name" class="input" placeholder="e.g. Table Fee, Platform Fee" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Type</label>
              <select v-model="newFee.type" class="input">
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage %</option>
              </select>
            </div>
            <div>
              <label class="label">Value</label>
              <input v-model.number="newFee.value" type="number" min="0" class="input"
                :placeholder="newFee.type === 'fixed' ? '500000' : '5'" />
            </div>
          </div>
          <button class="btn btn-primary w-full" :disabled="!newFee.name" @click="addFee">Add Fee</button>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showFees = false">Done</button>
      </template>
    </UiModal>

    <!-- ── In-page Report Overlay ────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showReport && cs.currentSession" class="fixed inset-0 z-50 bg-gray-950 overflow-y-auto">
        <div class="max-w-2xl mx-auto px-4 py-8">

          <!-- Report header -->
          <div class="flex items-start justify-between mb-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-100">{{ cs.currentSession.name }}</h1>
              <p class="text-gray-500 text-sm mt-0.5">
                {{ cs.currentSession.date }}
                <span v-if="cs.currentSession.platform"> · {{ cs.currentSession.platform }}</span>
              </p>
              <div class="flex gap-2 mt-1.5 flex-wrap">
                <span class="badge" :class="statusBadge(cs.currentSession.status)">{{ statusLabel(cs.currentSession.status) }}</span>
                <span v-if="cs.currentSession.artistId && artistMap[cs.currentSession.artistId]" class="text-xs bg-purple-900/40 text-purple-300 rounded px-2 py-0.5">
                  {{ artistMap[cs.currentSession.artistId].emoji }} {{ artistMap[cs.currentSession.artistId].name }}
                </span>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm shrink-0" @click="showReport = false">✕ Close</button>
          </div>

          <!-- Items breakdown -->
          <div class="card overflow-x-auto p-0 mb-6">
            <table class="table-base text-sm">
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-right">Sold</th>
                  <th class="text-right">Gross</th>
                  <th class="text-right">Print</th>
                  <th class="text-right">Fees</th>
                  <th class="text-right text-purple-400">Payout</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in cs.currentItems" :key="item.id">
                  <td>
                    <div class="flex items-center gap-2">
                      <img
                        v-if="itemImageMap[item.itemCode]"
                        :src="`/images/${itemImageMap[item.itemCode]}`"
                        class="w-8 h-8 object-contain rounded bg-gray-800 shrink-0"
                        @error="(e) => (e.target as HTMLImageElement).style.display='none'"
                      />
                      <div>
                        <p class="font-medium text-gray-200">{{ item.itemName }}</p>
                        <p v-if="item.channel" class="text-xs text-gray-500">{{ item.channel }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="text-right tabular-nums text-gray-400">× {{ item.quantitySold }}</td>
                  <td class="text-right tabular-nums text-emerald-400">{{ fmt(cs.calcItem(item).grossRevenue) }}</td>
                  <td class="text-right tabular-nums text-rose-400">{{ fmt(cs.calcItem(item).totalPrintingCost) }}</td>
                  <td class="text-right tabular-nums text-amber-400">{{ fmt(cs.calcItem(item).feeAllocation) }}</td>
                  <td class="text-right tabular-nums font-bold text-purple-400">{{ fmt(cs.calcItem(item).artistPayout) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Financial breakdown -->
          <div class="card space-y-0 p-0 mb-6 overflow-hidden">
            <div class="px-5 py-4 space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Gross Revenue</span>
                <span class="font-mono font-medium text-emerald-400">{{ fmt(rc.grossRevenue) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">− Printing Costs</span>
                <span class="font-mono text-rose-400">{{ fmt(rc.printingCosts) }}</span>
              </div>
              <div class="flex justify-between border-t border-gray-800 pt-2">
                <span class="text-gray-300">= Net after Printing</span>
                <span class="font-mono font-medium text-gray-200">{{ fmt(rc.netAfterPrinting) }}</span>
              </div>

              <template v-if="cs.currentSession.fees.length > 0">
                <div v-for="fee in cs.currentSession.fees" :key="fee.id" class="flex justify-between text-xs">
                  <span class="text-gray-500 pl-3">· {{ fee.name }} ({{ fee.type === 'fixed' ? fmt(fee.value) : fee.value + '%' }})</span>
                  <span class="font-mono text-gray-500">{{ fmt(fee.type === 'fixed' ? fee.value : rc.grossRevenue * fee.value / 100) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">− Session Fees</span>
                  <span class="font-mono text-amber-400">{{ fmt(rc.sessionFees) }}</span>
                </div>
                <div class="flex justify-between border-t border-gray-800 pt-2">
                  <span class="text-gray-300">= Net after Fees</span>
                  <span class="font-mono font-medium text-gray-200">{{ fmt(rc.netAfterFees) }}</span>
                </div>
              </template>

              <div class="flex justify-between pt-1">
                <span class="text-gray-400">Artist Payout</span>
                <span class="font-mono font-bold text-purple-400">{{ fmt(rc.artistPayout) }}</span>
              </div>
            </div>

            <!-- Payment processing section -->
            <template v-if="cs.currentSession.payVia">
              <div class="bg-gray-900/60 border-t border-gray-800 px-5 py-4 space-y-2 text-sm">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment via {{ cs.currentSession.payVia }}</p>

                <p v-if="rc.noKursWarning" class="text-xs text-amber-400 bg-amber-900/20 rounded px-3 py-2">
                  ⚠ Enter exchange rate in the payment section to see conversion
                </p>

                <template v-if="rc.hasConversion">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Kurs (1 {{ rc.kursCurrency }} = {{ fmt(rc.kursRate!) }})</span>
                    <span class="font-mono text-amber-400">
                      ≈ {{ fmtForeign(rc.payoutForeign!, rc.kursCurrency!) }} {{ rc.kursCurrency }}
                    </span>
                  </div>
                </template>

                <template v-if="rc.processingFeeTotal > 0">
                  <div v-if="rc.processingFeePercent > 0" class="flex justify-between text-xs">
                    <span class="text-gray-500 pl-3">· Fee {{ cs.currentSession.paymentFeePercent }}%</span>
                    <span class="font-mono text-gray-500">− {{ fmtForeign(rc.processingFeePercent, rc.artistReceivesCurrency) }}</span>
                  </div>
                  <div v-if="rc.processingFeeFixed > 0" class="flex justify-between text-xs">
                    <span class="text-gray-500 pl-3">· Fixed fee</span>
                    <span class="font-mono text-gray-500">− {{ fmtForeign(rc.processingFeeFixed, rc.artistReceivesCurrency) }}</span>
                  </div>
                </template>

                <div class="flex justify-between border-t border-gray-700 pt-2">
                  <span class="font-semibold text-gray-200">Artist Receives</span>
                  <span class="font-mono font-bold text-emerald-400 text-base">
                    {{ fmtForeign(rc.artistReceives, rc.artistReceivesCurrency) }} {{ rc.artistReceivesCurrency !== cs.currentSession.currency ? rc.artistReceivesCurrency : '' }}
                  </span>
                </div>
              </div>
            </template>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 flex-wrap">
            <button class="btn btn-primary flex-1" @click="sendToArchive">
              {{ archiveSent ? '✓ Saved to Archive' : '📁 Send to Archive' }}
            </button>
            <button class="btn btn-secondary" @click="exportPDF">Export PDF</button>
            <button class="btn btn-secondary" @click="exportCSV">Export CSV</button>
          </div>
          <p v-if="archiveError" class="text-sm text-red-400 mt-2">⚠ {{ archiveError }}</p>

        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import type { Item, Artist, Invoice, ConsignmentSession } from '~/composables/useDatabase'

const cs = useConsignmentStore()
const { db, ready } = useDatabase()

// ─── Invoice list (for cross-reference selector) ───────────────────────────
const invoiceList = ref<Invoice[]>([])

async function loadInvoices() {
  await ready
  const all = await db.invoices.toArray()
  invoiceList.value = all.sort((a, b) => b.date.localeCompare(a.date))
}

// ─── Quick invoice create ──────────────────────────────────────────────────
const showQuickInvoice = ref(false)
const quickInvoiceError = ref('')
const quickInvoiceForm = reactive({ refNumber: '' })

function openQuickInvoice() {
  quickInvoiceError.value = ''
  quickInvoiceForm.refNumber = ''
  showQuickInvoice.value = true
}

async function saveQuickInvoice() {
  quickInvoiceError.value = ''
  const sess = cs.currentSession
  if (!sess) return
  try {
    const record = {
      refNumber: quickInvoiceForm.refNumber || '',
      name: sess.name,
      date: sess.date,
      channel: sess.platform || sess.name,
      type: 'income' as const,
      amount: cs.sessionTotals.totalArtistPayout,
      currency: sess.currency,
      createdAt: new Date().toISOString(),
    }
    const id = await db.invoices.add(record as any)
    await loadInvoices()
    await cs.setSessionInvoice(id as number)
    showQuickInvoice.value = false
  } catch (err: any) {
    quickInvoiceError.value = err?.message ?? 'Failed to save.'
  }
}

// ─── Artist map + filter (for session list) ────────────────────────────────
const artistFilter = ref<number | null>(null)
const artistMap = ref<Record<number, Artist>>({})

const sessionArtists = computed(() => {
  const ids = new Set(cs.sessions.map(s => s.artistId).filter((id): id is number => !!id))
  return [...ids].map(id => artistMap.value[id]).filter(Boolean)
})

const filteredSessions = computed(() => {
  if (artistFilter.value === null) return cs.sessions
  return cs.sessions.filter(s => s.artistId === artistFilter.value)
})

// ─── Edit session ──────────────────────────────────────────────────────────
const showEditSession = ref(false)
const editSessionForm = reactive({
  name: '', date: '', currency: 'IDR' as 'IDR' | 'SGD',
  platform: '', notes: '', artistId: null as number | null,
})

const isInternationalPayVia = computed(() => {
  const pv = cs.currentSession?.payVia ?? ''
  return pv === 'PayPal' || pv === 'Wise'
})

async function selectPaymentMethod(method: string) {
  const isDeselect = cs.currentSession?.payVia === method
  const payVia = isDeselect ? undefined : method
  let paymentFeePercent = cs.currentSession?.paymentFeePercent
  let paymentFeeFixed = cs.currentSession?.paymentFeeFixed
  // Auto-prefill PayPal fees when first selecting it
  if (payVia === 'PayPal' && !paymentFeePercent && !paymentFeeFixed) {
    paymentFeePercent = 4.4
    paymentFeeFixed = 0.30
    localFeePercent.value = 4.4
    localFeeFixed.value = 0.30
  }
  // Default kurs currency to USD for international methods
  if ((payVia === 'PayPal' || payVia === 'Wise') && !localKursCurrency.value) {
    localKursCurrency.value = 'USD'
  }
  await cs.updateSession({
    payVia,
    kursCurrency: cs.currentSession?.kursCurrency,
    kursRate: cs.currentSession?.kursRate,
    paymentFeePercent,
    paymentFeeFixed,
  })
}

async function savePaymentKurs(kursCurrency: ConsignmentSession['kursCurrency'], kursRate: number | undefined) {
  await cs.updateSession({ payVia: cs.currentSession?.payVia, kursCurrency, kursRate })
}

// ─── In-page report ────────────────────────────────────────────────────────
const showReport = ref(false)
const archiveSent = ref(false)
const archiveError = ref('')

// Full payout calculation including payment processing fees
const rc = computed(() => {
  const sess = cs.currentSession
  const totals = cs.sessionTotals
  const payout = totals.totalArtistPayout
  // Use local state for live preview — falls back to saved session values
  const kursRate = localKursRate.value || sess?.kursRate
  const kursCurrency = (localKursCurrency.value || sess?.kursCurrency) as string | undefined
  const isInternational = sess?.payVia === 'PayPal' || sess?.payVia === 'Wise'

  const base = {
    grossRevenue: totals.grossRevenue,
    printingCosts: totals.totalPrintingCost,
    netAfterPrinting: totals.netAfterPrinting,
    sessionFees: totals.totalFees,
    netAfterFees: totals.netAfterFees,
    artistPayout: payout,
    hasConversion: false,
    noKursWarning: false,
    kursCurrency: kursCurrency ?? null,
    kursRate: kursRate ?? null,
    payoutForeign: null as number | null,
    processingFeePercent: 0,
    processingFeeFixed: 0,
    processingFeeTotal: 0,
    artistReceives: payout,
    artistReceivesCurrency: sess?.currency ?? 'IDR',
  }

  if (!sess?.payVia) return base

  if (isInternational && kursRate && kursCurrency) {
    const payoutForeign = payout / kursRate
    const feePercent = payoutForeign * ((sess.paymentFeePercent ?? 0) / 100)
    const feeFixed = sess.paymentFeeFixed ?? 0
    return {
      ...base,
      hasConversion: true,
      kursCurrency,
      kursRate,
      payoutForeign,
      processingFeePercent: feePercent,
      processingFeeFixed: feeFixed,
      processingFeeTotal: feePercent + feeFixed,
      artistReceives: payoutForeign - feePercent - feeFixed,
      artistReceivesCurrency: kursCurrency,
    }
  }

  if (isInternational) {
    // PayPal/Wise selected but kurs not set yet
    return { ...base, noKursWarning: true }
  }

  // Bank transfer — flat fee in session currency
  const feeFixed = sess.paymentFeeFixed ?? 0
  return {
    ...base,
    processingFeeFixed: feeFixed,
    processingFeeTotal: feeFixed,
    artistReceives: payout - feeFixed,
  }
})

function fmtForeign(amount: number, currency: string): string {
  if (currency === 'IDR') return 'Rp' + Math.round(amount).toLocaleString('id-ID')
  if (currency === 'KRW') return '₩' + Math.round(amount).toLocaleString('ko-KR')
  const symbols: Record<string, string> = { USD: '$', EUR: '€', SGD: 'S$' }
  return (symbols[currency] ?? '') + amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function sendToArchive() {
  archiveError.value = ''
  const sess = cs.currentSession
  if (!sess) return
  try {
    const record = {
      refNumber: '',
      name: sess.name,
      date: sess.date,
      channel: sess.platform || sess.name,
      type: 'income' as const,
      amount: cs.sessionTotals.totalArtistPayout,
      currency: sess.currency,
      createdAt: new Date().toISOString(),
    }
    const id = await db.invoices.add(record as any)
    await loadInvoices()
    await cs.setSessionInvoice(id as number)
    archiveSent.value = true
    setTimeout(() => { archiveSent.value = false }, 3000)
  } catch (err: any) {
    archiveError.value = err?.message ?? 'Failed to save to archive.'
  }
}

// Artist payout after payment processing fees
const artistPayoutAfterFees = computed(() => {
  const sess = cs.currentSession
  if (!sess?.payVia) return null
  const payout = cs.sessionTotals.totalArtistPayout
  if (sess.payVia === 'Bank Transfer') {
    const fixed = sess.paymentFeeFixed ?? 0
    return { amount: payout - fixed, currency: sess.currency, symbol: sess.currency === 'SGD' ? 'S$' : 'Rp', isIDR: sess.currency === 'IDR' }
  }
  if (sess.kursRate && sess.kursCurrency) {
    const symbols: Record<string, string> = { USD: '$', KRW: '₩', EUR: '€', SGD: 'S$' }
    const payoutForeign = payout / sess.kursRate
    const fee = payoutForeign * ((sess.paymentFeePercent ?? 0) / 100) + (sess.paymentFeeFixed ?? 0)
    return { amount: payoutForeign - fee, currency: sess.kursCurrency, symbol: symbols[sess.kursCurrency] ?? '', isIDR: false }
  }
  return null
})

// Local state for kurs + fee inputs — avoids re-render-on-save focus loss
const localKursCurrency = ref<string>('USD')
const localKursRate = ref<number | undefined>(undefined)
const localFeePercent = ref<number | undefined>(undefined)
const localFeeFixed = ref<number | undefined>(undefined)

watch(() => cs.currentSession?.id, () => {
  const sess = cs.currentSession
  localKursCurrency.value = sess?.kursCurrency ?? 'USD'
  localKursRate.value = sess?.kursRate ?? undefined
  localFeePercent.value = sess?.paymentFeePercent ?? undefined
  localFeeFixed.value = sess?.paymentFeeFixed ?? undefined
  feesSaved.value = false
}, { immediate: true })

const feesSaved = ref(false)

async function savePaymentFees(paymentFeePercent: number | undefined, paymentFeeFixed: number | undefined) {
  await cs.updateSession({ paymentFeePercent, paymentFeeFixed })
}

async function saveFeesWithFeedback() {
  await savePaymentFees(localFeePercent.value || undefined, localFeeFixed.value || undefined)
  feesSaved.value = true
  setTimeout(() => { feesSaved.value = false }, 2000)
}

function openEditSession() {
  const s = cs.currentSession!
  Object.assign(editSessionForm, {
    name: s.name, date: s.date, currency: s.currency,
    platform: s.platform ?? '', notes: s.notes ?? '',
    artistId: s.artistId ?? null,
  })
  showEditSession.value = true
}

async function saveEditSession() {
  await cs.updateSession({
    ...editSessionForm,
    artistId: editSessionForm.artistId ?? undefined,
  })
  showEditSession.value = false
}

// ─── Session creation ──────────────────────────────────────────────────────
const showCreate = ref(false)
const createError = ref('')
const creating = ref(false)
const showFees = ref(false)

const createForm = reactive({
  name: '',
  date: new Date().toISOString().split('T')[0],
  currency: 'IDR' as 'IDR' | 'SGD',
  platform: '',
  notes: '',
  artistId: null as number | null,
})

// All artists (excluding special tabs) for pickers
const allArtistsList = ref<Artist[]>([])

// ─── Multi-select item picker ──────────────────────────────────────────────
const showPicker = ref(false)
const itemSearch = ref('')
const pickerArtistFilter = ref<number | null>(null)
const pickerItems = ref<Item[]>([])
const pickerArtists = ref<Artist[]>([])
const searchInputRef = ref<HTMLInputElement | null>(null)
let pickerSelection = ref(new Set<string>())

// Image map for table display: itemCode → filename
const itemImageMap = ref<Record<string, string>>({})

const filteredPickerItems = computed(() => {
  let items = pickerItems.value
  if (pickerArtistFilter.value !== null) {
    items = items.filter(i => i.artistId === pickerArtistFilter.value)
  }
  const q = itemSearch.value.trim().toLowerCase()
  if (q) items = items.filter(i => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q))
  return items
})

function isAlreadyAdded(code: string): boolean {
  return cs.currentItems.some(i => i.itemCode === code)
}

async function openPicker() {
  await ready
  pickerItems.value = (await db.items.toArray()).filter((i: any) => i.active !== false)
  pickerArtists.value = (await db.artists.toArray()).filter((a: any) => !a.isSpecialTab)
  pickerSelection.value = new Set()
  showPicker.value = true
  await nextTick()
  searchInputRef.value?.focus()
}

function closePicker() {
  showPicker.value = false
  itemSearch.value = ''
  pickerArtistFilter.value = null
  pickerSelection.value = new Set()
}

function togglePickerItem(code: string) {
  if (isAlreadyAdded(code)) return
  const s = new Set(pickerSelection.value)
  if (s.has(code)) s.delete(code)
  else s.add(code)
  pickerSelection.value = s
}

function selectAllVisible() {
  const s = new Set(pickerSelection.value)
  for (const item of filteredPickerItems.value) {
    if (!isAlreadyAdded(item.code)) s.add(item.code)
  }
  pickerSelection.value = s
}

async function addSelectedItems() {
  const currency = cs.currentSession?.currency ?? 'IDR'
  const toAdd = pickerItems.value.filter(i => pickerSelection.value.has(i.code))
  const records = toAdd.map(item => {
    const artist = pickerArtists.value.find(a => a.id === item.artistId)
    return {
      itemCode: item.code,
      itemName: item.name,
      quantityConsigned: 0,
      quantitySold: 0,
      sellingPrice: currency === 'IDR' ? (item.priceIDR ?? 0) : (item.priceSGD ?? 0),
      printingCost: currency === 'IDR' ? (item.costIDR ?? 0) : (item.costSGD ?? 0),
      profitSharePercent: artist ? Math.round((artist.revenueShare ?? 0.5) * 100) : 50,
    }
  })
  await cs.bulkAddItems(records)
  // Update image map
  for (const item of toAdd) {
    if (item.image) itemImageMap.value[item.code] = item.image
  }
  closePicker()
}

// ─── Import from POS (in detail view — adds to current session) ────────────
const showImportPanel = ref(false)
const importPOSSessions = ref<any[]>([])
const importSelectedSession = ref<any>(null)
const importSales = ref<any[]>([])
const importItemMap = ref<Record<string, Item>>({})
const importArtistMap = ref<Record<number, Artist>>({})
let importSelection = ref(new Set<string>())
const importing = ref(false)

async function loadPOSSessions() {
  await ready
  const all = await db.sessions.toArray()
  importPOSSessions.value = all
    .filter(s => (s.status === 'ended' || (s.endedAt && !s.active)) && !s.archived)
    .sort((a, b) => b.date > a.date ? 1 : -1)
}

async function openImportFromPOS() {
  await loadPOSSessions()
  importSelectedSession.value = null
  importSales.value = []
  importSelection.value = new Set()
  showImportPanel.value = true
}

function closeImportPanel() {
  showImportPanel.value = false
  importSelectedSession.value = null
  importSales.value = []
  importSelection.value = new Set()
}

async function selectPOSSessionForImport(sess: any) {
  importSelectedSession.value = sess
  await ready
  const allItems = await db.items.toArray()
  const allArtists = await db.artists.toArray()
  // Build maps
  for (const item of allItems) importItemMap.value[item.code] = item
  for (const artist of allArtists) importArtistMap.value[artist.id!] = artist
  const sales = await db.sales.where('sessionId').equals(sess.id).toArray()
  importSales.value = sales.filter((s: any) => s.quantity > 0)
  // Pre-select all not already added
  importSelection.value = new Set(
    importSales.value.filter((s: any) => !isAlreadyAdded(s.itemCode)).map((s: any) => s.itemCode)
  )
}

function toggleImportItem(code: string) {
  const s = new Set(importSelection.value)
  if (s.has(code)) s.delete(code)
  else s.add(code)
  importSelection.value = s
}

function importSelectAll() {
  importSelection.value = new Set(
    importSales.value.filter((s: any) => !isAlreadyAdded(s.itemCode)).map((s: any) => s.itemCode)
  )
}

async function doImport() {
  importing.value = true
  try {
    const currency = cs.currentSession?.currency ?? importSelectedSession.value?.currency ?? 'IDR'
    const selectedSales = importSales.value.filter((s: any) => importSelection.value.has(s.itemCode))
    const records = selectedSales.map((sale: any) => {
      const item = importItemMap.value[sale.itemCode]
      const artist = item ? importArtistMap.value[item.artistId] : undefined
      const price = sale.customPrice ?? (currency === 'IDR' ? (item?.priceIDR ?? 0) : (item?.priceSGD ?? 0))
      const cost = sale.customCost ?? (currency === 'IDR' ? (item?.costIDR ?? 0) : (item?.costSGD ?? 0))
      return {
        itemCode: sale.itemCode,
        itemName: sale.customTitle ?? item?.name ?? sale.itemCode,
        quantityConsigned: sale.quantity,
        quantitySold: sale.quantity,
        sellingPrice: price,
        printingCost: cost,
        profitSharePercent: artist ? Math.round((artist.revenueShare ?? 0.5) * 100) : 50,
      }
    })
    await cs.bulkAddItems(records)
    // Update image map
    for (const sale of selectedSales) {
      const item = importItemMap.value[sale.itemCode]
      if (item?.image) itemImageMap.value[sale.itemCode] = item.image
    }
    closeImportPanel()
  } finally {
    importing.value = false
  }
}

// ─── "From POS" on sessions list (creates new consignment session) ─────────
const showFromPOSModal = ref(false)
const fromPOSStep = ref(1)
const fromPOSSelectedSession = ref<any>(null)

async function openFromPOS() {
  await loadPOSSessions()
  fromPOSStep.value = 1
  fromPOSSelectedSession.value = null
  importSales.value = []
  showFromPOSModal.value = true
}

async function selectFromPOSSession(sess: any) {
  fromPOSSelectedSession.value = sess
  await ready
  const allItems = await db.items.toArray()
  const allArtists = await db.artists.toArray()
  for (const item of allItems) importItemMap.value[item.code] = item
  for (const artist of allArtists) importArtistMap.value[artist.id!] = artist
  const sales = await db.sales.where('sessionId').equals(sess.id).toArray()
  importSales.value = sales.filter((s: any) => s.quantity > 0)
  // Pre-fill create form from POS session
  createForm.name = sess.name + ' — Consignment'
  createForm.date = sess.date
  createForm.currency = sess.currency
  createForm.platform = ''
  fromPOSStep.value = 2
}

async function createFromPOS() {
  if (!fromPOSSelectedSession.value) return
  creating.value = true
  try {
    const currency = createForm.currency
    const records = importSales.value.map((sale: any) => {
      const item = importItemMap.value[sale.itemCode]
      const artist = item ? importArtistMap.value[item.artistId] : undefined
      const price = sale.customPrice ?? (currency === 'IDR' ? (item?.priceIDR ?? 0) : (item?.priceSGD ?? 0))
      const cost = sale.customCost ?? (currency === 'IDR' ? (item?.costIDR ?? 0) : (item?.costSGD ?? 0))
      return {
        itemCode: sale.itemCode,
        itemName: sale.customTitle ?? item?.name ?? sale.itemCode,
        quantityConsigned: sale.quantity,
        quantitySold: sale.quantity,
        sellingPrice: price,
        printingCost: cost,
        profitSharePercent: artist ? Math.round((artist.revenueShare ?? 0.5) * 100) : 50,
      }
    })
    await cs.createSession({
      name: createForm.name,
      date: createForm.date,
      currency: createForm.currency,
      platform: createForm.platform || undefined,
      artistId: createForm.artistId ?? undefined,
    })
    await cs.bulkAddItems(records)
    // Update image map
    for (const sale of importSales.value) {
      const item = importItemMap.value[sale.itemCode]
      if (item?.image) itemImageMap.value[sale.itemCode] = item.image
    }
    showFromPOSModal.value = false
  } finally {
    creating.value = false
  }
}

// ─── Fees ──────────────────────────────────────────────────────────────────
const newFee = reactive({ name: '', type: 'fixed' as 'fixed' | 'percentage', value: 0 })

async function addFee() {
  await cs.addFee({ id: Date.now().toString(), ...newFee })
  Object.assign(newFee, { name: '', type: 'fixed', value: 0 })
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function fmt(amount: number): string {
  const c = cs.currentSession?.currency ?? 'IDR'
  if (c === 'IDR') return 'Rp' + Math.round(amount).toLocaleString('id-ID')
  return '$' + amount.toFixed(2)
}

const PAYOUT_STAGES = [
  { value: 'draft' as const,   label: 'Draft',             activeClass: 'border-gray-500 bg-gray-800 text-gray-200' },
  { value: 'pending' as const, label: 'Payment Pending',   activeClass: 'border-amber-600 bg-amber-900/50 text-amber-300' },
  { value: 'paid' as const,    label: '✓ Paid',            activeClass: 'border-emerald-600 bg-emerald-900/50 text-emerald-300' },
]

function statusBadge(status: string): string {
  return { draft: 'badge-blue', pending: 'badge-yellow', paid: 'badge-green' }[status] ?? 'badge-blue'
}

function statusLabel(status: string): string {
  return { draft: 'Draft', pending: 'Pending', paid: 'Paid ✓' }[status] ?? status
}

async function createSession() {
  createError.value = ''
  creating.value = true
  try {
    await cs.createSession({
      name: createForm.name,
      date: createForm.date,
      currency: createForm.currency,
      platform: createForm.platform || undefined,
      notes: createForm.notes || undefined,
      artistId: createForm.artistId ?? undefined,
    })
    showCreate.value = false
    Object.assign(createForm, { name: '', date: new Date().toISOString().split('T')[0], currency: 'IDR', platform: '', notes: '', artistId: null })
  } catch (err: any) {
    createError.value = err?.message ?? 'Failed to create session.'
  } finally {
    creating.value = false
  }
}

async function deleteSession(id: number) {
  if (!confirm('Delete this consignment session and all its items?')) return
  await cs.deleteSession(id)
}

function exportCSV() {
  if (!cs.currentSession) return
  exportConsignmentCSV({ session: cs.currentSession as any, items: cs.currentItems, calcItem: cs.calcItem as any })
}

function exportPDF() {
  if (!cs.currentSession) return
  exportConsignmentPDF({ session: cs.currentSession as any, items: cs.currentItems, calcItem: cs.calcItem as any, totals: cs.sessionTotals })
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────

onMounted(async () => {
  await ready
  await cs.loadSessions()
  await loadInvoices()
  // Load artists for map + pickers
  const artists = await db.artists.toArray()
  allArtistsList.value = artists.filter((a: Artist) => !a.isSpecialTab)
  for (const a of artists) {
    if (a.id) artistMap.value[a.id] = a
  }
  // Rebuild image map for any existing items
  if (cs.currentItems.length) {
    const allItems = await db.items.toArray()
    for (const item of allItems) {
      if (item.image) itemImageMap.value[item.code] = item.image
    }
  }
})

// Rebuild image map when session is opened
watch(() => cs.currentSession, async (sess) => {
  if (!sess) return
  await ready
  const allItems = await db.items.toArray()
  for (const item of allItems) {
    if (item.image) itemImageMap.value[item.code] = item.image
  }
})
</script>
