import { type ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

export function Container({
  children,
  maxWidth = "lg",
  className = "",
}: ContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full",
  };

  return (
    <div
      className={`
      mx-auto 
      px-[var(--uni-sys-layout-margin)] 
      ${maxWidthClasses[maxWidth]}
      ${className}
    `}
    >
      {children}
    </div>
  );
}
