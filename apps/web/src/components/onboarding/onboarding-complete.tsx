import { ArrowRight01Icon } from "hugeicons-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";

interface OnboardingCompleteProps {
	onContinue: () => void;
}

export function OnboardingComplete({ onContinue }: OnboardingCompleteProps) {
	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		const audio = new Audio("/sounds/intro.mp3");
		audioRef.current = audio;
		audio.volume = 0.5;
		audio.play().catch(() => {});
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current.currentTime = 0;
				audioRef.current = null;
			}
		};
	}, []);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.8 }}
			className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden"
		>
			<div className="relative z-10 text-center">
				<motion.h2
					initial={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
					animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
					transition={{ duration: 1, delay: 0.2 }}
					className="text-7xl md:text-9xl font-bold"
					style={{
						background:
							"linear-gradient(to top, #FFFFFF 0%, #ECECEC 50%, #E0E0E0 100%)",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
						backgroundClip: "text",
					}}
				>
					Welcome
				</motion.h2>
				<motion.p
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 1.4 }}
					className="mt-4 text-lg text-muted-foreground"
				>
					Onboarding complete. Ready to go.
				</motion.p>
			</div>

			<div className="relative z-10 mt-12">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.4, delay: 2.5 }}
				>
					<motion.button
						type="button"
						onClick={onContinue}
						className="overflow-hidden rounded-full active:scale-95 transition-all duration-200 ease-in-out py-3 bg-muted hover:bg-muted/80 flex items-center justify-center relative"
						initial={{ width: 48 }}
						animate={{ width: 230 }}
						transition={{ duration: 0.4, delay: 2.8, ease: "easeOut" }}
						aria-label="Continue to dashboard"
					>
						<motion.span
							initial={{ opacity: 0, filter: "blur(3px)" }}
							animate={{ opacity: 1, filter: "blur(0px)" }}
							transition={{ duration: 0.4, delay: 3.2, ease: "easeOut" }}
							className="whitespace-nowrap mr-2"
						>
							Continue to Dashboard
						</motion.span>
						<motion.span
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.3, delay: 0 }}
							className="absolute right-3.5"
						>
							<ArrowRight01Icon className="size-5 shrink-0" aria-hidden />
						</motion.span>
					</motion.button>
				</motion.div>
			</div>
		</motion.div>
	);
}
