import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

interface Step {
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

const stepperVariants = cva("flex", {
  variants: {
    orientation: {
      horizontal: "flex-row items-center",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

const stepItemVariants = cva("flex", {
  variants: {
    orientation: {
      horizontal: "flex-col items-center flex-1",
      vertical: "flex-row items-start",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

const stepIndicatorVariants = cva(
  "w-10u h-10u rounded-full flex items-center justify-center transition-all duration-short",
  {
    variants: {
      status: {
        completed: "bg-primary text-on-primary",
        current: "bg-primary-container text-on-primary-container border-2 border-primary",
        upcoming: "bg-surface-container-high text-on-surface-variant",
      },
      clickable: {
        true: "hover:brightness-95 cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      status: "upcoming",
      clickable: false,
    },
  }
);

const stepConnectorVariants = cva("", {
  variants: {
    orientation: {
      horizontal: "h-px w-full mx-2u",
      vertical: "w-px h-12u ml-5u my-2u",
    },
    completed: {
      true: "bg-primary",
      false: "bg-outline-variant",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    completed: false,
  },
});

interface StepperProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stepperVariants> {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(
  ({ steps, currentStep, orientation = "horizontal", onStepClick, className, ...props }, ref) => {
    const isHorizontal = orientation === "horizontal";

    return (
      <div
        ref={ref}
        className={cn(stepperVariants({ orientation }), className)}
        {...props}
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && index < currentStep;
          const status = isCompleted ? "completed" : isCurrent ? "current" : "upcoming";

          return (
            <div key={index} className={cn(stepItemVariants({ orientation }))}>
              {/* Step content */}
              <div
                className={cn(
                  "flex",
                  isHorizontal ? "flex-col items-center" : "flex-row items-center"
                )}
                onClick={() => isClickable && onStepClick(index)}
              >
                {/* Circle indicator */}
                <div className={cn(stepIndicatorVariants({ status, clickable: !!isClickable }))}>
                  {step.icon ? (
                    step.icon
                  ) : isCompleted ? (
                    <span className="material-symbols-outlined w-5u h-5u">check</span>
                  ) : (
                    <span className="text-label-large font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <div className={cn(isHorizontal ? "mt-2u text-center" : "ml-3u")}>
                  <div
                    className={cn(
                      "text-body-medium font-medium",
                      isCurrent ? "text-on-surface" : "text-on-surface-variant"
                    )}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-body-small text-on-surface-variant mt-0.5u">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    stepConnectorVariants({ orientation, completed: isCompleted })
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

Stepper.displayName = "Stepper";