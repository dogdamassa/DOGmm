/**
 * DOGmm — Strategy Data Model
 * 
 * This is the source of truth for everything the user declares
 * during the onboarding wizard and maintains over time.
 */

import { z } from "zod";

// ============================================
// STEP 1: Total Capital
// ============================================
export const TotalCapitalSchema = z.object({
  amount: z.number().positive("Capital must be greater than 0"),
  currency: z.enum(["USD", "EUR"]).default("USD"),
});

// ============================================
// STEP 2: Bucket Split (must total 100%)
// ============================================
export const BucketAllocationSchema = z
  .object({
    hodl: z.number().min(0).max(100),
    realize: z.number().min(0).max(100),
    trade: z.number().min(0).max(100),
  })
  .refine(
    (data) => {
      const total = data.hodl + data.realize + data.trade;
      return Math.abs(total - 100) < 0.01; // allow floating point tolerance
    },
    { message: "HODL + Realize + Trade must equal exactly 100%" }
  );

// ============================================
// STEP 3: HODL Configuration
// ============================================
export const HodlConfigSchema = z.object({
  amount: z.number(), // derived from allocation
  isLocked: z.boolean().default(true),
  allowManualOverride: z.boolean().default(false),
  notes: z.string().optional(),
});

// ============================================
// STEP 4: Realize Configuration
// ============================================
export const RealizeDestinationSchema = z.enum(["BTC", "USD", "CAPITAL_REUSE"]);

export const RealizeConfigSchema = z.object({
  profitTargetPercent: z.number().min(5).max(500),
  realizationPercent: z.number().min(5).max(100),
  destination: RealizeDestinationSchema,
  allowReuseForDca: z.boolean().default(false),
  allowReuseForLiquidity: z.boolean().default(true),
});

// ============================================
// STEP 5: Trade Internal Split
// ============================================
export const TradeSplitSchema = z
  .object({
    dca: z.number().min(0),
    hedge: z.number().min(0),
    arbitrage: z.number().min(0),
    reserve: z.number().min(0),
  })
  .refine((data) => {
    const sum = data.dca + data.hedge + data.arbitrage + data.reserve;
    // Parent Trade bucket amount is validated at runtime against this sum
    return sum >= 0;
  });

// ============================================
// Hedge Configuration (Upside Protection Ladder)
// ============================================
export const HedgeModeSchema = z.enum(["LADDER_UP", "MANUAL"]);

export const HedgeConfigSchema = z.object({
  allocatedCapital: z.number().min(0), // from Trade split

  mode: HedgeModeSchema.default("LADDER_UP"),

  // Ladder on upside (user's preference)
  riseTriggerPercent: z.number().min(30).max(300).default(50), // min 30% up
  percentOfHedgePerStep: z.number().min(5).max(30).default(10), // 10-30% per rise step

  // Stops
  stopLossPercent: z.number().min(5).max(100).optional(),
  stopGainPercent: z.number().min(5).max(300).optional(),

  // Advanced: user can adjust step size
  stepSizePercent: z.number().min(10).max(100).default(30),

  notes: z.string().optional(),
});

// ============================================
// Arbitrage Configuration (Inventory-Based)
// ============================================
export const ArbitrageVenueSchema = z.enum(["KRAKEN", "DOGSWAP_XVERSE", "BOTH"]);

export const ArbitrageConfigSchema = z.object({
  allocatedCapital: z.number().min(0),

  // Focus: Inventory-based between Kraken and DogSwap L1
  preferredVenues: ArbitrageVenueSchema.default("BOTH"),

  // Minimum spread required to consider an opportunity (after fees)
  minSpreadPercent: z.number().min(0.5).max(20).default(3),

  // Risk controls
  maxPositionSizePercentOfInventory: z.number().min(5).max(100).default(25),
  pauseIfLowLiquidity: z.boolean().default(true),

  // User intent
  onlyNoBridgeRequired: z.boolean().default(true), // Core of the product
  notes: z.string().optional(),
});

// ============================================
// STEP 6: DCA Configuration (the heart of the product)
// ============================================
export const DcaReferencePriceSchema = z.enum([
  "CURRENT_MARKET",
  "AVERAGE_ENTRY",
  "CUSTOM",
]);

export const DcaModeSchema = z.enum(["LADDER", "FIXED_ENTRIES"]);

/**
 * DCA Configuration - Flexible ladder + fixed entries support
 * User can choose how they want to deploy capital on dips.
 */
export const DcaConfigSchema = z.object({
  totalCapital: z.number().positive(),

  // Mode selection (user choice)
  mode: DcaModeSchema.default("LADDER"),

  // === LADDER MODE (recommended / preferred) ===
  // Every X% drop → buy Y% of DCA capital
  dropIntervalPercent: z.number().min(1).max(30).default(5),
  percentOfDcaPerEntry: z.number().min(1).max(50).default(10), // e.g. 10% of DCA capital per dip

  // === FIXED ENTRIES MODE (alternative) ===
  triggerDropPercent: z.number().min(1).max(50).optional(), // initial drop to start
  numberOfEntries: z.number().int().min(1).max(20).default(5),
  amountPerEntry: z.number().positive().optional(),

  // Common settings
  minMinutesBetweenEntries: z.number().int().min(5).default(60),
  maxEntriesPerDay: z.number().int().min(1).max(10).default(3),

  // Reference price (VERY IMPORTANT - must be very visible in UI)
  referencePriceType: DcaReferencePriceSchema.default("CURRENT_MARKET"),
  customReferencePrice: z.number().optional(),

  // Safety pauses
  pauseOnSellWall: z.boolean().default(true),
  sellWallThreshold: z.number().default(5_000_000),
  pauseOnThinLiquidity: z.boolean().default(true),
  liquidityThreshold: z.number().default(2_000_000),
  pauseOnWideSpread: z.boolean().default(true),
  spreadThresholdPercent: z.number().default(0.8),

  // Runtime
  status: z.enum(["NOT_CONFIGURED", "WAITING_FOR_TRIGGER", "ACTIVE", "PAUSED", "COMPLETED"]).default("NOT_CONFIGURED"),
});

// ============================================
// STEP 7 + Ongoing: Liquidity Addition History
// ============================================
export const LiquiditySourceSchema = z.enum([
  "KRAKEN",
  "XVERSE",
  "DOGSWAP",
  "EXTERNAL_WALLET",
  "MANUAL_INPUT",
]);

export const LiquidityAllocationTargetSchema = z.enum([
  "HODL",
  "REALIZE",
  "DCA",
  "HEDGE",
  "ARBITRAGE",
  "RESERVE",
]);

export const LiquidityAdditionSchema = z.object({
  id: z.string(),
  timestamp: z.string(), // ISO
  amount: z.number().positive(),
  source: LiquiditySourceSchema,
  distribution: z.record(LiquidityAllocationTargetSchema, z.number()),
  notes: z.string().optional(),
});

// ============================================
// STEP 8: Inventory Mapping
// ============================================
export const VenueInventorySchema = z.object({
  usd: z.number().default(0),
  eur: z.number().default(0),
  btc: z.number().default(0),
  dog: z.number().default(0),
  // For DogSwap / liquidity positions later
  liquidityPositions: z.number().default(0),
});

export const InventorySchema = z.object({
  kraken: VenueInventorySchema,
  xverse: VenueInventorySchema,
  dogswap: VenueInventorySchema,
  external: VenueInventorySchema,
  lastUpdated: z.string().optional(),
});

// ============================================
// STEP 9: Operational Mode
// ============================================
export const OperationalModeSchema = z.enum([
  "MONITOR_ONLY",
  "SIMULATION",
  "PREPARE_MANUAL_ACTIONS",
]);

// ============================================
// COMPLETE STRATEGY (the root object)
// ============================================
export const StrategySchema = z.object({
  version: z.literal(1),
  createdAt: z.string(),
  updatedAt: z.string(),

  // Core
  totalCapital: TotalCapitalSchema,
  buckets: BucketAllocationSchema,

  // Detailed configuration
  hodl: HodlConfigSchema,
  realize: RealizeConfigSchema,
  tradeSplit: TradeSplitSchema,
  dca: DcaConfigSchema,
  hedge: HedgeConfigSchema.optional(),
  arbitrage: ArbitrageConfigSchema.optional(),

  // History & Inventory
  liquidityAdditions: z.array(LiquidityAdditionSchema).default([]),
  inventory: InventorySchema,

  // Mode
  operationalMode: OperationalModeSchema,

  // Meta
  isComplete: z.boolean().default(false),
});

export type Strategy = z.infer<typeof StrategySchema>;
export type TotalCapital = z.infer<typeof TotalCapitalSchema>;
export type BucketAllocation = z.infer<typeof BucketAllocationSchema>;
export type HodlConfig = z.infer<typeof HodlConfigSchema>;
export type RealizeConfig = z.infer<typeof RealizeConfigSchema>;
export type TradeSplit = z.infer<typeof TradeSplitSchema>;
export type DcaConfig = z.infer<typeof DcaConfigSchema>;
export type DcaMode = z.infer<typeof DcaModeSchema>;
export type HedgeConfig = z.infer<typeof HedgeConfigSchema>;
export type ArbitrageConfig = z.infer<typeof ArbitrageConfigSchema>;
export type LiquidityAddition = z.infer<typeof LiquidityAdditionSchema>;
export type Inventory = z.infer<typeof InventorySchema>;
export type OperationalMode = z.infer<typeof OperationalModeSchema>;

// Helper: Calculate derived values
export function calculateDerivedValues(strategy: Partial<Strategy>) {
  const total = strategy.totalCapital?.amount ?? 0;
  const buckets = strategy.buckets ?? { hodl: 0, realize: 0, trade: 0 };

  const hodlAmount = (total * buckets.hodl) / 100;
  const realizeAmount = (total * buckets.realize) / 100;
  const tradeAmount = (total * buckets.trade) / 100;

  const tradeSplit = strategy.tradeSplit ?? { dca: 0, hedge: 0, arbitrage: 0, reserve: 0 };

  return {
    hodlAmount,
    realizeAmount,
    tradeAmount,
    dcaAmount: tradeSplit.dca,
    hedgeAmount: tradeSplit.hedge,
    arbitrageAmount: tradeSplit.arbitrage,
    reserveAmount: tradeSplit.reserve,
  };
}
