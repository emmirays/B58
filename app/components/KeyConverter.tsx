"use client";

import { useMemo, useState } from "react";
import {
  Alert02Icon,
  AlertCircleIcon,
  ArrowDataTransferHorizontalIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  KeyRoundIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ViewIcon,
  ViewOffSlashIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/interior/segmented-control";
import { CopyButton } from "@/components/interior/copy-button";
import { Icon } from "./Icon";
import {
  deriveKeyInfo,
  generateKeypair,
  parseBase58SecretKey,
  parseJsonSecretKey,
  secretKeyToBase58,
  secretKeyToJson,
} from "@/lib/solanaKeys";

type Mode = "auto" | "json" | "base58";
type DetectedMode = "json" | "base58" | null;

function DirectionLabel({ from, to }: { from: string; to: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {from}
      <Icon icon={ArrowDataTransferHorizontalIcon} size={12} aria-hidden />
      {to}
    </span>
  );
}

const MODE_OPTIONS: {
  value: Mode;
  label: React.ReactNode;
  srLabel?: string;
}[] = [
  { value: "auto", label: "Auto-detect" },
  {
    value: "json",
    label: <DirectionLabel from="JSON" to="Base58" />,
    srLabel: "JSON to Base58",
  },
  {
    value: "base58",
    label: <DirectionLabel from="Base58" to="JSON" />,
    srLabel: "Base58 to JSON",
  },
];

const PLACEHOLDERS: Record<Mode, string> = {
  auto: "Paste a Solana secret key, a JSON array [12,34,...] or a Base58 string or generate a new one below.",
  json: "[12, 34, 56, 78, ...]  (64 numbers, 0-255)",
  base58: "e.g. 5Jr7..., a Base58-encoded secret key that decodes to 64 bytes",
};

function detectMode(input: string): DetectedMode {
  const trimmed = input.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("[") ? "json" : "base58";
}

export function KeyConverter() {
  const [rawInput, setRawInput] = useState("");
  const [mode, setMode] = useState<Mode>("auto");
  const [revealOutput, setRevealOutput] = useState(false);

  const detected = useMemo(() => detectMode(rawInput), [rawInput]);
  const effectiveMode: DetectedMode = mode === "auto" ? detected : mode;

  const parseResult = useMemo(() => {
    if (!effectiveMode) return null;
    return effectiveMode === "json"
      ? parseJsonSecretKey(rawInput)
      : parseBase58SecretKey(rawInput);
  }, [rawInput, effectiveMode]);

  const keyInfo = useMemo(() => {
    if (!parseResult?.ok) return null;
    return deriveKeyInfo(parseResult.bytes);
  }, [parseResult]);

  const outputValue = useMemo(() => {
    if (!parseResult?.ok) return "";
    return effectiveMode === "json"
      ? secretKeyToBase58(parseResult.bytes)
      : secretKeyToJson(parseResult.bytes);
  }, [parseResult, effectiveMode]);

  const outputLabel =
    effectiveMode === "json"
      ? "Base58 (Phantom / Backpack)"
      : "JSON Array (Solana CLI)";

  function handleGenerate() {
    const kp = generateKeypair();
    setMode("auto");
    setRawInput(secretKeyToJson(kp.secretKeyBytes));
    setRevealOutput(true);
  }

  const hasInput = rawInput.trim().length > 0;
  const maskedOutput = revealOutput ? outputValue : "•".repeat(44);

  return (
    <Card className="w-full max-w-2xl gap-0 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-2xl ring-0 shadow-black/40 backdrop-blur-xl sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          label="Conversion direction"
          options={MODE_OPTIONS}
          value={mode}
          onValueChange={(value) => setMode(value as Mode)}
          className="w-full sm:w-auto"
        />

        <Button
          onClick={handleGenerate}
          className="group h-auto gap-2 bg-zinc-100 px-4 py-2 font-semibold text-zinc-900 hover:bg-white">
          <Icon
            icon={SparklesIcon}
            size={16}
            strokeWidth={2}
            className="transition-transform duration-300 ease-out-strong group-hover:rotate-12 motion-reduce:transition-none motion-reduce:group-hover:rotate-0"
          />
          Generate New Keypair
        </Button>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <label
            htmlFor="secret-key-input"
            className="text-sm font-medium text-zinc-300">
            Private Key Input
          </label>
          <div className="flex items-center gap-3">
            {hasInput && parseResult && (
              <span
                className={`inline-flex items-center gap-1 text-xs ${
                  parseResult.ok ? "text-emerald-400" : "text-red-400"
                }`}>
                {parseResult.ok ? (
                  <>
                    <Icon icon={CheckmarkCircle01Icon} />
                    Valid • {effectiveMode === "json" ? "JSON" : "Base58"}
                  </>
                ) : (
                  <>
                    <Icon icon={AlertCircleIcon} />
                    Invalid
                  </>
                )}
              </span>
            )}
            {hasInput && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setRawInput("")}
                className="h-auto px-0 text-zinc-400 hover:bg-transparent hover:text-zinc-100">
                <Icon icon={Cancel01Icon} className="size-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <Textarea
          id="secret-key-input"
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          rows={4}
          placeholder={PLACEHOLDERS[mode]}
          aria-invalid={hasInput && parseResult ? !parseResult.ok : undefined}
          aria-describedby={
            hasInput && parseResult && !parseResult.ok ? "key-error" : undefined
          }
          className={`mt-2 field-sizing-fixed resize-none bg-zinc-950/60 p-3 font-mono text-base duration-150 placeholder:font-sans placeholder:text-zinc-400 sm:text-sm dark:bg-zinc-950/60 ${
            hasInput && parseResult && !parseResult.ok
              ? "border-red-500/50 text-red-50"
              : "border-zinc-800 text-zinc-100"
          }`}
        />

        <div role="alert" aria-live="polite" className="min-h-0">
          {hasInput && parseResult && !parseResult.ok && (
            <p
              id="key-error"
              className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
              <Icon icon={AlertCircleIcon} />
              {parseResult.error}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span id="output-label" className="text-sm font-medium text-zinc-300">
            {hasInput && parseResult?.ok ? outputLabel : "Output"}
          </span>
          {outputValue && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setRevealOutput((v) => !v)}
              aria-pressed={revealOutput}
              className="h-auto px-0 text-zinc-400 hover:bg-transparent hover:text-zinc-100">
              <span className="inline-grid place-items-center">
                <Icon
                  icon={ViewOffSlashIcon}
                  className={`col-start-1 row-start-1 size-3.5 transition-[opacity,scale,filter] duration-200 ease-out-strong ${
                    revealOutput
                      ? "scale-100 opacity-100 blur-0"
                      : "scale-[0.25] opacity-0 blur-xs"
                  }`}
                />
                <Icon
                  icon={ViewIcon}
                  className={`col-start-1 row-start-1 size-3.5 transition-[opacity,scale,filter] duration-200 ease-out-strong ${
                    revealOutput
                      ? "scale-[0.25] opacity-0 blur-xs"
                      : "scale-100 opacity-100 blur-0"
                  }`}
                />
              </span>
              {revealOutput ? "Hide" : "Reveal"}
            </Button>
          )}
        </div>

        <div
          role="group"
          aria-labelledby="output-label"
          className="mt-2 flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
          <p
            className={`min-w-0 flex-1 leading-relaxed break-all font-mono text-sm tracking-wide text-zinc-100 ${
              outputValue && !revealOutput ? "select-none" : ""
            }`}>
            {outputValue ? (
              maskedOutput
            ) : (
              <span className="font-sans text-zinc-500">
                {hasInput
                  ? "Fix the error above to see the converted key."
                  : "Your converted key will appear here."}
              </span>
            )}
          </p>
          <CopyButton
            value={outputValue}
            ariaLabel="Copy converted key to clipboard"
            disabled={!outputValue}
            className="shrink-0"
          />
        </div>
      </div>

      {keyInfo && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span
              id="pubkey-label"
              className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
              <Icon icon={Wallet01Icon} size={16} />
              Solana Public Key (Wallet Address)
            </span>
            <Badge
              variant="outline"
              className="border-zinc-700 bg-zinc-800/60 text-[11px] font-normal text-zinc-400">
              Public — safe to share
            </Badge>
          </div>

          <div
            role="group"
            aria-labelledby="pubkey-label"
            className="mt-2 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/4 p-3">
            <p className="min-w-0 flex-1 leading-relaxed break-all font-mono text-sm tracking-wide text-emerald-300">
              {keyInfo.publicKeyBase58}
            </p>
            <CopyButton
              value={keyInfo.publicKeyBase58}
              ariaLabel="Copy public key to clipboard"
              className="shrink-0"
            />
          </div>

          {keyInfo.isValidKeypair ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
              <Icon icon={ShieldCheckIcon} />
              Signature check passed, this address matches the private key.
            </p>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
              <Icon icon={Alert02Icon} />
              Signature check failed — the embedded public key doesn&apos;t
              match this private key&apos;s seed. Double-check the source of
              this key.
            </p>
          )}
        </div>
      )}

      {!keyInfo && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-dashed border-zinc-700 p-3 text-xs text-zinc-400">
          <Icon icon={KeyRoundIcon} />
          Paste a valid secret key to derive its public wallet address.
        </div>
      )}
    </Card>
  );
}
