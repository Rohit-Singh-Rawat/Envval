import { buttonVariants } from "@envval/ui/components/button";
import { cn } from "@envval/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { type MotionProps, motion } from "motion/react";
import { useId } from "react";
import { EASE_OUT } from "@/lib/animation";

const fadeInUpVariant: MotionProps = {
	initial: { opacity: 0, y: 10, filter: "blur(6px)" },
	whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
	viewport: { once: true, margin: "-100px" },
};

const getTransition = (delay: number) => ({
	duration: 0.5,
	ease: EASE_OUT,
	delay,
});

const HeroCTA = () => (
	<div className="flex flex-col items-center text-center max-w-3xl">
		<motion.h2
			className="text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-4 sm:mb-6 font-zodiak font-medium"
			{...fadeInUpVariant}
			transition={getTransition(0.2)}
		>
			Manage your environment<span className="text-primary"> secrets</span>{" "}
			securely
		</motion.h2>
		<motion.p
			className="text-muted-foreground text-base sm:text-lg md:text-xl mb-8 sm:mb-10 leading-snug font-normal text-shadow-2xs text-shadow-muted-foreground/10 text-pretty"
			{...fadeInUpVariant}
			transition={getTransition(0.3)}
		>
			We help teams sync, share, and manage environment variables across
			projects, without exposing sensitive data in your codebase.
		</motion.p>
		<motion.div
			className="flex items-center gap-3 sm:gap-4"
			{...fadeInUpVariant}
			transition={getTransition(0.4)}
		>
			<Link
				to="/signup"
				className={cn(buttonVariants({ size: "lg" }), "px-5 group")}
			>
				<span className="inline-flex items-center gap-2 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] [text-shadow:0_-2lh_currentColor] group-hover:translate-y-[2lh]">
					Try for free
				</span>
			</Link>
			<Link
				to="/login"
				className={cn(
					buttonVariants({ variant: "ghost", size: "lg" }),
					"text-muted-foreground",
				)}
			>
				Get started
			</Link>
		</motion.div>
	</div>
);

const HeroImage = () => {
	const filterId = useId();
	return (
		<motion.div
			className="w-full max-w-7xl"
			{...fadeInUpVariant}
			transition={getTransition(0.5)}
		>
			<div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-video flex items-center justify-center shadow-2xs">
				<svg
					className="absolute inset-0 w-full h-full -z-10"
					xmlns="http://www.w3.org/2000/svg"
					preserveAspectRatio="none"
					aria-hidden={true}
				>
					<defs>
						<filter id={filterId}>
							<feTurbulence
								type="fractalNoise"
								baseFrequency="0.8"
								numOctaves="4"
								stitchTiles="stitch"
							/>
							<feColorMatrix type="saturate" values="0" />
						</filter>
					</defs>
					<image
						href="/images/home/hero/hero-bg.png"
						width="100%"
						style={{ filter: "contrast(0.9) saturate(0.8)" }}
						height="100%"
						preserveAspectRatio="xMidYMid slice"
					/>
					<rect
						width="100%"
						height="100%"
						filter={`url(#${filterId})`}
						opacity="0.25"
					/>
				</svg>
				<div className="p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl bg-black/5 backdrop-blur-sm w-[93%] sm:w-[80%] mx-auto">
					<div className="relative aspect-video flex items-center justify-center rounded-xl sm:rounded-2xl overflow-hidden shadow-2xs">
						<img
							src="/images/home/hero/hero-image.png"
							alt="Envval dashboard showing environment variable management interface"
							className="w-full h-full object-cover brightness-105"
						/>
					</div>
				</div>
			</div>
		</motion.div>
	);
};

const Hero = () => (
	<section className="container max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 md:py-32">
		<div className="flex flex-col items-center gap-10 sm:gap-16">
			<HeroCTA />
			<HeroImage />
		</div>
	</section>
);

export default Hero;
