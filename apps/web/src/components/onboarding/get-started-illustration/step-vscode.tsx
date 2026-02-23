"use client";

import {
  CommandIcon,
  Download01Icon,
  Search01Icon,
  StarIcon,
  Tick01Icon,
} from "hugeicons-react";
import { motion, useAnimate } from "motion/react";
import { useCallback, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  ActivityIcon,
  AnimatedCursor,
  EASE_OUT,
  EnvvalIcon,
  getPos,
  ILLUSTRATION_HEIGHT,
} from "./shared";

// ── Data ─────────────────────────────────────────────────────────────

const ENV_LINES = [
  {
    key: "DATABASE_URL",
    value: "postgresql://user:pass@db.io",
    encrypted: "a7f2•••e91b",
  },
  { key: "API_SECRET", value: "sk_live_7f3a9b2c8d", encrypted: "3bc8•••d4a2" },
  {
    key: "JWT_SECRET",
    value: "eyJhbGciOiJIUzI1NiJ9",
    encrypted: "f91e•••7c3d",
  },
  { key: "STRIPE_KEY", value: "pk_live_51HG8k2e", encrypted: "82d4•••1fa6" },
];

const PALETTE_ITEMS = ["Envval: Push", "Envval: Pull", "Envval: Compare"];

type VSCodeStep = 1 | 2;

/**
 * Combined VS Code illustration for steps 1 (install) and 2 (secure).
 * The activity bar persists across steps — only sidebar and main content swap.
 * Each step has its own imperative animation sequence within a shared scope.
 */
export function StepVSCodeInner({
  step,
  onComplete,
}: {
  step: VSCodeStep;
  onComplete?: () => void;
}) {
  const [scope, animate] = useAnimate();
  const maskId = useId();
  const generationRef = useRef(0);

  /** Runs the animation for the current step. Bails if step changes mid-sequence. */
  const runAnimation = useCallback(async () => {
    const gen = ++generationRef.current;
    const cancelled = () => generationRef.current !== gen;

    await new Promise((r) => setTimeout(r, 150));
    if (!scope.current || cancelled()) return;

    const pos = (sel: string) =>
      getPos(scope.current!, scope.current!.querySelector(sel) as HTMLElement);

    // Reset shared elements
    await animate(".cursor", { opacity: 0, scale: 1 }, { duration: 0 });
    await animate(".cursor-ring", { scale: 0, opacity: 0 }, { duration: 0 });
    await animate(".success-flash", { opacity: 0 }, { duration: 0 });

    if (step === 1) {
      await runInstallAnimation(animate, pos, cancelled);
    } else {
      await runSecureAnimation(animate, pos, cancelled);
    }

    if (!cancelled()) {
      onComplete?.();
    }
  }, [step, animate, scope, onComplete]);

  useEffect(() => {
    runAnimation();
  }, [runAnimation]);

  return (
    <div ref={scope} className="relative">
      <div className="flex relative" style={{ height: ILLUSTRATION_HEIGHT }}>
        {/* Persistent Activity Bar — only active icon changes */}
        <div className="flex w-9 flex-col items-center gap-0.5 border-r border-border bg-muted/40 pt-2 pb-1">
          <ActivityIcon icon="files" active={step === 2} />
          <ActivityIcon icon="search" />
          <ActivityIcon icon="scm" />
          <ActivityIcon icon="debug" />
          <ActivityIcon icon="extensions" active={step === 1} />
          <div className="flex-1" />
        </div>

        {/* Swappable content — key remount when step changes */}
        {step === 1 ? (
          <InstallContent key="install" maskId={maskId} />
        ) : (
          <SecureContent key="secure" />
        )}
      </div>

      <div
        className="success-flash absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 65% 40%, rgba(34, 197, 94, 0.15), transparent 50%)",
          opacity: 0,
        }}
      />

      <AnimatedCursor />
    </div>
  );
}

// ── Animation sequences ─────────────────────────────────────────────

type AnimateFn = ReturnType<typeof useAnimate>[1];
type PosFn = (sel: string) => { x: number; y: number };
type CancelledFn = () => boolean;

/** Step 1 animation — searches marketplace, clicks Envval, installs extension. */
async function runInstallAnimation(
  animate: AnimateFn,
  pos: PosFn,
  cancelled: CancelledFn,
) {
  const search = pos(".search-input-container");
  const envvalItem = pos(".envval-list-item");
  const installBtn = pos(".install-btn");
  const away = { x: installBtn.x + 120, y: installBtn.y + 50 };

  // Reset step-specific elements
  await animate(".search-char", { opacity: 0 }, { duration: 0 });
  await animate(".extension-item", { opacity: 0, x: -6 }, { duration: 0 });
  await animate(".detail-panel", { opacity: 0 }, { duration: 0 });
  await animate(
    ".detail-panel-placeholder",
    { opacity: 0.25 },
    { duration: 0 },
  );
  await animate(".cursor", { x: search.x, y: search.y }, { duration: 0 });
  await animate(
    ".install-btn",
    { backgroundColor: "var(--primary)" },
    { duration: 0 },
  );
  await animate(".btn-text-install", { opacity: 1 }, { duration: 0 });
  await animate(".btn-text-installing", { opacity: 0 }, { duration: 0 });
  await animate(".btn-text-installed", { opacity: 0 }, { duration: 0 });

  if (cancelled()) return;

  await animate(".cursor", { opacity: 1 }, { duration: 0.25 });
  await new Promise((r) => setTimeout(r, 200));
  if (cancelled()) return;

  await animate(
    ".search-char",
    { opacity: 1 },
    { duration: 0.08, delay: (i: number) => i * 0.06, ease: EASE_OUT },
  );
  await new Promise((r) => setTimeout(r, 300));
  if (cancelled()) return;

  await animate(
    ".extension-item",
    { opacity: 1, x: 0 },
    { duration: 0.35, ease: EASE_OUT, delay: (i: number) => i * 0.06 },
  );
  await new Promise((r) => setTimeout(r, 400));
  if (cancelled()) return;

  await animate(
    ".cursor",
    { x: envvalItem.x, y: envvalItem.y },
    { duration: 0.45, ease: EASE_OUT },
  );
  await animate(".cursor", { scale: 0.85 }, { duration: 0.06 });
  await animate(".cursor-ring", { scale: 1, opacity: 0.6 }, { duration: 0.08 });
  await animate(".envval-list-item", { scale: 0.98 }, { duration: 0.06 });
  await animate(".cursor", { scale: 1 }, { duration: 0.1 });
  await animate(".cursor-ring", { scale: 1.6, opacity: 0 }, { duration: 0.25 });
  await animate(".envval-list-item", { scale: 1 }, { duration: 0.1 });
  if (cancelled()) return;

  await Promise.all([
    animate(
      ".detail-panel",
      { opacity: 1 },
      { duration: 0.35, ease: EASE_OUT },
    ),
    animate(
      ".detail-panel-placeholder",
      { opacity: 0 },
      { duration: 0.3, ease: EASE_OUT },
    ),
  ]);
  await new Promise((r) => setTimeout(r, 300));
  if (cancelled()) return;

  await animate(
    ".cursor",
    { x: installBtn.x, y: installBtn.y },
    { duration: 0.5, ease: EASE_OUT },
  );

  await animate(".install-btn", { scale: 1.04 }, { duration: 0.1 });
  await animate(".cursor", { scale: 0.85 }, { duration: 0.06 });
  await animate(".cursor-ring", { scale: 1, opacity: 0.6 }, { duration: 0.08 });
  await animate(".install-btn", { scale: 0.96 }, { duration: 0.06 });
  await animate(".cursor", { scale: 1 }, { duration: 0.1 });
  await animate(".cursor-ring", { scale: 1.8, opacity: 0 }, { duration: 0.25 });
  await animate(".install-btn", { scale: 1 }, { duration: 0.12 });
  if (cancelled()) return;

  await animate(".btn-text-install", { opacity: 0 }, { duration: 0.08 });
  await animate(".btn-text-installing", { opacity: 1 }, { duration: 0.12 });

  await animate(
    ".cursor",
    { x: away.x, y: away.y, opacity: 0 },
    { duration: 0.45, ease: EASE_OUT },
  );

  await new Promise((r) => setTimeout(r, 1100));
  if (cancelled()) return;

  await animate(".btn-text-installing", { opacity: 0 }, { duration: 0.08 });
  await animate(
    ".install-btn",
    { backgroundColor: "#16a34a" },
    { duration: 0.2 },
  );
  await animate(
    ".btn-text-installed",
    { opacity: 1, scale: [0.85, 1] },
    { duration: 0.22 },
  );

  await animate(".success-flash", { opacity: [0, 0.4, 0] }, { duration: 0.5 });
}

/** Step 2 animation — opens command palette, pushes .env, encrypts variables. */
async function runSecureAnimation(
  animate: AnimateFn,
  pos: PosFn,
  cancelled: CancelledFn,
) {
  const editorArea = pos(".editor-area");
  const pushItem = pos(".palette-push-item");
  const away = { x: pushItem.x + 140, y: pushItem.y + 80 };

  // Reset step-specific elements
  await animate(
    ".command-palette",
    { opacity: 0, y: -8, scale: 0.96 },
    { duration: 0 },
  );
  await animate(".palette-char", { opacity: 0 }, { duration: 0 });
  await animate(".palette-item", { opacity: 0, x: -4 }, { duration: 0 });
  await animate(".palette-highlight", { opacity: 0 }, { duration: 0 });
  await animate(".env-val-plain", { opacity: 1 }, { duration: 0 });
  await animate(".env-val-enc", { opacity: 0 }, { duration: 0 });
  await animate(".encrypting-indicator", { opacity: 0, y: 4 }, { duration: 0 });
  await animate(
    ".toast-notification",
    { opacity: 0, y: 8, x: 8 },
    { duration: 0 },
  );
  await animate(
    ".cursor",
    { x: editorArea.x, y: editorArea.y },
    { duration: 0 },
  );
  await animate(".lock-check", { opacity: 0, scale: 0.5 }, { duration: 0 });

  if (cancelled()) return;

  await animate(".cursor", { opacity: 1 }, { duration: 0.25 });
  await new Promise((r) => setTimeout(r, 400));
  if (cancelled()) return;

  await animate(
    ".command-palette",
    { opacity: 1, y: 0, scale: 1 },
    { duration: 0.2, ease: EASE_OUT },
  );
  await new Promise((r) => setTimeout(r, 200));
  if (cancelled()) return;

  await animate(
    ".palette-char",
    { opacity: 1 },
    { duration: 0.06, delay: (i: number) => i * 0.04, ease: EASE_OUT },
  );
  await new Promise((r) => setTimeout(r, 200));
  if (cancelled()) return;

  await animate(
    ".palette-item",
    { opacity: 1, x: 0 },
    { duration: 0.25, ease: EASE_OUT, delay: (i: number) => i * 0.04 },
  );
  await new Promise((r) => setTimeout(r, 200));
  if (cancelled()) return;

  await animate(
    ".cursor",
    { x: pushItem.x, y: pushItem.y },
    { duration: 0.4, ease: EASE_OUT },
  );

  await animate(".palette-highlight", { opacity: 1 }, { duration: 0.1 });
  await new Promise((r) => setTimeout(r, 150));
  if (cancelled()) return;

  await animate(".cursor", { scale: 0.85 }, { duration: 0.06 });
  await animate(".cursor-ring", { scale: 1, opacity: 0.6 }, { duration: 0.08 });
  await animate(".cursor", { scale: 1 }, { duration: 0.1 });
  await animate(".cursor-ring", { scale: 1.6, opacity: 0 }, { duration: 0.25 });

  await animate(
    ".command-palette",
    { opacity: 0, y: -4, scale: 0.98 },
    { duration: 0.15, ease: EASE_OUT },
  );

  await animate(
    ".cursor",
    { x: away.x, y: away.y, opacity: 0 },
    { duration: 0.4, ease: EASE_OUT },
  );
  if (cancelled()) return;

  await animate(
    ".encrypting-indicator",
    { opacity: 1, y: 0 },
    { duration: 0.2, ease: EASE_OUT },
  );

  for (let i = 0; i < ENV_LINES.length; i++) {
    await new Promise((r) => setTimeout(r, 200));
    if (cancelled()) return;
    await Promise.all([
      animate(`.env-plain-${i}`, { opacity: 0 }, { duration: 0.15 }),
      animate(
        `.env-enc-${i}`,
        { opacity: 1 },
        { duration: 0.2, ease: EASE_OUT },
      ),
      animate(
        `.lock-check-${i}`,
        { opacity: 1, scale: 1 },
        { duration: 0.2, ease: EASE_OUT },
      ),
    ]);
  }

  await animate(
    ".encrypting-indicator",
    { opacity: 0, y: -4 },
    { duration: 0.15 },
  );

  await animate(
    ".toast-notification",
    { opacity: 1, y: 0, x: 0 },
    { duration: 0.3, ease: EASE_OUT },
  );

  await animate(".success-flash", { opacity: [0, 0.4, 0] }, { duration: 0.5 });
}

// ── Step 1 content — Extension marketplace ──────────────────────────

function InstallContent({ maskId }: { maskId: string }) {
  return (
    <>
      {/* Sidebar — Extension List */}
      <div className="w-[100px] border-r border-border bg-muted/20 flex flex-col">
        <div className="search-input-container border-b border-border p-1">
          <div className="flex items-center gap-1.5 rounded-sm border border-border bg-background px-2 py-[3px]">
            <Search01Icon
              size={10}
              className="text-muted-foreground/50 shrink-0"
              strokeWidth={2}
            />
            <span className="text-[10px] text-foreground/80 truncate flex min-w-0">
              {["e", "n", "v", "v", "a", "u", "l", "t"].map((char, i) => (
                <span key={i} className="search-char" style={{ opacity: 0 }}>
                  {char}
                </span>
              ))}
            </span>
          </div>
        </div>
        <div className="px-2 h-fit py-0">
          <span className="text-[8px] font-semibold uppercase tracking text-muted-foreground/60">
            Marketplace
          </span>
        </div>
        <div className="px-1 space-y-0.5 flex-1 overflow-hidden">
          <ExtensionListItem
            name="Envval"
            publisher="Envval"
            active
            className="envval-list-item"
          />
          <ExtensionListItem name=".ENV" publisher="mikestead" />
          <ExtensionListItem name="Env Switcher" publisher="edonet" />
        </div>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 relative bg-background overflow-hidden">
        <div className="detail-panel-placeholder absolute inset-0 flex items-center justify-center pointer-events-none">
          <VSCodeLogo maskId={maskId} />
        </div>
        <div
          className="detail-panel flex-1 bg-background overflow-hidden flex flex-col relative"
          style={{ opacity: 0 }}
        >
          <div className="flex items-start gap-2 border-b border-border p-2 py-3">
            <div className="relative shrink-0">
              <div className="flex size-7 items-center justify-center rounded-lg text-foreground">
                <EnvvalIcon size={18} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-semibold text-foreground">
                  Envval
                </h3>
                <span className="rounded bg-muted px-1 py-px text-[8px] font-medium text-muted-foreground">
                  v2.4.1
                </span>
              </div>
              <p className="mt-px text-[9px] text-muted-foreground">
                Secure .env management & team sharing
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <Stars count={5} size={6} />
                <span className="text-[9px] text-muted-foreground/70">
                  156,234
                </span>
                <span className="text-[9px] text-muted-foreground/40">|</span>
                <span className="text-[9px] text-muted-foreground/70">
                  Envval Inc.
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1">
                <button className="install-btn relative flex h-4.5 w-14 items-center justify-center rounded-sm text-[9px] font-medium text-primary-foreground bg-primary">
                  <span className="btn-text-install absolute flex items-center gap-0.5">
                    <Download01Icon
                      size={8}
                      strokeWidth={2.5}
                      className="shrink-0"
                    />
                    Install
                  </span>
                  <span
                    className="btn-text-installing absolute flex items-center gap-0.5"
                    style={{ opacity: 0 }}
                  >
                    <motion.div
                      className="size-2 rounded-full border-[1.5px] border-primary-foreground/30 border-t-primary-foreground"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.7,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <span className="text-[8px]">Installing</span>
                  </span>
                  <span
                    className="btn-text-installed absolute flex items-center gap-0.5"
                    style={{ opacity: 0 }}
                  >
                    <Tick01Icon
                      size={6}
                      className="shrink-0"
                      strokeWidth={2.5}
                    />
                    <span className="text-[8px]">Installed</span>
                  </span>
                </button>
                <button className="flex h-4.5 items-center justify-center rounded-sm border border-border bg-background px-1.5 text-[8px] text-muted-foreground">
                  Disable
                </button>
                <button className="flex h-4.5 items-center justify-center rounded-sm border border-border bg-background px-1.5 text-[8px] text-muted-foreground">
                  Uninstall
                </button>
              </div>
            </div>
          </div>
          <div className="flex border-b border-border px-2">
            <div className="border-b-2 border-primary px-2 py-1 text-[9px] font-medium text-foreground">
              Details
            </div>
            <div className="px-2 py-1 text-[9px] text-muted-foreground/60">
              Feature Contributions
            </div>
            <div className="px-2 py-1 text-[9px] text-muted-foreground/60">
              Changelog
            </div>
          </div>
          <div className="p-2 flex-1 overflow-hidden">
            <div className="space-y-1.5 text-[9px] text-muted-foreground">
              {[
                "End-to-end encrypted .env sync",
                "Team sharing & granular access control",
                "Auto-detect .env files in workspace",
              ].map((f) => (
                <p key={f} className="flex items-center gap-2">
                  <span className="flex size-3.5 items-center justify-center rounded-sm bg-emerald-500/10">
                    <Tick01Icon
                      size={6}
                      className="text-emerald-500"
                      strokeWidth={2.5}
                    />
                  </span>
                  {f}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Step 2 content — Editor with encryption ─────────────────────────

function SecureContent() {
  return (
    <>
      {/* Explorer Sidebar */}
      <div className="w-[100px] border-r border-border bg-muted/20 flex flex-col">
        <div className="border-b border-border px-2 py-1">
          <span className="text-[8px] font-semibold uppercase tracking text-muted-foreground/60">
            Explorer
          </span>
        </div>
        <div className="px-1 pt-0.5 space-y-px">
          <FileTreeItem name="my-saas-app" isFolder level={0} expanded />
          <FileTreeItem name="src" isFolder level={1} />
          <FileTreeItem name="package.json" level={1} />
          <FileTreeItem name=".env" level={1} active />
          <FileTreeItem name=".gitignore" level={1} />
          <FileTreeItem name="tsconfig.json" level={1} />
        </div>
      </div>

      {/* Editor Area */}
      <div className="editor-area flex-1 bg-background overflow-hidden flex flex-col relative">
        {/* Tab Bar */}
        <div className="flex border-b border-border">
          <div className="flex items-center gap-1.5 border-r border-border bg-background px-2.5 py-1">
            <div className="size-2.5 rounded-sm bg-amber-400/60" />
            <span className="text-[9px] text-foreground">.env</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/30">
            <div className="size-2.5 rounded-sm bg-blue-400/60" />
            <span className="text-[9px] text-muted-foreground/60">
              index.ts
            </span>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-2 font-mono text-[9px] leading-relaxed overflow-hidden">
          <div className="flex gap-3">
            <div className="flex flex-col text-muted-foreground/30 select-none text-right w-4 shrink-0">
              {ENV_LINES.map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <div className="flex-1 space-y-0">
              {ENV_LINES.map((line, i) => (
                <div key={line.key} className="flex items-center">
                  <span className="text-emerald-600 dark:text-emerald-400 shrink-0">
                    {line.key}
                  </span>
                  <span className="text-muted-foreground/60 shrink-0">=</span>
                  <div className="relative min-w-0 flex-1">
                    <span
                      className={`env-val-plain env-plain-${i} text-amber-600 dark:text-amber-400 block truncate`}
                    >
                      {line.value}
                    </span>
                    <span
                      className={`env-val-enc env-enc-${i} text-muted-foreground/50 absolute inset-0 truncate`}
                      style={{ opacity: 0 }}
                    >
                      {line.encrypted}
                    </span>
                  </div>
                  <span
                    className={`lock-check lock-check-${i} ml-1 shrink-0`}
                    style={{ opacity: 0 }}
                  >
                    <Tick01Icon
                      size={8}
                      className="text-emerald-500"
                      strokeWidth={2.5}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Command Palette Overlay */}
        <div
          className="command-palette absolute top-0 left-1/2 -translate-x-1/2 w-[75%] mt-1 rounded-md border border-border bg-card shadow-xl overflow-hidden z-10"
          style={{ opacity: 0 }}
        >
          <div className="flex items-center gap-1.5 border-b border-border px-2 py-1.5">
            <CommandIcon
              size={10}
              className="text-muted-foreground/50 shrink-0"
              strokeWidth={2}
            />
            <span className="text-[9px] text-foreground/80 flex">
              {[
                ">",
                " ",
                "E",
                "n",
                "v",
                "V",
                "a",
                "u",
                "l",
                "t",
                ":",
                " ",
                "P",
                "u",
                "s",
                "h",
              ].map((char, i) => (
                <span key={i} className="palette-char" style={{ opacity: 0 }}>
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </span>
          </div>
          <div className="py-0.5">
            {PALETTE_ITEMS.map((item, i) => (
              <div
                key={item}
                className={cn(
                  "palette-item flex items-center gap-2 px-2 py-1 text-[9px] relative",
                  i === 0 ? "palette-push-item" : "",
                )}
                style={{ opacity: 0 }}
              >
                {i === 0 && (
                  <div
                    className="palette-highlight absolute inset-x-0.5 inset-y-0 rounded-sm bg-accent"
                    style={{ opacity: 0 }}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10",
                    i === 0 ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Encrypting Indicator */}
        <div
          className="encrypting-indicator absolute bottom-2 right-2 flex items-center gap-1.5 rounded-md bg-card border border-border px-2.5 py-1.5 shadow-sm"
          style={{ opacity: 0 }}
        >
          <motion.div
            className="size-2.5 rounded-full border-[1.5px] border-primary/30 border-t-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
          />
          <span className="text-[8px] text-muted-foreground">
            Encrypting variables...
          </span>
        </div>

        {/* Toast Notification */}
        <div
          className="toast-notification absolute bottom-2 right-2 flex items-center gap-1.5 rounded-md bg-card border border-border px-2 py-1.5 shadow-lg z-10"
          style={{ opacity: 0 }}
        >
          <span className="flex size-3.5 items-center justify-center rounded-full bg-emerald-500/15">
            <Tick01Icon
              size={8}
              className="text-emerald-500"
              strokeWidth={2.5}
            />
          </span>
          <span className="text-[8px] font-medium text-foreground">
            Pushed 4 variables
          </span>
        </div>
      </div>
    </>
  );
}

// ── Shared sub-components ───────────────────────────────────────────

function ExtensionListItem({
  name,
  publisher,
  active,
  className,
}: {
  name: string;
  publisher: string;
  active?: boolean;
  className?: string;
}) {
  const isEnvval = name === "Envval";
  return (
    <div
      className={cn(
        "extension-item flex items-center gap-1 rounded-sm p-1 cursor-pointer transition-colors",
        active ? "bg-accent" : "hover:bg-accent/50",
        className,
      )}
      style={{ opacity: 0 }}
    >
      {isEnvval ? (
        <div className="flex size-5 shrink-0 items-center justify-center rounded-[3px]">
          <EnvvalIcon size={10} />
        </div>
      ) : (
        <div className="flex size-5 shrink-0 items-center justify-center rounded-[3px] bg-muted">
          <span className="text-[7px] font-bold text-muted-foreground">
            {name === ".ENV" ? ".E" : name[0]}
          </span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate text-[8px] font-medium leading-tight",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {name}
        </div>
        <div className="truncate text-[7px] text-muted-foreground/60 leading-tight">
          {publisher}
        </div>
      </div>
    </div>
  );
}

function FileTreeItem({
  name,
  isFolder,
  level = 0,
  active,
  expanded,
}: {
  name: string;
  isFolder?: boolean;
  level?: number;
  active?: boolean;
  expanded?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-sm px-1 py-px text-[8px] cursor-pointer transition-colors",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent/50",
      )}
      style={{ paddingLeft: `${4 + level * 8}px` }}
    >
      {isFolder && (
        <svg
          width="6"
          height="6"
          viewBox="0 0 6 6"
          fill="none"
          className={cn("shrink-0", expanded ? "rotate-90" : "")}
          aria-hidden="true"
        >
          <path
            d="M2 1L4.5 3L2 5"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {!isFolder && <span className="w-[6px]" />}
      <span className="truncate">{name}</span>
    </div>
  );
}

function Stars({ count, size = 8 }: { count: number; size?: number }) {
  return (
    <div className="flex items-center gap-px">
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          size={size}
          className={
            i <= count
              ? "text-amber-400 fill-amber-400"
              : "text-muted fill-muted"
          }
        />
      ))}
    </div>
  );
}

function VSCodeLogo({ maskId }: { maskId: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 100 100"
      fill="none"
      className="opacity-25"
      aria-hidden="true"
    >
      <mask
        id={maskId}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="100"
        height="100"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M70.9119 99.3171C72.4869 99.9307 74.2828 99.8914 75.8725 99.1264L96.4608 89.2197C98.6242 88.1787 100 85.9892 100 83.5872V16.4133C100 14.0113 98.6243 11.8218 96.4609 10.7808L75.8725 0.873756C73.7862 -0.130129 71.3446 0.11576 69.5135 1.44695C69.252 1.63711 69.0028 1.84943 68.769 2.08341L29.3551 38.0415L12.1872 25.0096C10.589 23.7965 8.35363 23.8959 6.86933 25.2461L1.36303 30.2549C-0.452552 31.9064 -0.454633 34.7627 1.35853 36.417L16.2471 50.0001L1.35853 63.5832C-0.454633 65.2374 -0.452552 68.0938 1.36303 69.7453L6.86933 74.7541C8.35363 76.1043 10.589 76.2037 12.1872 74.9905L29.3551 61.9587L68.769 97.9167C69.3925 98.5406 70.1246 99.0104 70.9119 99.3171ZM75.0152 27.2989L45.1091 50.0001L75.0152 72.7012V27.2989Z"
          fill="white"
        />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M96.4614 10.7962L75.8569 0.875542C73.4719 -0.272773 70.6217 0.211611 68.75 2.08333L1.29858 63.5832C-0.515693 65.2373 -0.513607 68.0937 1.30308 69.7452L6.81272 74.754C8.29793 76.1042 10.5347 76.2036 12.1338 74.9905L93.3609 13.3699C96.086 11.3026 100 13.2462 100 16.6667V16.4275C100 14.0265 98.6246 11.8378 96.4614 10.7962Z"
          fill="#0065A9"
        />
        <path
          d="M96.4614 89.2038L75.8569 99.1245C73.4719 100.273 70.6217 99.7884 68.75 97.9167L1.29858 36.4169C-0.515693 34.7627 -0.513607 31.9063 1.30308 30.2548L6.81272 25.246C8.29793 23.8958 10.5347 23.7964 12.1338 25.0095L93.3609 86.6301C96.086 88.6974 100 86.7538 100 83.3334V83.5726C100 85.9735 98.6246 88.1622 96.4614 89.2038Z"
          fill="#007ACC"
        />
        <path
          d="M75.8578 99.1263C73.4721 100.274 70.6219 99.7885 68.75 97.9166C71.0564 100.223 75 98.5895 75 95.3278V4.67213C75 1.41039 71.0564 -0.223106 68.75 2.08329C70.6219 0.211402 73.4721 -0.273666 75.8578 0.873633L96.4587 10.7807C98.6234 11.8217 100 14.0112 100 16.4132V83.5871C100 85.9891 98.6234 88.1786 96.4586 89.2196L75.8578 99.1263Z"
          fill="#1F9CF0"
        />
      </g>
    </svg>
  );
}
