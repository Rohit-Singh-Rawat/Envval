import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@envval/ui/components/field";
import { Input } from "@envval/ui/components/input";
import { Controller, useFormContext } from "react-hook-form";
import type { OnboardingFormValues } from "./types";

export function ProfileStep() {
  const form = useFormContext<OnboardingFormValues>();

  return (
    <FieldGroup>
      <Controller
        name="firstName"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="profile-first-name">First name</FieldLabel>
            <Input
              {...field}
              id="profile-first-name"
              variant="muted"
              placeholder="Ada"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="lastName"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="profile-last-name">Last name</FieldLabel>
            <Input
              {...field}
              id="profile-last-name"
              variant="muted"
              placeholder="Lovelace"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );
}
