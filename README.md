<div align="center">

# B58

**Convert Solana private keys between CLI JSON arrays and Base58, entirely in your browser.**

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
route, no analytics, no network request carrying your key. The whole thing is
short enough to read in a few minutes, and it runs offline.

## Contents

- [Features](#features)
- [Getting started](#getting-started)
- [Verifying the offline claim](#verifying-the-offline-claim)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Handling private keys safely](#handling-private-keys-safely)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Features

**Converts both directions.** Paste a JSON array to get Base58, or paste Base58
to get a JSON array.

**Detects the format for you.** In auto-detect mode, input starting with `[` is
read as JSON and anything else as Base58. You can also set the direction by hand.

**Explains bad input instead of just rejecting it.** You get the specific
problem: invalid JSON syntax, the wrong array length, a value outside 0 to 255
(including which index), a character outside the Base58 alphabet (including its
position), or a decoded length that isn't 64 bytes.

**Derives the wallet address.** From a valid key it shows the matching public key
in Base58, so you can confirm you're holding the key you meant to.

**Verifies the key is internally consistent.** A Solana secret key is 64 bytes: a
32 byte seed followed by a copy of the 32 byte public key. B58 signs a fixed
message with the full key and verifies that signature against the embedded public
key. If the two halves don't belong together, it says so, rather than quietly
displaying an address that can't sign.

**Hides output until you ask for it.** The converted key stays masked behind a
reveal toggle. Copy works either way.

**Generates a keypair.** Handy for trying the tool out, or for a throwaway key.

## Getting started

**Prerequisites:** Node.js 20.9 or newer (developed on 24) and
[pnpm](https://pnpm.io) 11.

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
| `pnpm build` | Build a static site into `out/` |
| `pnpm start` | Serve `out/` locally |
| `pnpm lint` | Run ESLint |
| `pnpm audit` | Check dependencies for known vulnerabilities |
| `pnpm verify:offline` | Search the source for network and storage calls |

## Verifying the offline claim

Any key converter can claim it works locally. Here the claim is small enough to
check yourself, in about a minute.

**1. Search for code that could send data anywhere.**

```bash
pnpm verify:offline
```

This greps `app/`, `lib/`, and `components/` for `fetch(`, `XMLHttpRequest`,
`navigator.send`, `localStorage`, `sessionStorage`, and `indexedDB`. On an
unmodified checkout it finds nothing, meaning no code path transmits your key or
writes it to disk.

The one file it skips is [`lib/githubStars.ts`](lib/githubStars.ts), which reads
the repo's star count from the GitHub API. It runs only during `pnpm build`,
never in your browser, and the number is baked into the HTML. Your key exists only in React state and vanishes when the tab
closes.

**2. Watch the network yourself.** Open DevTools, switch to the Network tab,
convert a key, and confirm nothing is sent. Fonts load once at page load and
nothing else follows.

**3. Cut the connection.** The site builds to plain static files in `out/`, and
serving them needs no network at all:

```bash
pnpm build
pnpm start
```

Then turn off networking and use it. `next/font` downloads Space Grotesk and
JetBrains Mono at build time rather than page load, so a build made online works
fully offline afterwards. A build made offline still works; the GitHub button
just shows no star count. For a key that holds real funds, this is the way to run
it.

## How it works

A Solana secret key is 64 bytes. The first 32 are the seed. The last 32 are a
copy of the Ed25519 public key derived from that seed. Both of B58's formats
describe those same 64 bytes:

```
JSON    [174, 47, 154, 16, ...]     64 integers, each 0 to 255
Base58  4NMwxzmb3j2jT2kT6...        the same bytes, Base58 encoded
```

Converting is only re-encoding, which is why it can happen locally with no
service involved. Two details are worth knowing.

**Base58 is implemented in this repo** rather than pulled from a package. See
[`lib/base58.ts`](lib/base58.ts). It uses the standard Bitcoin alphabet, which
omits `0`, `O`, `I`, and `l` so characters aren't easily confused by eye. One
fewer dependency in the code path that touches your key.

**The signature check is real signing.** [`lib/solanaKeys.ts`](lib/solanaKeys.ts)
uses [tweetnacl](https://github.com/dchest/tweetnacl-js) to sign a fixed message
with the 64 byte key, then verify that signature against the public key half.
This catches a key whose two halves disagree, which a malformed or hand edited
key can otherwise hide while being unable to sign anything.

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
  base58.ts                     Base58 encode and decode, alphabet check
  solanaKeys.ts                 parsing, validation, derivation, generation
components/
  ui/                           shadcn primitives (button, card, badge, textarea)
  interior/                     copy button, segmented control
```

Built with Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, and
Three.js via [@react-three/fiber](https://github.com/pmndrs/react-three-fiber)
for the background.

The only dependency that touches key material is
[tweetnacl](https://github.com/dchest/tweetnacl-js), pinned in `pnpm-lock.yaml`
with a hash so a later install cannot silently substitute different code. Always
install with the lockfile committed here rather than resolving versions fresh.

## Handling private keys safely

A Solana private key is complete control of the funds at that address. Anyone who
has it can move them, and the transfer cannot be reversed.

So treat every key converter with suspicion, this one included.

**Read the source before pasting a key that holds real value.** It's short on
purpose. [`lib/solanaKeys.ts`](lib/solanaKeys.ts) and
[`lib/base58.ts`](lib/base58.ts) are the parts that touch your key.

**Prefer a local build over a hosted copy.** Running from source you have read is
a stronger guarantee than any promise a website makes. See
[verifying the offline claim](#verifying-the-offline-claim).

**For a key with meaningful funds, use a machine that is offline.**

**Clear your clipboard when you're done.** The copy button puts your key there,
and other applications can read it.

**Watch the URL if you ever use a hosted version.** Key converter phishing sites
copy real ones closely, and a convincing clone costs an attacker very little.

B58 does all of its work client side, but that's a claim you should verify rather
than accept. The source is here for exactly that reason.

## Contributing

Issues and pull requests are welcome.

Good things to help with: additional input formats, test coverage for the
conversion logic in `lib/`, accessibility fixes, and clearer error messages.

Before opening a PR:

```bash
pnpm lint
pnpm build
```

A few expectations specific to this project.

**Keep key handling client side.** No telemetry, no logging of key material, no
new network calls in a code path that can see a key. That constraint is the point
of the project, and `pnpm verify:offline` should stay silent.

**Keep the `lib/` modules free of React**, so the conversion logic stays readable
and testable on its own.

**Be careful with crypto changes.** Changes to `base58.ts` or `solanaKeys.ts`
need round trip evidence in the PR description. Encode then decode, in both
directions, and say what you tested.

**Think twice before adding a dependency**, especially anywhere near key
handling. Every package added there is code a reader has to audit before they can
trust the tool.

## Security

Found a vulnerability? Please report it privately rather than opening a public
issue. [SECURITY.md](SECURITY.md) covers how to reach us, what to include, and
what's in scope.

## License

[MIT](LICENSE) © Emmanuel Oyiboke

Use it, change it, ship it, just keep the copyright notice. The license also
disclaims warranty and liability, which is worth reading if you plan to run a
hosted copy for other people.
