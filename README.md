<div align="center">

# B58

**Convert Solana private keys between CLI JSON arrays and Base58 — entirely in your browser.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-087ea4?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](#contributing)

</div>

---

The Solana CLI writes private keys as a JSON array of 64 numbers. Wallets like
Phantom and Backpack want a Base58 string. Moving between the two usually means
pasting your key into a random website and hoping for the best.

B58 does the conversion in your browser and nowhere else. No backend, no API
route, no analytics, no network request carrying your key. You can read the whole
thing in a few minutes, and you can run it offline.

## Contents

- [Features](#features)
- [Getting started](#getting-started)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Handling private keys safely](#handling-private-keys-safely)
- [Contributing](#contributing)
- [License](#license)

## Features

**Converts both directions.** Paste a JSON array to get Base58, or paste Base58
to get a JSON array.

**Detects the format for you.** In auto-detect mode, input starting with `[` is
read as JSON and anything else as Base58. You can also set the direction by hand.

**Explains bad input instead of just rejecting it.** You get the specific
problem: invalid JSON syntax, the wrong array length, a value outside 0–255
(including which index), a character outside the Base58 alphabet (including its
position), or a decoded length that isn't 64 bytes.

**Derives the wallet address.** From a valid key it shows the matching public key
in Base58, so you can confirm you're holding the key you meant to.

**Verifies the key is internally consistent.** A Solana secret key is 64 bytes: a
32-byte seed followed by a copy of the 32-byte public key. B58 signs a fixed
message with the full key and verifies that signature against the embedded public
key. If the two halves don't belong together, it tells you — rather than quietly
displaying an address that can't sign.

**Hides output until you ask for it.** The converted key stays masked behind a
reveal toggle; copy works either way.

**Generates a keypair.** Handy for trying the tool out, or for a throwaway key.

## Getting started

**Prerequisites:** Node.js 20+ (developed on 24) and [pnpm](https://pnpm.io).

```bash
git clone https://github.com/emmirays/B58.git
cd B58
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |

### Running it offline

The app makes no network calls of its own, so a production build works with no
connection at all:

```bash
pnpm build
pnpm start   # then disconnect, or use a machine that was never connected
```

Note that `next/font` fetches the Space Grotesk and JetBrains Mono files at build
time, not at page load — so a build made online runs fine offline afterwards.

## How it works

A Solana secret key is 64 bytes. The first 32 are the seed; the last 32 are a
copy of the Ed25519 public key derived from that seed. Both of B58's formats
describe those same 64 bytes:

```
JSON    [174, 47, 154, 16, ...]     64 integers, each 0–255
Base58  4NMwxzmb3j2jT2kT6...       the same bytes, Base58-encoded
```

Converting is just re-encoding, which is why it can happen locally with no
service involved. Two details are worth knowing:

- **Base58 is implemented in this repo**, not pulled from a package — see
  [`lib/base58.ts`](lib/base58.ts). It's the standard Bitcoin alphabet, which
  omits `0`, `O`, `I` and `l` so characters aren't easily confused by eye.
- **The signature check is real signing.** [`lib/solanaKeys.ts`](lib/solanaKeys.ts)
  uses [tweetnacl](https://github.com/dchest/tweetnacl-js) to sign a fixed
  message with the 64-byte key and verify it against the public-key half. That's
  what catches a key whose two halves disagree — a malformed or hand-edited key
  can otherwise look valid while being unable to sign anything.

The logic in `lib/` is plain TypeScript with no React in it, so it can be read,
tested, or reused independently of the UI.

## Project structure

```
app/
  page.tsx                      the single page
  layout.tsx                    fonts, metadata, dark theme
  components/
    KeyConverter.tsx            all converter interaction and state
    HeroBackground.tsx          animated WebGL shader background
    GridOverlay.tsx             faint grid over the background
    Icon.tsx                    hugeicons wrapper
lib/
  base58.ts                     Base58 encode/decode + alphabet check
  solanaKeys.ts                 parsing, validation, derivation, generation
components/
  ui/                           shadcn primitives (button, card, badge, textarea)
  interior/                     copy button, segmented control
```

Built with Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, and
Three.js via [@react-three/fiber](https://github.com/pmndrs/react-three-fiber)
for the background.

## Handling private keys safely

A Solana private key is complete control of the funds at that address. Anyone who
has it can move them, and the transfer can't be reversed.

So treat every key converter with suspicion, this one included:

- **Read the source before pasting a key that holds real value.** It's short on
  purpose — [`lib/solanaKeys.ts`](lib/solanaKeys.ts) and
  [`lib/base58.ts`](lib/base58.ts) are the parts that touch your key.
- **Prefer a local build over a hosted copy.** Running `pnpm dev` from source you
  have read is a stronger guarantee than any promise a website makes.
- **For a key with meaningful funds, use a machine that is offline.**
- **Watch the URL if you use a hosted version.** Key-converter phishing sites
  copy real ones closely.

B58 does all of its work client-side — but that's a claim you should verify, not
accept. The source is here for exactly that reason.

## Contributing

Issues and pull requests are welcome.

Good things to help with: additional input formats, test coverage for the
conversion logic in `lib/`, accessibility fixes, and clearer error messages.

Before opening a PR:

```bash
pnpm lint
pnpm build
```

A few expectations specific to this project:

- **Keep key handling client-side.** No telemetry, no logging of key material,
  no new network calls in a code path that can see a key. That constraint is the
  point of the project.
- **Keep the `lib/` modules free of React**, so the conversion logic stays
  readable and testable on its own.
- **Be careful with crypto changes.** Changes to `base58.ts` or `solanaKeys.ts`
  need round-trip evidence in the PR description — encode then decode, in both
  directions, and say what you tested.

### Reporting a security problem

If you find a vulnerability, especially one that could expose key material, please
report it privately rather than opening a public issue. Use GitHub's
[private vulnerability reporting](https://github.com/emmirays/B58/security/advisories/new)
on this repository.

## License

[MIT](LICENSE) © Emmanuel Oyiboke

Use it, change it, ship it — just keep the copyright notice. The license also
disclaims warranty and liability, which is worth reading if you plan to run a
hosted copy for other people.
