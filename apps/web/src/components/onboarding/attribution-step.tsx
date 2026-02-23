import { Field, FieldError, FieldLabel } from "@envval/ui/components/field";
import { Input } from "@envval/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@envval/ui/components/select";
import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
	ATTRIBUTION_MEDIUM_OPTIONS,
	ATTRIBUTION_SOURCE_OPTIONS,
} from "@/config/attribution";
import type { OnboardingFormValues } from "./types";

export function AttributionStep() {
	const form = useFormContext<OnboardingFormValues>();
	const detailsId = useId();

	return (
		<div className="space-y-4">
			<Controller
				name="source"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor="attribution-source">
							Where did you hear about us?
						</FieldLabel>
						<Select
							onValueChange={field.onChange}
							value={field.value || undefined}
							aria-invalid={fieldState.invalid}
						>
							<SelectTrigger variant="muted">
								<SelectValue>
									{field.value
										? ATTRIBUTION_SOURCE_OPTIONS.find(
												(opt) => opt.value === field.value,
											)?.label
										: "Select where you heard about us"}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{ATTRIBUTION_SOURCE_OPTIONS.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>

			<Controller
				name="medium"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor="attribution-medium">
							How did you find us?
						</FieldLabel>
						<Select
							onValueChange={field.onChange}
							value={field.value || undefined}
							aria-invalid={fieldState.invalid}
						>
							<SelectTrigger variant="muted">
								<SelectValue>
									{field.value
										? ATTRIBUTION_MEDIUM_OPTIONS.find(
												(opt) => opt.value === field.value,
											)?.label
										: "Select how you found us"}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{ATTRIBUTION_MEDIUM_OPTIONS.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>

			<Controller
				name="details"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor={detailsId}>
							Anything else you'd like to share?{" "}
							<span className="text-muted-foreground font-normal">
								(optional)
							</span>
						</FieldLabel>
						<Input
							{...field}
							id={detailsId}
							variant="muted"
							placeholder="e.g., specific blog post, tweet, etc."
							aria-invalid={fieldState.invalid}
						/>
					</Field>
				)}
			/>
		</div>
	);
}
