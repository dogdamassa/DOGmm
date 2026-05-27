/**
 * DOGmm — Strategy Onboarding Wizard
 * The heart of the entire application.
 */

import { useState } from "react";
import { Strategy, BucketAllocation, DcaConfig } from "../../types/strategy";
import { ArrowLeft, ArrowRight, Check, TrendingDown, Target, Shield, Repeat } from "lucide-react";


interface WizardProps {
  onComplete: (strategy: Strategy) => void;
  onCancel?: () => void;
}

const STEPS = [
  "Total Capital",
  "Bucket Split",
  "HODL",
  "Realize",
  "Trade Split",
  "DCA Rules",
  "Liquidity",
  "Inventory",
  "Review & Mode",
] as const;

type Step = (typeof STEPS)[number];

export function StrategyWizard({ onComplete, onCancel }: WizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [strategy, setStrategy] = useState<Partial<Strategy>>({
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    buckets: { hodl: 50, realize: 20, trade: 30 },
    operationalMode: "PREPARE_MANUAL_ACTIONS",
    liquidityAdditions: [],
    inventory: {
      kraken: { usd: 0, eur: 0, btc: 0, dog: 0, liquidityPositions: 0 },
      xverse: { usd: 0, eur: 0, btc: 0, dog: 0, liquidityPositions: 0 },
      dogswap: { usd: 0, eur: 0, btc: 0, dog: 0, liquidityPositions: 0 },
      external: { usd: 0, eur: 0, btc: 0, dog: 0, liquidityPositions: 0 },
    },
  });

  const currentStep = STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const goNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }
  };

  const updateStrategy = (updates: Partial<Strategy>) => {
    setStrategy((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Validation helpers
  const canProceed = () => {
    if (currentStep === "Total Capital") {
      return (strategy.totalCapital?.amount ?? 0) > 0;
    }
    if (currentStep === "Bucket Split") {
      const b = strategy.buckets;
      if (!b) return false;
      const sum = b.hodl + b.realize + b.trade;
      return Math.abs(sum - 100) < 0.5;
    }
    if (currentStep === "DCA Rules") {
      return (strategy.dca?.totalCapital ?? 0) > 0;
    }
    return true; // TODO: add per-step validation
  };

  const handleComplete = () => {
    // In real version we run full Zod validation here
    const completeStrategy: Strategy = {
      ...(strategy as Strategy),
      isComplete: true,
    };
    onComplete(completeStrategy);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f2f2f2]">
      {/* Top bar */}
      <div className="h-14 border-b border-[#242424] flex items-center px-8 justify-between">
        <div className="flex items-center gap-3">
          <img src="/dogmm-logo.jpg" alt="DOGmm" className="h-8 w-auto" />
          <span className="font-semibold tracking-wide">DOGmm</span>
          <span className="text-[#555] text-xs font-mono ml-2">STRATEGY SETUP</span>
        </div>
        <div className="text-xs font-mono text-[#666]">
          STEP {currentStepIndex + 1} / {STEPS.length}
        </div>
      </div>

      <div className="max-w-[960px] mx-auto px-8 pt-10 pb-20">
        {/* Progress */}
        <div className="mb-8">
          <div className="h-1 bg-[#1f1f1f] rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-[#f5a623] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step dots */}
          <div className="flex justify-between">
            {STEPS.map((label, idx) => (
              <div
                key={idx}
                className={`text-[10px] font-mono text-center w-20 ${
                  idx === currentStepIndex ? "text-[#f5a623]" : idx < currentStepIndex ? "text-[#22c55e]" : "text-[#444]"
                }`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-10">
          <div className="text-[#f5a623] font-mono text-xs tracking-[0.2em] mb-2">
            {currentStep.toUpperCase()}
          </div>
          <h2 className="text-4xl font-semibold tracking-[-1px] mb-8">{getStepTitle(currentStep)}</h2>

          {currentStep === "Total Capital" && (
            <TotalCapitalStep value={strategy.totalCapital} onChange={(v) => updateStrategy({ totalCapital: v })} />
          )}

          {currentStep === "Bucket Split" && (
            <BucketSplitStep
              value={strategy.buckets!}
              totalCapital={strategy.totalCapital?.amount ?? 0}
              onChange={(v) => updateStrategy({ buckets: v })}
            />
          )}

          {currentStep === "HODL" && (
            <div className="card p-8">
              <p className="text-[#a1a1a1]">
                HODL configuration UI will live here. For now: the amount allocated to HODL is protected by default.
              </p>
            </div>
          )}

          {currentStep === "Realize" && (
            <div className="card p-8">
              <p className="text-[#a1a1a1]">Realize rules (profit target, %, destination) coming next.</p>
            </div>
          )}

          {currentStep === "Trade Split" && (
            <TradeSplitStep
              split={strategy.tradeSplit}
              totalTrade={calculateTradeCapital(strategy)}
              hedge={strategy.hedge}
              arbitrage={strategy.arbitrage}
              onSplitChange={(v) => updateStrategy({ tradeSplit: v })}
              onHedgeChange={(v) => updateStrategy({ hedge: v })}
              onArbitrageChange={(v) => updateStrategy({ arbitrage: v })}
            />
          )}

          {currentStep === "DCA Rules" && (
            <DcaRulesStep
              dca={strategy.dca}
              tradeCapital={calculateTradeCapital(strategy)}
              onChange={(v) => updateStrategy({ dca: v })}
            />
          )}

          {currentStep === "Inventory" && (
            <InventoryStep
              inventory={strategy.inventory}
              onChange={(v) => updateStrategy({ inventory: v })}
            />
          )}

          {/* Other steps are placeholders for now */}
          {![
            "Total Capital",
            "Bucket Split",
            "HODL",
            "Realize",
            "Trade Split",
            "DCA Rules",
            "Inventory",
          ].includes(currentStep) && (
            <div className="card p-8 text-[#888]">
              {currentStep} step UI will be implemented here.
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-[#222]">
          <button
            onClick={goPrev}
            disabled={currentStepIndex === 0}
            className="btn-ghost flex items-center gap-2 disabled:opacity-40"
          >
            <ArrowLeft size={16} /> BACK
          </button>

          <div>
            {currentStepIndex === STEPS.length - 1 ? (
              <button onClick={handleComplete} className="btn-gold flex items-center gap-3 px-10">
                SAVE STRATEGY &amp; ENTER COCKPIT <Check size={18} />
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="btn-gold flex items-center gap-3 px-8 disabled:opacity-50"
              >
                CONTINUE <ArrowRight size={18} />
              </button>
            )}
          </div>

          {onCancel && (
            <button onClick={onCancel} className="text-xs text-[#666] hover:text-red-400">
              CANCEL SETUP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function calculateTradeCapital(strategy: Partial<Strategy>): number {
  const total = strategy.totalCapital?.amount ?? 0;
  const buckets = strategy.buckets ?? { hodl: 0, realize: 0, trade: 0 };
  return (total * buckets.trade) / 100;
}

function getStepTitle(step: Step): string {
  switch (step) {
    case "Total Capital":
      return "How much capital are you allocating?";
    case "Bucket Split":
      return "Split your capital into three buckets";
    case "HODL":
      return "Protect your long-term allocation";
    case "Realize":
      return "Define when and how you will take profit";
    case "Trade Split":
      return "Allocate your active trading capital";
    case "DCA Rules":
      return "Program your DCA strategy";
    case "Liquidity":
      return "Plan future liquidity additions";
    case "Inventory":
      return "Map where your capital and $DOG live";
    case "Review & Mode":
      return "Review everything and choose your mode";
    default:
      return step;
  }
}

// ============================================
// DCA RULES STEP - Clean, flexible, ladder-first
// ============================================
function DcaRulesStep({
  dca,
  tradeCapital,
  onChange,
}: {
  dca?: DcaConfig;
  tradeCapital: number;
  onChange: (dca: DcaConfig) => void;
}) {
  const current = dca ?? {
    totalCapital: Math.round(tradeCapital * 0.5),
    mode: "LADDER" as const,
    dropIntervalPercent: 5,
    percentOfDcaPerEntry: 10,
    referencePriceType: "CURRENT_MARKET" as const,
    minMinutesBetweenEntries: 60,
    maxEntriesPerDay: 3,
    pauseOnSellWall: true,
    pauseOnThinLiquidity: true,
    pauseOnWideSpread: true,
    status: "NOT_CONFIGURED" as const,
  };

  const update = (updates: Partial<DcaConfig>) => {
    onChange({ ...current, ...updates } as DcaConfig);
  };

  const dcaCapital = current.totalCapital || Math.round(tradeCapital * 0.5);

  // Live preview calculation
  const preview = current.mode === "LADDER"
    ? {
        type: "LADDER",
        text: `Every ${current.dropIntervalPercent}% drop → Buy ${current.percentOfDcaPerEntry}% of DCA capital`,
        amountPerEntry: Math.round((dcaCapital * (current.percentOfDcaPerEntry || 10)) / 100),
      }
    : {
        type: "FIXED",
        text: `After ${current.triggerDropPercent || 8}% drop → ${current.numberOfEntries || 5} entries`,
        amountPerEntry: Math.round(dcaCapital / (current.numberOfEntries || 5)),
      };

  return (
    <div className="space-y-8">
      {/* Total DCA Capital */}
      <div className="card p-6">
        <div className="section-header">DCA CAPITAL</div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold font-mono text-[#f5a623]">${dcaCapital}</span>
          <span className="text-[#666]">of ${tradeCapital} Trade bucket</span>
        </div>
        <input
          type="range"
          min={100}
          max={Math.floor(tradeCapital)}
          step={50}
          value={dcaCapital}
          onChange={(e) => update({ totalCapital: parseInt(e.target.value) })}
          className="w-full accent-[#f5a623] mt-4"
        />
      </div>

      {/* DCA Mode - User Choice */}
      <div>
        <div className="section-header mb-3">DCA STYLE</div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => update({ mode: "LADDER" })}
            className={`card p-5 text-left border-2 transition-all ${current.mode === "LADDER" 
              ? "border-[#f5a623] ring-2 ring-[#f5a623]/30 bg-[#1f1a10]" 
              : "border-[#242424] hover:border-[#444]"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={18} className={current.mode === "LADDER" ? "text-[#f5a623]" : "text-[#888]"} />
              <span className="font-semibold">Ladder (Recommended)</span>
            </div>
            <div className="text-sm text-[#aaa]">
              Buy on every % drop. Smooth, automatic averaging.
            </div>
          </button>

          <button
            onClick={() => update({ mode: "FIXED_ENTRIES" })}
            className={`card p-5 text-left border-2 transition-all ${current.mode === "FIXED_ENTRIES" 
              ? "border-[#f5a623] ring-2 ring-[#f5a623]/30 bg-[#1f1a10]" 
              : "border-[#242424] hover:border-[#444]"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className={current.mode === "FIXED_ENTRIES" ? "text-[#f5a623]" : "text-[#888]"} />
              <span className="font-semibold">Fixed Entries</span>
            </div>
            <div className="text-sm text-[#aaa]">
              Wait for one big drop, then split into fixed buys.
            </div>
          </button>
        </div>
      </div>

      {/* Ladder Controls */}
      {current.mode === "LADDER" && (
        <div className="card p-6 space-y-6">
          <div>
            <div className="text-sm text-[#aaa] mb-2">Every how much % drop do you want to buy?</div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={current.dropIntervalPercent}
                onChange={(e) => update({ dropIntervalPercent: parseInt(e.target.value) })}
                className="input w-24 text-2xl font-mono"
              />
              <span className="text-2xl text-[#666]">%</span>
            </div>
          </div>

          <div>
            <div className="text-sm text-[#aaa] mb-2">What % of your DCA capital to deploy each time?</div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={current.percentOfDcaPerEntry}
                onChange={(e) => update({ percentOfDcaPerEntry: parseInt(e.target.value) })}
                className="input w-24 text-2xl font-mono"
              />
              <span className="text-2xl text-[#666]">% of DCA</span>
            </div>
            <div className="text-xs text-[#555] mt-1">
              ≈ ${preview.amountPerEntry} per entry
            </div>
          </div>
        </div>
      )}

      {/* Fixed Entries (alternative) */}
      {current.mode === "FIXED_ENTRIES" && (
        <div className="card p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-[#aaa] mb-2">Initial drop to trigger</div>
              <div className="flex items-center gap-2">
                <input type="number" value={current.triggerDropPercent || 8} onChange={(e) => update({ triggerDropPercent: parseInt(e.target.value) })} className="input w-24 text-2xl" />
                <span>%</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#aaa] mb-2">How many entries after trigger?</div>
              <input type="number" value={current.numberOfEntries || 5} onChange={(e) => update({ numberOfEntries: parseInt(e.target.value) })} className="input w-24 text-2xl" />
            </div>
          </div>
        </div>
      )}

      {/* Reference Price - VERY VISIBLE */}
      <div>
        <div className="section-header mb-3 flex items-center gap-2">
          <span>REFERENCE PRICE</span>
          <span className="text-[10px] text-[#f5a623] font-mono">• BASE FOR DROP CALCULATION</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "CURRENT_MARKET", label: "Current Price", desc: "Price right now" },
            { value: "AVERAGE_ENTRY", label: "My Average Entry", desc: "Your current cost basis" },
            { value: "CUSTOM", label: "Custom Price", desc: "Set your own level" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ referencePriceType: opt.value as any })}
              className={`p-4 rounded-xl border text-left transition-all ${current.referencePriceType === opt.value ? "border-[#f5a623] bg-[#1f1a10]" : "border-[#242424] hover:border-[#444]"}`}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs text-[#777] mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>
        {current.referencePriceType === "CUSTOM" && (
          <input
            type="number"
            placeholder="Custom base price"
            value={current.customReferencePrice || ""}
            onChange={(e) => update({ customReferencePrice: parseFloat(e.target.value) })}
            className="input mt-3"
          />
        )}
      </div>

      {/* Live Preview - Very Important */}
      <div className="card p-6 bg-[#111]">
        <div className="text-xs text-[#f5a623] font-mono mb-2">YOUR DCA PLAN</div>
        <div className="text-xl font-medium">{preview.text}</div>
        <div className="text-sm text-[#888] mt-2">
          Reference: <span className="text-[#ccc]">{current.referencePriceType.replace("_", " ")}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STEP 1: Total Capital
// ============================================
function TotalCapitalStep({
  value,
  onChange,
}: {
  value?: { amount: number; currency: "USD" | "EUR" };
  onChange: (v: { amount: number; currency: "USD" | "EUR" }) => void;
}) {
  const amount = value?.amount ?? 0;

  return (
    <div className="max-w-md">
      <div className="card p-8">
        <label className="block text-xs font-mono text-[#888] mb-2">TOTAL CAPITAL TO MANAGE</label>
        <div className="flex items-center gap-3">
          <div className="text-5xl font-semibold font-mono text-[#f5a623] tracking-[-1px]">$</div>
          <input
            type="number"
            className="input text-5xl font-semibold font-mono tracking-[-1.5px] w-full"
            value={amount || ""}
            placeholder="1000"
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              onChange({ amount: isNaN(num) ? 0 : num, currency: value?.currency ?? "USD" });
            }}
          />
        </div>
        <div className="text-[#666] text-sm mt-2">This is the foundation. All buckets are calculated from this number.</div>
      </div>

      <div className="mt-6 text-xs text-[#555] max-w-sm">
        Example: $1,000, $4,200, or $12,500. You can always add more liquidity later through the dedicated flow.
      </div>
    </div>
  );
}

// ============================================
// STEP 2: Bucket Split (with live validation)
// ============================================
function BucketSplitStep({
  value,
  totalCapital,
  onChange,
}: {
  value: BucketAllocation;
  totalCapital: number;
  onChange: (v: BucketAllocation) => void;
}) {
  const { hodl, realize, trade } = value;
  const total = hodl + realize + trade;
  const isValid = Math.abs(total - 100) < 0.5;

  const update = (key: keyof BucketAllocation, newVal: number) => {
    const next = { ...value, [key]: Math.max(0, Math.min(100, newVal)) };
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <BucketCard
          label="HODL"
          desc="Long-term protected"
          color="#22c55e"
          value={hodl}
          onChange={(v) => update("hodl", v)}
          amount={((totalCapital * hodl) / 100).toFixed(0)}
        />
        <BucketCard
          label="REALIZE"
          desc="Profit taking"
          color="#f5a623"
          value={realize}
          onChange={(v) => update("realize", v)}
          amount={((totalCapital * realize) / 100).toFixed(0)}
        />
        <BucketCard
          label="TRADE"
          desc="Active strategies"
          color="#3b82f6"
          value={trade}
          onChange={(v) => update("trade", v)}
          amount={((totalCapital * trade) / 100).toFixed(0)}
        />
      </div>

      <div className={`card p-5 flex items-center justify-between ${isValid ? "border-green-900" : "border-red-900"}`}>
        <div>
          <div className="font-mono text-xs text-[#888]">TOTAL ALLOCATION</div>
          <div className={`text-3xl font-semibold font-mono ${isValid ? "text-green-500" : "text-red-500"}`}>
            {total.toFixed(1)}%
          </div>
        </div>
        <div className="text-right">
          {!isValid && <div className="text-red-500 text-sm">Must equal exactly 100%</div>}
          {isValid && <div className="text-green-500 text-sm flex items-center gap-1.5">✓ Perfect split</div>}
        </div>
      </div>
    </div>
  );
}

function BucketCard({
  label,
  desc,
  color,
  value,
  onChange,
  amount,
}: {
  label: string;
  desc: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
  amount: string;
}) {
  return (
    <div className="card p-6">
      <div style={{ color }} className="font-semibold tracking-widest text-sm mb-1">{label}</div>
      <div className="text-[#666] text-xs mb-4">{desc}</div>

      <div className="flex items-baseline gap-1 mb-4">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="bg-transparent text-5xl font-semibold font-mono w-24 outline-none"
          style={{ color }}
        />
        <span className="text-2xl text-[#444]">%</span>
      </div>

      <div className="text-xs text-[#888] mb-3 font-mono">≈ ${amount}</div>

      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#f5a623]"
      />
    </div>
  );
}

// ============================================
// TRADE SPLIT + HEDGE / ARBITRAGE CONFIG
// ============================================
function TradeSplitStep({
  split,
  totalTrade,
  hedge,
  arbitrage,
  onSplitChange,
  onHedgeChange,
  onArbitrageChange,
}: {
  split?: any;
  totalTrade: number;
  hedge?: any;
  arbitrage?: any;
  onSplitChange: (v: any) => void;
  onHedgeChange: (v: any) => void;
  onArbitrageChange: (v: any) => void;
}) {
  const s = split ?? { dca: Math.floor(totalTrade * 0.5), hedge: Math.floor(totalTrade * 0.2), arbitrage: Math.floor(totalTrade * 0.15), reserve: Math.floor(totalTrade * 0.15) };
  const h = hedge ?? { allocatedCapital: s.hedge, mode: "LADDER_UP", riseTriggerPercent: 50, percentOfHedgePerStep: 10, stepSizePercent: 30 };
  const a = arbitrage ?? { allocatedCapital: s.arbitrage, minSpreadPercent: 3, onlyNoBridgeRequired: true };

  const updateSplit = (key: string, val: number) => {
    onSplitChange({ ...s, [key]: val });
  };

  const remaining = totalTrade - (s.dca + s.hedge + s.arbitrage + s.reserve);

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <div className="section-header mb-4">ALLOCATE YOUR TRADE CAPITAL (${totalTrade})</div>

        <div className="space-y-6">
          {[
            { key: "dca", label: "DCA", color: "#f5a623" },
            { key: "hedge", label: "Hedge (Upside Protection)", color: "#ef4444" },
            { key: "arbitrage", label: "Inventory Arbitrage", color: "#3b82f6" },
            { key: "reserve", label: "Reserve", color: "#888" },
          ].map(({ key, label, color }) => {
            const val = (s as any)[key] || 0;
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1 items-center">
                  <span style={{ color }}>{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#666]">$</span>
                    <input
                      type="number"
                      value={val}
                      min={0}
                      max={totalTrade}
                      onChange={(e) => updateSplit(key, Math.max(0, Math.min(totalTrade, parseInt(e.target.value) || 0)))}
                      className="input w-24 py-1 text-sm"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={totalTrade}
                  value={val}
                  onChange={(e) => updateSplit(key, parseInt(e.target.value))}
                  className="w-full accent-[#f5a623]"
                />
              </div>
            );
          })}
        </div>

        <div className={`mt-4 text-sm font-mono ${remaining === 0 ? "text-green-500" : "text-red-400"}`}>
          Remaining to allocate: ${remaining}
        </div>
      </div>

      {/* Hedge Configuration */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-red-500" />
          <span className="font-semibold">HEDGE - Upside Protection (Ladder)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-[#888] mb-1">Trigger on rise</div>
            <div className="flex items-center gap-2">
              <input type="number" value={h.riseTriggerPercent} onChange={e => onHedgeChange({ ...h, riseTriggerPercent: parseInt(e.target.value) })} className="input w-20" />
              <span>% up</span>
            </div>
          </div>
          <div>
            <div className="text-[#888] mb-1">% of Hedge capital per step</div>
            <div className="flex items-center gap-2">
              <input type="number" value={h.percentOfHedgePerStep} onChange={e => onHedgeChange({ ...h, percentOfHedgePerStep: parseInt(e.target.value) })} className="input w-20" />
              <span>%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-[#888] mb-1">Stop Loss</div>
            <input type="number" placeholder="Optional" value={h.stopLossPercent || ""} onChange={e => onHedgeChange({ ...h, stopLossPercent: parseFloat(e.target.value) || undefined })} className="input" />
          </div>
          <div>
            <div className="text-[#888] mb-1">Stop Gain</div>
            <input type="number" placeholder="Optional" value={h.stopGainPercent || ""} onChange={e => onHedgeChange({ ...h, stopGainPercent: parseFloat(e.target.value) || undefined })} className="input" />
          </div>
        </div>
      </div>

      {/* Arbitrage Configuration */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Repeat size={18} className="text-blue-500" />
          <span className="font-semibold">INVENTORY ARBITRAGE (Kraken ↔ DogSwap/Xverse)</span>
        </div>

        <div className="text-sm space-y-4">
          <div>
            <div className="text-[#888] mb-1">Minimum spread to act (after fees)</div>
            <div className="flex items-center gap-2">
              <input type="number" value={a.minSpreadPercent} onChange={e => onArbitrageChange({ ...a, minSpreadPercent: parseFloat(e.target.value) })} className="input w-20" />
              <span>%</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={a.onlyNoBridgeRequired}
              onChange={e => onArbitrageChange({ ...a, onlyNoBridgeRequired: e.target.checked })}
            />
            <span className="text-sm">Only show opportunities that require <strong>no bridge</strong> (you already have inventory on both sides)</span>
          </div>
        </div>

        <div className="text-[11px] text-[#666] mt-4">
          This will use your declared inventory (next step) + live prices/order book from Kraken and DogSwap.
        </div>
      </div>
    </div>
  );
}

// ============================================
// INVENTORY STEP - Critical for Inventory-Based Arbitrage
// ============================================
function InventoryStep({
  inventory,
  onChange,
}: {
  inventory?: any;
  onChange: (v: any) => void;
}) {
  const inv = inventory ?? {
    kraken: { usd: 0, dog: 0 },
    dogswap_xverse: { dog: 0 },
    other: { dog: 0, usd: 0 },
  };

  const update = (venue: string, field: string, value: number) => {
    const next = { ...inv, [venue]: { ...inv[venue], [field]: value } };
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-[#aaa]">
        Declare where your capital and $DOG are. This powers real <strong>inventory-based arbitrage</strong> (no bridge required).
      </div>

      {/* Kraken */}
      <div className="card p-6">
        <div className="font-semibold mb-4">Kraken</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-[#888] mb-1">USD / Stable available</div>
            <input type="number" value={inv.kraken.usd} onChange={e => update("kraken", "usd", parseFloat(e.target.value) || 0)} className="input" />
          </div>
          <div>
            <div className="text-xs text-[#888] mb-1">$DOG on Kraken</div>
            <input type="number" value={inv.kraken.dog} onChange={e => update("kraken", "dog", parseFloat(e.target.value) || 0)} className="input" />
          </div>
        </div>
      </div>

      {/* DogSwap / Xverse (Bitcoin L1) */}
      <div className="card p-6">
        <div className="font-semibold mb-4">DogSwap / Xverse (Bitcoin L1)</div>
        <div>
          <div className="text-xs text-[#888] mb-1">$DOG on Bitcoin L1 (Xverse / DogSwap)</div>
          <input type="number" value={inv.dogswap_xverse?.dog || 0} onChange={e => {
            const next = { ...inv, dogswap_xverse: { dog: parseFloat(e.target.value) || 0 } };
            onChange(next);
          }} className="input" />
        </div>
        <div className="text-[11px] text-[#666] mt-3">
          This is where you can sell $DOG without withdrawing from Kraken.
        </div>
      </div>

      <div className="text-xs text-[#555]">
        Later we will pull live balances from Kraken (via CLI) and let you connect/read Xverse for more accuracy.
      </div>
    </div>
  );
}
