import React, { useState, useEffect } from "react";
import "./App.css";
import { Shield, TrendingUp, Zap, ArrowRight, Target } from "lucide-react";
import { StrategyWizard } from "./components/wizard/StrategyWizard";
import type { Strategy } from "./types/strategy";
import { MarketIntelligence } from "./components/MarketIntelligence";
import { getKrakenPrice, getDogSwapPrice, getBtcPriceUsd } from "./lib/dogdata";

// Proper Error Boundary so one crashing component (like MarketIntelligence) doesn't make the whole dashboard go black
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error("Dashboard component crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card p-6 border border-red-500/50">
          <div className="text-red-400 font-semibold mb-2">Something went wrong in this section</div>
          <div className="text-sm text-[#888]">Try refreshing the page (Ctrl + Shift + R). The rest of the cockpit should still work.</div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SafeMarketIntelligence() {
  return (
    <ErrorBoundary>
      <MarketIntelligence />
    </ErrorBoundary>
  );
}

function App() {
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  // Liquidity addition mini-flow state (for the nice two-button + preview experience)
  const [liqAmount, setLiqAmount] = useState(500);
  const [liqChoice, setLiqChoice] = useState<'current' | 'custom' | null>(null);

  // Custom split for the "new money only" (editable when user chooses Customize)
  const [customHodlPct, setCustomHodlPct] = useState(50);
  const [customRealizePct, setCustomRealizePct] = useState(20);
  const [customTradePct, setCustomTradePct] = useState(30);

  // Live prices for accurate inventory valuation
  const [krakenDogPriceUsd, setKrakenDogPriceUsd] = useState<number | null>(null);
  const [btcPriceUsd, setBtcPriceUsd] = useState<number | null>(null);
  const [dogswapSats, setDogswapSats] = useState<number | null>(null);

  const handleStrategyComplete = (completed: Strategy) => {
    setStrategy(completed);
    setShowWizard(false);
    // TODO: Persist to Tauri store / JSON file
    console.log("Strategy saved:", completed);
  };

  // Fetch prices periodically for accurate real holdings valuation from Inventory
  useEffect(() => {
    const fetchPrices = async () => {
      const [kraken, btc, dogswap] = await Promise.all([
        getKrakenPrice(),
        getBtcPriceUsd(),
        getDogSwapPrice(),
      ]);

      if (kraken?.price) setKrakenDogPriceUsd(kraken.price);
      if (btc) setBtcPriceUsd(btc);
      if (dogswap?.priceSats) setDogswapSats(dogswap.priceSats);
    };

    fetchPrices();
    const id = setInterval(fetchPrices, 60000);
    return () => clearInterval(id);
  }, []);

  // If user has a complete strategy → show clean minimalist portfolio-style dashboard
  if (strategy && !showWizard) {
    // Derived numbers for Add Liquidity preview (the old dcaPreview string is no longer rendered here)
    const currentTotal = strategy.totalCapital?.amount || 0;
    const tradePct = strategy.buckets?.trade || 0;
    const added = Math.max(0, liqAmount || 0);

    const addedToHodl = added * ((strategy.buckets?.hodl || 0) / 100);
    const addedToRealize = added * ((strategy.buckets?.realize || 0) / 100);
    const addedToTrade = added * (tradePct / 100);

    // ======================================================
    // REAL HOLDINGS FROM INVENTORY (what the user actually has)
    // ======================================================
    const inv = strategy.inventory || { kraken: {}, xverse: {}, dogswap: {}, external: {} };

    const totalDog = 
      (inv.kraken?.dog || 0) + 
      (inv.xverse?.dog || 0) + 
      (inv.dogswap?.dog || 0) + 
      (inv.external?.dog || 0);

    const totalBtc = 
      (inv.kraken?.btc || 0) + 
      (inv.xverse?.btc || 0) + 
      (inv.dogswap?.btc || 0) + 
      (inv.external?.btc || 0);

    const totalFiatUsd = 
      (inv.kraken?.usd || 0) + (inv.xverse?.usd || 0) + (inv.dogswap?.usd || 0) + (inv.external?.usd || 0);

    // Accurate valuation using correct price per venue
    const krakenDogValue = (inv.kraken?.dog || 0) * (krakenDogPriceUsd || 0);

    const l1Dog = (inv.dogswap?.dog || 0) + (inv.xverse?.dog || 0) + (inv.external?.dog || 0);
    const dogswapUsdPerDog = (dogswapSats && btcPriceUsd) 
      ? (dogswapSats / 100_000_000) * btcPriceUsd 
      : (krakenDogPriceUsd || 0);
    const l1DogValue = l1Dog * dogswapUsdPerDog;

    const btcValue = totalBtc * (btcPriceUsd || 0);
    const totalPortfolioUsd = krakenDogValue + l1DogValue + btcValue + totalFiatUsd;

    const newTotal = currentTotal + added;

    // For the new money inside Trade, distribute using current tradeSplit ratios
    const ts = (strategy.tradeSplit as any) || { dca: 0, hedge: 0, arbitrage: 0, reserve: 0 };
    const tradeSum = (ts.dca || 0) + (ts.hedge || 0) + (ts.arbitrage || 0) + (ts.reserve || 0) || 1;

    const addedDca = addedToTrade * ((ts.dca || 0) / tradeSum);
    const addedHedge = addedToTrade * ((ts.hedge || 0) / tradeSum);
    const addedArb = addedToTrade * ((ts.arbitrage || 0) / tradeSum);
    const addedReserve = addedToTrade * ((ts.reserve || 0) / tradeSum);

    // === CUSTOM SPLIT CALCULATIONS (for the new money only) ===
    const customTotalPct = customHodlPct + customRealizePct + customTradePct;
    const customHodl = added * (customHodlPct / 100);
    const customRealize = added * (customRealizePct / 100);
    const customTrade = added * (customTradePct / 100);

    // Inside the custom Trade portion, use existing tradeSplit ratios
    const customDca = customTrade * ((ts.dca || 0) / tradeSum);
    const customHedge = customTrade * ((ts.hedge || 0) / tradeSum);
    const customArb = customTrade * ((ts.arbitrage || 0) / tradeSum);
    const customReserve = customTrade * ((ts.reserve || 0) / tradeSum);

    const applyLiquidity = (choice: 'current' | 'custom') => {
      if (added <= 0) return;

      const isCustom = choice === 'custom';

      // For custom we use the user's chosen % for the *new money only*
      const useHodl = isCustom ? customHodl : addedToHodl;
      const useRealize = isCustom ? customRealize : addedToRealize;
      const useTrade = isCustom ? customTrade : addedToTrade;
      const useDca = isCustom ? customDca : addedDca;
      const useHedge = isCustom ? customHedge : addedHedge;
      const useArb = isCustom ? customArb : addedArb;
      const useReserve = isCustom ? customReserve : addedReserve;

      const newTotalCapital = currentTotal + added;

      // We keep the *existing* bucket percentages for the overall strategy
      // (the custom split only affects how the new slice is recorded and the absolute tradeSplit grows)
      const newBuckets = { ...strategy.buckets };

      const oldTradeAmount = currentTotal * (tradePct / 100);
      const newTradeAmount = oldTradeAmount + useTrade;

      const newTradeSplit = {
        dca: Math.round(((ts.dca || 0) / Math.max(oldTradeAmount || 1, 1)) * newTradeAmount),
        hedge: Math.round(((ts.hedge || 0) / Math.max(oldTradeAmount || 1, 1)) * newTradeAmount),
        arbitrage: Math.round(((ts.arbitrage || 0) / Math.max(oldTradeAmount || 1, 1)) * newTradeAmount),
        reserve: Math.round(((ts.reserve || 0) / Math.max(oldTradeAmount || 1, 1)) * newTradeAmount),
      };

      const newStrategy: Strategy = {
        ...strategy,
        totalCapital: { ...strategy.totalCapital, amount: Math.round(newTotalCapital) },
        buckets: newBuckets,
        tradeSplit: newTradeSplit as any,
        liquidityAdditions: [
          ...(strategy.liquidityAdditions || []),
          {
            id: `liq_${Date.now()}`,
            timestamp: new Date().toISOString(),
            amount: added,
            source: 'MANUAL_INPUT',
            distribution: {
              HODL: Math.round(useHodl),
              REALIZE: Math.round(useRealize),
              DCA: Math.round(useDca),
              HEDGE: Math.round(useHedge),
              ARBITRAGE: Math.round(useArb),
              RESERVE: Math.round(useReserve),
            },
            notes: isCustom ? `Custom split for this addition (HODL ${customHodlPct}% / Realize ${customRealizePct}% / Trade ${customTradePct}%)` : 'Added using existing allocation %',
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      setStrategy(newStrategy);
      setLiqChoice(null);
      // Keep the amount so the user sees what they just added
    };

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f2f2f2]">
        {/* Top bar */}
        <div className="h-14 border-b border-[#242424] flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <img src="/dogmm-logo.jpg" alt="DOGmm" className="h-8 w-auto" />
            <div>
              <div className="font-semibold text-xl tracking-wide">DOGmm</div>
              <div className="text-[10px] text-[#666] -mt-0.5 font-mono">STRATEGY COCKPIT</div>
            </div>
          </div>
          <button onClick={() => setShowWizard(true)} className="btn-ghost text-xs">
            EDIT STRATEGY
          </button>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-10">
          {/* Portfolio Summary - Simple & Objective (Balance, PnL, Division) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-[#666] font-mono tracking-widest">YOUR $DOG PORTFOLIO</div>
                <div className="text-5xl font-semibold tracking-[-1.5px] mt-1 text-[#f5a623]">
                  ${totalPortfolioUsd.toLocaleString()}
                </div>
                <div className="text-[#888] text-sm">Real value of your declared holdings (Inventory)</div>
              </div>
              <button 
                onClick={() => setShowWizard(true)} 
                className="btn-ghost text-sm px-6 py-2"
              >
                EDIT STRATEGY
              </button>
            </div>

            {/* Balance + PnL + Division Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Value - Real holdings */}
              <div className="card p-5">
                <div className="text-xs text-[#666] mb-1 font-mono">CURRENT ESTIMATED VALUE</div>
                <div className="text-4xl font-semibold text-[#f5a623]">
                  ${totalPortfolioUsd.toLocaleString()}
                </div>
                <div className="text-xs text-[#888] mt-1">From your Inventory • Kraken + L1 prices</div>
              </div>

              {/* PnL */}
              <div className="card p-5">
                <div className="text-xs text-[#666] mb-1 font-mono">UNREALIZED PnL</div>
                <div className="text-4xl font-semibold text-[#22c55e]">
                  +$0 <span className="text-base">(0.00%)</span>
                </div>
                <div className="text-xs text-[#888] mt-1">Coming soon — based on your entry prices</div>
              </div>

              {/* How the money is divided */}
              <div className="card p-5">
                <div className="text-xs text-[#666] mb-2 font-mono">HOW YOUR MONEY IS DIVIDED</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>HODL (Protected)</span> 
                    <span className="font-mono text-[#22c55e]">{(strategy.buckets?.hodl || 0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Realize Bucket</span> 
                    <span className="font-mono text-[#f5a623]">{(strategy.buckets?.realize || 0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trade (Active)</span> 
                    <span className="font-mono text-[#3b82f6]">{(strategy.buckets?.trade || 0)}%</span>
                  </div>
                </div>
              </div>

              {/* Real Holdings - Smooth, minimal & simple (no EUR) */}
              {totalDog > 0 || totalBtc > 0 || totalFiatUsd > 0 ? (
                <div className="mt-5">
                  <div className="text-xs text-[#666] font-mono mb-2.5 tracking-wider">YOUR HOLDINGS</div>
                  
                  <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                    <div>
                      <div className="text-[#888] text-xs tracking-wider">DOG</div>
                      <div className="font-mono text-xl text-[#f5a623] tabular-nums">{totalDog.toLocaleString()}</div>
                      <div className="font-mono text-xs text-[#22c55e] tabular-nums">${(krakenDogValue + l1DogValue).toLocaleString()}</div>
                    </div>

                    <div>
                      <div className="text-[#888] text-xs tracking-wider">BTC</div>
                      <div className="font-mono text-xl text-[#f5a623] tabular-nums">{totalBtc.toFixed(4)}</div>
                      <div className="font-mono text-xs text-[#22c55e] tabular-nums">${btcValue.toLocaleString()}</div>
                    </div>

                    <div>
                      <div className="text-[#888] text-xs tracking-wider">USD</div>
                      <div className="font-mono text-xl text-[#f5a623] tabular-nums">${totalFiatUsd.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#555] mt-3">
                    From Inventory • Prices every 60s
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-xs text-[#666]">
                  Declare your real DOG, BTC and USD in the Inventory step of the wizard.
                </div>
              )}
            </div>
          </div>

          {/* Main Intelligence Section - The Beautiful Part */}
          <div className="mb-8">
            <div className="text-xs text-[#666] font-mono tracking-widest mb-3">LIVE MARKET INTELLIGENCE</div>
            <SafeMarketIntelligence />
          </div>

          {/* Add Liquidity - Real working mini-flow with 2 buttons + live preview (user request) */}
          <div className="card p-6 mb-8">
            <div className="font-semibold text-lg mb-1">Add Liquidity</div>
            <div className="text-xs text-[#888] mb-4">
              Add new capital. Choose to keep your current % split or customize only for this addition. 
              Future: tell the bot in natural language.
            </div>

            {/* Current Buckets Summary */}
            <div className="mb-5">
              <div className="text-xs text-[#666] font-mono mb-2">YOUR CURRENT ALLOCATION (TOTAL ${currentTotal.toLocaleString()})</div>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 bg-[#111] rounded text-sm">HODL <span className="font-mono text-[#22c55e]">{(strategy.buckets?.hodl || 0)}%</span></div>
                <div className="px-3 py-1 bg-[#111] rounded text-sm">Realize <span className="font-mono text-[#f5a623]">{(strategy.buckets?.realize || 0)}%</span></div>
                <div className="px-3 py-1 bg-[#111] rounded text-sm">Trade <span className="font-mono text-[#3b82f6]">{tradePct}%</span></div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Amount input */}
              <div>
                <label className="text-xs text-[#888] mb-1 block font-mono">NEW CAPITAL TO ADD (USD)</label>
                <div className="flex gap-3">
                  <input 
                    type="number" 
                    value={liqAmount}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setLiqAmount(val);
                      // Do NOT reset choice — keep the preview visible and reactive as user types
                      if (val > 0 && !liqChoice) {
                        setLiqChoice('current'); // default to current allocation so preview appears immediately
                      }
                    }}
                    placeholder="500" 
                    className="input w-48 text-lg" 
                  />
                  <div className="text-xs text-[#666] self-end pb-2">This money will be allocated according to your choice below</div>
                </div>
              </div>

              {/* The two visual buttons - exactly as requested */}
              {added > 0 && (
                <div className="p-4 rounded-xl border border-[#f5a623]/60 bg-[#111]">
                  <div className="font-semibold text-sm mb-3 text-[#f5a623]">How do you want to treat the new ${added.toLocaleString()}?</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <button 
                      onClick={() => setLiqChoice('current')}
                      className={`p-4 text-left rounded-lg border-2 transition-all ${liqChoice === 'current' 
                        ? 'border-[#f5a623] bg-[#f5a623]/10 ring-1 ring-[#f5a623]/40' 
                        : 'border-[#333] hover:border-[#555] bg-[#0a0a0a]'}`}
                    >
                      <div className="font-semibold">Use Current Allocation</div>
                      <div className="text-xs text-[#888] mt-1">The new money follows exactly your existing HODL / Realize / Trade % split. Clean and consistent.</div>
                    </button>

                    <button 
                      onClick={() => setLiqChoice('custom')}
                      className={`p-4 text-left rounded-lg border-2 transition-all ${liqChoice === 'custom' 
                        ? 'border-[#f5a623] bg-[#f5a623]/10 ring-1 ring-[#f5a623]/40' 
                        : 'border-[#333] hover:border-[#555] bg-[#0a0a0a]'}`}
                    >
                      <div className="font-semibold">Customize Split for This Addition Only</div>
                      <div className="text-xs text-[#888] mt-1">Decide different % just for these new dollars (overall allocation will shift slightly).</div>
                    </button>
                  </div>

                  {/* LIVE PREVIEW of what happens to the new money */}
                  {liqChoice === 'current' && (
                    <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 text-sm">
                      <div className="font-mono text-xs text-[#f5a623] mb-2">PREVIEW — WHAT THIS ${added} WILL BECOME</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-sm">
                        <div>HODL: <span className="font-mono text-[#22c55e]">+${Math.round(addedToHodl).toLocaleString()}</span> <span className="text-[#666]">({strategy.buckets?.hodl}%)</span></div>
                        <div>Realize: <span className="font-mono text-[#f5a623]">+${Math.round(addedToRealize).toLocaleString()}</span> <span className="text-[#666]">({strategy.buckets?.realize}%)</span></div>
                        <div>Trade total: <span className="font-mono text-[#3b82f6]">+${Math.round(addedToTrade).toLocaleString()}</span></div>
                        <div className="pl-3 text-[#aaa]">→ DCA +${Math.round(addedDca)}</div>
                        <div className="pl-3 text-[#aaa]">→ Hedge +${Math.round(addedHedge)}</div>
                        <div className="pl-3 text-[#aaa]">→ Arbitrage +${Math.round(addedArb)}</div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#222] flex items-center justify-between text-xs">
                        <div>New total capital after this addition: <span className="font-mono text-[#f5a623] text-base">${newTotal.toLocaleString()}</span></div>
                        <button 
                          onClick={() => applyLiquidity('current')}
                          className="btn-gold px-5 py-1.5 text-xs"
                        >
                          CONFIRM &amp; ADD ${added} USING CURRENT %
                        </button>
                      </div>
                    </div>
                  )}

                  {liqChoice === 'custom' && (
                    <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 text-sm">
                      <div className="text-[#f5a623] text-xs font-mono mb-2">CUSTOM SPLIT — ONLY FOR THESE NEW ${added} (edit the % below)</div>

                      {/* Editable % for the new money only */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div>
                          <label className="text-[10px] text-[#888] block mb-1">HODL % of new money</label>
                          <input type="number" value={customHodlPct} min={0} max={100}
                            onChange={(e) => setCustomHodlPct(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                            className="input w-full text-center font-mono text-lg" />
                          <div className="text-[10px] text-[#22c55e] mt-0.5">+${Math.round(customHodl).toLocaleString()}</div>
                        </div>
                        <div>
                          <label className="text-[10px] text-[#888] block mb-1">REALIZE % of new money</label>
                          <input type="number" value={customRealizePct} min={0} max={100}
                            onChange={(e) => setCustomRealizePct(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                            className="input w-full text-center font-mono text-lg" />
                          <div className="text-[10px] text-[#f5a623] mt-0.5">+${Math.round(customRealize).toLocaleString()}</div>
                        </div>
                        <div>
                          <label className="text-[10px] text-[#888] block mb-1">TRADE % of new money</label>
                          <input type="number" value={customTradePct} min={0} max={100}
                            onChange={(e) => setCustomTradePct(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                            className="input w-full text-center font-mono text-lg" />
                          <div className="text-[10px] text-[#3b82f6] mt-0.5">+${Math.round(customTrade).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className={`text-xs mb-3 font-mono ${Math.abs(customTotalPct - 100) > 1 ? 'text-red-400' : 'text-[#22c55e]'}`}>
                        Sum of new money split: {customTotalPct.toFixed(0)}% {Math.abs(customTotalPct - 100) > 1 ? '← must be ~100%' : '✓ good'}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-[#888]">
                          Trade portion will be split internally using your existing DCA/Hedge/Arbitrage ratios.
                        </div>
                        <button 
                          onClick={() => applyLiquidity('custom')}
                          disabled={Math.abs(customTotalPct - 100) > 1}
                          className="btn-gold px-5 py-1.5 text-xs disabled:opacity-50"
                        >
                          CONFIRM CUSTOM SPLIT + ADD ${added}
                        </button>
                      </div>
                    </div>
                  )}

                  {liqChoice && (
                    <div className="mt-2 text-[10px] text-[#666]">
                      After applying, your Portfolio Summary and all % will update automatically. No need to restart the wizard.
                    </div>
                  )}
                </div>
              )}

              {!added && (
                <div className="text-xs text-[#666]">Enter an amount above to see the two-button allocation choice and live preview.</div>
              )}
            </div>

            <div className="text-[10px] text-[#f5a623] mt-4">
              Tip: Adding liquidity this way keeps your original plan intact. Your DCA ladder, hedge triggers and inventory targets stay valid.
            </div>
          </div>

          {/* Natural Language Bot Command Area - Intention + Coming Soon (user request) */}
          <div className="card p-6 mb-8 border border-[#f5a623]/30">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-lg flex items-center gap-2">
                  Ask the Agent
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#f5a623] text-black font-mono tracking-wider">COMING SOON</span>
                </div>
                <div className="text-xs text-[#888] mt-0.5">
                  In the future you will talk directly to the bot in plain English to buy $DOG, add liquidity, adjust your DCA, lock HODL, etc.
                </div>
              </div>
            </div>

            <div className="text-sm text-[#aaa] mb-3">
              Examples of what you will be able to say:
            </div>

            <div className="space-y-2 mb-4 text-xs">
              <div className="bg-[#111] border border-[#222] px-3 py-2 rounded font-mono text-[#ccc]">
                “Add $1200 and put 40% in HODL, 40% DCA every 6% drop, 20% in Hedge on 40% upside”
              </div>
              <div className="bg-[#111] border border-[#222] px-3 py-2 rounded font-mono text-[#ccc]">
                “Buy 850k DOG right now on Kraken using my Trade bucket”
              </div>
              <div className="bg-[#111] border border-[#222] px-3 py-2 rounded font-mono text-[#ccc]">
                “Lock my entire HODL position for the next 120 days”
              </div>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                disabled 
                placeholder="Type your command here... (the agent will understand your full strategy)" 
                className="input flex-1 opacity-60 cursor-not-allowed" 
              />
              <button 
                disabled 
                className="btn-gold px-6 opacity-60 cursor-not-allowed"
              >
                Send
              </button>
            </div>

            <div className="text-[10px] text-[#f5a623] mt-3">
              The agent will read your current buckets, DCA rules, inventory and execute exactly what you asked for.
            </div>
          </div>

          <div className="text-center text-xs text-[#444] font-mono">
            Kraken + DogSwap data • Auto-refreshing • No WSL required for this view
          </div>
        </div>
      </div>
    );
  }

  // Show the real wizard
  if (showWizard) {
    return <StrategyWizard onComplete={handleStrategyComplete} onCancel={() => setShowWizard(false)} />;
  }

  // Landing / First Run
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f2f2f2]">
      <div className="h-14 border-b border-[#242424] flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <img src="/dogmm-logo.jpg" alt="DOGmm" className="h-8 w-auto" />
          <div>
            <div className="font-semibold tracking-[0.04em] text-lg">DOGmm</div>
            <div className="text-[10px] text-[#666] -mt-1 font-mono">PERSONAL $DOG STRATEGY COCKPIT</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-[#666]">
          <div className="flex items-center gap-2">
            <div className="live-dot" />
            KRAKEN CLI
          </div>
          <div>LOCAL • SOVEREIGN</div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-8 pt-16 pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#333] text-[#f5a623] text-xs font-mono tracking-[0.1em] mb-6">
            <Target size={14} /> FOUNDATION REQUIRED
          </div>

          <h1 className="text-6xl font-semibold tracking-[-1.5px] leading-[0.96] mb-6">
            Before you watch the market,<br />define your strategy.
          </h1>

          <p className="text-xl text-[#a1a1a1] max-w-[620px] mb-10">
            DOGmm is not a trading dashboard. It is a personal capital allocation system.
            The first thing you must do is declare how you want to treat your $DOG capital.
          </p>

          <div className="flex gap-4 mb-16">
            <button onClick={() => setShowWizard(true)} className="btn-gold flex items-center gap-3 text-base px-8 py-3.5">
              CREATE STRATEGY PLAN <ArrowRight size={18} />
            </button>
            <button className="btn-ghost flex items-center gap-2 text-base px-6">
              LOAD EXISTING PLAN
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="card p-6">
              <Shield className="text-[#f5a623] mb-4" size={22} />
              <div className="font-semibold mb-1.5">Protect what matters</div>
              <div className="text-sm text-[#a1a1a1]">
                HODL bucket is sacred. It only moves when you explicitly unlock it.
              </div>
            </div>
            <div className="card p-6">
              <TrendingUp className="text-[#f5a623] mb-4" size={22} />
              <div className="font-semibold mb-1.5">Plan your realization</div>
              <div className="text-sm text-[#a1a1a1]">
                Define exactly at what profit % and what size you will take money off the table.
              </div>
            </div>
            <div className="card p-6">
              <Zap className="text-[#f5a623] mb-4" size={22} />
              <div className="font-semibold mb-1.5">DCA with intention</div>
              <div className="text-sm text-[#a1a1a1]">
                Trigger conditions, entry count, safety pauses, reference price — all under your control.
              </div>
            </div>
          </div>

          <div className="mt-12 text-[11px] text-[#555] font-mono max-w-md">
            Built on Kraken CLI • All strategy data stays on your machine • Inspired by dog-intel &amp; the $DOG Army
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
