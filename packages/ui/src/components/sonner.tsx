"use client";

import { InformationCircleIcon } from "hugeicons-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { Spinner } from "@envval/ui/components/icons/spinner";
import { Check } from "@envval/ui/components/icons/animated/check";
import { AlertCircle } from "@envval/ui/components/icons/animated/alert";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={"light"}
      className="toaster group w-full flex items-center justify-center"
      icons={{
        success: <Check className="size-4" />,
        info: <InformationCircleIcon className="size-4" />,
        warning: <AlertCircle className="size-4" />,
        error: <AlertCircle className="size-4" />,
        loading: <Spinner className="size-4 " />,
      }}
      style={
        {
          "--normal-bg": "#000000",
          "--success-bg": "#000000",
          "--normal-text": "#ffffff",
          "--normal-border": "#000000",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
