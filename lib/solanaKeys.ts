import nacl from "tweetnacl";
import { base58Decode, base58Encode, isLikelyBase58, Base58Error } from "./base58";

export const SECRET_KEY_LENGTH = 64;
export const SEED_LENGTH = 32;

export type ParseResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; error: string };

export function parseJsonSecretKey(input: string): ParseResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Input is empty" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "Invalid JSON syntax" };
  }

  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      error: "Input must be a JSON array, e.g. [12, 34, 56, ...]",
    };
  }

  if (parsed.length !== SECRET_KEY_LENGTH) {
    return {
      ok: false,
      error: `Array length is ${parsed.length}, expected ${SECRET_KEY_LENGTH}`,
    };
  }

  const bytes = new Uint8Array(SECRET_KEY_LENGTH);
  for (let i = 0; i < parsed.length; i++) {
    const value = parsed[i];
    if (typeof value !== "number" || !Number.isInteger(value)) {
      return { ok: false, error: `Value at index ${i} is not an integer` };
    }
    if (value < 0 || value > 255) {
      return {
        ok: false,
        error: `Value at index ${i} (${value}) is out of byte range (0-255)`,
      };
    }
    bytes[i] = value;
  }

  return { ok: true, bytes };
}

export function parseBase58SecretKey(input: string): ParseResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Input is empty" };
  }

  if (!isLikelyBase58(trimmed)) {
    return { ok: false, error: "Invalid character in Base58 string" };
  }

  let bytes: Uint8Array;
  try {
    bytes = base58Decode(trimmed);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Base58Error ? err.message : "Invalid Base58 string",
    };
  }

  if (bytes.length !== SECRET_KEY_LENGTH) {
    return {
      ok: false,
      error: `Decoded key is ${bytes.length} bytes, expected ${SECRET_KEY_LENGTH}`,
    };
  }

  return { ok: true, bytes };
}

export function secretKeyToJson(bytes: Uint8Array): string {
  return `[${Array.from(bytes).join(",")}]`;
}

export function secretKeyToBase58(bytes: Uint8Array): string {
  return base58Encode(bytes);
}

const INTEGRITY_MESSAGE = new TextEncoder().encode("b58.sh-key-integrity-check");

export interface DerivedKeyInfo {
  publicKeyBytes: Uint8Array;
  publicKeyBase58: string;
  isValidKeypair: boolean;
}

export function deriveKeyInfo(secretKeyBytes: Uint8Array): DerivedKeyInfo {
  const publicKeyBytes = secretKeyBytes.slice(SEED_LENGTH, SECRET_KEY_LENGTH);
  const signature = nacl.sign.detached(INTEGRITY_MESSAGE, secretKeyBytes);
  const isValidKeypair = nacl.sign.detached.verify(
    INTEGRITY_MESSAGE,
    signature,
    publicKeyBytes
  );

  return {
    publicKeyBytes,
    publicKeyBase58: base58Encode(publicKeyBytes),
    isValidKeypair,
  };
}

export interface GeneratedKeypair {
  secretKeyBytes: Uint8Array;
  publicKeyBytes: Uint8Array;
  publicKeyBase58: string;
}

export function generateKeypair(): GeneratedKeypair {
  const keyPair = nacl.sign.keyPair();
  return {
    secretKeyBytes: keyPair.secretKey,
    publicKeyBytes: keyPair.publicKey,
    publicKeyBase58: base58Encode(keyPair.publicKey),
  };
}
