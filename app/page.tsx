import {
  StarIcon,
  WifiDisconnected01Icon,
} from "@hugeicons/core-free-icons";
import { buttonVariants } from "@/components/ui/button";
import { KeyConverter } from "./components/KeyConverter";
import { Icon } from "./components/Icon";
import { HeroBackground } from "./components/HeroBackground";
import { GridOverlay } from "./components/GridOverlay";
import { GithubIcon } from "./components/GithubIcon";
import { getStarCount } from "@/lib/githubStars";

const REPO_URL = "https://github.com/emmirays/B58";

const formatStars = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export default async function Home() {
  const stars = await getStarCount("emmirays/B58");

  return (
    <main className="relative isolate flex min-h-screen flex-col items-center px-4 py-16 sm:py-24">
      <HeroBackground className="fixed inset-0 -z-10" />

      <div className="fixed inset-0 -z-10 bg-zinc-950/20" />

      <GridOverlay className="z-[-5]" />

      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View B58 source on GitHub"
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className:
            "group py-4 flex items-center absolute top-4 right-4 gap-1.5 border-zinc-800 bg-zinc-900/60 text-zinc-300 backdrop-blur-md hover:bg-zinc-800/80 hover:text-zinc-50 sm:top-6 sm:right-6 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80",
        })}>
        <GithubIcon />
        <span>GitHub</span>
        {stars !== null && (
          <>
            <span className="border-l border-hairline pl-1.5">
              {formatStars.format(stars)}
            </span>
            <Icon icon={StarIcon} className="group-hover:text-transparent group-hover:fill-[#eab308]" />
          </>
        )}
      </a>

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
