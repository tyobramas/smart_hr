"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends ButtonProps {
  loadingText?: string;
}

export function SubmitButton({
  children,
  loadingText = "Menyimpan...",
  className,
  variant = "primary",
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending || disabled}
      className={className}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
