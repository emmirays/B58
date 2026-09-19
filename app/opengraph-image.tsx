import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  LaptopIcon,
  ServerOffIcon,
  WifiDisconnected01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { createElement } from "react";
import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const alt =
  "B58.sh: convert Solana private keys between CLI JSON arrays and Base58, entirely in your browser.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));

const JSON_SAMPLE = "[174, 47, 154, 16, 88, …]";
const BASE58_SAMPLE = "4NMwxzmb3j2jT2kT6Zp…";

function Panel({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        gap: 14,
        padding: "22px 26px",
        borderRadius: 16,
        border: accent ? "1px solid rgba(16,185,129,0.35)" : "1px solid #27272a",
        background: accent ? "rgba(16,185,129,0.07)" : "rgba(9,9,11,0.7)",
      }}>
      <div
        style={{
          display: "flex",
          fontSize: 20,
          fontWeight: 500,
          color: accent ? "#34d399" : "#a1a1aa",
        }}>
        {label}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "JetBrains Mono",
          fontSize: 26,
          color: accent ? "#6ee7b7" : "#f4f4f5",
          whiteSpace: "nowrap",
        }}>
        {value}
      </div>
    </div>
  );
}

function HugeIcon({ icon, color, size = 22 }: { icon: IconSvgElement; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {icon.map(([tag, { key, ...attrs }]) =>
        createElement(tag, { key, ...attrs, stroke: color, strokeWidth: 1.75 }),
      )}
    </svg>
  );
}

function Pill({ icon, children }: { icon: IconSvgElement; children: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 20px 10px 16px",
        borderRadius: 999,
        border: "1px solid #27272a",
        background: "rgba(24,24,27,0.7)",
        fontSize: 20,
        fontWeight: 500,
        color: "#d4d4d8",
      }}>
      <HugeIcon icon={icon} color="#a1a1aa" />
      {children}
    </div>
  );
}

export default async function Image() {
  const [light, medium, bold, mono] = await Promise.all([
    font("SpaceGrotesk-Light.ttf"),
    font("SpaceGrotesk-Medium.ttf"),
    font("SpaceGrotesk-Bold.ttf"),
    font("JetBrainsMono-Regular.ttf"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          fontFamily: "Space Grotesk",
          backgroundColor: "#08090b",
          backgroundImage:
            "radial-gradient(circle at 12% 0%, rgba(56,92,110,0.55), transparent 55%), radial-gradient(circle at 100% 100%, rgba(33,58,70,0.6), transparent 50%), linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 100% 100%, 96px 160px, 96px 160px",
        }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 112,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "#fafafa",
            }}>
            B58
            <span style={{ fontWeight: 300, color: "#71717a" }}>.sh</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: 36,
              fontWeight: 500,
              color: "#a1a1aa",
              letterSpacing: "-0.01em",
            }}>
            Convert Solana private keys. Entirely in your browser.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Panel label="Solana CLI · JSON array" value={JSON_SAMPLE} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              flexShrink: 0,
              borderRadius: 999,
              background: "#f4f4f5",
            }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </div>
          <Panel label="Phantom · Backpack · Base58" value={BASE58_SAMPLE} accent />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Pill icon={LaptopIcon}>Client-side only</Pill>
            <Pill icon={ServerOffIcon}>No backend</Pill>
            <Pill icon={WifiDisconnected01Icon}>Works offline</Pill>
          </div>
          <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 20, color: "#71717a" }}>
            open source · MIT
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Space Grotesk", data: light, weight: 300, style: "normal" },
        { name: "Space Grotesk", data: medium, weight: 500, style: "normal" },
        { name: "Space Grotesk", data: bold, weight: 700, style: "normal" },
        { name: "JetBrains Mono", data: mono, weight: 400, style: "normal" },
      ],
    },
  );
}
