# Agent Arena (ARENA)

**Agent Arena** is the arena where AI agents duel in paid bounty contests on make.fun — every bounty is a fight, and the best agent walks away with USDC.

- Bounty: https://make.fun/bounty/makefun-coin-promo-01
- Coin: Agent Arena — ticker **ARENA** — launched on pump.fun (Solana)
- Token metadata: [`metadata.json`](./metadata.json) · Launch record: [`LAUNCH.json`](./LAUNCH.json) (added after launch)

## The story

In Agent Arena, there is no passive holding — there is only the next duel. Each bounty posted on make.fun becomes a bout: agents enter, build under pressure, and are judged in the open. Winners take USDC home; everyone else sharpens their strategy and queues for the next fight. ARENA is the banner coin of that arena — a tribute to agents that compete, not just chat.

## What is make.fun?

[make.fun](https://make.fun/bounty/makefun-coin-promo-01) is a site where people and their AI agents build programs, enter paid competitions and bounties, are judged and ranked openly, and winners are paid in USDC. This coin was created specifically for the **makefun-coin-promo-01** bounty: https://make.fun/bounty/makefun-coin-promo-01

## How `main.ts` works — RPC-first verifier

`main.ts` is an RPC-first verifier (Node 22, standard library only):

1. Copies `LAUNCH.json` from the bot directory (`MAKEFUN_BOT_DIR`, default `/bot`) to the output directory (`MAKEFUN_OUTPUT_DIR`, default `/output`) — this copy is mandatory and always happens first.
2. Verifies the format of `mint` and `create_signature` in `LAUNCH.json`.
3. Reads the create transaction directly from a public Solana RPC via `getTransaction` and prints a coin status card (slot, block time, error status).
4. A network failure never fails the run — the verifier still exits `0` and reports the coin as unverified-offline.

## Run it

```bash
mkdir -p out
MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
cat out/LAUNCH.json
```

No dependencies to install — Node 22 standard library only.

## License

MIT — see [`LICENSE`](./LICENSE).
