# Development log

## 2026-04-24 — Vault unlocking flow + Personal vaults + plain-English copy

- **Personal (solo) vaults** (`lib/btcScript.ts`): new `deriveSoloP2wshVault` — witness script `<ownerPubkey> OP_CHECKSIG` wrapped in P2WSH. Named on-chain pocket only the owner can spend from. Added `createSoloBtcVaultRecord` in `btcVaultStorage.ts` with a `kind: "solo" | "multisig"` field and a `getVaultKind` helper for back-compat on legacy rows.
- **`CreateBtcVault.tsx`**: fully rewritten with a kind picker (Personal / Shared) as step 1. Solo flow skips the signer step entirely — two-step wizard. Multisig flow keeps the signer step but with plainer copy (no BIP-67 / P2WSH / m-of-n jargon). On success we redirect to the vault view instead of the wallet selector.
- **Send flow (`BtcVaultView.tsx`)**: rewired into a single `phase` state machine — `idle → building → awaiting-sign → signing → ready → broadcasting → sent`. For solo vaults the user signs once and gets a Broadcast button; for multisig the PSBT is surfaced for collection and auto-detects threshold via local `Transaction.finalize()`. Percent chips (25/50/75/Max), USD echo, inline fee summary, explorer link on success.
- **`lib/btcVaultSpend.ts`** (new): shared PSBT builder used by the vault page. Handles coin selection, feerate picking, solo vs multisig vsize estimation, dust handling.
- **Copy trim**: removed user-facing references to “P2WSH”, “CLTV”, “CHECKLOCKTIMEVERIFY”, “non-custodial”, “BIP-67”, “m-of-n”, “deterministic”, “preview-only”, etc. from `Locks.tsx`, `BtcVaultCard.tsx`, `CreateBtcVault.tsx`, `BtcVaultView.tsx`. Lock disclaimer is now “Funds lock on-chain until the unlock date…”.
- **`BtcVaultCard.tsx`**: badges now show `Personal` (with user icon) or `X of Y` (with users icon) instead of `N-of-M P2WSH`.

## 2026-04-24 — Locks page: user-facing copy only

- Removed internal “why not vaults” / product-modeling block from `Locks.tsx`. Single “Coming soon” card with short user-facing bullets (BTC, STX, shared control).

## 2026-04-24 — Send UX, header STX/USD, bolder header

- **Send:** Dark-themed tab triggers (no default light `bg-background` on active), full-width tab bar, copy/callout when `walletId` missing, Stacks wizard gated behind route param, Btc send panel: labeled inputs, from-address in a code box, a11y `htmlFor`/`id`, removed extra `<Toaster />`s from `WizardStepRenderer`.
- **WalletLayout:** **CoinGecko** STX/USD on mount, **Charisma** still preferred when its USD price is valid; `useParams` network sync effect depends only on `walletId` (avoids bad loop); balance hook uses `walletId ?? ""`.
- **Header:** Truncated **STX** address + copy in STX cell; **font-extrabold** / **font-bold** for amounts and USD (STX + BTC).

## 2026-04-24 — BTC in Asset Overview; Vaults → Locks; product copy

- **Asset Overview** (`AssetOverview.tsx`): **Bitcoin (L1)** row via `useBtcWallet` (balance, USD, Connect / Send); **total** header sums STX + sBTC + native BTC USD; STX line uses 2 d.p.
- **Nav:** removed **Vaults** from desktop + mobile sidebars; **`/vaults/:walletId`** redirects to **`/locks/:walletId`**; deleted `Vaults.tsx`.
- **Dashboard** intro: smart wallet deploy framed as **BTC-vault–like**; multisig, threshold, new in-app wallet; **Locks** page expanded (same + “shared control” blurb). `ui-v3/README.md` route blurb updated.

## 2026-04-24 — Compact header, STX/USD fix, Locks page

- `WalletLayout`: when Charisma/`.stx` price fails, **CoinGecko** (`fetchStxUsdPrice` / `lib/stxPrice.ts`) fills STX/USD; balance display **2** decimals. USD shows `—` only when price unavailable.
- `WalletHeader`: single tight row (reduced padding, small labels, no heavy cards) — STX and BTC as compact strips; “From wallet” → small **STX** hint + title on BTC cell; slimmer account/network controls.
- New route **`/locks/:walletId?`** (`Locks.tsx`): coming soon, copy for **native Bitcoin non-custodial** locks and **STX** locks; **Locks** nav enabled (desktop + mobile) instead of disabled “Soon”.

## 2026-04-24 — Header: BTC address with STX; fewer BTC decimals

- `formatBtcFromSats` in `utils/numbers.ts` (max 5 fraction digits, no forced trailing zeros). Used in `WalletHeader` and `MobileNavigationDrawer` instead of 6–8 decimals.
- When STX is present and a BTC (L1) address exists: truncated BTC is shown in the **BTC balance card** with copy; **Accounts** button (`md+`) shows STX and BTC on two lines; **mobile nav drawer** STX/BTC block shows a truncated BTC line under the balance.

## 2026-04-24 — Header accounts: Taproot (P2TR) in dropdown

- `BtcWalletContext`: `getAccounts` requests Payment + Ordinals; persists optional `taprootAddress` from Ordinals / P2TR; exposes `taprootAddress` (sats session or `walletData.taprootBtc`).
- `WalletHeader` Accounts menu: second row **Taproot (P2TR)** with copy when it differs from the payment (L1) address; unified label **Bitcoin · Taproot (P2TR)** when payment is Taproot or same as `taprootAddress`.

## 2026-04-24 (revision) — BTC UX realignment

- Removed `/native-btc` route and sidebar link; added `BtcWalletProvider` + header CTA **Connect Bitcoin wallet** with BTC amount/USD (Mempool + CoinGecko).
- **Send** and **History** use **Stacks | Bitcoin** tabs; L1 send lives in `BtcSendPanel`.
- Sidebar: **Locks** = coming soon (disabled); **Vaults** page copy = coming soon.
- `btcMempoolService` for L1 address balance and tx list for history tab.

## 2026-04-24 — Single-wallet BTC via @stacks/connect + custom time picker

- **`BtcWalletContext`:** rewritten to go through the main `WalletContext` (i.e. `@stacks/connect`). No more `sats-connect` provider or `csw_btc_account_v1` persistence. `activeBtcAddress` = `walletData.preferredBtc`; `connectBtcWallet()` now delegates to `connectWallet()`. Consumer interface preserved (`satsBtcAddress` = `null`, `disconnectDedicatedBtc` = no-op) so the header’s Unlink disappears automatically.
- **Send path:** `Locks.tsx` and `BtcSendPanel.tsx` use `request('sendTransfer', { recipients })` from `@stacks/connect`. Cancellations handled via JSON-RPC `4001`.
- **Cleanup:** removed `services/satsConnectAdapter.ts`; dropped `sats-connect` + `@sats-connect/core` from `package.json`. Help copy updated (header tooltip, BTC send empty state).
- **`components/ui/time-picker.tsx`:** new Radix `Select`-based hour / minute / AM-PM picker (5-min steps by default, dark theme). Replaces the native `<input type="time">` on the Locks page. `toHHmm` now snaps its initial value to the picker step.

## 2026-04-24 — BTC Lock UX: percent chips, slider, calendar date picker

- **`pages/Locks.tsx`:** pulls `balanceSats` / `loadingBalance` from `useBtcWallet` to show *Available BTC + USD* next to the amount field.
- **Percent chips** (10 / 25 / 50 / 75 / Max) + **slider** (0–100%) write the amount deterministically from sats, so there is no float drift.
- Live echo: `{percent}% of balance`, `sats`, and `≈ $USD` (from `useAssetPrices().btcUsd`); red helper when amount exceeds balance.
- Replaced `datetime-local` with **shadcn `Popover` + `Calendar`** for the date (past dates disabled) and an `<input type="time">` for the time; combined into a single `Date`, still enforced ≥ 1 h from now; on success we reset to *+24 h*.

## 2026-04-24 — BTC Lock feature (Stacks locks coming soon)

- **`lib/deriveBtcLockAddress.ts`:** deterministic Taproot-style preview lock address per `(lockId, owner, unlockUnix)`; ready to swap for a real CLTV P2WSH/P2TR script via `bitcoinjs-lib` without changing storage.
- **`lib/btcLockStorage.ts`:** `csw_btc_locks_v1` with `createBtcLockRecord` / `updateBtcLock` / `removeBtcLock` and `BTC_LOCKS_CHANGED_EVENT` for live list refresh.
- **`pages/Locks.tsx`:** Bitcoin / STX tabs. BTC tab:
  - Connect BTC CTA when unconnected; sending address preview.
  - Form: amount (BTC) + unlock datetime (min +1h) + optional note; USD + sats echo; Mempool feerate hint.
  - `sats-connect` `sendTransfer` to the derived lock address → record `txid`, status `broadcast`, toast, reset inputs.
  - Lock list with status chips (pending / broadcast / locked confirmed / unlock window open), explorer link, copy txid/address, remove.
  - Background poll (60s) of Mempool `/address/{lock}/txs` to move `broadcast → confirmed`, and to flip `confirmed → unlockable` when `unlockUnix` passes.
- STX tab: "coming soon" card, same routing as before.

## 2026-04-24 — BTC vault list: derived address + “View” coming soon

- **`lib/deriveBtcVaultAddress.ts`:** SHA-256–deterministic Taproot-**style** preview string (`bc1p` / `tb1p` from linked L1), not spendable on-chain.
- **`lib/btcVaultStorage.ts`:** local list `csw_btc_vaults_v1`, `appendBtcVault`, `BTC_VAULTS_CHANGED_EVENT` for same-tab refresh.
- **`CreateBtcVault`:** shows derived preview; **Add to my wallets** saves and returns to the selector.
- **`BtcVaultCard` + `WalletSelector`:** vaults in the same grid as smart wallets; **View vault** disabled with tooltip *coming soon*; copy on derived address.

## 2026-04-24 — App wiring: asset prices + Create BTC vault route

- **`App.tsx`:** `AssetPricesProvider` wraps `BtcWalletProvider` (STX/BTC spot flows from one context into BTC balance USD). Route **`/create-btc-vault`** → `CreateBtcVault.tsx` (placeholder multi-step flow).
- **`WalletSelector`:** `stxUsdLabel` uses **`pricesLoading`** from `useAssetPrices` so USD shows `—` until the shared spot is ready.
- **`WalletSelectorHeader`:** `satsBtcAddress` is used directly for unlink/show flags (renamed from `hasDedicatedBtc`).

## 2026-04-24 — BTC wallets, onboarding, vaults (ui-v3)

- Unified `WalletContext` with `useWalletConnection` (single source); added `walletSession.ts` with `preferredStx` / `preferredBtc`.
- Installed `sats-connect`; added `satsConnectAdapter.ts`, `bitcoinTxService.ts` (Mempool feerates + explorer links), `NativeBtcSend` page.
- Added `/onboarding` (personal vs group, localStorage), redirect from `/wallet-selector` when connected and not completed.
- Added `/vaults/:walletId?` policy/vault spike page; sidebar links for Vaults and Native Bitcoin.
- Extended `chain-config` for native BTC address prefixes; added `embeddedWalletPolicy.ts` placeholder for future WaaS.

## 2026-04-24 — Fix `JsonRpcError` on BTC lock create

Root cause: `deriveBtcLockAddressPreview` produced a `bc1p…` string without a valid BIP-173 checksum, so Leather rejected `sendTransfer` with `JsonRpcError` (InvalidParams). Our `catch` also compared `code === 4001`, which never matches the `@stacks/connect` error codes (`-32000` / `-31001`).

- **`lib/btcLockStorage.ts`:** `createBtcLockRecord` now sets `lockAddress = ownerBtcAddress` (MVP self-send) and keeps the deterministic string as `previewScriptHint` for future migration to a real CLTV P2WSH/P2TR script. Type-guard updated.
- **`pages/Locks.tsx`:** imports `JsonRpcError` + `JsonRpcErrorCode` from `@stacks/connect`; new `parseStacksRpcError` helper surfaces `message` + `data` and classifies `UserRejection` / `UserCanceled` as "Cancelled". Added preflight checks (dust limit 546 sats, balance guard). UI label changed to **Funded address** with an honest MVP note.
- **`components/send/BtcSendPanel.tsx`:** same error-handling upgrade — real `JsonRpcError` branch instead of the bogus `4001` check.

## 2026-04-24 — Pass `network` to `sendTransfer` (fix `InsufficientFunds` on testnet addresses)

Leather's `BitcoinCoinSelectionService` was throwing `BitcoinError: InsufficientFunds` because `stacksRequest("sendTransfer", …)` defaulted to mainnet UTXO selection while the connected wallet was holding funds on **testnet3**. The address in our `BtcWalletContext` is already network-tagged, so we now forward that hint:

- **`pages/Locks.tsx` & `components/send/BtcSendPanel.tsx`:** import `getClientConfig` from `@/utils/chain-config`, infer `"mainnet" | "testnet"` from `activeBtcAddress` (via its bech32/legacy prefix), and pass it as `network` on the `sendTransfer` params. No change needed to Leather or to our address discovery — the wallet picks the correct BTC account using the supplied network string.

## 2026-04-24 — Platform fee + live on-chain lock state + UTC-safe dates

Three pain points the user flagged in one turn: (1) no way to charge a platform fee to the CSW treasury; (2) the Locks UI showed stale "pending" status on freshly confirmed tx; (3) dates looked arbitrary — "Unlocks 4/24/2026 3:40 PM · in ~8 h" for something created minutes earlier — with no time-zone disambiguation.

- **`lib/platformFee.ts` (new):** single source of truth for the CSW treasury fee. Env-overridable (`VITE_CSW_TREASURY_BTC_MAINNET` / `_TESTNET`, `VITE_CSW_FEE_BPS`, `_MIN_SATS`, `_CAP_SATS`). Defaults: 10 bps (0.10%), min 546 sats, cap 50k sats. `computeBtcPlatformFee(amount, network)` is **fail-open** — if no treasury is configured for the active network the fee is silently skipped, so we never route funds to a placeholder.
- **Lock funding (`pages/Locks.tsx → handleCreateLock`):** `sendTransfer` now takes *two* recipients when a fee is enabled — the CLTV P2WSH lock output *and* a second output to the treasury. Balance check (`exceedsBalanceWithFee`) and the new fee-summary card both account for the extra cost. Disclosed to the user right above the "Lock BTC" button.
- **Lock sweep (`lib/btcLockSpend.ts`):** `buildUnlockPsbt` now attaches the treasury output inside the PSBT itself (so the lock's owner pays the fee at redemption time). `BuildUnlockPsbtResult` gains `platformFeeSats` + `platformFeeTreasury`. vsize budget grows by 31 vB when a fee output is present.
- **Vault spend (`lib/btcVaultSpend.ts`):** same pattern — platform-fee output is added before change, coin-selection loop now covers `amount + miner fee + platform fee`, result struct surfaces the new fields. `BtcVaultView` renders a "Platform fee" row in the spend summary when non-zero.
- **Adaptive poller (`pages/Locks.tsx`):** replaced the flat 45 s interval with a back-off ladder (5 s → 10 s → 20 s → 45 s). Every new lock resets the cadence to 5 s via the `locks.length` dep. Visibility returns also reset. Polling now pulls three on-chain signals per lock in parallel: `/tx/{txid}/status`, `/blocks/tip/height`, and `/address/{lockAddress}` — so we surface balance + confirmations even when mempool.space hasn't re-indexed the owner's tx list yet. Sweep tx status is tracked independently so the UI keeps updating after `status === "spent"`.
- **On-chain state row:** each lock row now shows *On-chain balance / Funding tx / Sweep tx* ("In mempool", "N conf.") pulled from the poller. First visible signal lands within ~5 s of creating a lock.
- **Time handling:** new `formatRelativeTime(unix, now, "future" | "past")` returns `"in 45s" / "12s ago" / "in ~8 h" / "2 d ago"` — crucially handles sub-minute deltas so a just-created row renders as `just now` instead of `in ~0 h`. `formatAbsolute(ms)` appends the short time-zone name (e.g. `GMT+2`) so the absolute stamp is unambiguous. The `now` ticker went from 30 s → 5 s so the relative strings stay live.


## 2026-04-24 21:18 — Collapsible lock cards + conclusive time labels

- `pages/Locks.tsx`: each lock row now uses `Collapsible` with a compact summary (`amount`, `status`, `unlock`, `created/funded`) and a `Details` toggle for long technical sections (addresses, txids, on-chain breakdown, note, optional remove button).
- Timing hardening in lock rows: `Unlocks` and `Created/Funded` now both show **local time + explicit UTC line**, and relative labels now use floor/ceil logic (no ambiguous rounding drift).
- Added guard for indexer clock skew: if `fundedAtUnixSec` appears in the future by more than 2 minutes, UI falls back to local `createdAt` and shows a warning banner instead of displaying misleading future-funded timestamps.

## 2026-04-24 22:05 — Status chip derived from wall-clock + on-mount promotion

- `chipFor()` in `pages/Locks.tsx` now derives "Unlock window open" purely from `unlockUnixSec <= now && lock.txid` — catches stale `confirmed`/`broadcast` rows whose unlock time has passed but whose persisted `status` wasn't yet promoted. Also adds a terminal `Unlocked · swept` chip for `status === "spent"` so completed locks don't get ambiguous labeling.
- On Locks-page mount, any `confirmed` row whose `unlockUnixSec` has elapsed is promoted to `unlockable` immediately via `updateBtcLock` — no 5s wait for the first poll cycle. Prevents the "lock past its unlock time still shows Locked · confirmed" flicker users reported.


## 2026-04-24 22:40 — Fix `signPsbt` TypeError on unlock / vault spend

- `@stacks/connect` v8's runtime marshaller for Leather's legacy `signPsbt` shape calls `params.signInputs.map(...)` unconditionally — even though the TS type declares `signInputs?` as optional. Omitting it triggered `TypeError: Cannot read properties of undefined (reading 'map')` inside `@stacks_connect.js` and killed the claim/sweep flow.
- Fix: `Locks.tsx` (`handleUnlock`) and `BtcVaultView.tsx` (`handleSign`) now pass an explicit `signInputs = [0, 1, ..., inputCount-1]` array built from the PSBT's input count, asking the wallet to sign every input. No behavior change on the wallet side — the sig set is the same one we always intended.

## 2026-04-24 23:05 — Manual finalizer for CLTV-P2WSH lock spends

- After `signPsbt` started returning successfully (previous fix added the required `signInputs`), `tx.finalize()` blew up with `Error: Unknown inputs not allowed` from `@scure/btc-signer`'s `finalizeIdx`. The library only auto-finalizes inputs whose witnessScript matches one of its built-in shapes (P2WPKH, BIP-67 multisig, taproot…); our CLTV script `<unlockTime> CLTV DROP <pubkey> CHECKSIG` isn't one of them.
- Added `ui-v3/src/lib/btcLockFinalize.ts` → `finalizeCltvSpendPsbt(signedPsbtBase64, lock)`. It loads the PSBT with `allowUnknownInputs: true`, pulls each input's `partialSig` matching the lock's `ownerPubkey`, and writes `finalScriptWitness = [signature, witnessScript]` directly via `updateInput`. Then `tx.extract()` produces the broadcastable raw tx and `tx.id` gives the txid.
- `Locks.tsx → handleUnlock` now calls the new finalizer instead of `tx.finalize()`. Removed the now-unused `Transaction` and `base64` imports from the page.

## 2026-04-24 23:55 — Locks popup spam fix + Dashboard pricing + Vault dashboard view

- **Wallet popup spam on Locks page open (`pages/Locks.tsx` + `lib/btcLockHeal.ts`):** the passive auto-heal effect was calling `tryHealLock(lock, walletData)` for every legacy lock on mount; each call fell through to `resolveOwnerPubkey()` → `stacksRequest("getAddresses")`, opening a Leather popup per lock. `tryHealLock` now takes `{ allowWalletPrompt }` (default `false`). Background heal uses session-cached pubkeys + mempool-history fallback only — never prompts the wallet. Click-time heal in `handleUnlock` opts in (`allowWalletPrompt: true`) so "Recover & sweep" still works.
- **AssetOverview (`components/dashboard/AssetOverview.tsx`):** rewrote as a single `AssetRow[]` model that's sorted by descending USD value before render. Rows with unknown USD (still loading, or no price) sink to the bottom. Each row now also shows `$X.XX / SYMBOL` spot price beneath the USD column for clarity. Switched the price source from `useGetRates` to the centralized `useAssetPrices()` (BTC + STX), so STX, sBTC, and native BTC L1 all use the same canonical spot prices.
- **Dashboard stat cards (`pages/Dashboard.tsx`):** "Total Balance" and "USD Value" used to count STX only. Now "Holdings" shows a multi-asset summary (`X STX · Y sBTC · Z BTC`) and "Total USD value" sums STX + sBTC + native BTC L1 via `useAssetPrices()`. No more flickering from the tiny STX-only number jumping to the full total.
- **BtcVaultView (`pages/BtcVaultView.tsx`):** rebuilt to mirror the dashboard layout — three-up stat cards (Vault balance / USD value / Policy), Quick Actions (Send / Deposit / Explorer / Refresh), 2-col grid (single-asset Vault assets card + Recent activity scoped to the vault address via `getAddressTxs`), optional multisig signer card, then the existing send flow card. Send / sign / broadcast logic preserved verbatim — only the visual scaffolding changed. URL stays `/btc-vault/:vaultId`.

## 2026-04-25 00:30 — On-chain fallback recovery for BTC locks

- Added `ui-v3/src/lib/btcLockRecovery.ts`: pure-JS recovery that rebuilds `BtcLockRecord`s from the connected BTC address's transaction history when localStorage was wiped (cleared site data, dev server restart on a different port, fresh browser, etc.). Two complementary paths:
  1. **Spent-lock recovery (deterministic):** scans every recent vin's witness; when a `[signature, witnessScript]` pair decodes to our exact CLTV shape (`<unlockUnixSec> CLTV DROP <pubkey33> CHECKSIG`) we extract `unlockUnixSec` + `ownerPubkey`, verify the implied address matches the spent prevout, and reconstruct a fully-known record with `status: "spent"` and `spendTxid` populated.
  2. **Unspent-lock candidates (heuristic):** for every owner-funded `vout` with `scriptpubkey_type === "v0_p2wsh"`, persist a record with the known fields (`lockAddress`, `txid`, `vout`, `amountSats`, `fundedAtUnixSec`) and queue a tiered brute-force on `unlockUnixSec` using the connected wallet's pubkey. Tiers: minute resolution for the first 60 days after funding, hourly out to 5 years, daily out to 20 years. First match wins; the record is patched with `witnessScriptHex` + `scriptPubkeyHex` so the regular unlock flow can sweep it. Yields to the event loop every 4096 candidates so the page stays interactive.
- Added `getTxFull(txid, networkHint)` to `services/btcMempoolService.ts` returning the full mempool.space tx shape (vin with `prevout` + `witness`, vout with `scriptpubkey_type`). This is what the recovery scanner consumes.
- Added `upsertBtcLock(record)` to `lib/btcLockStorage.ts` so the recovery module can insert reconstructed records without bypassing the storage's notification + validation pipeline.
- `pages/Locks.tsx` runs `recoverAndPersistLocks(...)` once per `(activeBtcAddress, sessionPubkey)` pair on mount, gated by a `useRef` cache key. Pulls the owner's compressed pubkey straight from the wallet session (`preferredBtc`/`taprootBtc`/`addresses.btc`) — never prompts the wallet, so the popup-spam fix from earlier still holds. Shows a toast if any new locks were merged in.
- UI safety: lock rows now treat `unlockUnixSec === 0` as a "recovering…" sentinel — the "Unlocks" cell shows `Unknown — recovering…` instead of "Jan 1, 1970", and `windowOpen` is forced false until the brute-force resolves the time.

## 2026-04-25 01:10 — Recovery follow-ups: friendly heal error + deterministic vault activity direction

- **`lib/btcLockHeal.ts`:** clicking "Recover & sweep" on a chain-recovered candidate whose `unlockUnixSec` was still `0` (sentinel meaning "background search hasn't resolved this yet") was hitting `buildCltvWitnessScript` and surfacing the raw `Unlock time must be a Unix timestamp greater than 500,000,000` error to the user. `tryHealLock` now bails early with a friendly message ("We're still searching the chain for this lock's unlock time. Hang on a moment and try again.") whenever `unlockUnixSec ≤ 500_000_000`, deferring to the recovery brute-force.
- **`pages/BtcVaultView.tsx` recent activity:** the previous row classification was "any vout pays the vault → deposit", which mislabeled every spend (each vault spend has a change-back output paying the vault). Switched to a deterministic flow rule: a row is a *deposit* IFF the vault address appears in **no** vin and in ≥1 vout; otherwise it's a *spend*. Computed by fetching `getTxFull(txid)` for the top 6 rows and summing `vault-in-vins` vs `vault-in-vouts`. Spend rows now also display the magnitude that actually left the vault (`|inFromVault − outToVault|`, i.e. payment + miner fee), prefixed `−`, instead of the raw vault-only output sum.

## 2026-04-25 02:15 — Faster lock recovery + collapsible "New BTC lock" card

- **`lib/btcLockRecovery.ts` brute-force tiers reordered & exposed for re-runs:** the previous tier-1 search was a single 60-day minute window (≈86 K candidates), which is fast on first match but slow when the unlock time is just hours away (every miss has to scan the whole window). Split tier-1 into two: `[fundedAt − 1h, fundedAt + 48h]` minute resolution (≈3 K, sub-100 ms — catches every short test lock) before falling through to the wider 60-day window. Hour-out-to-5y and day-out-to-20y stages preserved.
- **`resolveUnknownUnlockTimes(...)` (new export):** iterates persisted locks where `unlockUnixSec ≤ 500_000_000` and re-runs the brute-force using the connected wallet's pubkey. Required because `recoverLocksFromChain` only enqueues *net-new* candidates — once a candidate is persisted, subsequent mounts would skip it and the user would stare at "Unknown — recovering…" forever. `recoverAndPersistLocks` now fires this for free.
- **`pages/Locks.tsx` recovery effect:** on first mount per `(addr, pubkey)` we still do the full chain scan; on subsequent renders of the same pair we just call `resolveUnknownUnlockTimes` (cheap, no network) so refreshing the page or reconnecting the wallet eventually resolves stuck candidates. Toasts when ≥1 are resolved.
- **`pages/Locks.tsx` chip honesty (`chipFor`):** rows with unknown `unlockUnixSec` (chain-recovered candidates) used to display "Unlock window open" because `0 * 1000 ≤ now`. Now they show a "Recovering unlock time…" amber pill with a spinner until the brute-force resolves them.
- **Collapsible "New BTC lock" card (`pages/Locks.tsx`):** wrapped the create-lock card in a `Collapsible` that's closed by default — the existing locks list (the thing users come here for after their first session) now owns the viewport. Clicking the header opens the form; a successful broadcast auto-collapses it again so the new entry slides into the list cleanly. Header shows "Lock new funds" / "Hide" plus a rotating chevron for affordance.
