export type Coin = {
  symbol: string;
  name: string;
  binanceSymbol: string;
  coingeckoId: string;
  iconUrl?: string;
  currentPrice?: number;
  priceChange24h?: number;
};

export const COINS: Coin[] = [
  { symbol: 'BTC', name: 'Bitcoin', binanceSymbol: 'BTCUSDT', coingeckoId: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', binanceSymbol: 'ETHUSDT', coingeckoId: 'ethereum' },
  { symbol: 'SOL', name: 'Solana', binanceSymbol: 'SOLUSDT', coingeckoId: 'solana' },
  { symbol: 'BNB', name: 'BNB', binanceSymbol: 'BNBUSDT', coingeckoId: 'binancecoin' },
  { symbol: 'XRP', name: 'XRP', binanceSymbol: 'XRPUSDT', coingeckoId: 'ripple' },
  { symbol: 'ADA', name: 'Cardano', binanceSymbol: 'ADAUSDT', coingeckoId: 'cardano' },
];

export const DEFAULT_SELECTION: string[] = COINS.map((c) => c.symbol);
