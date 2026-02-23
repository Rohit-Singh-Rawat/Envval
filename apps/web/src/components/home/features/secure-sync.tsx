import { motion, useAnimate, useInView } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { EnvvalIcon } from "@/components/onboarding/get-started-illustration/shared";
import { EASE_OUT } from "@/lib/animation";

const SHARED_ENVS = [
  { key: "DB_URL", value: "pg://admin:s3cret@db.io" },
  { key: "API_KEY", value: "sk_live_7f3a9b2c" },
  { key: "JWT_SEC", value: "eyJhbGciOiJIUzI1" },
] as const;

const NEW_ENVS = [
  { key: "STRIPE", value: "pk_live_51HG8k2e" },
  { key: "REDIS", value: "redis://cache:6379" },
] as const;

const CIPHER_CHARS = "!@#$%^&*()_+-=[]{}|;:<>?/~0123456789abcdef";

type AnimateFn = ReturnType<typeof useAnimate>[1];
type CancelledFn = () => boolean;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function typeText(
  el: HTMLElement,
  text: string,
  charDelay: number,
  cancelled: CancelledFn,
  className?: string,
) {
  for (let i = 0; i < text.length; i++) {
    if (cancelled()) return;
    el.textContent = text.slice(0, i + 1);
    if (className) el.className = className;
    await sleep(charDelay);
  }
}

/** Scrambles text through cipher characters before resolving to dots */
async function scrambleEncrypt(
  el: HTMLElement,
  text: string,
  duration: number,
  cancelled: CancelledFn,
) {
  const len = text.length;
  const startTime = Date.now();

  return new Promise<void>((resolve) => {
    const frame = () => {
      if (cancelled()) {
        resolve();
        return;
      }
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const chars: string[] = [];

      for (let i = 0; i < len; i++) {
        const charProgress = (progress - i / len / 2) * 2;
        if (charProgress >= 1) {
          chars.push("\u2022");
        } else if (charProgress > 0) {
          chars.push(
            CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)],
          );
        } else {
          chars.push(text[i] ?? "");
        }
      }

      el.textContent = chars.join("");

      if (progress >= 1) {
        resolve();
      } else {
        requestAnimationFrame(frame);
      }
    };
    requestAnimationFrame(frame);
  });
}

/** Sweeps a linearGradient across a line for a traveling signal effect */
async function sweepGradient(
  gradient: SVGLinearGradientElement,
  from: number,
  to: number,
  duration: number,
  cancelled: CancelledFn,
) {
  const windowSize = 24;
  const startTime = performance.now();

  return new Promise<void>((resolve) => {
    const frame = (now: number) => {
      if (cancelled()) {
        resolve();
        return;
      }
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t * t * (3 - 2 * t);
      const pos = from + (to - from) * eased;

      gradient.setAttribute("x1", String(pos - windowSize / 2));
      gradient.setAttribute("x2", String(pos + windowSize / 2));

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        gradient.setAttribute("x1", "-20");
        gradient.setAttribute("x2", "-10");
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });
}

async function signalRightToLeft(
  gradientRight: SVGLinearGradientElement,
  gradientLeft: SVGLinearGradientElement,
  cancelled: CancelledFn,
) {
  await sweepGradient(gradientRight, 60, 0, 400, cancelled);
  if (cancelled()) return;
  await sweepGradient(gradientLeft, 60, 0, 400, cancelled);
}

async function signalLeftToRight(
  gradientLeft: SVGLinearGradientElement,
  gradientRight: SVGLinearGradientElement,
  cancelled: CancelledFn,
) {
  await sweepGradient(gradientLeft, 0, 60, 400, cancelled);
  if (cancelled()) return;
  await sweepGradient(gradientRight, 0, 60, 400, cancelled);
}

/**
 * Sync animation timeline:
 * 1. Type 4th env on right → encrypt → signal right→left → type 4th on left
 * 2. Type 5th env on left → encrypt → signal left→right → type 5th on right
 * 3. Remove 4th+5th on right → signal right→left → remove 4th+5th on left
 * 4. Loop
 */
async function runSyncSequence(
  scope: React.RefObject<HTMLDivElement | null>,
  animate: AnimateFn,
  cancelled: CancelledFn,
) {
  const scopeEl = scope.current;
  if (!scopeEl) return;

  const q = <T extends Element>(sel: string) => scopeEl.querySelector<T>(sel);

  const rightKey0 = q<HTMLElement>("[data-right-key-0]");
  const rightVal0 = q<HTMLElement>("[data-right-val-0]");
  const rightKey1 = q<HTMLElement>("[data-right-key-1]");
  const rightVal1 = q<HTMLElement>("[data-right-val-1]");
  const leftKey0 = q<HTMLElement>("[data-left-key-0]");
  const leftVal0 = q<HTMLElement>("[data-left-val-0]");
  const leftKey1 = q<HTMLElement>("[data-left-key-1]");
  const leftVal1 = q<HTMLElement>("[data-left-val-1]");
  const gradRight = q<SVGLinearGradientElement>(
    '[data-signal-gradient="right"]',
  );
  const gradLeft = q<SVGLinearGradientElement>('[data-signal-gradient="left"]');

  if (
    !rightKey0 ||
    !rightVal0 ||
    !rightKey1 ||
    !rightVal1 ||
    !leftKey0 ||
    !leftVal0 ||
    !leftKey1 ||
    !leftVal1 ||
    !gradRight ||
    !gradLeft
  )
    return;

  const valCls =
    "text-[11px] font-mono leading-[22px] text-foreground/80 truncate";
  const keyCls =
    "text-[11px] font-mono leading-[22px] text-emerald-500 shrink-0";

  // Reset all animated lines
  await animate(
    "[data-right-line-0]",
    { opacity: 0, height: 0, filter: "blur(0px)", y: 0 },
    { duration: 0 },
  );
  await animate(
    "[data-right-line-1]",
    { opacity: 0, height: 0, filter: "blur(0px)", y: 0 },
    { duration: 0 },
  );
  await animate(
    "[data-left-line-0]",
    { opacity: 0, height: 0, filter: "blur(0px)", y: 0 },
    { duration: 0 },
  );
  await animate(
    "[data-left-line-1]",
    { opacity: 0, height: 0, filter: "blur(0px)", y: 0 },
    { duration: 0 },
  );
  gradRight.setAttribute("x1", "-20");
  gradRight.setAttribute("x2", "-10");
  gradLeft.setAttribute("x1", "-20");
  gradLeft.setAttribute("x2", "-10");
  rightKey0.textContent = "";
  rightVal0.textContent = "";
  rightKey1.textContent = "";
  rightVal1.textContent = "";
  leftKey0.textContent = "";
  leftVal0.textContent = "";
  leftKey1.textContent = "";
  leftVal1.textContent = "";

  await sleep(800);
  if (cancelled()) return;

  // Phase 1: Write 4th env on right → signal → write on left
  await animate(
    "[data-right-line-0]",
    { opacity: 1, height: "auto" },
    { duration: 0.25, ease: EASE_OUT },
  );
  if (cancelled()) return;

  await typeText(rightKey0, NEW_ENVS[0].key, 45, cancelled, keyCls);
  if (cancelled()) return;
  await sleep(80);
  await typeText(rightVal0, NEW_ENVS[0].value, 25, cancelled, valCls);
  if (cancelled()) return;
  await sleep(400);

  rightVal0.className =
    "text-[11px] font-mono leading-[22px] text-muted-foreground/60 truncate";
  await scrambleEncrypt(rightVal0, NEW_ENVS[0].value, 400, cancelled);
  if (cancelled()) return;
  await sleep(300);

  await signalRightToLeft(gradRight, gradLeft, cancelled);
  if (cancelled()) return;

  await animate(
    "[data-left-line-0]",
    { opacity: 1, height: "auto" },
    { duration: 0.25, ease: EASE_OUT },
  );
  if (cancelled()) return;
  await typeText(leftKey0, NEW_ENVS[0].key, 45, cancelled, keyCls);
  if (cancelled()) return;
  await sleep(60);
  await typeText(leftVal0, NEW_ENVS[0].value, 25, cancelled, valCls);
  if (cancelled()) return;
  await sleep(800);
  if (cancelled()) return;

  // Phase 2: Write 5th env on left → signal → write on right
  await animate(
    "[data-left-line-1]",
    { opacity: 1, height: "auto" },
    { duration: 0.25, ease: EASE_OUT },
  );
  if (cancelled()) return;

  await typeText(leftKey1, NEW_ENVS[1].key, 45, cancelled, keyCls);
  if (cancelled()) return;
  await sleep(80);
  await typeText(leftVal1, NEW_ENVS[1].value, 25, cancelled, valCls);
  if (cancelled()) return;
  await sleep(400);

  leftVal1.className =
    "text-[11px] font-mono leading-[22px] text-muted-foreground/60 truncate";
  await scrambleEncrypt(leftVal1, NEW_ENVS[1].value, 400, cancelled);
  if (cancelled()) return;
  await sleep(300);

  await signalLeftToRight(gradLeft, gradRight, cancelled);
  if (cancelled()) return;

  await animate(
    "[data-right-line-1]",
    { opacity: 1, height: "auto" },
    { duration: 0.25, ease: EASE_OUT },
  );
  if (cancelled()) return;
  await typeText(rightKey1, NEW_ENVS[1].key, 45, cancelled, keyCls);
  if (cancelled()) return;
  await sleep(60);
  await typeText(rightVal1, NEW_ENVS[1].value, 25, cancelled, valCls);
  if (cancelled()) return;
  await sleep(1500);
  if (cancelled()) return;

  // Phase 3: Remove lines on right → signal → remove on left
  await Promise.all([
    animate(
      "[data-right-line-0]",
      { opacity: 0, filter: "blur(4px)", y: -4 },
      { duration: 0.35, ease: EASE_OUT },
    ),
    animate(
      "[data-right-line-1]",
      { opacity: 0, filter: "blur(4px)", y: -4 },
      { duration: 0.35, ease: EASE_OUT },
    ),
  ]);
  if (cancelled()) return;
  await Promise.all([
    animate(
      "[data-right-line-0]",
      { height: 0 },
      { duration: 0.35, ease: EASE_OUT },
    ),
    animate(
      "[data-right-line-1]",
      { height: 0 },
      { duration: 0.35, ease: EASE_OUT },
    ),
  ]);
  if (cancelled()) return;
  await sleep(200);

  await signalRightToLeft(gradRight, gradLeft, cancelled);
  if (cancelled()) return;

  await Promise.all([
    animate(
      "[data-left-line-0]",
      { opacity: 0, filter: "blur(4px)", y: -4 },
      { duration: 0.35, ease: EASE_OUT },
    ),
    animate(
      "[data-left-line-1]",
      { opacity: 0, filter: "blur(4px)", y: -4 },
      { duration: 0.35, ease: EASE_OUT },
    ),
  ]);
  if (cancelled()) return;
  await Promise.all([
    animate(
      "[data-left-line-0]",
      { height: 0 },
      { duration: 0.35, ease: EASE_OUT },
    ),
    animate(
      "[data-left-line-1]",
      { height: 0 },
      { duration: 0.35, ease: EASE_OUT },
    ),
  ]);
  if (cancelled()) return;

  await sleep(800);
}

function EnvFileLine({
  lineNumber,
  envKey,
  value,
}: {
  lineNumber: number;
  envKey: string;
  value: string;
}) {
  return (
    <div className="h-[22px] flex items-center">
      <span className="text-[11px] leading-[22px] font-mono text-muted-foreground/50 select-none w-4 text-right shrink-0 mr-3">
        {lineNumber}
      </span>
      <span className="text-[11px] font-mono text-emerald-500 leading-[22px] shrink-0">
        {envKey}
      </span>
      <span className="text-[11px] font-mono text-muted-foreground/60 leading-[22px]">
        =
      </span>
      <span className="text-[11px] font-mono text-foreground/80 leading-[22px] truncate">
        {value}
      </span>
    </div>
  );
}

function NewEnvSlot({
  lineNumber,
  side,
  index,
}: {
  lineNumber: number;
  side: "left" | "right";
  index: number;
}) {
  return (
    <div
      {...{ [`data-${side}-line-${index}`]: true }}
      style={{ opacity: 0, height: 0, overflow: "hidden" }}
    >
      <div className="h-[22px] flex items-center">
        <span className="text-[11px] leading-[22px] font-mono text-muted-foreground/50 select-none w-4 text-right shrink-0 mr-3">
          {lineNumber}
        </span>
        <span
          {...{ [`data-${side}-key-${index}`]: true }}
          className="text-emerald-500 shrink-0 text-[11px] font-mono leading-[22px]"
        />
        <span className="text-[11px] font-mono text-muted-foreground/60 leading-[22px]">
          =
        </span>
        <span
          {...{ [`data-${side}-val-${index}`]: true }}
          className="text-foreground/80 truncate text-[11px] font-mono leading-[22px]"
        />
      </div>
    </div>
  );
}

function EnvEditorWindow({
  fileName,
  side,
  children,
}: {
  fileName: string;
  side: "left" | "right";
  children: React.ReactNode;
}) {
  const isLeft = side === "left";
  const cornerClass = isLeft
    ? "rounded-tr-lg rounded-bl-2xl "
    : "rounded-tl-lg rounded-br-2xl ";

  return (
    <div className="flex-1 min-w-0 self-stretch relative pt-4 flex flex-col">
      {/* Stacked tab — back */}
      <motion.div
        className={`absolute inset-x-3 top-0 h-6 ${cornerClass} border border-border bg-card`}
        style={{ zIndex: 1, opacity: 0.35 }}
        initial={{ y: 14, opacity: 0 }}
        whileInView={{ y: 0, opacity: 0.35 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
        aria-hidden="true"
      >
        <div
          className={`flex items-center h-full bg-muted/40 px-3 ${cornerClass}`}
        >
          <div className="flex items-center gap-[5px]">
            <span className="size-[5px] rounded-full bg-muted-foreground/20" />
            <span className="size-[5px] rounded-full bg-muted-foreground/20" />
            <span className="size-[5px] rounded-full bg-muted-foreground/20" />
          </div>
        </div>
      </motion.div>

      {/* Stacked tab — middle */}
      <motion.div
        className={`absolute inset-x-1.5 top-2 h-6 ${cornerClass} border border-border bg-card`}
        style={{ zIndex: 2, opacity: 0.6 }}
        initial={{ y: 10, opacity: 0 }}
        whileInView={{ y: 0, opacity: 0.6 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.45, delay: 0.25, ease: [0.32, 0.72, 0, 1] }}
        aria-hidden="true"
      >
        <div
          className={`flex items-center h-full bg-muted/40 px-3 ${cornerClass}`}
        >
          <div className="flex items-center gap-[5px]">
            <span className="size-[5px] rounded-full bg-muted-foreground/25" />
            <span className="size-[5px] rounded-full bg-muted-foreground/25" />
            <span className="size-[5px] rounded-full bg-muted-foreground/25" />
          </div>
        </div>
      </motion.div>

      {/* Main editor window */}
      <motion.div
        className={`relative overflow-hidden border-t bg-card ${cornerClass} ${isLeft ? "border-r" : "border-l"} border-border flex-1 flex flex-col`}
        style={{ zIndex: 3 }}
        initial={{ y: 6, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
        role="img"
        aria-label={`${fileName} environment file`}
      >
        <div className="flex items-center justify-between h-6 border-b border-border bg-muted/40 px-3">
          <div className="flex items-center gap-[5px]">
            <span className="size-[6px] rounded-full bg-muted-foreground/30" />
            <span className="size-[6px] rounded-full bg-muted-foreground/30" />
            <span className="size-[6px] rounded-full bg-muted-foreground/30" />
          </div>
          <span className="text-[9px] text-muted-foreground/40">
            {fileName}
          </span>
          <div className="w-10" />
        </div>
        <div className="p-3 pb-3 bg-background flex-1">{children}</div>
      </motion.div>
    </div>
  );
}

function ConnectionLine({ direction }: { direction: "left" | "right" }) {
  const gradientId = `h-line-gradient-${direction}`;
  return (
    <svg
      width="60"
      height="2"
      viewBox="0 0 60 2"
      fill="none"
      className="shrink-0 self-center block max-sm:w-[20px] "
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="1"
        x2="60"
        y2="1"
        stroke="currentColor"
        className="text-muted-foreground/30"
      />
      <line
        x1="0"
        y1="1"
        x2="60"
        y2="1"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
      />
      <defs>
        <linearGradient
          id={gradientId}
          data-signal-gradient={direction}
          gradientUnits="userSpaceOnUse"
          x1="-20"
          y1="1"
          x2="-10"
          y2="1"
        >
          <stop offset="0" stopColor="transparent" />
          <stop
            offset="0.2"
            stopColor="var(--color-primary)"
            stopOpacity="0.12"
          />
          <stop
            offset="0.4"
            stopColor="var(--color-primary)"
            stopOpacity="0.5"
          />
          <stop offset="0.5" stopColor="var(--color-primary)" />
          <stop
            offset="0.6"
            stopColor="var(--color-primary)"
            stopOpacity="0.5"
          />
          <stop
            offset="0.8"
            stopColor="var(--color-primary)"
            stopOpacity="0.12"
          />
          <stop offset="1" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const SecureSyncIllustration = () => {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const isInView = useInView(scope, { once: false, margin: "-80px" });
  const generationRef = useRef(0);

  const startAnimation = useCallback(async () => {
    const gen = ++generationRef.current;
    const cancelled = () => generationRef.current !== gen;

    while (!cancelled()) {
      await runSyncSequence(scope, animate, cancelled);
    }
  }, [animate, scope]);

  useEffect(() => {
    if (isInView) {
      startAnimation();
    } else {
      generationRef.current++;
    }
  }, [isInView, startAnimation]);

  return (
    <div className="flex flex-col flex-1 h-full border-x border-b border-muted rounded-b-2xl overflow-hidden">
      <div
        ref={scope}
        className="relative overflow-hidden flex-1 min-h-[180px] sm:min-h-[212px]"
        role="img"
        aria-label="Secure sync: environment variables sync between devices through encrypted Envval relay"
      >
        <div className="absolute inset-0 flex items-stretch">
          <EnvEditorWindow fileName=".env.local" side="left">
            {SHARED_ENVS.map((env, i) => (
              <EnvFileLine
                key={env.key}
                lineNumber={i + 1}
                envKey={env.key}
                value={env.value}
              />
            ))}
            <NewEnvSlot
              lineNumber={SHARED_ENVS.length + 1}
              side="left"
              index={0}
            />
            <NewEnvSlot
              lineNumber={SHARED_ENVS.length + 2}
              side="left"
              index={1}
            />
          </EnvEditorWindow>

          <ConnectionLine direction="left" />

          {/* Envval icon with spinning conic gradient border */}
          <div className="relative flex flex-col items-center justify-center shrink-0 z-10 self-center">
            <div className="relative size-10 sm:size-12 shrink-0 overflow-hidden rounded-sm bg-gray-200 p-px shadow-xl dark:bg-neutral-700">
              <div
                className="absolute inset-0 scale-[1.4] animate-spin rounded-full"
                style={{
                  backgroundImage:
                    "conic-gradient(at center, transparent, var(--color-primary) 20%, transparent 30%)",
                  animationDuration: "4s",
                }}
              />
              <div
                className="absolute inset-0 scale-[1.4] animate-spin rounded-full"
                style={{
                  backgroundImage:
                    "conic-gradient(at center, transparent, var(--color-primary) 20%, transparent 30%)",
                  animationDuration: "4s",
                  animationDelay: "2s",
                }}
              />
              <div className="relative z-20 flex h-full w-full items-center justify-center rounded-[5px] bg-white dark:bg-neutral-900">
                <EnvvalIcon size={22} />
              </div>
            </div>
          </div>

          <ConnectionLine direction="right" />

          <EnvEditorWindow fileName=".env.local" side="right">
            {SHARED_ENVS.map((env, i) => (
              <EnvFileLine
                key={env.key}
                lineNumber={i + 1}
                envKey={env.key}
                value={env.value}
              />
            ))}
            <NewEnvSlot
              lineNumber={SHARED_ENVS.length + 1}
              side="right"
              index={0}
            />
            <NewEnvSlot
              lineNumber={SHARED_ENVS.length + 2}
              side="right"
              index={1}
            />
          </EnvEditorWindow>
        </div>
      </div>
    </div>
  );
};

export default SecureSyncIllustration;
