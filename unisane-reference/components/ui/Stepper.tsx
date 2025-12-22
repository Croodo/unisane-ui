import React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  activeStep: number;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, activeStep, className }) => {
  return (
    <div className={cn("w-full flex items-start gap-0", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < activeStep;
        const isActive = index === activeStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className={cn("flex flex-col items-center relative", isLast ? "flex-none" : "flex-1")}>
            {/* Connecting Line */}
            {!isLast && (
              <div className={cn(
                "absolute top-4u left-1/2 w-full h-[2px] transition-colors duration-standard z-0",
                isCompleted ? "bg-primary" : "bg-outline-variant/30"
              )} />
            )}

            {/* Step Node */}
            <div className={cn(
              "w-8u h-8u rounded-xs flex items-center justify-center text-[11px] font-black border-2 z-10 transition-all duration-emphasized",
              isActive && "bg-primary border-primary text-on-primary shadow-2 scale-110",
              isCompleted && "bg-primary border-primary text-on-primary",
              !isActive && !isCompleted && "bg-surface border-outline-variant text-on-surface-variant"
            )}>
              {isCompleted ? (
                <Icon symbol="check" size={18} strokeWidth={4} />
              ) : (
                index + 1
              )}
            </div>

            {/* Label Block */}
            <div className="mt-4u text-center px-2u max-w-[120px]">
              <span className={cn(
                "block text-[10px] font-black uppercase tracking-widest transition-colors",
                isActive ? "text-on-surface" : "text-on-surface-variant"
              )}>
                {step.label}
              </span>
              {step.description && (
                <span className="hidden @md:block text-[9px] font-bold text-on-surface-variant/60 uppercase mt-1 leading-none tracking-tighter">
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