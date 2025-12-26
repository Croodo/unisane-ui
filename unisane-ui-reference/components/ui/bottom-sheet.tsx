"use client";

import React, { useState, useEffect, useRef, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Portal } from "./portal";
import { FocusTrap } from "./focus-trap";
import { animations } from "../../utils/animations";

const bottomSheetVariants = cva(
  "fixed bottom-0 left-0 right-0 z-modal bg-surface-container-low rounded-t-xl shadow-4 flex flex-col"
);

interface BottomSheetProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  snapPoints?: number[]; // Percentage heights: [50, 100]
  defaultSnap?: number;
}

export const BottomSheet = forwardRef<HTMLDivElement, BottomSheetProps>(
  ({ open, onClose, snapPoints = [50, 100], defaultSnap = 0, children, className = "", ...props }, ref) => {
    const [currentSnap, setCurrentSnap] = useState(defaultSnap);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [translateY, setTranslateY] = useState(0);
    const sheetRef = useRef<HTMLDivElement>(null);

    const snapHeight = snapPoints[currentSnap];

    useEffect(() => {
      if (!open) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [open, onClose]);

    const handleDragStart = (clientY: number) => {
      setIsDragging(true);
      setStartY(clientY);
    };

    const handleDragMove = (clientY: number) => {
      if (!isDragging) return;
      const delta = clientY - startY;
      if (delta > 0) {
        setTranslateY(delta);
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);

      // If dragged down more than 100px, close
      if (translateY > 100) {
        onClose();
      } else {
        setTranslateY(0);
      }
    };

    if (!open) return null;

    return (
      <Portal>
        <FocusTrap active={open}>
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 bg-scrim z-modal",
              animations.fadeIn
            )}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div
            ref={(node) => {
              (sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            style={{
              height: `${snapHeight}vh`,
              transform: `translateY(${translateY}px)`,
              transition: isDragging ? "none" : "transform 0.3s ease",
            }}
            className={cn(
              bottomSheetVariants(),
              animations.slideInFromBottom,
              className
            )}
            {...props}
          >
            {/* Drag Handle */}
            <div
              className="flex justify-center pt-3u pb-2u cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => handleDragStart(e.clientY)}
              onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
              onMouseMove={(e) => handleDragMove(e.clientY)}
              onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
              onMouseUp={handleDragEnd}
              onTouchEnd={handleDragEnd}
            >
              <div className="w-8u h-1u bg-on-surface-variant/40 rounded-full" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6u pb-6u">
              {children}
            </div>
          </div>
        </FocusTrap>
      </Portal>
    );
  }
);

BottomSheet.displayName = "BottomSheet";