import { AnimatePresence } from 'motion/react';
import { WelcomeComplete } from './welcome-complete';

interface OnboardingTransitionProps {
	isComplete: boolean;
	onContinue: () => void;
	children: React.ReactNode;
}

export function OnboardingTransition({
	isComplete,
	onContinue,
	children,
}: OnboardingTransitionProps) {
	return (
		<AnimatePresence mode='wait'>
			{!isComplete ? (
				<OnboardingContainer>{children}</OnboardingContainer>
			) : (
				<WelcomeComplete onContinue={onContinue} />
			)}
		</AnimatePresence>
	);
}
import { motion } from 'motion/react';

interface OnboardingContainerProps {
	children: React.ReactNode;
}

export function OnboardingContainer({ children }: OnboardingContainerProps) {
	return (
		<motion.main
			key='onboarding'
			initial={{ opacity: 1, filter: 'blur(0px)' }}
			exit={{ opacity: 0, filter: 'blur(20px)' }}
			transition={{ duration: 0.6 }}
			className='min-h-screen bg-background flex items-center justify-center px-4 border-x border-border max-w-4xl mx-auto'
		>
			{children}
		</motion.main>
	);
}
