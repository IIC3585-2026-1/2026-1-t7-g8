<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, type Chart as ChartType } from 'chart.js/auto';
  import type { Coin } from '../lib/coins';
  import {
    EVT_SELECTION_CHANGED,
    type SelectionChangedDetail,
    requestSelection,
  } from '../lib/island-bus';

  type LivePrice = { price: number; changePct: number | null };
  type Props = { coins: Coin[] };

  let { coins }: Props = $props();

  let selected = $state<string[]>([]);
  let prices = $state<Record<string, LivePrice>>({});
  let connecting = $state(false);
  let status = $state<'idle' | 'connecting' | 'live' | 'error'>('idle');

  const coinBySymbol = $derived(
    Object.fromEntries(coins.map((c) => [c.symbol, c])) as Record<string, Coin>,
  );
  const selectedCoins = $derived(selected.map((s) => coinBySymbol[s]).filter(Boolean) as Coin[]);

  let ws: WebSocket | null = null;
  const charts = new Map<string, ChartType>();
  const series = new Map<string, { labels: number[]; values: number[] }>();
  const MAX_POINTS = 60;

  function fmtPrice(value: number): string {
    if (value >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (value >= 1) return value.toFixed(2);
    return value.toFixed(4);
  }

  function fmtPct(value: number | null): string {
    if (value === null || !Number.isFinite(value)) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  async function seedHistory(symbol: string, binanceSymbol: string): Promise<void> {
    try {
      const r = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1m&limit=${MAX_POINTS}`,
      );
      if (!r.ok) throw new Error(`klines ${r.status}`);
      const rows: unknown[] = await r.json();
      const labels: number[] = [];
      const values: number[] = [];
      for (const row of rows as Array<[number, string, string, string, string]>) {
        labels.push(row[0]);
        values.push(parseFloat(row[4]));
      }
      series.set(symbol, { labels, values });
      const last = values[values.length - 1];
      const first = values[0];
      if (Number.isFinite(last)) {
        prices = {
          ...prices,
          [symbol]: { price: last, changePct: first ? ((last - first) / first) * 100 : null },
        };
      }
    } catch (e) {
      console.warn(`[PriceTicker] history seed failed for ${symbol}`, e);
      series.set(symbol, { labels: [], values: [] });
    }
  }

  function ensureChart(symbol: string): void {
    const canvas = document.getElementById(`chart-${symbol}`) as HTMLCanvasElement | null;
    if (!canvas) return;
    const existing = charts.get(symbol);
    if (existing) existing.destroy();
    const s = series.get(symbol);
    if (!s) return;
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: s.labels.map(String),
        datasets: [
          {
            data: s.values,
            borderColor: '#0f172a',
            borderWidth: 1.5,
            fill: true,
            backgroundColor: 'rgba(15,23,42,0.06)',
            tension: 0.3,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: false },
        },
      },
    });
    charts.set(symbol, chart);
  }

  function pushPoint(symbol: string, price: number): void {
    const s = series.get(symbol);
    if (!s) return;
    s.labels.push(Date.now());
    s.values.push(price);
    if (s.values.length > MAX_POINTS) {
      s.labels.shift();
      s.values.shift();
    }
    const chart = charts.get(symbol);
    if (chart) {
      chart.data.labels = s.labels.map(String);
      chart.data.datasets[0].data = s.values;
      chart.update('none');
    }
  }

  function closeStream(): void {
    if (ws) {
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      try {
        ws.close();
      } catch {
      }
      ws = null;
    }
  }

  function openStream(symbols: string[]): void {
    closeStream();
    if (symbols.length === 0) {
      status = 'idle';
      return;
    }
    const streams = symbols
      .map((s) => coinBySymbol[s])
      .filter(Boolean)
      .map((c) => `${c.binanceSymbol.toLowerCase()}@miniTicker`)
      .join('/');
    if (!streams) return;
    status = 'connecting';
    ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    ws.onopen = () => {
      status = 'live';
    };
    ws.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data) as {
          data?: { s?: string; c?: string; o?: string };
        };
        const tick = payload.data;
        if (!tick?.s || !tick.c) return;
        const binSym = tick.s.toUpperCase();
        const coin = coins.find((c) => c.binanceSymbol === binSym);
        if (!coin) return;
        const close = parseFloat(tick.c);
        const open = parseFloat(tick.o ?? '0');
        const changePct = open ? ((close - open) / open) * 100 : null;
        prices = { ...prices, [coin.symbol]: { price: close, changePct } };
        pushPoint(coin.symbol, close);
      } catch {
        /* malformed frame */
      }
    };
    ws.onerror = () => {
      status = 'error';
    };
    ws.onclose = () => {
      if (status === 'live') status = 'idle';
    };
  }

  async function reload(symbols: string[]): Promise<void> {
    if (connecting) return;
    connecting = true;
    closeStream();
    for (const [, chart] of charts) chart.destroy();
    charts.clear();
    series.clear();
    if (symbols.length === 0) {
      connecting = false;
      status = 'idle';
      return;
    }
    await Promise.all(
      symbols.map((sym) => {
        const coin = coinBySymbol[sym];
        if (!coin) return Promise.resolve();
        return seedHistory(sym, coin.binanceSymbol);
      }),
    );
    await Promise.resolve();
    queueMicrotask(() => {
      for (const sym of symbols) ensureChart(sym);
      openStream(symbols);
    });
    connecting = false;
  }

  function handleSelection(e: Event): void {
    const detail = (e as CustomEvent<SelectionChangedDetail>).detail;
    if (!detail || !Array.isArray(detail.symbols)) return;
    const next = Array.from(detail.symbols);
    const same = next.length === selected.length && next.every((s) => selected.includes(s));
    selected = next;
    if (!same) reload(next);
  }

  onMount(() => {
    window.addEventListener(EVT_SELECTION_CHANGED, handleSelection);
    requestSelection();
    return () => {
      window.removeEventListener(EVT_SELECTION_CHANGED, handleSelection);
      closeStream();
      for (const [, chart] of charts) chart.destroy();
      charts.clear();
    };
  });
</script>

<section
  class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
  aria-labelledby="ticker-title"
>
  <header class="mb-4 flex items-center justify-between">
    <div>
      <p class="mt-1 text-lg font-semibold text-slate-900">Streaming desde Binance (WebSockets)</p>
    </div>
    <span class="inline-flex items-center gap-2 text-xs">
      {#if status === 'live'}
        <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="text-slate-600">En vivo</span>
      {:else if status === 'connecting'}
        <span class="h-2 w-2 rounded-full bg-amber-500"></span>
        <span class="text-slate-600">Conectando…</span>
      {:else if status === 'error'}
        <span class="h-2 w-2 rounded-full bg-rose-500"></span>
        <span class="text-slate-600">Desconectado</span>
      {:else}
        <span class="h-2 w-2 rounded-full bg-slate-300"></span>
        <span class="text-slate-500">Inactivo</span>
      {/if}
    </span>
  </header>
  <p class="mb-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
    Si no nos crees que son datos reales y en vivo, haz click sobre la tarjeta de la 
    criptomoneda que quieras para abrir su página en CoinGecko.
  </p>

  {#if selectedCoins.length === 0}
    <div class="py-16 text-center text-sm text-slate-400">
      Pick at least one coin in the filter panel to start streaming.
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each selectedCoins as coin (coin.symbol)}
        {@const live = prices[coin.symbol]}
        {@const pct = live?.changePct ?? null}
        {@const up = pct !== null && pct >= 0}
        <a
          href={`https://www.coingecko.com/es/monedas/${coin.coingeckoId}`}
          target="_blank"
          rel="noopener noreferrer"
          class="block"
          title={`Ver ${coin.name} en CoinGecko`}
        >
        <article
          class="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:-translate-y-0.5"
        >
          <div class="flex items-center gap-3">
            {#if coin.iconUrl}
              <img
                src={coin.iconUrl}
                alt=""
                width="28"
                height="28"
                class="rounded-full"
                loading="lazy"
              />
            {:else}
              <span class="h-7 w-7 rounded-full bg-slate-200" aria-hidden="true"></span>
            {/if}
            <div class="flex-1">
              <p class="text-sm font-semibold text-slate-900">{coin.symbol}</p>
              <p class="text-xs text-slate-500">{coin.name}</p>
            </div>
            <div class="text-right">
              <p class="text-base font-semibold tabular-nums text-slate-900">
                {live ? `$${fmtPrice(live.price)}` : '—'}
              </p>
              <p class="text-xs tabular-nums" class:text-emerald-600={up} class:text-rose-600={pct !== null && !up}>
                {fmtPct(pct)}
              </p>
            </div>
          </div>
          <div class="mt-3 h-16 relative">
            <canvas id={`chart-${coin.symbol}`} class="absolute inset-0"></canvas>
          </div>
        </article>
        </a>
      {/each}
    </div>
  {/if}
</section>
