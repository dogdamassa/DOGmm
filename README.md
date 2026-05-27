# 🐕 DOGmm — Dog Market Maker

**Personal $DOG Strategy Cockpit for Kraken Power Users**

> Built to make serious $DOG holders on Kraken dangerously intentional with their capital.

DOGmm is a sovereign desktop application that turns Kraken into a strategic platform for $DOG — not just a place to trade.

It forces every user to define a complete capital allocation plan **before** they ever see live prices or order books. Then it arms them with precise Kraken-native intelligence (prices, depth, walls) + Bitcoin L1 DogSwap data for true inventory-based arbitrage without bridges.

---

## Why This Matters for Kraken + $DOG

Most $DOG activity on Kraken is still tactical. People chase dips, set random buys, or hold emotionally.

DOGmm changes the game by making **strategy the product**:

- **Protected HODL** that only moves when the user explicitly unlocks it
- **Realize rules** with clear profit targets and destinations
- **Disciplined DCA** (ladder or fixed) with safety pauses on walls and thin liquidity
- **Hedge ladders** on the upside (30–300% moves)
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
- Architecture inspired by the best community patterns (dog-intel) but evolved into a full strategy system

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
   - Upside hedge ladders + stop rules
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

## Built for the Kraken Ecosystem

This project exists because of the incredible foundation laid by the $DOG community and Kraken’s own tooling efforts:

- Direct inspiration from [ra1nb93/dog-intel](https://github.com/ra1nb93/dog-intel)
- Heavy use of Kraken public market data patterns
- Designed to increase the quality and intentionality of $DOG activity on Kraken

DOGmm is a love letter to Kraken power users who want to treat $DOG like serious capital — not just another meme to ape.

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

## For the Kraken Agent Zero / $DOG Community

If you’re a serious $DOG holder on Kraken who wants to stop gambling and start *managing* capital with discipline, DOGmm is for you.

It’s the tool I wish existed when I started accumulating. Now it does.

Built in public. Built with love for the Army. Built to win on Kraken.

---

*Not financial advice. Built for the $DOG Army by dogdamassa.*

## License

MIT — fork it, improve it, take better care of your $DOG on Kraken. 🐕🚀
