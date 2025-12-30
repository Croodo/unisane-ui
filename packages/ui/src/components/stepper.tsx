import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";
import { Icon } from "@ui/primitives/icon";
import { Text } from "@ui/primitives/text";
import { Ripple } from "./ripple";

interface Step {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps?: Step[];
  activeStep?: number;
  children?: React.ReactNode;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  activeStep = 0,
  children,
  className,
}) => {
  if (!steps || steps.length === 0) {
    return <div className={cn("flex items-center justify-between w-full", className)}>{children}</div>;
  }

  return (
    <div className={cn("w-full flex items-start gap-0", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < activeStep;
        const isActive = index === activeStep;
        const isLast = index === steps.length - 1;

        return (
          <div
            key={`${step.label}-${index}`}
            className={cn("flex flex-col items-center relative", isLast ? "flex-none" : "flex-1")}
          >
            {!isLast && (
              <div
                className={cn(
                  "absolute top-4 left-1/2 w-full h-0.5 transition-colors duration-medium z-0",
                  isCompleted ? "bg-primary" : "bg-outline-variant/30"
                )}
              />
            )}

            <div
              className={cn(
                "w-8 h-8 rounded-sm flex items-center justify-center text-label-small font-medium border-2 z-10 transition-all duration-emphasized",
                isActive && "bg-primary border-primary text-on-primary scale-110",
                isCompleted && "bg-primary border-primary text-on-primary",
                !isActive &&
                  !isCompleted &&
                  "bg-surface border-outline-variant text-on-surface-variant"
              )}
            >
              {isCompleted ? (
                <Icon symbol="check" size={18} strokeWidth={4} />
              ) : (
                index + 1
              )}
            </div>

            <div className="mt-4 text-center px-2 max-w-30">
              <span
                className={cn(
                  "block text-label-small font-medium transition-colors",
                  isActive ? "text-on-surface" : "text-on-surface-variant"
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="hidden @md:block text-label-small font-medium text-on-surface-variant/60 mt-1 leading-none">
                  {step.description}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const stepVariants = cva(
  "relative flex items-center gap-3 cursor-pointer select-none overflow-hidden rounded-sm",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col",
      },
      active: {
        true: "",
        false: "",
      },
      completed: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      active: false,
      completed: false,
    },
  }
);

export type StepProps = VariantProps<typeof stepVariants> & {
  stepNumber: number;
  active?: boolean;
  completed?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export const Step: React.FC<StepProps> = ({
  stepNumber,
  active,
  completed,
  orientation,
  children,
  onClick,
  className,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={cn(stepVariants({ orientation, active, completed, className }))}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={onClick ? 0 : undefined}
      aria-current={active ? "step" : undefined}
    >
      <Ripple />
      <div
        className={cn(
          "w-8 h-8 rounded-sm flex items-center justify-center transition-colors duration-medium ease-standard",
          active
            ? "bg-primary text-on-primary"
            : completed
              ? "bg-primary-container text-on-primary-container"
              : "bg-surface-variant text-on-surface-variant"
        )}
      >
        <Text variant="labelLarge">{completed ? "✓" : stepNumber}</Text>
      </div>

      <div className={cn("flex-1", orientation === "vertical" && "ml-0 mt-2")}>
        {children}
      </div>
    </div>
  );
};

export type StepLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export const StepLabel: React.FC<StepLabelProps> = ({ children, className }) => {
  return (
    <div className={className}>
      <Text variant="bodyLarge">{children}</Text>
    </div>
  );
};

export type StepDescriptionProps = {
  children: React.ReactNode;
  className?: string;
};

export const StepDescription: React.FC<StepDescriptionProps> = ({
  children,
  className,
}) => {
  return (
    <div className={className}>
      <Text variant="bodyMedium" className="text-on-surface-variant">
        {children}
      </Text>
    </div>
  );
};
