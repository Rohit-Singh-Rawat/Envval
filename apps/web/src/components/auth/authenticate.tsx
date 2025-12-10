import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { ArrowLeft01Icon } from 'hugeicons-react';

import { useTimer } from '@/hooks/use-timer';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import EnvvalLogo from '../logo/envval';
import AuthForm from './auth-form';
import { Button } from '../ui/button';
import { authClient } from '@/lib/auth-client';

type AuthenticateProps = {
	mode?: 'login' | 'signup';
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
		<div className='space-y-6 w-full relative'>
			<div className='flex items-center justify-between'>
				<Button
					type='button'
					variant='muted'
					className='absolute left-0 top-2 group flex items-center overflow-hidden round h-9 w-9 hover:w-[72px] transition-all duration-300 ease-in-out'
					onClick={onBack}
					disabled={isResending || isVerifying}
				>
					<ArrowLeft01Icon className='absolute left-2 size-5 shrink-0' />
					<span className='absolute left-7  whitespace-nowrap opacity-0 blur-xs group-hover:blur-none ease-in-out group-hover:opacity-100 transition-opacity duration-300 text-sm'>
						Back
					</span>
				</Button>

				<div className='flex items-center gap-2 text-sm font-semibold mx-auto '>
					<EnvvalLogo className='size-12' />
				</div>

				<div
					className='w-9'
					aria-hidden
				/>
			</div>
			<div className='space-y-1 text-center'>
				<h1 className='text-center'>Enter Verification Code</h1>
				<p className='text-sm text-muted-foreground text-center'>
					Send verification code to{' '}
					<span className='text-foreground font-zodiak font-medium'>{email}</span>
				</p>
			</div>

			<div className='flex justify-center'>
				<InputOTP
					maxLength={OTP_LENGTH}
					value={otpValue}
					onChange={onOtpChange}
					inputMode='numeric'
					pattern='[0-9]*'
					autoFocus
					disabled={isVerifying || isResending}
					containerClassName='justify-center'
				>
					<InputOTPGroup>
						{Array.from({ length: OTP_LENGTH }).map((_, index) => (
							<InputOTPSlot
								key={index}
								index={index}
								aria-invalid={otpError ? 'true' : undefined}
								className='h-12 w-12 text-lg'
							/>
						))}
					</InputOTPGroup>
				</InputOTP>
			</div>

			{otpError ? <p className='text-center text-sm text-destructive'>{otpError}</p> : null}

			<div className='flex items-center justify-center gap-2 text-sm'>
				<span className='text-muted-foreground'>Didn&apos;t receive OTP?</span>
				<Button
					type='button'
					variant='link'
					size='sm'
					className='h-auto px-0'
					onClick={onResend}
					disabled={isResending || isVerifying || isCooldown}
				>
					{isCooldown ? `Resend in ${cooldownSeconds}s` : 'Resend'}
				</Button>
			</div>
		</div>
	);
}

function Authenticate({ mode = 'login' }: AuthenticateProps) {
	const isLogin = mode === 'login';
	const [step, setStep] = useState<'email' | 'otp'>('email');
	const [targetEmail, setTargetEmail] = useState('');
	const [otpValue, setOtpValue] = useState('');
	const [otpError, setOtpError] = useState<string | null>(null);
	const {
		secondsLeft: resendSeconds,
		isRunning: isResendCoolingDown,
		start: startResendCooldown,
		reset: resetResendCooldown,
	} = useTimer(30);

	const [isRequesting, setIsRequesting] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);

	const requestCode = async (email: string) => {
		setIsRequesting(true);
		try {
			const { error } = await (authClient as any).emailOtp?.sendVerificationOtp({
				email,
				type: 'sign-in',
			});

			if (error) {
				throw error;
			}

			setTargetEmail(email);
			setStep('otp');
			setOtpError(null);
			setOtpValue('');
			startResendCooldown();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to send code';
			toast.error(message);
		} finally {
			setIsRequesting(false);
		}
	};

	const verifyCode = async (code: string) => {
		if (!targetEmail) return;

		setIsVerifying(true);
		try {
			const { error } = await (authClient as any).signIn?.emailOtp({
				email: targetEmail,
				otp: code,
			});

			if (error) {
				throw error;
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Incorrect code, try again';
			setOtpError(message);
			toast.warning(message);
		} finally {
			setIsVerifying(false);
		}
	};

	const handleOtpChange = (value: string) => {
		setOtpValue(value);
		if (otpError) setOtpError(null);
		if (value.length === OTP_LENGTH && !isVerifying) {
			void verifyCode(value);
		}
	};

	const handleResend = async () => {
		if (!targetEmail || isResendCoolingDown) return;
		setOtpValue('');
		setOtpError(null);
		setIsRequesting(true);
		try {
			const { error } = await (authClient as any).emailOtp?.sendVerificationOtp({
				email: targetEmail,
				type: 'sign-in',
			});
			if (error) throw error;
			startResendCooldown();
			toast.success('Verification code resent');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to resend code';
			toast.error(message);
		} finally {
			setIsRequesting(false);
		}
	};

	return (
		<div className='flex flex-col items-center justify-center w-full max-w-md gap-6	'>
			{step === 'email' ? (
				<>
					<EnvvalLogo className='size-12' />
					<div className='md:text-left text-center space-y-1 w-full'>
						<h1>{isLogin ? 'Login' : 'Create account'}</h1>
						<p className='text-lg text-muted-foreground'>
							{isLogin ? "Welcome back, let's get you signed in." : 'Join us to get started.'}
						</p>{' '}
						<AuthForm
							mode={mode}
							isSubmitting={isRequesting}
							onSubmit={({ email }) => requestCode(email)}
						/>
					</div>
					<div className='text-sm text-muted-foreground text-center'>
						{isLogin ? (
							<span>
								Don&apos;t have an account?{' '}
								<Link
									to='/signup'
									className='hover:text-primary  hover:underline font-medium'
								>
									Sign up
								</Link>
							</span>
						) : (
							<span>
								Already have an account?{' '}
								<Link
									to='/login'
									className='hover:text-primary  hover:underline font-medium'
								>
									Log in
								</Link>
							</span>
						)}
					</div>
				</>
			) : (
				<OtpStep
					email={targetEmail}
					otpValue={otpValue}
					otpError={otpError}
					onOtpChange={handleOtpChange}
					onBack={() => {
						setStep('email');
						setOtpValue('');
						setOtpError(null);
						resetResendCooldown();
					}}
					onResend={() => handleResend()}
					isResending={isRequesting}
					isVerifying={isVerifying}
					isCooldown={isResendCoolingDown}
					cooldownSeconds={resendSeconds}
				/>
			)}
		</div>
	);
}
export default Authenticate;
