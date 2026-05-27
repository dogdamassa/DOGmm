# DOGAIKRAKEN — Agent Guidelines

## Core Mandate

The capital setup and strategy planning flow is the **foundation** of this entire product.

Every feature, screen, and piece of intelligence must ultimately serve the user's declared personal strategy. Market data is a tool, not the product.

## Non-Negotiable Rules

1. **Onboarding First**
   - The app must never show charts, order books, or raw market data as the primary first experience.
   - A user who has never completed the strategy wizard should be gently but firmly guided back to it.

2. **Clarity of Capital**
   - Every screen must help the user answer "Where is my money right now?" in under 3 seconds.
   - If a number appears, the user must be able to trace it back to their own allocation choices.

3. **Validation is Sacred**
   - In the strategy wizard, total allocation must always equal 100%.
   - Trade sub-buckets must never exceed the parent Trade bucket.
   - DCA math (entries × amount) must be consistent and visible.

4. **Inventory is Personal**
   - Arbitrage suggestions must be based on *what the user actually holds* across venues.
   - Never suggest bridge-dependent arb as the default. Always surface "no bridge required" opportunities first when inventory supports it.

5. **Local First**
   - All strategy state lives locally.
   - Kraken CLI is the only external dependency for market data (public endpoints).

## Development Priorities (Current Phase)

Priority order:

1. Strategy Onboarding Wizard (all 9 steps + review)
2. Persistent strategy storage + load on startup
3. Post-setup Dashboard skeleton with the 7 core cards
4. Kraken CLI integration layer (reuse dog-intel patterns)
5. Add Liquidity flow (the ongoing version of Step 7)
6. DCA execution simulation / tracking
7. Inventory-based arbitrage detection logic
8. Polish, risk scoring, agent suggestions

Do not jump to beautiful charts or real-time order books until the above foundation is solid and delightful.

## UI/UX Principles

- Dark cockpit aesthetic (deep blacks, subtle borders, gold #f5a623 accents)
- Monospace for all numbers and labels where precision matters
- Information density is good, but never at the cost of instant comprehension
- Every complex configuration must have a "plain English" summary next to it
- Use progressive disclosure: advanced pause conditions in DCA should be collapsed by default

## Technical Patterns (from dog-intel reference)

When integrating market data:

```ts
// Preferred pattern (inspired by dog-intel)
const result = await invoke('run_kraken_cli', {
  command: 'ticker DOG/USD',
  format: 'json'
});
```

Keep the CLI calls thin and cache aggressively (60s like the reference).

## State Management

- Strategy state must be versioned (we will evolve the schema).
- Always separate "user declared strategy" from "current calculated state".
- Never mutate the user's plan without explicit confirmation.

## Questions to Ask Before Implementing Any Feature

- Does this help the user understand where their capital is allocated?
- Does this respect the rules the user set in the wizard?
- Would this still make sense if the user had $500 or $50,000 allocated?
- Can the user explain this screen to another $DOG holder in one sentence?

If the answer to any is "no" or "maybe", redesign.

## Current Project Phase

**Foundation Phase** — We are building the Strategy Cockpit core.

Everything else is secondary until the capital planning experience feels complete and trustworthy.
