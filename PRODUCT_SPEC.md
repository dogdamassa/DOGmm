# DOGAIKRAKEN — Product Specification

**Version:** 0.1 (Foundation Phase)
**Date:** 2026

---

## 1. Product Positioning

DOGAIKRAKEN is a **personal $DOG strategy cockpit**, not a trading terminal.

Its job is to make the user *dangerously clear* about their capital allocation, rules, and inventory before they ever make a decision.

The market data layer (powered by Kraken CLI) is a supporting actor. The strategy the user defines is the protagonist.

---

## 2. First Run Experience (Mandatory)

On first open → user is forced into the **Strategy Setup Wizard**.

They cannot access any dashboard, charts, or intelligence until they complete or explicitly save a draft of their plan.

### Wizard Steps (Exact Order)

#### Step 1: Total Capital
- Simple number input: "How much capital are you allocating to this strategy?"
- Currency: USD (or allow EUR toggle later)
- Example: $1,000
- Validation: > 0

#### Step 2: Bucket Allocation (HODL / Realize / Trade)
- Three sliders or percentage inputs that must sum to exactly 100%
- Live validation bar showing remaining %
- HODL (protected long-term)
- Realize (profit taking)
- Trade (active strategies)
- Cannot proceed until 100%

#### Step 3: Configure HODL
- Display the HODL amount from previous step
- "This capital is protected. It will not be touched for DCA, hedging, or realization unless you explicitly unlock it later."
- Optional: Allow manual override toggle (advanced)
- Simple confirmation + notes field

#### Step 4: Configure Realize
- Target profit % (e.g. 40%)
- Realization % of position (e.g. 20%)
- Realized profit destination:
  - BTC
  - USD (stable)
  - Back into available capital (for reuse)
- Can realized profit be reused for DCA / liquidity later? (yes/no toggle)

#### Step 5: Trade Bucket Internal Split
- Show the Trade bucket total
- Four internal buckets that must sum ≤ Trade total:
  1. DCA
  2. Hedge
  3. Arbitrage
  4. Reserve Cash
- Live remaining indicator
- Validation prevents over-allocation

#### Step 6: DCA Configuration (Critical)
This is the most sophisticated part of the wizard.

Fields:
- Total DCA Capital (pre-filled from Step 5, editable)
- Trigger Condition:
  - Price drop % from reference (e.g. 8%)
- Entry Structure:
  - Number of planned entries (e.g. 5)
  - Amount per entry (auto-calculated or manual)
- Timing Rules:
  - Minimum minutes/hours between entries
  - Maximum entries per 24h period
- Safety Pauses (toggles + thresholds):
  - Pause if sell wall ≥ X DOG within Y%
  - Pause if liquidity within 1% < Z DOG
  - Pause if spread > W%
- Reference Price:
  - Current market price (at setup time)
  - Average entry price (if user has existing position)
  - Custom price (user input)

UI must clearly show the resulting plan:
> Total DCA: $150  
> Trigger: 8% drop  
> 5 entries × $30  
> Status: Waiting for trigger

#### Step 7: Liquidity Additions
- Explain the concept: "You will add more capital over time. Define how the system should handle it."
- Future additions can be:
  - Added to specific buckets (HODL / DCA / Arbitrage / etc.)
  - Or left as "unallocated" for manual decision later
- This step can be light on first run — the real power is the "Add Liquidity" action available later on the dashboard.

#### Step 8: Inventory Mapping
This is where the arbitrage intelligence becomes personal.

User declares current holdings across venues:

**Kraken**
- USD / EUR balance available for trading
- DOG balance

**Xverse (or other Bitcoin wallet)**
- BTC
- DOG (Runes)

**DogSwap / Stacks ecosystem**
- Liquidity positions
- DOG holdings

**External / Manual**
- Free text or structured entries for cold wallets, other exchanges, OTC, etc.

The system later uses this to detect **inventory-based arbitrage** opportunities (buy low on one venue where you have cash, sell high on another where you already hold DOG — no bridge required).

#### Step 9: Operational Mode + Review
- Three modes:
  1. **Monitor Only** — Track everything, suggest nothing actionable
  2. **Simulation** — Generate hypothetical actions and track what *would* have happened
  3. **Prepare Manual** — Generate specific, copy-paste ready actions for the user to execute themselves
- Final review screen showing the entire strategy in a clean summary
- "Save Strategy & Enter Cockpit" button

---

## 3. Core Dashboard (Post-Setup)

The dashboard must be scannable in under 10 seconds.

### Primary Cards (Priority Order)

1. **Capital Overview**
   - Total allocated
   - Current estimated value (with $DOG price from Kraken)
   - Available cash vs locked in positions
   - Overall P&L (if we have entry tracking later)

2. **Bucket Allocation**
   - Three large visual cards: HODL / Realize / Trade
   - Show current $ and % for each
   - Sub-breakdown for Trade (DCA / Hedge / Arbitrage / Reserve)

3. **DCA Plan**
   - Current status (Waiting / Active / Paused / Completed)
   - Trigger condition + distance to trigger
   - Entries remaining / total
   - Next possible action
   - Safety pauses active

4. **Liquidity History + Add Button**
   - Timeline of capital additions
   - Big prominent "Add Liquidity" CTA that opens the same distribution flow as Step 7

5. **Inventory Map**
   - Visual representation of where capital and DOG live
   - Kraken | Xverse | DogSwap | Other
   - Quick "Refresh from Kraken" button (calls CLI)

6. **Arbitrage Readiness**
   - "You have inventory on both sides" indicator
   - Current best inventory-based opportunity (if any)
   - "No bridge required" badge when applicable
   - Warning when liquidity is too thin for the opportunity to be real

7. **Agent Decision / Suggestion**
   - One clear recommendation based on current market state + user's rules
   - "Why" explanation (references their own DCA rules, inventory, risk settings)
   - Confidence level + manual verification checklist

### Secondary / Supporting Areas
- Risk Score (simple composite: concentration, DCA coverage, liquidity fragmentation)
- Recent Added Liquidity
- Strategy Health (are you respecting your own rules?)

---

## 4. Key Product Rules

- Never show the user a chart as the first thing.
- Never ask them to trade before they have declared their strategy.
- Every number on screen must be explainable from the user's own plan.
- Inventory-based arbitrage is the killer differentiator. Generic cross-venue arb is secondary.
- The system should feel like a very competent, slightly obsessive co-pilot — not an autopilot.

---

## 5. Non-Goals (For Now)

- Do not build automated execution (the user explicitly wants manual or simulated actions in v1)
- Do not build complex on-chain indexing
- Do not prioritize beautiful price charts over capital clarity
- Do not add social / sharing features

---

## 6. Success Metrics (Qualitative)

A user should be able to answer these questions in < 5 seconds after opening the app:

1. How much of my total capital is protected forever?
2. How much am I willing to realize and at what profit?
3. How many DCA entries do I still have available if price drops 12%?
4. Do I currently have the inventory to act on an arbitrage opportunity without moving funds?
5. What single action, if any, does the system think I should consider today?

If the UI cannot answer these clearly, we have failed.

---

*This document is the source of truth for the capital planning experience.*
