import {
  WifiDisconnected01Icon,
} from "@hugeicons/core-free-icons";
import { KeyConverter } from "./components/KeyConverter";
import { Icon } from "./components/Icon";
import { HeroBackground } from "./components/HeroBackground";
import { GridOverlay } from "./components/GridOverlay";

export default function Home() {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-center px-4 py-16 sm:py-24">
      <HeroBackground className="fixed inset-0 -z-10" />

      <div className="fixed inset-0 -z-10 bg-zinc-950/20" />

      <GridOverlay className="z-[-5]" />

      <div className="flex w-full max-w-2xl flex-col items-center">
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          B58<span className="font-light text-zinc-500">.sh</span>
        </h1>
        <p className="mt-3 max-w-md text-center text-sm text-balance text-zinc-400 sm:text-base">
          Convert Solana private keys between CLI JSON arrays and Base58
          strings.
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
          <Icon icon={WifiDisconnected01Icon} />
          Client-side only. Your keys never leave your browser.
        </p>

        <div className="mt-10 w-full">
          <KeyConverter />
        </div>

        <footer className="mt-10 text-center text-xs text-balance text-zinc-400">
          No analytics. No backend. No servers. Everything runs locally in your
          browser.
        </footer>
      </div>
    </main>
  );
}
