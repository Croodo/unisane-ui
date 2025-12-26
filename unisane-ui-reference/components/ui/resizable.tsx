"use client";

import React, { useState, useRef, useCallback, createContext, useContext } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

interface ResizableContextType {
  sizes: number[];
  setSizes: (sizes: number[]) => void;
}

const ResizableContext = createContext<ResizableContextType | undefined>(undefined);

const resizableVariants = cva("flex w-full h-full", {
  variants: {
    direction: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    direction: "horizontal",
  },
});

interface ResizableProps extends VariantProps<typeof resizableVariants> {
  children: React.ReactNode;
  defaultSizes?: number[];
  onResize?: (sizes: number[]) => void;
  className?: string;
  direction?: "horizontal" | "vertical";
}

export const Resizable = ({
  children,
  direction = "horizontal",
  defaultSizes = [50, 50],
  onResize,
  className,
}: ResizableProps) => {
  const [sizes, setSizes] = useState(defaultSizes);

  const handleResize = (newSizes: number[]) => {
    setSizes(newSizes);
    onResize?.(newSizes);
  };

  return (
    <ResizableContext.Provider value={{ sizes, setSizes: handleResize }}>
      <div className={cn(resizableVariants({ direction }), className)}>
        {children}
      </div>
    </ResizableContext.Provider>
  );
};

// Resizable Panel
interface ResizablePanelProps {
  children: React.ReactNode;
  index: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
}

export const ResizablePanel = ({
  children,
  index,
  minSize = 10,
  maxSize = 90,
  className,
}: ResizablePanelProps) => {
  const context = useContext(ResizableContext);
  if (!context) throw new Error("ResizablePanel must be used within Resizable");

  const size = context.sizes[index] || 50;

  return (
    <div
      style={{ flexBasis: `${size}%` }}
      className={cn("overflow-auto", className)}
    >
      {children}
    </div>
  );
};

// Resizable Handle
const resizableHandleVariants = cva(
  "flex-shrink-0 transition-colors duration-short",
  {
    variants: {
      direction: {
        horizontal: "w-1u cursor-col-resize",
        vertical: "h-1u cursor-row-resize",
      },
      isDragging: {
        true: "bg-primary",
        false: "bg-outline-variant hover:bg-primary",
      },
    },
    defaultVariants: {
      direction: "horizontal",
      isDragging: false,
    },
  }
);

interface ResizableHandleProps extends VariantProps<typeof resizableHandleVariants> {
  index: number;
  className?: string;
  direction?: "horizontal" | "vertical";
}

export const ResizableHandle = ({
  index,
  direction = "horizontal",
  className,
}: ResizableHandleProps) => {
  const context = useContext(ResizableContext);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!context) throw new Error("ResizableHandle must be used within Resizable");

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const startPos = direction === "horizontal" ? e.clientX : e.clientY;
      const startSizes = [...context.sizes];

      const handleMouseMove = (e: MouseEvent) => {
        const currentPos = direction === "horizontal" ? e.clientX : e.clientY;
        const delta = currentPos - startPos;
        const container = containerRef.current?.parentElement;
        if (!container) return;

        const containerSize =
          direction === "horizontal" ? container.offsetWidth : container.offsetHeight;
        const deltaPercent = (delta / containerSize) * 100;

        const newSizes = [...startSizes];
        newSizes[index] = Math.max(10, Math.min(90, startSizes[index] + deltaPercent));
        newSizes[index + 1] = Math.max(10, Math.min(90, startSizes[index + 1] - deltaPercent));

        context.setSizes(newSizes);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [context, direction, index]
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className={cn(resizableHandleVariants({ direction, isDragging }), className)}
    />
  );
};