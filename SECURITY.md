# Security Policy

B58 is a browser based converter for Solana private keys. A bug here can cost
someone their funds, so security reports are taken seriously and are welcome.

## Reporting a vulnerability

**Please don't open a public issue for a security problem.** A public report tells
everyone about the weakness before there's a fix, including people using the tool
with real keys.

Report it privately through either channel:

- **GitHub private vulnerability reporting.**
  [Open a draft advisory](https://github.com/emmirays/B58/security/advisories/new).
  Preferred, because the report, the discussion, and the fix stay in one place.
- **Email.** [emmanueloyiboke@gmail.com](mailto:emmanueloyiboke@gmail.com) with
  "B58 security" in the subject line. Note that plain email is not encrypted, so
  for anything sensitive prefer the advisory route above.

**Never include a private key that holds real funds in a report.** If you need a
key to demonstrate the bug, generate a throwaway one with the app's "Generate New
Keypair" button and use that. Redact any key that has ever held value, and assume
any key you paste into a bug report is permanently compromised.

### What helps

- What you did, in enough detail to reproduce it.
- What happened, and what you expected instead.
- Which version, as a commit hash or the date you cloned.
- Your browser and OS, if the bug seems to depend on them.
- A proof of concept, if you have one.
- What an attacker gains. A clear impact statement speeds up triage more than
  anything else.

### What to expect

This is a small project maintained by one person, so there's no guaranteed
response time. What you can expect:

- An acknowledgement that the report arrived, usually within a few days.
- An assessment of whether it's a real issue and how serious it is.
- A fix prioritized by severity. Anything that can expose key material comes
  first.
- Credit in the advisory and release notes when the fix ships, unless you'd
  rather stay anonymous.

Please allow a reasonable window to ship a fix before publishing details.

## Scope

B58 isn't deployed anywhere yet. The scope is the source in this repository,
which people run locally.

### In scope

- Anything that could send key material off the machine: a network request, a
  form submission, or an analytics or error reporting call in a code path that
  can see a key.
- Bugs in the conversion or validation logic in
  [`lib/base58.ts`](lib/base58.ts) or [`lib/solanaKeys.ts`](lib/solanaKeys.ts).
  Wrong output, a malformed key accepted as valid, or the signature check passing
  when it shouldn't.
- Key material persisting where it shouldn't: the console, browser storage, the
  URL, or anywhere it outlives the page.
- XSS or script injection reachable through pasted input.
- A dependency vulnerability that is actually exploitable in this app, with the
  path explained.
- Anything that breaks the client side only property, even if no key has leaked
  yet.

### Out of scope

- Lookalike or phishing sites that copy this project. Report those to the host
  and the registrar, since they aren't under this repo's control.
- Risks inherent to pasting a private key into any software at all. The
  [README](README.md#handling-private-keys-safely) covers reducing that exposure.
- Bare scanner output naming a dependency version, with no explanation of how it
  is reachable here.
- A compromised machine or browser extension. Nothing in the page can defend
  against a keylogger or an extension reading the DOM.
- Physical access, shoulder surfing, or a clipboard read by another local
  application. The README notes the clipboard risk, but the page cannot prevent
  it.

## The security model

B58's core claim is that **your key never leaves your browser.** There is no
backend, no API route, no analytics, and no telemetry. All conversion runs in
client side JavaScript.

That is a property the source lets you verify rather than a promise to accept on
faith. The README documents
[how to check it](README.md#verifying-the-offline-claim) in about a minute, and
`pnpm verify:offline` greps the source for network and storage calls.

Your key lives only in React state for the lifetime of the page. It is never
written to `localStorage`, `sessionStorage`, IndexedDB, the URL, or a cookie, so
closing the tab is enough to discard it.

**What the model does not cover.** The page cannot protect a key from the
environment it runs in. A compromised OS, a malicious browser extension, a
keylogger, or another application reading your clipboard all sit outside what any
web page can defend against. This is why an offline machine is the right answer
for keys that hold meaningful funds.

## Dependencies and supply chain

The code path that touches key material has exactly one cryptographic
dependency, [tweetnacl](https://github.com/dchest/tweetnacl-js), used for
signing, verification, and key generation. Base58 is implemented in this repo so
that path stays as short as possible to audit.

A compromised npm package is a realistic way a tool like this could start
leaking keys without a single line of its own source changing. Some practices
that follow from that:

- **Install from the committed lockfile.** `pnpm-lock.yaml` pins every package to
  an exact version and integrity hash, so a later install cannot silently swap in
  different code. Use `pnpm install --frozen-lockfile` in any automated setting.
- **New dependencies near key handling get real scrutiny**, and are refused when
  the same thing can be done with a small amount of code in this repo.
- **Run `pnpm audit`** before a release, and after any dependency bump.

If you believe a dependency of this project has been compromised upstream, report
it here through the channels above as well as to that package's maintainers.

### Known dependency status

The framework itself sits in the trusted path, since it builds and serves the
page. Keeping Next.js current matters even though this app has no server routes
of its own.

Run `pnpm audit` for the current picture. If it reports advisories against
`next`, upgrade to a patched release rather than adding an override, then
re-run the audit to confirm the tree is clean.

## Supported versions

There are no released versions yet. Fixes land on `main`, so run the latest
commit.
