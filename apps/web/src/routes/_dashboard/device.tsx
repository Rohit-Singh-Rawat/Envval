import { Button } from "@envval/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import type { SVGProps } from "react";
import { useState } from "react";
import { object, string } from "zod";
import { authClient } from "@/lib/auth-client";
import { normalizeClientError } from "@/lib/error";
import { toast } from "@/lib/toast";

const EASE_OUT = [0.32, 0.72, 0, 1] as const;

const containerVariants = (reduce: boolean | null) => ({
  hidden: { opacity: 0, filter: reduce ? "blur(0px)" : "blur(6px)" },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: reduce ? 0.01 : 0.28,
      ease: EASE_OUT,
      staggerChildren: reduce ? 0 : 0.06,
      delayChildren: reduce ? 0 : 0.05,
    },
  },
});

const itemVariants = (reduce: boolean | null) => ({
  hidden: { opacity: 0, y: reduce ? 0 : 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: reduce ? 0.01 : 0.22, ease: EASE_OUT },
  },
});

/** LineMd confirm check — circle draws then check (SVG animate) */
function LineMdConfirm(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeDasharray="24"
        strokeDashoffset="24"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 11l6 6l10 -10"
      >
        <animate
          fill="freeze"
          attributeName="stroke-dashoffset"
          dur="0.4s"
          values="24;0"
        />
      </path>
    </svg>
  );
}

/** LineMd cancel twotone — circle draws, fill fades in, then X draws (SVG animate) */
function LineMdCancelTwotone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path
          fill="currentColor"
          fillOpacity="0"
          strokeDasharray="64"
          strokeDashoffset="64"
          d="M5.64 5.64c3.51 -3.51 9.21 -3.51 12.73 0c3.51 3.51 3.51 9.21 0 12.73c-3.51 3.51 -9.21 3.51 -12.73 0c-3.51 -3.51 -3.51 -9.21 -0 -12.73Z"
        >
          <animate
            fill="freeze"
            attributeName="fill-opacity"
            begin="0.8s"
            dur="0.15s"
            values="0;0.3"
          />
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            dur="0.6s"
            values="64;0"
          />
        </path>
        <path strokeDasharray="20" strokeDashoffset="20" d="M6 6l12 12">
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            begin="0.6s"
            dur="0.2s"
            values="20;0"
          />
        </path>
      </g>
    </svg>
  );
}

function ResultSuccessScene() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={containerVariants(reduce)}
      initial="hidden"
      animate="show"
      className="flex max-w-md flex-col items-center text-center"
    >
      <motion.div
        variants={itemVariants(reduce)}
        className="flex size-20 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400"
      >
        <LineMdConfirm className="size-12" />
      </motion.div>
      <motion.h2
        variants={itemVariants(reduce)}
        className="mt-6 text-xl font-semibold tracking-tight text-foreground"
      >
        Device approved
      </motion.h2>
      <motion.p
        variants={itemVariants(reduce)}
        className="mt-2 text-sm text-muted-foreground"
      >
        You can close this window and return to VS Code.
      </motion.p>
    </motion.div>
  );
}

function ResultDeniedScene() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={containerVariants(reduce)}
      initial="hidden"
      animate="show"
      className="flex max-w-md flex-col items-center text-center"
    >
      <motion.div
        variants={itemVariants(reduce)}
        className="flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive"
      >
        <LineMdCancelTwotone className="size-12" />
      </motion.div>
      <motion.h2
        variants={itemVariants(reduce)}
        className="mt-6 text-xl font-semibold tracking-tight text-foreground"
      >
        Device denied
      </motion.h2>
      <motion.p
        variants={itemVariants(reduce)}
        className="mt-2 text-sm text-muted-foreground"
      >
        The authorization request was denied.
      </motion.p>
    </motion.div>
  );
}

const DeviceSearchSchema = object({
  user_code: string().optional(),
});

export const Route = createFileRoute("/_dashboard/device")({
  component: RouteComponent,
  validateSearch: DeviceSearchSchema,
});

function DeviceAuthorizationContent({ userCode }: { userCode: string }) {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<"approved" | "denied" | null>(null);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await authClient.device.approve({ userCode });
      setResult("approved");
    } catch (error) {
      const { message, kind } = normalizeClientError(
        error,
        "Failed to approve device",
      );
      const showToast = kind === "rate_limit" ? toast.warning : toast.error;
      showToast(message);
    }
    setProcessing(false);
  };

  const handleDeny = async () => {
    setProcessing(true);
    try {
      await authClient.device.deny({ userCode });
      setResult("denied");
    } catch (error) {
      const { message, kind } = normalizeClientError(
        error,
        "Failed to deny device",
      );
      const showToast = kind === "rate_limit" ? toast.warning : toast.error;
      showToast(message);
    }
    setProcessing(false);
  };

  if (result) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        {result === "approved" ? <ResultSuccessScene /> : <ResultDeniedScene />}
      </div>
    );
  }

  return (
    <div className=" flex items-center justify-center">
      <div className="max-w-md w-full p-6">
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold">Authorize Device</h2>
          <p className="text-sm text-muted-foreground">
            A device is requesting access to your EnvVal account.
          </p>
        </div>
        <div className="space-y-6">
          <div className="p-4 text-center">
            <div className="text-sm text-muted-foreground">Device Code</div>
            <div className="text-xl font-mono">{userCode}</div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleDeny}
              disabled={processing}
              className="flex-1"
            >
              Deny
            </Button>
            <Button
              onClick={handleApprove}
              disabled={processing}
              className="flex-1"
            >
              {processing ? "Approving..." : "Approve"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  const { user_code: userCode } = Route.useSearch();

  if (!userCode) {
    return (
      <div className=" flex items-center justify-center">
        <div className="max-w-md w-full p-6 text-center">
          <h2 className="text-lg font-semibold">Missing Device Code</h2>
          <p className="text-sm text-muted-foreground">
            No device code was provided in the URL.
          </p>
        </div>
      </div>
    );
  }

  return <DeviceAuthorizationContent userCode={userCode} />;
}
