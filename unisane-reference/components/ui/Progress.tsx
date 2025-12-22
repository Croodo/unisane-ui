import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressProps {
  value?: number;
  className?: string;
  max?: number;
}

export const LinearProgress: React.FC<ProgressProps> = ({ value, max = 100, className }) => {
  const isIndeterminate = value === undefined;
  const percentage = value !== undefined ? (value / max) * 100 : 0;

  return (
    <div className={cn("w-full h-1.5u bg-surface-container-highest rounded-none overflow-hidden relative border border-outline-variant/40", className)}>
      {isIndeterminate ? (
        <div className="absolute inset-0 bg-primary origin-left animate-[indeterminate-bar_2s_infinite_linear] w-full" />
      ) : (
        <div 
            className="h-full bg-primary transition-all duration-emphasized ease-emphasized" 
            style={{ width: `${percentage}%` }} 
        />
      )}
      <style>{`@keyframes indeterminate-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
};

export const CircularProgress: React.FC<ProgressProps> = ({ value, max = 100, className }) => {
  const isIndeterminate = value === undefined;
  const size = 48;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = value !== undefined ? circumference - ((value / max) * circumference) : 0;

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
        <svg className={cn("rotate-[-90deg]", isIndeterminate && "animate-spin")} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--uni-sys-color-surface-container-highest)" strokeWidth={strokeWidth} />
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={isIndeterminate ? circumference * 0.25 : offset}
                strokeLinecap="square"
                className={cn("text-primary transition-all duration-emphasized", isIndeterminate && "animate-[indet-circle_1.5s_ease-in-out_infinite]")}
            />
        </svg>
        <style>{`@keyframes indet-circle { 0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; } 50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; } 100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; } }`}</style>
    </div>
  );
};