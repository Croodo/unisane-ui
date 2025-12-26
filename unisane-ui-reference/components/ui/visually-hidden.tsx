import React, { forwardRef } from "react";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          absolute w-px h-px p-0 -m-px
          overflow-hidden whitespace-nowrap
          border-0
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  }
);

VisuallyHidden.displayName = "VisuallyHidden";