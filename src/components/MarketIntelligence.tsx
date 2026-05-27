import { useEffect, useState } from 'react';
import { getKrakenPrice, getDogSwapPrice, getBtcPriceUsd } from '../lib/dogdata';
import { KrakenOrderBook } from './KrakenOrderBook';

interface PriceData {
  krakenUsd: number | null;
  dogswapUsd: number | null;
  krakenSats: number | null;
  dogswapSats: number | null;
  spread: number | null;
}

export function MarketIntelligence() {
  const [prices, setPrices] = useState<PriceData>({ 
    krakenUsd: null, 
    dogswapUsd: null, 
    krakenSats: null, 
    dogswapSats: null, 
    spread: null 
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dogswapSource, setDogswapSource] = useState<'dogdata' | 'direct' | 'fallback-kraken' | null>(null);

  const fetchPrices = async () => {
    try {
      const [kraken, dogswap, btc] = await Promise.all([
        getKrakenPrice(),
        getDogSwapPrice(),
        getBtcPriceUsd(),
      ]);

      const kUsd = kraken?.price ?? null;
      const btcUsd = btc ?? 65000;

      // Kraken sats
      const kSats = (kUsd && btcUsd > 0) ? (kUsd / btcUsd) * 100_000_000 : null;

      // DogSwap L1 (primary per user request)
      const dSats = dogswap?.priceSats ?? null;
      let dUsd = dogswap?.priceUsd ?? null;
      const dSource = dogswap?.source ?? null;

      // Fallback calculation if needed
      if (dSats && !dUsd && btcUsd > 0) {
        dUsd = (dSats / 100_000_000) * btcUsd;
      }

      let spread: number | null = null;
      if (kUsd && dUsd && kUsd > 0) {
        spread = ((dUsd - kUsd) / kUsd) * 100;
      }

      setPrices({
        krakenUsd: kUsd,
        dogswapUsd: dUsd,
        krakenSats: kSats,
        dogswapSats: dSats,
        spread,
      });
      setDogswapSource(dSource);
      setLastUpdate(new Date());
      setError(null);
    } catch (e) {
      setError("Could not load prices (external API)");
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const formatUsd = (p: number | null) => p ? `$${p.toFixed(6)}` : '—';
  const formatSats = (s: number | null) => s ? `${Math.round(s).toLocaleString()} sats` : '—';

  const spreadColor = prices.spread !== null 
    ? (prices.spread > 0 ? 'text-green-400' : 'text-red-400') 
    : 'text-[#666]';

  return (
    <div className="space-y-6">
      {/* Price Comparison */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold">DOG Price — Kraken vs DogSwap (L1)</div>
            <div className="text-xs text-[#666]">Key for inventory-based arbitrage</div>
          </div>
          {lastUpdate && (
            <div className="text-[10px] text-[#555] font-mono">
              {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Kraken */}
          <div className={`p-4 rounded-xl border ${prices.spread !== null && prices.spread < 0 ? 'border-green-500 bg-green-900/10' : 'border-[#222] bg-[#111]'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-[#888]">KRAKEN</span>
              {prices.spread !== null && prices.spread < 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-green-900/30 text-green-400">CHEAPER</span>
              )}
            </div>
            <div className="text-3xl font-mono text-[#f5a623] leading-none mb-0.5">{formatUsd(prices.krakenUsd)}</div>
            <div className="text-sm font-mono text-[#aaa]">{formatSats(prices.krakenSats)}</div>
          </div>

          {/* DogSwap */}
          <div className={`p-4 rounded-xl border ${prices.spread !== null && prices.spread > 0 ? 'border-green-500 bg-green-900/10' : 'border-[#222] bg-[#111]'}`}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888]">DOGSWAP (L1)</span>
                {dogswapSource === 'dogdata' && (
                  <span className="text-[9px] px-1.5 py-px rounded bg-[#1a3a1a] text-green-400">DOGDATA.XYZ</span>
                )}
                {dogswapSource === 'fallback-kraken' && (
                  <span className="text-[9px] px-1.5 py-px rounded bg-[#333] text-[#aaa]">via Kraken (fallback)</span>
                )}
                {dogswapSource === 'direct' && (
                  <span className="text-[9px] px-1.5 py-px rounded bg-[#1a3a1a] text-green-400">direct</span>
                )}
              </div>
              {prices.spread !== null && prices.spread > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-green-900/30 text-green-400">CHEAPER</span>
              )}
            </div>
            <div className="text-3xl font-mono text-[#f5a623] leading-none mb-0.5">
              {formatUsd(prices.dogswapUsd)}
            </div>
            <div className="text-sm font-mono text-[#aaa]">
              {prices.dogswapSats ? formatSats(prices.dogswapSats) : 'Loading from DogSwap...'}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-[#111] border border-[#222]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-[#888]">SPREAD</span>
              <span className={`ml-3 text-2xl font-mono ${spreadColor}`}>
                {prices.spread !== null ? `${prices.spread > 0 ? '+' : ''}${prices.spread.toFixed(2)}%` : '—'}
              </span>
            </div>

            {prices.spread !== null && Math.abs(prices.spread) > 2 && (
              <div className="text-right">
                <div className="text-xs text-[#f5a623]">
                  {prices.spread > 0 
                    ? "Buy on DogSwap → Sell on Kraken" 
                    : "Buy on Kraken → Sell on DogSwap"}
                </div>
                <div className="text-[10px] text-[#666]">Check your inventory positions</div>
              </div>
            )}
          </div>
        </div>

        {error && <div className="text-xs text-red-400 mt-2">{error}</div>}
      </div>

      {/* Order Book - Auto loads, no scan button */}
      <div>
        <div className="font-semibold mb-2 text-sm">Kraken Order Book (DOG/USD)</div>
        <KrakenOrderBook />
      </div>
    </div>
  );
}
