import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import {
  type OnboardingFormValues,
  onboardingSchema,
} from "@/components/onboarding/types";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { normalizeClientError } from "@/lib/error";
import { toast } from "@/lib/toast";

export type UseOnboardingOptions = {
  totalSteps: number;
};

/** Fields to validate per step (used for Next button and onInvalid). */
const STEP_FIELDS: Record<number, (keyof OnboardingFormValues)[]> = {
  1: ["firstName"],
  2: ["source", "medium"],
};

export function useOnboarding({ totalSteps }: UseOnboardingOptions) {
  const [step, setStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const { data: session } = useSession();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      source: undefined,
      medium: undefined,
      details: "",
    },
  });

  useEffect(() => {
    if (!session?.user?.name || form.getValues("firstName")) return;
    const nameParts = session.user.name.split(" ");
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") ?? "";
    if (firstName) form.setValue("firstName", firstName);
    if (lastName) form.setValue("lastName", lastName);
  }, [session?.user?.name, form]);

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingFormValues) => {
      const payload = {
        name: data.firstName,
        ...(data.lastName && { lastName: data.lastName }),
        source: data.source || null,
        medium: data.medium || null,
        details: data.details || null,
      };
      const response = await apiClient.onboarding.$post({ json: payload });
      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Failed to complete onboarding" }));
        throw new Error(
          (error as { message: string }).message ??
            "Failed to complete onboarding",
        );
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Onboarding completed successfully!");
      setIsComplete(true);
    },
    onError: (error) => {
      const { message, kind } = normalizeClientError(
        error,
        "Failed to complete onboarding",
      );
      const showToast = kind === "rate_limit" ? toast.warning : toast.error;
      showToast(message);
    },
  });

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    if (step === 1) return form.trigger("firstName");
    if (step === 2) {
      const values = form.getValues();
      if (!values.source) {
        form.setError("source", {
          type: "required",
          message: "Please select where you heard about us",
        });
      }
      if (!values.medium) {
        form.setError("medium", {
          type: "required",
          message: "Please select how you found us",
        });
      }
      if (!values.source || !values.medium) return false;
      return form.trigger(["source", "medium"]);
    }
    return true;
  }, [step, form]);

  const goNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (isValid && step < totalSteps) setStep((s) => s + 1);
  }, [step, totalSteps, validateCurrentStep]);

  const goBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const onSubmit = useCallback(
    async (data: OnboardingFormValues) => {
      if (step !== totalSteps) return;
      // Step 2 fields are optional in schema for step 1; require them before submitting.
      if (totalSteps >= 2 && (!data.source || !data.medium)) {
        if (!data.source) {
          form.setError("source", {
            type: "required",
            message: "Please select where you heard about us",
          });
        }
        if (!data.medium) {
          form.setError("medium", {
            type: "required",
            message: "Please select how you found us",
          });
        }
        toast.error("Please fill in how you heard about us before finishing.");
        return;
      }
      await onboardingMutation.mutateAsync(data);
    },
    [step, totalSteps, form, onboardingMutation],
  );

  const onInvalid = useCallback(
    (errors: FieldErrors<OnboardingFormValues>) => {
      const fields = STEP_FIELDS[step];
      if (!fields) return;
      const hasError = fields.some((f) => errors[f]);
      if (!hasError) return;
      if (step === 1)
        toast.error("Please fill in your first name before continuing.");
      if (step === 2)
        toast.error("Please fill in how you heard about us before finishing.");
    },
    [step],
  );

  return {
    step,
    isComplete,
    form,
    goNext,
    goBack,
    onSubmit,
    onInvalid,
    isSubmitting: onboardingMutation.isPending,
  };
}
