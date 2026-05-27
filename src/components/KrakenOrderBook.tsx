import { useEffect, useState } from 'react';

interface Level {
  price: number;
  size: number;
}

interface OrderBookData {
  asks: Level[];
  bids: Level[];
  walls: { side: 'ASK' | 'BID'; price: number; size: number }[];
}

const WALL_THRESHOLD = 10_000_000; // 10M DOG

export function KrakenOrderBook() {
  const [data, setData] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderBook = async () => {
    try {
      setLoading(true);
      // Kraken public REST API - no auth, no WSL needed
      const res = await fetch('https://api.kraken.com/0/public/Depth?pair=DOGUSD&count=30');
      const json = await res.json();

      if (json.error && json.error.length > 0) {
        throw new Error(json.error[0]);
      }

      const book = json.result.DOGUSD;
      const asks: Level[] = book.asks.map(([p, s]: [string, string]) => ({
        price: parseFloat(p),
        size: parseFloat(s),
      }));
      const bids: Level[] = book.bids.map(([p, s]: [string, string]) => ({
        price: parseFloat(p),
        size: parseFloat(s),
      }));

      // Detect walls (cumulative at level >= 10M DOG)
      const walls = [
        ...asks.filter(a => a.size >= WALL_THRESHOLD).map(a => ({ side: 'ASK' as const, price: a.price, size: a.size })),
        ...bids.filter(b => b.size >= WALL_THRESHOLD).map(b => ({ side: 'BID' as const, price: b.price, size: b.size })),
      ];

      setData({ asks: asks.slice(0, 8), bids: bids.slice(0, 8), walls });
      setError(null);
    } catch (e: any) {
      setError('Failed to load order book from Kraken');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 45000); // refresh every 45s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <div className="card p-6 text-sm text-[#666]">Loading Kraken order book...</div>;
  }

  if (error) {
    return <div className="card p-6 text-sm text-red-400">{error}</div>;
  }

  if (!data) return null;

  const maxSize = Math.max(
    ...data.asks.map(a => a.size),
    ...data.bids.map(b => b.size)
  );

  return (
    <div className="card p-5">
      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        {/* BIDS - Left side (green) */}
        <div>
          <div className="flex justify-between text-green-400 mb-1.5 px-1">
            <span>BIDS</span>
            <span>Size</span>
          </div>
          {data.bids.map((b, i) => {
            const isWall = b.size >= WALL_THRESHOLD;
            const barWidth = Math.max((b.size / maxSize) * 100, 3);
            return (
              <div key={i} className={`relative flex justify-between items-center py-0.5 px-1 rounded ${isWall ? 'bg-green-900/30' : ''}`}>
                <div className="absolute left-0 top-0 bottom-0 bg-green-500/20 rounded" style={{ width: `${barWidth}%` }} />
                <span className={`relative z-10 ${isWall ? 'text-green-400 font-semibold' : ''}`}>
                  ${b.price.toFixed(6)}
                </span>
                <span className={`relative z-10 text-right ${isWall ? 'font-semibold' : 'text-[#aaa]'}`}>
                  {(b.size / 1_000_000).toFixed(2)}M
                </span>
              </div>
            );
          })}
        </div>

        {/* ASKS - Right side (red) */}
        <div>
          <div className="flex justify-between text-red-400 mb-1.5 px-1">
            <span>ASKS</span>
            <span>Size</span>
          </div>
          {data.asks.map((a, i) => {
            const isWall = a.size >= WALL_THRESHOLD;
            const barWidth = Math.max((a.size / maxSize) * 100, 3);
            return (
              <div key={i} className={`relative flex justify-between items-center py-0.5 px-1 rounded ${isWall ? 'bg-red-900/30' : ''}`}>
                <div className="absolute right-0 top-0 bottom-0 bg-red-500/20 rounded" style={{ width: `${barWidth}%` }} />
                <span className={`relative z-10 ${isWall ? 'text-red-400 font-semibold' : ''}`}>
                  ${a.price.toFixed(6)}
                </span>
                <span className={`relative z-10 text-right ${isWall ? 'font-semibold' : 'text-[#aaa]'}`}>
                  {(a.size / 1_000_000).toFixed(2)}M
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[10px] text-[#555] mt-3 font-mono flex justify-between">
        <span>Auto-refreshing • Depth bars shown</span>
        <span>Walls ≥ 10M DOG highlighted</span>
      </div>
    </div>
  );
}
