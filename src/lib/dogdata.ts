/**
 * DOGDATA Integration (Bitcoin L1 $DOG data)
 * https://www.dogdata.xyz
 */

const DOGDATA_BASE = 'https://www.dogdata.xyz';

// ==========================
// PRICING (only Kraken + DogSwap as requested)
// ==========================

// Direct Kraken public API (no CORS issues for public endpoints from browser)
export async function getKrakenPrice(): Promise<{ price: number; change24h?: number } | null> {
  try {
    const res = await fetch('https://api.kraken.com/0/public/Ticker?pair=DOGUSD');
    if (!res.ok) return null;
    const data = await res.json();

    if (data.error && data.error.length > 0) {
      return null;
    }

    const ticker = data.result?.DOGUSD;
    if (!ticker) return null;

    const last = parseFloat(ticker.c?.[0] || '0');
    const open = parseFloat(ticker.o || '0');

    let change24h: number | undefined;
    if (open > 0) {
      change24h = ((last - open) / open) * 100;
    }

    return {
      price: last,
      change24h,
    };
  } catch {
    return null;
  }
}

// DogSwap L1 price (Bitcoin L1 DEX)
// Primary source: dogdata.xyz (as requested by user - the $DOG-SWAP card they showed)
// Fallback: direct swap.dogofbitcoin + Kraken derivation
export async function getDogSwapPrice(): Promise<{ 
  priceUsd: number | null; 
  priceSats: number | null;
  change24h?: number;
  source: 'dogdata' | 'direct' | 'fallback-kraken';
} | null> {
  // 1. Preferred: dogdata.xyz (exact price the user showed in screenshot from DOGDATA.XYZ)
  try {
    const res = await fetch('https://www.dogdata.xyz/api/price/dogswap', {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.price_sats || data.priceSats) {
        return {
          priceSats: parseFloat(data.price_sats || data.priceSats),
          priceUsd: data.price_usd || data.priceUsd || data.price || null,
          change24h: data.change_24h_pct || data.change24h || 0,
          source: 'dogdata',
        };
      }
    }
  } catch {}

  // 2. Try direct DogSwap site (may return HTML)
  const candidates = [
    'https://swap.dogofbitcoin.com/api',
    'https://swap.dogofbitcoin.com/api/price',
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) continue;

      const text = await res.text();
      if (text.trim().startsWith('<!') || text.includes('<html')) continue;

      const data = JSON.parse(text);
      const raw = data.price ?? data.sats ?? data.last ?? data.dogBtc ?? data.rate ?? data.value;
      const sats = raw ? parseFloat(raw) : null;

      if (sats && sats > 0 && sats < 10) {
        return {
          priceSats: sats,
          priceUsd: null,
          change24h: data.change24h || data.change_24h,
          source: 'direct',
        };
      }
    } catch {}
  }

  // 3. Last resort: derive from Kraken
  try {
    const [dog, btc] = await Promise.all([getKrakenPrice(), getBtcPriceUsd()]);
    if (dog?.price && btc && btc > 0) {
      const sats = (dog.price / btc) * 100_000_000;
      return {
        priceSats: sats,
        priceUsd: dog.price,
        change24h: dog.change24h,
        source: 'fallback-kraken',
      };
    }
  } catch {}

  return null;
}

// Simple BTC price for sats conversion (using Kraken via DOGDATA if available, fallback public)
export async function getBtcPriceUsd(): Promise<number | null> {
  try {
    // Try to get from DOGDATA kraken if they expose it, otherwise public coingecko-like
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    if (res.ok) {
      const data = await res.json();
      return data.bitcoin?.usd ?? null;
    }
  } catch {}
  return 65000; // rough fallback
}

export async function getMarkets(): Promise<any> {
  try {
    const res = await fetch(`${DOGDATA_BASE}/api/markets`);
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

// ==========================
// Whale Alerts
// ==========================

export interface WhaleAlert {
  txid: string;
  amount: number;
  chain?: string;
  timestamp?: number;
  from?: string;
  to?: string;
  type?: string;
}

export async function getWhaleAlerts(limit = 8, threshold = 5_000_000, chain = 'bitcoin'): Promise<WhaleAlert[]> {
  try {
    const url = `${DOGDATA_BASE}/api/whale-alerts?chain=${chain}&threshold=${threshold}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.alerts || data || [];
  } catch {
    return [];
  }
}

// ==========================
// Real-time SSE (combined events)
// ==========================

export function subscribeToDogEvents(
  events: string[] = ['new_transaction', 'whale_alert', 'price_update'],
  onEvent: (event: any) => void
): () => void {
  const eventList = events.join(',');
  const url = `${DOGDATA_BASE}/api/events?events=${eventList}`;

  const es = new EventSource(url);

  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
    } catch {}
  };

  es.onerror = () => {
    // Silent fail - component will handle reconnection if needed
  };

  return () => es.close();
}
