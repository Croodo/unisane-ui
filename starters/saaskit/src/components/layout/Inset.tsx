import React from "react";
import { cn } from "@unisane/ui/lib/utils";

type InsetVariant = "narrow" | "default" | "wide";

export function Inset({
  variant = "default",
  children,
  className,
}: {
  variant?: InsetVariant;
  children: React.ReactNode;
  className?: string;
}) {
  const maxW =
    variant === "narrow"
      ? "max-w-2xl"
      : variant === "wide"
        ? "max-w-screen-xl"
        : "container";
  return (
    <div className={cn("mx-auto", maxW, "px-6", className)}>{children}</div>
  );
}

export default Inset;
