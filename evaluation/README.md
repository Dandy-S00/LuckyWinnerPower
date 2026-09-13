# Game Evaluation Framework

The evaluation suite checks the pure game rules used by the in-app demo games. It is intentionally dependency-free and runs with the Node.js built-in test runner.

## Commands

```bash
npm test
npm run evaluate
```

## Current checks

- Three matching slot symbols pay 12x the bet.
- An adjacent slot pair pays 2x the bet.
- Non-matching slots pay zero.
- Roulette maps zero to green and validates red/black outcomes.
- Roulette pays only when the selected color matches.
- River Sweep handles matching-card payouts.
- A wager cannot reduce credits when the player cannot afford it.

These are client-side demo-credit rules. They are not a payment, wallet, or server-authoritative payout system. Real-money or sweepstakes balances must remain server-authoritative before production use.
