/**
 * Kraken CLI Integration Helper
 * 
 * All calls go through WSL because Kraken CLI only has Linux builds.
 * This layer makes it easy to swap later if we get native Windows support.
 */

const KRAKEN_CMD = "~/.cargo/bin/kraken";

export async function runKrakenCommand(args: string[]): Promise<any> {
  const command = `wsl ${KRAKEN_CMD} ${args.join(" ")} -o json`;
  
  // In Tauri we will use shell API. For now this is the pattern.
  // In development (Vite), we can use a local proxy or manual testing.
  
  const res = await fetch("/api/kraken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
  });

  if (!res.ok) throw new Error("Failed to reach Kraken CLI");
  return res.json();
}

export async function getTicker(pair = "DOG/USD") {
  return runKrakenCommand(["ticker", pair]);
}

export async function getOrderbook(pair = "DOG/USD", count = 25) {
  return runKrakenCommand(["orderbook", pair, "--count", count.toString()]);
}

export async function getTrades(pair = "DOG/USD", count = 50) {
  return runKrakenCommand(["trades", pair, "--count", count.toString()]);
}

/**
 * Detects significant walls in the order book.
 * A "wall" is defined as cumulative liquidity >= 10M DOG at a specific price level
 * (or very tight cluster). Works for both asks (sell walls) and bids (buy walls).
 */
export interface OrderBookWall {
  side: 'ASK' | 'BID';
  price: number;
  size: number;           // DOG
  usdValue: number;
  isSignificant: boolean; // >= 10M DOG
}

export async function getOrderbookWithWalls(pair = "DOG/USD", count = 30, wallThreshold = 10_000_000): Promise<{
  asks: any[];
  bids: any[];
  walls: OrderBookWall[];
  mid: number;
}> {
  const data = await getOrderbook(pair, count);
  const book = data[pair];

  if (!book) {
    throw new Error("Invalid orderbook response");
  }

  const asks = book.asks.map(([price, size]: [string, string]) => ({
    price: parseFloat(price),
    size: parseFloat(size),
  }));

  const bids = book.bids.map(([price, size]: [string, string]) => ({
    price: parseFloat(price),
    size: parseFloat(size),
  }));

  const mid = (asks[0]?.price + bids[0]?.price) / 2 || 0;

  const walls: OrderBookWall[] = [];

  // Detect sell walls (asks)
  asks.forEach((level: any) => {
    if (level.size >= wallThreshold) {
      walls.push({
        side: 'ASK',
        price: level.price,
        size: level.size,
        usdValue: level.price * level.size,
        isSignificant: true,
      });
    }
  });

  // Detect buy walls (bids)
  bids.forEach((level: any) => {
    if (level.size >= wallThreshold) {
      walls.push({
        side: 'BID',
        price: level.price,
        size: level.size,
        usdValue: level.price * level.size,
        isSignificant: true,
      });
    }
  });

  return { asks, bids, walls, mid };
}
