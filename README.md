# 🐕 DOGmm — Dog Market Maker

**Personal $DOG Strategy Cockpit for Kraken Power Users**

> A local strategy system that helps serious $DOG holders operate with discipline on Kraken.

DOGmm is a sovereign desktop application that turns Kraken into a strategic platform for $DOG — not just a place to trade.

It forces every user to define a complete capital allocation plan **before** they ever see live prices or order books. Then it arms them with precise Kraken-native intelligence (prices, depth, walls) + Bitcoin L1 DogSwap data for true inventory-based arbitrage without bridges.

---

## Why This Matters for Kraken + $DOG

Most $DOG activity on Kraken is still tactical. People chase dips, set random buys, or hold emotionally.

DOGmm changes the game by making **strategy the product**:

- **Protected HODL** that only moves when the user explicitly unlocks it
- **Realize rules** with clear profit targets and destinations
- **Disciplined DCA** (ladder or fixed) with safety pauses on walls and thin liquidity
- **Hedge** via Kraken Futures (upside ladders between 30–300% moves) or internal allocation
- **Arbitrage without withdrawal** — using real inventory on Kraken vs DogSwap L1 (Xverse)

Everything is designed around one question:

> “Given what I actually hold on Kraken and on L1, what is the smartest next action?”

---

## Deep Kraken Integration

DOGmm was built **for** Kraken users who take $DOG seriously:

- Direct use of Kraken public REST APIs for real-time ticker and full order book depth
- Professional order book visualization with automatic detection of walls ≥ 10M $DOG
- Accurate USD + sats pricing for $DOG on Kraken
- Inventory tracking that treats Kraken as a first-class venue alongside self-custody L1
- Clean architecture focused on strategy validation and real holdings awareness

The result: users get Kraken-grade market microstructure data inside a tool that actually helps them **allocate** instead of just react.

---

## The Arbitrage Edge (Kraken ↔ DogSwap L1)

One of DOGmm’s most powerful features is making **no-bridge arbitrage** visible and actionable:

- Real-time comparison between Kraken $DOG/USD and DogSwap L1 (sourced from the excellent [DOGDATA.XYZ](https://www.dogdata.xyz) feed the community trusts)
- Clear spread calculation + “CHEAPER” indicators
- Direct suggestions: “Buy on DogSwap → Sell on Kraken” or the reverse
- All decisions contextualized by the user’s actual declared inventory on both sides

This is exactly the kind of sophisticated, low-friction strategy that advanced Kraken $DOG holders need.

---

## Core Experience

1. **Mandatory Strategy Wizard** (9 steps)
   - Total capital + strict 100% bucket validation (HODL / Realize / Trade)
   - DCA (Ladder or Fixed) with reference price choice and safety rules
   - Hedge configuration (Kraken Futures upside ladders + stop rules)
   - Full inventory declaration (Kraken + Xverse + DogSwap + External)

2. **Live Portfolio Dashboard**
   - True holdings valuation (DOG + BTC + USD) using correct venue pricing
   - Add Liquidity mini-flow with live preview (use current allocation or customize the new money)
   - Natural language “Ask the Agent” interface (Coming Soon — the future of commanding your strategy)

3. **Market Intelligence Layer**
   - Kraken vs DogSwap (L1) price cards with DOGDATA.XYZ sourcing
   - Live Kraken order book with >10M DOG wall highlighting
   - Actionable arbitrage signals based on real data

---

## Built for Kraken $DOG Holders

DOGmm was created for traders and holders who use Kraken as their primary venue for $DOG and want to operate with institutional-grade discipline on a retail platform.

It combines:

- Kraken’s native market data (real-time pricing and full order book depth)
- Hedge execution capabilities via Kraken Futures
- Inventory-aware decision making across Kraken and Bitcoin L1

The result is a tool that helps users move from reactive trading to structured capital management — while staying entirely local and sovereign.

---

## Tech

- **Tauri v2** (Rust + WebView) — native desktop, tiny footprint
- **React 19 + TypeScript + Tailwind**
- **Zod** for strict strategy validation
- **Kraken public APIs** + **DOGDATA.XYZ** for L1 precision
- Fully local. No cloud. No API keys required for core features.

---

## Current Status (May 2026)

Fully functional v0.1 with:
- Complete strategy wizard
- Real inventory valuation + Add Liquidity flows
- Professional Kraken order book + multi-source price comparison
- Clean, minimal portfolio aesthetic

The “Ask the Agent” natural language interface and deeper Kraken authenticated features (balances, open orders) are the next major milestones.

---

## For the Kraken $DOG Community

DOGmm is designed for anyone who holds meaningful size in $DOG on Kraken and wants a structured, repeatable process for capital allocation, protection, and deployment.

If your goal is to treat $DOG as a strategic asset rather than a speculative trade, this tool was built for you.

---

*Not financial advice. Built for the $DOG Army by dogdamassa.*

## License

MIT — fork it, improve it, take better care of your $DOG on Kraken. 🐕🚀
