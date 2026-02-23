import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";

export type StepConfig = {
	id: number;
	label: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
};

type StepProgressProps = {
	steps: StepConfig[];
	currentStep: number;
	className?: string;
};

export function StepProgress({
	steps,
	currentStep,
	className,
}: StepProgressProps) {
	return (
		<div className={cn("flex items-center justify-center gap-4", className)}>
			{steps.map((s, idx) => {
				const active = currentStep === s.id;
				const done = currentStep > s.id;
				const Icon = s.icon;
				const nextStepDone = currentStep > s.id + 1 || currentStep === s.id + 1;
				return (
					<div key={s.id} className="flex items-center gap-3">
						<div className="relative flex flex-col items-center">
							<div
								className={cn(
									"flex items-center justify-center size-10 rounded-full transition-colors",
									active && "text-primary",
									done && "text-green-600",
									!active && !done && "text-muted-foreground",
								)}
							>
								<Icon className="size-5" />
							</div>
							<span
								className={cn(
									"absolute top-full mt-1 text-xs whitespace-nowrap transition-colors",
									active
										? "text-foreground font-medium"
										: "text-muted-foreground",
								)}
							>
								{s.label}
							</span>
						</div>
						{idx < steps.length - 1 && (
							<div className="w-24 h-0.5 rounded-full bg-muted overflow-hidden">
								<div
									className={cn(
										"h-full bg-primary transition-all duration-500 ease-out",
										nextStepDone || done ? "w-full" : "w-0",
									)}
								/>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
