import { Button } from "@envval/ui/components/button";
import { Spinner } from "@envval/ui/components/icons/spinner";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@envval/ui/components/input-otp";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft01Icon } from "hugeicons-react";
import { useState } from "react";
import { useDeviceKeyMaterialRegistration } from "@/hooks/auth/use-device-key-material-registration";
import { useTimer } from "@/hooks/use-timer";
import { authClient } from "@/lib/auth-client";
import { normalizeClientError } from "@/lib/error";
import { toast, toastKeyMaterialSync } from "@/lib/toast";
import EnvvalLogo from "../logo/envval";
import AuthForm from "./auth-form";

type AuthenticateProps = {
	mode?: "login" | "signup";
};

const OTP_LENGTH = 6;

type OtpStepProps = {
	email: string;
	otpValue: string;
	otpError?: string | null;
	onOtpChange: (value: string) => void;
	onBack: () => void;
	onResend: () => void;
	isResending: boolean;
	isVerifying: boolean;
	isCooldown: boolean;
	cooldownSeconds: number;
};

function OtpStep({
	email,
	otpValue,
	otpError,
	onOtpChange,
	onBack,
	onResend,
	isResending,
	isVerifying,
	isCooldown,
	cooldownSeconds,
}: OtpStepProps) {
	return (
		<div className="space-y-6 w-full relative">
			<div className="flex items-center justify-between">
				<Button
					type="button"
					variant="muted"
					className="absolute left-0 top-0 group flex items-center overflow-hidden round h-9 w-9 hover:w-[72px] transition-all duration-300 ease-in-out"
					onClick={onBack}
					disabled={isResending || isVerifying}
				>
					<ArrowLeft01Icon className="absolute left-2 size-5 shrink-0" />
					<span className="absolute left-7  whitespace-nowrap opacity-0 blur-xs group-hover:blur-none ease-in-out group-hover:opacity-100 transition-opacity duration-300 text-sm">
						Back
					</span>
				</Button>

				<div className="flex items-center gap-2 text-sm font-semibold mx-auto ">
					<EnvvalLogo className="size-12" />
				</div>

				<div className="w-9" aria-hidden />
			</div>
			<div className="space-y-1 text-center">
				<h1 className="text-center">Enter Verification Code</h1>
				<p className="text-sm text-muted-foreground text-center">
					We sent a verification code to{" "}
					<span className="text-foreground font-zodiak font-medium">
						{email}
					</span>
				</p>
			</div>

			<div className="flex justify-center items-center gap-4">
				<InputOTP
					maxLength={OTP_LENGTH}
					value={otpValue}
					onChange={onOtpChange}
					inputMode="numeric"
					pattern="[0-9]*"
					autoFocus
					disabled={isVerifying || isResending}
					containerClassName="justify-center"
				>
					<InputOTPGroup>
						{Array.from({ length: OTP_LENGTH }).map((_, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: OTP slots are positional — fixed length, never reordered
							<InputOTPSlot
								key={index}
								index={index}
								aria-invalid={otpError ? "true" : undefined}
								className="h-12 w-12 text-lg"
							/>
						))}
					</InputOTPGroup>
				</InputOTP>
				{isVerifying && (
					<Spinner className="absolute right-0 size-5 text-muted-foreground" />
				)}
			</div>

			{otpError ? (
				<p className="text-center text-sm text-destructive">{otpError}</p>
			) : null}

			<div className="flex items-center justify-center gap-2 text-sm">
				<span className="text-muted-foreground">Didn&apos;t receive OTP?</span>
				<Button
					type="button"
					variant="link"
					size="sm"
					className="h-auto px-0"
					onClick={onResend}
					disabled={isResending || isVerifying || isCooldown}
				>
					{isCooldown ? `Resend in ${cooldownSeconds}s` : "Resend"}
				</Button>
			</div>
		</div>
	);
}

type OtpState = {
	value: string;
	error: string | null;
	targetEmail: string;
};

const initialOtpState: OtpState = {
	value: "",
	error: null,
	targetEmail: "",
};

function Authenticate({ mode = "login" }: AuthenticateProps) {
	const isLogin = mode === "login";
	const navigate = useNavigate();
	const search = useSearch({ strict: false }) as { redirectUrl?: string };
	const [step, setStep] = useState<"email" | "otp">("email");
	const [otpState, setOtpState] = useState<OtpState>(initialOtpState);
	const {
		secondsLeft: resendSeconds,
		isRunning: isResendCoolingDown,
		start: startResendCooldown,
		reset: resetResendCooldown,
	} = useTimer(30);

	const { registerDeviceAndFetchKeyMaterial } =
		useDeviceKeyMaterialRegistration();

	const requestCodeMutation = useMutation({
		mutationFn: async (email: string) => {
			const { error } = await authClient.emailOtp.sendVerificationOtp({
				email,
				type: "sign-in",
			});
			if (error) throw error;
			return email;
		},
		onSuccess: (email) => {
			setOtpState({ value: "", error: null, targetEmail: email });
			setStep("otp");
			startResendCooldown();
		},
		onError: (error) => {
			const { message, kind } = normalizeClientError(
				error,
				"Failed to send code",
			);
			const showToast = kind === "rate_limit" ? toast.warning : toast.error;
			showToast(message);
		},
	});

	const verifyCodeMutation = useMutation({
		mutationFn: async (code: string) => {
			const { error } = await authClient.signIn.emailOtp({
				email: otpState.targetEmail,
				otp: code,
			});
			if (error) throw error;
		},
		onSuccess: async () => {
			toastKeyMaterialSync(registerDeviceAndFetchKeyMaterial()).catch(() => {});

			if (mode === "signup") {
				navigate({
					to: "/onboarding",
					...(search.redirectUrl && {
						search: { redirectUrl: search.redirectUrl },
					}),
				});
			} else if (search.redirectUrl) {
				navigate({ to: search.redirectUrl });
			} else {
				navigate({ to: "/dashboard" });
			}
		},
		onError: (error) => {
			const { message, kind } = normalizeClientError(
				error,
				"Incorrect code, try again",
			);
			// For rate limit errors, avoid marking the input as "incorrect code"
			if (kind === "rate_limit") {
				setOtpState((prev) => ({ ...prev, error: null }));
				toast.warning(message);
				return;
			}

			setOtpState((prev) => ({ ...prev, error: message }));
			toast.warning(message);
		},
	});

	const resendCodeMutation = useMutation({
		mutationFn: async () => {
			const { error } = await authClient.emailOtp.sendVerificationOtp({
				email: otpState.targetEmail,
				type: "sign-in",
			});
			if (error) throw error;
		},
		onSuccess: () => {
			setOtpState((prev) => ({ ...prev, value: "", error: null }));
			startResendCooldown();
			toast.success("Verification code resent");
		},
		onError: (error) => {
			const { message, kind } = normalizeClientError(
				error,
				"Failed to resend code",
			);
			const showToast = kind === "rate_limit" ? toast.warning : toast.error;
			showToast(message);
		},
	});

	const handleOtpChange = (value: string) => {
		setOtpState((prev) => ({
			...prev,
			value,
			error: prev.error ? null : prev.error,
		}));
		if (value.length === OTP_LENGTH && !verifyCodeMutation.isPending) {
			verifyCodeMutation.mutate(value);
		}
	};

	const handleResend = () => {
		if (!otpState.targetEmail || isResendCoolingDown) return;
		resendCodeMutation.mutate();
	};

	return (
		<div className="flex flex-col items-center justify-center w-full max-w-md gap-6	">
			{step === "email" ? (
				<>
					<EnvvalLogo className="size-12" />
					<div className="md:text-left text-center space-y-1 w-full">
						<h1>{isLogin ? "Login" : "Create account"}</h1>
						<p className="text-lg text-muted-foreground">
							{isLogin
								? "Welcome back, let's get you signed in."
								: "Join us to get started."}
						</p>{" "}
						<AuthForm
							mode={mode}
							isSubmitting={requestCodeMutation.isPending}
							onSubmit={({ email }) => requestCodeMutation.mutate(email)}
						/>
					</div>
					<div className="text-sm text-muted-foreground text-center">
						{isLogin ? (
							<span>
								Don&apos;t have an account?{" "}
								<Link
									to="/signup"
									className="hover:text-primary  hover:underline font-medium"
								>
									Sign up
								</Link>
							</span>
						) : (
							<span>
								Already have an account?{" "}
								<Link
									to="/login"
									className="hover:text-primary  hover:underline font-medium"
								>
									Log in
								</Link>
							</span>
						)}
					</div>
				</>
			) : (
				<OtpStep
					email={otpState.targetEmail}
					otpValue={otpState.value}
					otpError={otpState.error}
					onOtpChange={handleOtpChange}
					onBack={() => {
						setStep("email");
						setOtpState(initialOtpState);
						resetResendCooldown();
					}}
					onResend={handleResend}
					isResending={resendCodeMutation.isPending}
					isVerifying={verifyCodeMutation.isPending}
					isCooldown={isResendCoolingDown}
					cooldownSeconds={resendSeconds}
				/>
			)}
		</div>
	);
}
export default Authenticate;
