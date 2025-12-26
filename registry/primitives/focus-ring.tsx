import React from "react";
import { cn } from "@/lib/utils";

export interface FocusRingProps {
  children: React.ReactElement<any>;
  className?: string;
}

export const FocusRing: React.FC<FocusRingProps> = ({
  children,
  className,
}) => {
  return React.cloneElement(children, {
    className: cn(
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
      children.props.className,
      className
    ),
  });
};
