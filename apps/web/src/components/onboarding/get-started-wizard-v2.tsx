"use client";

import { Button } from "@envval/ui/components/button";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { type SVGProps, useState } from "react";
import { cn } from "@/lib/utils";
import { UnifiedIllustration } from "./get-started-illustration/unified-illustration";

type StepId = 1 | 2 | 3;

type GetStartedWizardProps = {
  onComplete: () => void;
};

type StepConfig = {
  title: string;
  description: string;
};

const STORAGE_KEY = "envval_onboarding_completed";

const EASE_OUT = [0.32, 0.72, 0, 1] as const;

const STEP_TRANSITION_MS = 500;

const TOTAL_STEPS = 3;

const EXTENSION_URL =
  "https://marketplace.visualstudio.com/items?itemName=envval.envval";

const STEP_CONFIG: Record<StepId, StepConfig> = {
  1: {
    title: "Install the Extension",
    description:
      "Get Envval for VS Code to sync and secure your environment variables across devices.",
  },
  2: {
    title: "Secure Your Repository",
    description:
      "Push your .env file with the extension to encrypt and sync it. Only you and your team can decrypt.",
  },
  3: {
    title: "View in Dashboard",
    description:
      "Access your environment variables from anywhere. Decryption happens in your browser, so we never see your secrets.",
  },
};

export function isOnboardingCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function markOnboardingCompleted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, "true");
}

export function GetStartedWizard({ onComplete }: GetStartedWizardProps) {
  const [activeStep, setActiveStep] = useState<StepId>(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const advanceTo = (next: StepId) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveStep(next);
      setIsTransitioning(false);
    }, STEP_TRANSITION_MS);
  };

  const handleFinish = () => {
    markOnboardingCompleted();
    onComplete();
  };

  const currentConfig = STEP_CONFIG[activeStep];

  return (
    <LayoutGroup>
      <motion.section
        aria-label="Get started with Envval"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="relative overflow-hidden"
      >
        <div className="flex items-center justify-end px-4 pt-3">
          <div
            role="progressbar"
            aria-valuenow={activeStep}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            aria-label={`Step ${activeStep} of ${TOTAL_STEPS}`}
          >
            <StepIndicator totalSteps={TOTAL_STEPS} currentStep={activeStep} />
          </div>
        </div>

        <div className="p-6 py-10 max-sm:px-4 max-sm:py-6">
          <div className="flex flex-col items-center -space-y-10 max-sm:-space-y-6">
            <motion.div
              layoutId="wizard-illustration-container"
              className="w-full overflow-hidden mask-b-from-60% mask-b-to-100% max-w-md max-sm:max-w-none flex justify-center"
            >
              <div className="w-full flex justify-center max-sm:scale-[0.72] max-sm:origin-top max-sm:-mb-[74px] max-[479px]:scale-[0.6] max-[479px]:-mb-[106px]">
                <UnifiedIllustration activeStep={activeStep} />
              </div>
            </motion.div>

            <motion.div
              layoutId="wizard-text-container"
              className="mt-6 max-w-md text-center"
            >
              <AnimatePresence mode="wait">
                <motion.h3
                  key={`title-${activeStep}`}
                  initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                  transition={{
                    duration: 0.3,
                    ease: EASE_OUT,
                  }}
                  className="text-lg font-semibold tracking-tight max-sm:text-base"
                >
                  {currentConfig.title}
                </motion.h3>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.p
                  key={`desc-${activeStep}`}
                  initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                  transition={{
                    duration: 0.3,
                    ease: EASE_OUT,
                    delay: 0.06,
                  }}
                  className="mt-1.5 text-sm leading-relaxed text-muted-foreground max-sm:text-xs"
                >
                  {currentConfig.description}
                </motion.p>
              </AnimatePresence>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 max-sm:mt-4 max-sm:gap-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`actions-${activeStep}`}
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                    transition={{
                      duration: 0.3,
                      ease: EASE_OUT,
                      delay: 0.12,
                    }}
                    className="flex flex-wrap items-center justify-center gap-3"
                  >
                    <StepActions
                      step={activeStep}
                      isTransitioning={isTransitioning}
                      onAdvance={advanceTo}
                      onFinish={handleFinish}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </LayoutGroup>
  );
}

function StepActions({
  step,
  isTransitioning,
  onAdvance,
  onFinish,
}: {
  step: StepId;
  isTransitioning: boolean;
  onAdvance: (next: StepId) => void;
  onFinish: () => void;
}) {
  switch (step) {
    case 1:
      return (
        <>
          <Button
            size="sm"
            onClick={() => onAdvance(2)}
            disabled={isTransitioning}
          >
            <CheckIcon />
            I've installed it
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              window.open(EXTENSION_URL, "_blank", "noopener,noreferrer")
            }
          >
            <DownloadIcon className="mr-1.5 size-[14px] shrink-0" />
            Install Extension
          </Button>
        </>
      );
    case 2:
      return (
        <Button
          size="sm"
          onClick={() => onAdvance(3)}
          disabled={isTransitioning}
        >
          <CheckIcon />
          I've pushed it
        </Button>
      );
    case 3:
      return (
        <Button size="sm" onClick={onFinish}>
          Finish Setup
        </Button>
      );
  }
}

function StepIndicator({
  totalSteps,
  currentStep,
}: {
  totalSteps: number;
  currentStep: number;
}) {
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = currentStep === step;

        return (
          <motion.div
            key={step}
            className={cn(
              "h-2 ring-1 ring-primary/50 ring-offset-1 rounded-full transition-colors",
              isActive ? "bg-primary" : "bg-muted-foreground/30",
            )}
            initial={false}
            animate={{ width: isActive ? 24 : 8 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        );
      })}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="mr-1.5"
      aria-hidden={true}
    >
      <path
        d="M2 7L5.5 10.5L12 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      aria-hidden={true}
      {...props}
    >
      <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
        <path
          d="M3 14.25a.75.75 0 0 1 .75.75c0 1.435.002 2.436.103 3.192c.099.734.28 1.122.556 1.399c.277.277.665.457 1.4.556c.754.101 1.756.103 3.191.103h6c1.435 0 2.436-.002 3.192-.103c.734-.099 1.122-.28 1.399-.556c.277-.277.457-.665.556-1.4c.101-.755.103-1.756.103-3.191a.75.75 0 0 1 1.5 0v.055c0 1.367 0 2.47-.116 3.337c-.122.9-.38 1.658-.982 2.26s-1.36.86-2.26.982c-.867.116-1.97.116-3.337.116h-6.11c-1.367 0-2.47 0-3.337-.116c-.9-.122-1.658-.38-2.26-.982s-.86-1.36-.981-2.26c-.117-.867-.117-1.97-.117-3.337V15a.75.75 0 0 1 .75-.75"
          opacity=".5"
        />
        <path d="M12 16.75a.75.75 0 0 0 .553-.244l4-4.375a.75.75 0 1 0-1.107-1.012l-2.696 2.95V3a.75.75 0 0 0-1.5 0v11.068l-2.696-2.95a.75.75 0 0 0-1.108 1.013l4 4.375a.75.75 0 0 0 .554.244" />
      </g>
    </svg>
  );
}
