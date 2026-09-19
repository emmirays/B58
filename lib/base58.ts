const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const ALPHABET_MAP: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) {
  ALPHABET_MAP[ALPHABET[i]] = i;
}

export function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";

  let zeroes = 0;
  let pbegin = 0;
  const pend = bytes.length;
  while (pbegin !== pend && bytes[pbegin] === 0) {
    pbegin++;
    zeroes++;
  }

  const size = (((pend - pbegin) * 138) / 100 + 1) >>> 0;
  const b58 = new Uint8Array(size);
  let length = 0;

  while (pbegin !== pend) {
    let carry = bytes[pbegin];
    let i = 0;
    for (
      let it = size - 1;
      (carry !== 0 || i < length) && it !== -1;
      it--, i++
    ) {
      carry += (256 * b58[it]) >>> 0;
      b58[it] = carry % 58;
      carry = (carry / 58) >>> 0;
    }
    length = i;
    pbegin++;
  }

  let it2 = size - length;
  while (it2 !== size && b58[it2] === 0) it2++;

  let result = "1".repeat(zeroes);
  for (; it2 < size; it2++) result += ALPHABET[b58[it2]];

  return result;
}

export function base58Decode(input: string): Uint8Array {
  const trimmed = input.trim();
  if (trimmed.length === 0) return new Uint8Array(0);

  let psz = 0;
  let zeroes = 0;
  while (trimmed[psz] === "1") {
    zeroes++;
    psz++;
  }

  const size = (((trimmed.length - psz) * 733) / 1000 + 1) >>> 0;
  const b256 = new Uint8Array(size);
  let length = 0;

  while (psz < trimmed.length) {
    const char = trimmed[psz];
    const carryIndex = ALPHABET_MAP[char];
    if (carryIndex === undefined) {
      throw new Base58Error(
        `Invalid character '${char}' in Base58 string at position ${psz}`
      );
    }
    let carry = carryIndex;
    let i = 0;
    for (
      let it = size - 1;
      (carry !== 0 || i < length) && it !== -1;
      it--, i++
    ) {
      carry += (58 * b256[it]) >>> 0;
      b256[it] = carry % 256;
      carry = (carry / 256) >>> 0;
    }
    length = i;
    psz++;
  }

  let it2 = size - length;
  while (it2 !== size && b256[it2] === 0) it2++;

  const out = new Uint8Array(zeroes + (size - it2));
  out.fill(0, 0, zeroes);
  let j = zeroes;
  while (it2 !== size) out[j++] = b256[it2++];

  return out;
}

export class Base58Error extends Error {}

export function isLikelyBase58(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length === 0) return false;
  for (const char of trimmed) {
    if (ALPHABET_MAP[char] === undefined) return false;
  }
  return true;
}
