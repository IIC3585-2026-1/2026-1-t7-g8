<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Coin } from '../lib/coins';
import {
  EVT_REQUEST_SELECTION,
  STORAGE_KEY,
  dispatchSelection,
} from '../lib/island-bus';

const props = defineProps<{ coins: Coin[]; defaults: string[] }>();

const query = ref('');
const selected = ref<string[]>([...props.defaults]);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.coins;
  return props.coins.filter(
    (c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
  );
});

function loadFromStorage(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
      return parsed;
    }
  } catch {
    /* ignore corrupted storage */
  }
  return null;
}

function saveToStorage(value: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage may be disabled */
  }
}

function toggle(symbol: string): void {
  if (selected.value.includes(symbol)) {
    selected.value = selected.value.filter((s) => s !== symbol);
  } else {
    selected.value = [...selected.value, symbol];
  }
}

function selectAll(): void {
  selected.value = props.coins.map((c) => c.symbol);
}

function clearAll(): void {
  selected.value = [];
}

function onRequest(): void {
  dispatchSelection([...selected.value]);
}

watch(
  selected,
  (next) => {
    const plain = [...next];
    saveToStorage(plain);
    dispatchSelection(plain);
  },
  { deep: true },
);

onMounted(() => {
  const stored = loadFromStorage();
  if (stored) selected.value = stored;
  window.addEventListener(EVT_REQUEST_SELECTION, onRequest);
  dispatchSelection([...selected.value]);
});

onBeforeUnmount(() => {
  window.removeEventListener(EVT_REQUEST_SELECTION, onRequest);
});
</script>

<template>
  <section
    class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit sticky top-20"
    aria-labelledby="filter-title"
  >
    <header class="mb-4">
      <h2 id="filter-title" class="text-sm font-semibold uppercase tracking-wider text-slate-500">
        Filters
      </h2>
      <p class="mt-1 text-lg font-semibold text-slate-900">Choose coins</p>
      <p class="text-sm text-slate-500">
        {{ selected.length }} of {{ coins.length }} selected
      </p>
    </header>

    <label class="block">
      <span class="sr-only">Search coins</span>
      <input
        v-model="query"
        type="search"
        placeholder="Search BTC, Ethereum…"
        class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 transition"
      />
    </label>

    <div class="mt-2 flex gap-2 text-xs">
      <button
        type="button"
        class="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 transition"
        @click="selectAll"
      >
        Select all
      </button>
      <button
        type="button"
        class="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 transition"
        @click="clearAll"
      >
        Clear
      </button>
    </div>

    <ul class="mt-3 max-h-96 overflow-auto divide-y divide-slate-100" role="list">
      <li v-for="coin in filtered" :key="coin.symbol">
        <label
          class="flex items-center gap-3 py-2 px-1 cursor-pointer hover:bg-slate-50 rounded-md transition"
        >
          <input
            type="checkbox"
            :checked="selected.includes(coin.symbol)"
            class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            @change="toggle(coin.symbol)"
          />
          <img
            v-if="coin.iconUrl"
            :src="coin.iconUrl"
            :alt="''"
            width="20"
            height="20"
            class="rounded-full"
            loading="lazy"
          />
          <span v-else class="h-5 w-5 rounded-full bg-slate-200" aria-hidden="true"></span>
          <span class="flex-1 text-sm">
            <span class="font-medium text-slate-900">{{ coin.symbol }}</span>
            <span class="ml-2 text-slate-500">{{ coin.name }}</span>
          </span>
        </label>
      </li>
      <li v-if="filtered.length === 0" class="py-6 text-center text-sm text-slate-400">
        No matches.
      </li>
    </ul>
  </section>
</template>
