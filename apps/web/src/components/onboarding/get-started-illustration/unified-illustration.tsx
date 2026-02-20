'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LockIcon } from 'hugeicons-react';
import { EASE_OUT, TrafficLights, ReplayButton } from './shared';
import { StepVSCodeInner } from './step-vscode';
import { StepDashboardInner } from './step-dashboard';

type StepId = 1 | 2 | 3;

type UnifiedIllustrationProps = {
	activeStep: StepId;
};

/** Title bar text per step — steps 1-2 show VS Code title, step 3 shows browser URL bar */
const TITLE_BAR_CONFIG: Record<
	StepId,
	{ type: 'text'; label: string } | { type: 'url'; url: string }
> = {
	1: { type: 'text', label: 'Envval — Visual Studio Code' },
	2: { type: 'text', label: '.env — my-saas-app' },
	3: { type: 'url', url: 'app.envval.dev/repos/my-saas-app' },
};

/**
 * Unified illustration with a persistent window shell.
 * The outer frame (border, title bar, traffic lights) stays mounted across all steps.
 * Steps 1-2 share a VS Code layout with a persistent activity bar.
 * Step 3 renders the dashboard layout.
 */
export function UnifiedIllustration({ activeStep }: UnifiedIllustrationProps) {
	const [replayKey, setReplayKey] = useState(0);
	const [animationDone, setAnimationDone] = useState(false);

	const handleReplay = useCallback(() => {
		setAnimationDone(false);
		setReplayKey((k) => k + 1);
	}, []);

	const handleAnimationComplete = useCallback(() => {
		setAnimationDone(true);
	}, []);

	// Reset replay state when step changes
	const [prevStep, setPrevStep] = useState(activeStep);
	if (prevStep !== activeStep) {
		setPrevStep(activeStep);
		setAnimationDone(false);
	}

	const titleConfig = TITLE_BAR_CONFIG[activeStep];
	const isVSCodeStep = activeStep === 1 || activeStep === 2;

	return (
		<div className='relative w-full max-w-[570px] group'>
			{/* Persistent window frame */}
			<div className='relative overflow-hidden rounded-md bg-[hsl(var(--card))] border border-border w-full'>
				{/* Persistent title bar */}
				<div className='relative flex h-6 items-center justify-center border-b border-border bg-muted/60 px-3'>
					<TrafficLights />

					{/* Title bar content — animated swap with blur bridge */}
					<AnimatePresence mode='wait'>
						<motion.div
							key={`title-${activeStep}`}
							initial={{ opacity: 0, y: 4, filter: 'blur(4px)' }}
							animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
							exit={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
							transition={{ duration: 0.25, ease: EASE_OUT }}
							className='flex items-center'
						>
							{titleConfig.type === 'text' ? (
								<span className='text-[10px] text-muted-foreground/50 hidden sm:block'>
									{titleConfig.label}
								</span>
							) : (
								<div className='flex items-center gap-1.5 rounded-sm border border-border bg-background px-2 py-[2px] max-w-[220px]'>
									<LockIcon
										size={8}
										className='text-emerald-500 shrink-0'
										strokeWidth={2.5}
									/>
									<span className='text-[9px] text-muted-foreground/70 truncate'>
										{titleConfig.url}
									</span>
								</div>
							)}
						</motion.div>
					</AnimatePresence>

					<ReplayButton
						onClick={handleReplay}
						visible={animationDone}
					/>
				</div>

				{/* Inner content — smoother transitions with blur bridge */}
				<AnimatePresence mode='wait'>
					{isVSCodeStep ? (
						<motion.div
							key={`vscode-${activeStep}-${replayKey}`}
							initial={{ opacity: 0, filter: 'blur(6px)' }}
							animate={{ opacity: 1, filter: 'blur(0px)' }}
							exit={{ opacity: 0, filter: 'blur(6px)' }}
							transition={{
								duration: 0.35,
								ease: EASE_OUT,
								exit: { duration: 0.2 },
							}}
						>
							<StepVSCodeInner
								step={activeStep as 1 | 2}
								onComplete={handleAnimationComplete}
							/>
						</motion.div>
					) : (
						<motion.div
							key={`dashboard-${replayKey}`}
							initial={{ opacity: 0, filter: 'blur(6px)' }}
							animate={{ opacity: 1, filter: 'blur(0px)' }}
							exit={{ opacity: 0, filter: 'blur(6px)' }}
							transition={{
								duration: 0.35,
								ease: EASE_OUT,
								exit: { duration: 0.2 },
							}}
						>
							<StepDashboardInner onComplete={handleAnimationComplete} />
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
