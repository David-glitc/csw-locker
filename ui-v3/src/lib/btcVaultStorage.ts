import {
  deriveMultisigP2wshVault,
  deriveSoloP2wshVault,
  parsePubkey,
  btcNetworkFromAddress,
  networkLabelFromAddress,
} from "@/lib/btcScript";

const STORAGE_KEY = "csw_btc_vaults_v1";

export const BTC_VAULTS_CHANGED_EVENT = "csw-btc-vaults-changed";

/**
 * BTC vault record.
 *
 * A real vault is an **m-of-n P2WSH multisig** whose address is deterministically derived
 * from the sorted (BIP-67) list of compressed signer pubkeys and the threshold `m`.
 *
 * Legacy rows from the preview flow (pre-real-script) keep `derivedVaultAddress` for backward
 * compat and are flagged via the absence of `witnessScriptHex`.
 */
export type BtcVaultKind = "solo" | "multisig";

export type BtcVaultRecord = {
  id: string;
  name: string;
  /** "solo" = single-sig pocket (owner only). "multisig" = m-of-n shared vault. */
  kind?: BtcVaultKind;
  /** On-chain deposit address (P2WSH). For legacy rows this is still the preview string. */
  derivedVaultAddress: string;
  /** Address of the connected wallet when the vault was created (owner pubkey is in signerPubkeys[0]). */
  linkedBtcAddress: string;
  /** Lexicographically sorted (BIP-67) 33-byte compressed pubkeys. For solo vaults this has a single entry. */
  signerPubkeys?: string[];
  /** Optional human labels matching signerPubkeys by index. */
  signerLabels?: string[];
  /** Legacy field (free text). New vaults keep it empty — use signerPubkeys / signerLabels. */
  signerHint: string;
  /** For multisig: minimum signatures to spend. For solo: always "1". */
  threshold: string;
  /** Hex witness script. */
  witnessScriptHex?: string;
  /** Hex scriptPubKey: `OP_0 <sha256(witnessScript)>`. */
  scriptPubkeyHex?: string;
  network?: "mainnet" | "testnet";
  createdAt: string;
};

/** Infer the vault kind for records written before `kind` existed. */
export function getVaultKind(v: BtcVaultRecord): BtcVaultKind {
  if (v.kind === "solo" || v.kind === "multisig") return v.kind;
  return (v.signerPubkeys?.length ?? 0) > 1 ? "multisig" : "solo";
}

function parseList(raw: string | null): BtcVaultRecord[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(isBtcVaultRecord);
  } catch {
    return [];
  }
}

function isBtcVaultRecord(x: unknown): x is BtcVaultRecord {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  if (
    typeof r.id !== "string" ||
    typeof r.name !== "string" ||
    typeof r.derivedVaultAddress !== "string" ||
    typeof r.linkedBtcAddress !== "string" ||
    typeof r.signerHint !== "string" ||
    typeof r.threshold !== "string" ||
    typeof r.createdAt !== "string"
  ) {
    return false;
  }
  if (r.signerPubkeys !== undefined && !(Array.isArray(r.signerPubkeys) && r.signerPubkeys.every((p) => typeof p === "string"))) return false;
  if (r.signerLabels !== undefined && !(Array.isArray(r.signerLabels) && r.signerLabels.every((l) => typeof l === "string"))) return false;
  if (r.witnessScriptHex !== undefined && typeof r.witnessScriptHex !== "string") return false;
  if (r.scriptPubkeyHex !== undefined && typeof r.scriptPubkeyHex !== "string") return false;
  if (r.network !== undefined && r.network !== "mainnet" && r.network !== "testnet") return false;
  if (r.kind !== undefined && r.kind !== "solo" && r.kind !== "multisig") return false;
  return true;
}

export function loadBtcVaults(): BtcVaultRecord[] {
  if (typeof localStorage === "undefined") return [];
  return parseList(localStorage.getItem(STORAGE_KEY));
}

function saveAll(vaults: BtcVaultRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vaults));
}

export function notifyBtcVaultsChanged() {
  window.dispatchEvent(new Event(BTC_VAULTS_CHANGED_EVENT));
}

export type CreateBtcVaultInput = {
  id: string;
  name: string;
  linkedBtcAddress: string;
  /** Compressed pubkeys in the order provided by the user. They are sorted (BIP-67) before script derivation. */
  signerPubkeysHex: string[];
  signerLabels?: string[];
  /** m in "m of n". */
  threshold: number;
};

export function createBtcVaultRecord(input: CreateBtcVaultInput): BtcVaultRecord {
  const pubkeys = input.signerPubkeysHex.map((pk) => parsePubkey(pk));
  const network = btcNetworkFromAddress(input.linkedBtcAddress);
  const derived = deriveMultisigP2wshVault(pubkeys, input.threshold, network);
  const record: BtcVaultRecord = {
    id: input.id,
    name: input.name,
    kind: "multisig",
    derivedVaultAddress: derived.address,
    linkedBtcAddress: input.linkedBtcAddress,
    signerPubkeys: derived.sortedPubkeysHex,
    signerLabels: input.signerLabels,
    signerHint: "",
    threshold: String(input.threshold),
    witnessScriptHex: derived.witnessScriptHex,
    scriptPubkeyHex: derived.scriptPubkeyHex,
    network: networkLabelFromAddress(input.linkedBtcAddress),
    createdAt: new Date().toISOString(),
  };
  const next = [...loadBtcVaults(), record];
  saveAll(next);
  notifyBtcVaultsChanged();
  return record;
}

export type CreateSoloVaultInput = {
  id: string;
  name: string;
  linkedBtcAddress: string;
  /** Compressed pubkey (hex) of the owner — same wallet that connected. */
  ownerPubkeyHex: string;
  ownerLabel?: string;
};

/**
 * Create a "solo" vault: a named, owner-only P2WSH pocket. Only the connected wallet can
 * sign spends. Useful for segregating funds (e.g. "rent", "savings") without the overhead
 * of multisig coordination.
 */
export function createSoloBtcVaultRecord(input: CreateSoloVaultInput): BtcVaultRecord {
  const ownerPubkey = parsePubkey(input.ownerPubkeyHex);
  const network = btcNetworkFromAddress(input.linkedBtcAddress);
  const derived = deriveSoloP2wshVault(ownerPubkey, network);
  const record: BtcVaultRecord = {
    id: input.id,
    name: input.name,
    kind: "solo",
    derivedVaultAddress: derived.address,
    linkedBtcAddress: input.linkedBtcAddress,
    signerPubkeys: [derived.ownerPubkeyHex],
    signerLabels: [input.ownerLabel?.trim() || "You"],
    signerHint: "",
    threshold: "1",
    witnessScriptHex: derived.witnessScriptHex,
    scriptPubkeyHex: derived.scriptPubkeyHex,
    network: networkLabelFromAddress(input.linkedBtcAddress),
    createdAt: new Date().toISOString(),
  };
  const next = [...loadBtcVaults(), record];
  saveAll(next);
  notifyBtcVaultsChanged();
  return record;
}

/**
 * @deprecated legacy preview-only path. Use `createBtcVaultRecord` so the vault is spendable on-chain.
 */
export function appendBtcVault(input: {
  id: string;
  name: string;
  linkedBtcAddress: string;
  signerHint: string;
  threshold: string;
}): BtcVaultRecord {
  const record: BtcVaultRecord = {
    id: input.id,
    name: input.name,
    derivedVaultAddress: input.linkedBtcAddress,
    linkedBtcAddress: input.linkedBtcAddress,
    signerHint: input.signerHint,
    threshold: input.threshold,
    createdAt: new Date().toISOString(),
  };
  const next = [...loadBtcVaults(), record];
  saveAll(next);
  notifyBtcVaultsChanged();
  return record;
}

export function removeBtcVault(id: string) {
  const next = loadBtcVaults().filter((v) => v.id !== id);
  saveAll(next);
  notifyBtcVaultsChanged();
}

export function getBtcVault(id: string): BtcVaultRecord | undefined {
  return loadBtcVaults().find((v) => v.id === id);
}

export function vaultIsOnChain(v: BtcVaultRecord): boolean {
  return Boolean(v.witnessScriptHex && v.scriptPubkeyHex && v.signerPubkeys?.length);
}
