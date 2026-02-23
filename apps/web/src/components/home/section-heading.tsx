import { motion } from "motion/react";
import { EASE_OUT } from "@/lib/animation";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
	label: string;
	heading: string;
	text: string;
	align?: "center" | "left";
	className?: string;
};

const SectionHeading = ({
	label,
	heading,
	text,
	align = "center",
	className,
}: SectionHeadingProps) => (
	<motion.div
		className={cn(
			"flex flex-col max-w-2xl mb-10 sm:mb-14 md:mb-20",
			align === "center"
				? "items-center text-center mx-auto"
				: "items-start text-left",
			className,
		)}
		initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
		whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
		viewport={{ once: true, margin: "-100px" }}
		transition={{ duration: 0.5, ease: EASE_OUT }}
	>
		<span className="text-xs font-medium tracking-widest uppercase text-primary mb-3">
			{label}
		</span>
		<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-[1.1] font-zodiak font-medium mb-3 sm:mb-4">
			{heading}
		</h2>
		<p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed text-shadow-2xs text-shadow-muted-foreground/10">
			{text}
		</p>
	</motion.div>
);

export default SectionHeading;
