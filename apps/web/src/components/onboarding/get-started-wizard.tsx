import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { Layers01Icon, LockKeyIcon, LaptopIcon } from 'hugeicons-react';
import { StepProgress, type StepConfig } from './step-progress';
import { Button } from '@envval/ui/components/button';
import { cn } from '@/lib/utils';
import { useRouter } from '@tanstack/react-router';

import { type Project as Repo } from '@/hooks/repos/use-get-repos';

type GetStartedWizardProps = {
	repos: Repo[];
	userName?: string | null;
	onHide?: () => void;
};

type StepId = 1 | 2 | 3;

type CompletedState = {
	1: boolean;
	2: boolean;
	3: boolean;
};

const VIEWED_ENV_STORAGE_KEY = 'envval_hasViewedEnv';
const HIDE_WIZARD_STORAGE_KEY = 'envval_hideGetStartedWizard';

export function shouldShowGetStartedWizard(repos: Repo[]): boolean {
	// if user explicitly hid the wizard, respect that
	if (typeof window !== 'undefined') {
		const hide = window.localStorage.getItem(HIDE_WIZARD_STORAGE_KEY);
		if (hide === 'true') return false;
	}

	// Show the Get Started wizard only as an empty state when there are no repos yet
	return repos.length === 0;
}

export function markEnvViewedInBrowser() {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(VIEWED_ENV_STORAGE_KEY, 'true');
}

export function GetStartedWizard({ repos, userName, onHide }: GetStartedWizardProps) {
	const router = useRouter();

	const hasRepos = repos.length > 0;
	const hasSecuredRepo = repos.some((r) => r.environments > 0);

	const [activeStep, setActiveStep] = useState<StepId>(1);
	const [completedSteps, setCompletedSteps] = useState<CompletedState>({
		1: false,
		2: false,
		3: false,
	});

	const [isAnimating, setIsAnimating] = useState(false);

	const hasViewedEnv =
		typeof window !== 'undefined' && window.localStorage.getItem(VIEWED_ENV_STORAGE_KEY) === 'true';

	useEffect(() => {
		setCompletedSteps((prev) => {
			const next: CompletedState = { ...prev };
			if (hasRepos) next[1] = true;
			if (hasSecuredRepo) next[2] = true;
			if (hasViewedEnv) next[3] = true;
			return next;
		});
	}, [hasRepos, hasSecuredRepo, hasViewedEnv]);

	useEffect(() => {
		if (isAnimating) return;

		const allDone = completedSteps[1] && completedSteps[2] && completedSteps[3];
		if (allDone) {
			return;
		}

		let target: StepId | null = null;
		if (completedSteps[1] && !completedSteps[2]) target = 2;
		else if (completedSteps[1] && completedSteps[2] && !completedSteps[3]) target = 3;

		if (target && target !== activeStep) {
			setIsAnimating(true);
			const timeout = setTimeout(() => {
				setActiveStep(target as StepId);
				setIsAnimating(false);
			}, 700);
			return () => clearTimeout(timeout);
		}
	}, [completedSteps, activeStep, isAnimating]);

	const steps: StepConfig[] = useMemo(
		() => [
			{
				id: 1,
				label: 'Connect editor',
				icon: Layers01Icon as ComponentType<SVGProps<SVGSVGElement>>,
			},
			{
				id: 2,
				label: 'Secure repo',
				icon: LockKeyIcon as ComponentType<SVGProps<SVGSVGElement>>,
			},
			{
				id: 3,
				label: 'View env',
				icon: LaptopIcon as ComponentType<SVGProps<SVGSVGElement>>,
			},
		],
		[]
	);

	const handleHide = () => {
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(HIDE_WIZARD_STORAGE_KEY, 'true');
		}
		onHide?.();
	};

	const handleManualAdvance = () => {
		if (activeStep < 3) {
			setCompletedSteps((prev) => ({
				...prev,
				[activeStep]: true,
			}));
			setIsAnimating(true);
			const nextStep = (activeStep + 1) as StepId;
			setTimeout(() => {
				setActiveStep(nextStep);
				setIsAnimating(false);
			}, 700);
		}
	};

	const firstSecuredRepo = repos.find((r) => r.environments > 0);

	const openEnvs = () => {
		if (!firstSecuredRepo?.id) return;
		markEnvViewedInBrowser();
		router.navigate({
			to: '/dashboard',
			search: {
				repoId: firstSecuredRepo.id,
			},
		});
	};

	const greeting = userName ? `Hey ${userName}, let's get started` : "Let's get you set up";

	return (
		<section className='mb-6 rounded-2xl border border-border bg-muted/40 px-5 py-4 flex flex-col gap-4'>
			<div className='flex items-start justify-between gap-4'>
				<div className='flex flex-col gap-1'>
					<h2 className='text-sm font-semibold tracking-tight'>{greeting}</h2>
					<p className='text-xs text-muted-foreground'>
						Follow these three quick steps to connect your editor, secure a repo, and verify your
						.env in the dashboard.
					</p>
				</div>
				<Button
					variant='ghost'
					size='icon'
					className='h-7 w-7 text-muted-foreground'
					onClick={handleHide}
				>
					<span className='sr-only'>Hide onboarding</span>
					<span aria-hidden>✕</span>
				</Button>
			</div>

			<StepProgress
				steps={steps}
				currentStep={activeStep}
				className='mt-1'
			/>

			<div className='mt-4'>
				{activeStep === 1 && (
					<StepConnectEditor
						hasRepos={hasRepos}
						onManualAdvance={handleManualAdvance}
					/>
				)}
				{activeStep === 2 && (
					<StepSecureRepo
						hasRepos={hasRepos}
						hasSecuredRepo={hasSecuredRepo}
						onManualAdvance={handleManualAdvance}
					/>
				)}
				{activeStep === 3 && (
					<StepViewEnv
						hasSecuredRepo={hasSecuredRepo}
						onOpenEnvs={openEnvs}
					/>
				)}
			</div>
		</section>
	);
}

type StepConnectEditorProps = {
	hasRepos: boolean;
	onManualAdvance: () => void;
};

function StepConnectEditor({ hasRepos, onManualAdvance }: StepConnectEditorProps) {
	return (
		<div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
			<div className='space-y-1.5'>
				<h3 className='text-sm font-semibold'>Step 1 — Connect your editor</h3>
				<p className='text-xs text-muted-foreground max-w-md'>
					Install the EnvVault VS Code extension and sign in with this account. Once your editor is
					connected and a repo shows up, we&apos;ll move you to the next step automatically.
				</p>
				<div className='flex items-center gap-2'>
					<Button
						size='sm'
						onClick={() => {
							window.open(
								'https://marketplace.visualstudio.com/items?itemName=envval.envval',
								'_blank',
								'noopener,noreferrer'
							);
						}}
					>
						Install VS Code extension
					</Button>
					<Button
						size='sm'
						variant='outline'
						onClick={onManualAdvance}
					>
						I&apos;ve installed it
					</Button>
				</div>
				{!hasRepos && (
					<p className='text-[11px] text-muted-foreground'>
						No projects detected yet. Open a project folder in VS Code with the extension enabled.
					</p>
				)}
				{hasRepos && (
					<p className='text-[11px] text-emerald-600'>
						Editor connected. We can see at least one project from your machine.
					</p>
				)}
			</div>
			<div className={cn('mt-4 md:mt-0 w-full md:w-auto')}>
				<div className='h-28 w-full md:w-64 rounded-xl border border-dashed border-border bg-background flex items-center justify-center text-[11px] text-muted-foreground'>
					Editor illustration placeholder
				</div>
			</div>
		</div>
	);
}

type StepSecureRepoProps = {
	hasRepos: boolean;
	hasSecuredRepo: boolean;
	onManualAdvance: () => void;
};

function StepSecureRepo({ hasRepos, hasSecuredRepo, onManualAdvance }: StepSecureRepoProps) {
	const text = !hasRepos
		? 'Open a project in VS Code. EnvVault will detect it automatically.'
		: !hasSecuredRepo
			? 'We see your repo. Initialize your .env from the extension prompt to secure it.'
			: "Nice, you've secured at least one .env.";

	return (
		<div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
			<div className='space-y-1.5'>
				<h3 className='text-sm font-semibold'>Step 2 — Secure your first repo</h3>
				<p className='text-xs text-muted-foreground max-w-md'>{text}</p>
				<div className='flex items-center gap-2'>
					{!hasRepos && (
						<Button
							size='sm'
							variant='outline'
							onClick={() => {
								window.open(
									'https://docs.envval.com/get-started/open-project',
									'_blank',
									'noopener,noreferrer'
								);
							}}
						>
							Open project in VS Code
						</Button>
					)}
					{hasRepos && !hasSecuredRepo && (
						<>
							<Button
								size='sm'
								variant='outline'
								onClick={() => {
									window.open(
										'https://docs.envval.com/get-started/secure-repo',
										'_blank',
										'noopener,noreferrer'
									);
								}}
							>
								See detected repos
							</Button>
							<Button
								size='sm'
								variant='outline'
								onClick={onManualAdvance}
							>
								I&apos;ve secured it
							</Button>
						</>
					)}
					{hasSecuredRepo && (
						<Button
							size='sm'
							variant='default'
						>
							You&apos;re good here
						</Button>
					)}
				</div>
				{hasRepos && !hasSecuredRepo && (
					<p className='text-[11px] text-muted-foreground'>
						Initialize your .env from the EnvVault extension banner to lock it down.
					</p>
				)}
				{hasSecuredRepo && (
					<p className='text-[11px] text-emerald-600'>
						We can see at least one secured environment for your project.
					</p>
				)}
			</div>
			<div className='mt-4 md:mt-0 w-full md:w-auto'>
				<div className='h-28 w-full md:w-64 rounded-xl border border-dashed border-border bg-background flex items-center justify-center text-[11px] text-muted-foreground'>
					Repo lock illustration placeholder
				</div>
			</div>
		</div>
	);
}

type StepViewEnvProps = {
	hasSecuredRepo: boolean;
	onOpenEnvs: () => void;
};

function StepViewEnv({ hasSecuredRepo, onOpenEnvs }: StepViewEnvProps) {
	return (
		<div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
			<div className='space-y-1.5'>
				<h3 className='text-sm font-semibold'>Step 3 — View your env in the dashboard</h3>
				<p className='text-xs text-muted-foreground max-w-md'>
					Open your .env from the web to verify everything is wired correctly. We decrypt only in
					your browser – the server never sees plaintext secrets.
				</p>
				<div className='flex items-center gap-2'>
					<Button
						size='sm'
						onClick={onOpenEnvs}
						disabled={!hasSecuredRepo}
					>
						Open envs
					</Button>
				</div>
				{!hasSecuredRepo && (
					<p className='text-[11px] text-muted-foreground'>
						Secure at least one repo first to unlock env viewing in the dashboard.
					</p>
				)}
			</div>
			<div className='mt-4 md:mt-0 w-full md:w-auto'>
				<div className='h-28 w-full md:w-64 rounded-xl border border-dashed border-border bg-background flex items-center justify-center text-[11px] text-muted-foreground'>
					Dashboard env illustration placeholder
				</div>
			</div>
		</div>
	);
}
