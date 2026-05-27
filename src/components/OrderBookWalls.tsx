import { useState } from 'react';
import { getOrderbookWithWalls, OrderBookWall } from '../lib/kraken';

interface Props {
  pair?: string;
  wallThreshold?: number;
  onWallsDetected?: (walls: OrderBookWall[]) => void;
}

export function OrderBookWalls({ pair = "DOG/USD", wallThreshold = 10_000_000, onWallsDetected }: Props) {
  const [loading, setLoading] = useState(false);
  const [walls, setWalls] = useState<OrderBookWall[]>([]);
  const [mid, setMid] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAndAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getOrderbookWithWalls(pair, 40, wallThreshold);
      setWalls(result.walls);
      setMid(result.mid);

      if (onWallsDetected) {
        onWallsDetected(result.walls);
      }
    } catch (e: any) {
      setError("Failed to fetch order book. Make sure Kraken CLI is accessible via WSL.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const sellWalls = walls.filter(w => w.side === 'ASK');
  const buyWalls = walls.filter(w => w.side === 'BID');

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold flex items-center gap-2">
            Order Book Walls
            <span className="text-xs px-2 py-0.5 rounded bg-[#222] text-[#f5a623]">≥ 10M DOG</span>
          </div>
          <div className="text-xs text-[#666]">Kraken • {pair}</div>
        </div>

        <button 
          onClick={fetchAndAnalyze} 
          disabled={loading}
          className="btn-ghost text-xs"
        >
          {loading ? "Scanning..." : "Scan Order Book"}
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm mb-4">{error}</div>
      )}

      {walls.length > 0 && (
        <div className="space-y-4">
          {/* Sell Walls (Resistance) */}
          <div>
            <div className="text-xs text-red-400 font-mono mb-2">SELL WALLS (Resistance)</div>
            {sellWalls.length > 0 ? (
              sellWalls.map((wall, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-[#222]">
                  <span className="font-mono text-red-400">${wall.price.toFixed(6)}</span>
                  <span className="font-mono">{(wall.size / 1_000_000).toFixed(1)}M DOG</span>
                  <span className="text-[#666]">${(wall.usdValue / 1_000_000).toFixed(1)}M</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#555]">No significant sell walls detected</div>
            )}
          </div>

          {/* Buy Walls (Support) */}
          <div>
            <div className="text-xs text-green-400 font-mono mb-2">BUY WALLS (Support)</div>
            {buyWalls.length > 0 ? (
              buyWalls.map((wall, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-[#222]">
                  <span className="font-mono text-green-400">${wall.price.toFixed(6)}</span>
                  <span className="font-mono">{(wall.size / 1_000_000).toFixed(1)}M DOG</span>
                  <span className="text-[#666]">${(wall.usdValue / 1_000_000).toFixed(1)}M</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#555]">No significant buy walls detected</div>
            )}
          </div>
        </div>
      )}

      {walls.length === 0 && !loading && !error && (
        <div className="text-xs text-[#666]">
          Click "Scan Order Book" to analyze current liquidity walls on Kraken.
        </div>
      )}

      {mid && (
        <div className="text-[10px] text-[#555] mt-4 font-mono">
          Mid price: ${mid.toFixed(6)}
        </div>
      )}
    </div>
  );
}
