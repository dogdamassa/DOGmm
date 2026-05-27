import { useEffect, useState } from 'react';

interface DogTransaction {
  txid: string;
  block_height?: number;
  timestamp?: number;
  amount?: number; // in DOG (satoshis or normalized?)
  from?: string;
  to?: string;
  type?: string;
}

interface LiveDogTransactionsProps {
  maxItems?: number;
}

export function LiveDogTransactions({ maxItems = 8 }: LiveDogTransactionsProps) {
  const [transactions, setTransactions] = useState<DogTransaction[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('https://www.dogdata.xyz/api/events?events=new_transaction');

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // The event structure from DOGDATA may vary. We normalize here.
        const newTx: DogTransaction = {
          txid: data.txid || data.transaction_id || 'unknown',
          timestamp: data.timestamp || Date.now() / 1000,
          amount: data.amount || data.value || 0,
          from: data.from || data.sender,
          to: data.to || data.receiver,
          type: data.type || 'transfer',
        };

        setTransactions(prev => {
          const updated = [newTx, ...prev].slice(0, maxItems);
          return updated;
        });
        setLastUpdate(new Date());
      } catch (e) {
        // Ignore parse errors for now
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [maxItems]);

  const formatAmount = (amount: number) => {
    if (!amount) return '—';
    // Assuming amount comes in smallest unit (like satoshis for runes)
    const dog = amount / 1e8; // common for many runes
    if (dog > 1_000_000) return `${(dog / 1_000_000).toFixed(1)}M`;
    if (dog > 1_000) return `${(dog / 1_000).toFixed(1)}K`;
    return dog.toFixed(0);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold">Live $DOG Transactions</div>
          <div className="text-xs text-[#666]">Bitcoin L1 • Real-time via DOGDATA</div>
        </div>
        <div className={`text-xs px-2 py-1 rounded ${connected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
          {connected ? 'LIVE' : 'DISCONNECTED'}
        </div>
      </div>

      {transactions.length === 0 && (
        <div className="text-sm text-[#666] py-4">
          Waiting for on-chain activity...
        </div>
      )}

      <div className="space-y-2 text-sm font-mono">
        {transactions.map((tx, index) => (
          <div key={index} className="flex justify-between items-center py-1 border-b border-[#222] last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-[#f5a623]">{formatAmount(tx.amount || 0)}</span>
              <span className="text-[#888] text-xs truncate max-w-[180px]">
                {tx.txid.slice(0, 12)}...
              </span>
            </div>
            <div className="text-xs text-[#555]">
              {tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleTimeString() : 'now'}
            </div>
          </div>
        ))}
      </div>

      {lastUpdate && (
        <div className="text-[10px] text-[#555] mt-4 font-mono">
          Last update: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      <div className="text-[10px] text-[#444] mt-3">
        Data from dogdata.xyz (Bitcoin L1 on-chain)
      </div>
    </div>
  );
}
