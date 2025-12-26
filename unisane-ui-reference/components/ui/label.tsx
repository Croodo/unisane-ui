import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const labelVariants = cva("text-body-medium font-medium text-on-surface", {
  variants: {
    disabled: {
      true: "opacity-38 cursor-not-allowed",
      false: "cursor-pointer",
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required = false, disabled = false, children, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants({ disabled }), className)}
        {...props}
      >
        {children}
        {required && <span className="text-error ml-0.5u" aria-label="required">*</span>}
      </label>
    );
  }
);

Label.displayName = "Label";