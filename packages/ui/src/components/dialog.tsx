"use client";

import React, { useEffect, useRef, useId, forwardRef } from "react";
import { cn } from "@ui/lib/utils";
import { Text } from "@ui/primitives/text";
import { Surface } from "@ui/primitives/surface";
import { Ripple } from "./ripple";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  contentClassName?: string;
  className?: string;
}

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  (
    {
      open,
      onClose,
      title,
      children,
      actions,
      icon,
      contentClassName,
      className,
    },
    ref
  ) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);
    const titleId = useId();
    const descId = useId();

    // Focus Management & Keyboard Handling
    useEffect(() => {
      if (open) {
        const dialogNode = dialogRef.current;
        previousActiveElement.current = document.activeElement as HTMLElement;

        const getFocusableElements = () => {
          if (!dialogNode) return [];
          return Array.from(
            dialogNode.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
        };

        const focusFirstElement = () => {
          const focusables = getFocusableElements();
          (focusables[0] ?? dialogNode)?.focus();
        };

        const timer = setTimeout(focusFirstElement, 0);

        document.body.style.overflow = "hidden";

        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Escape") {
            onClose();
          }
          if (e.key === "Tab") {
            const focusables = getFocusableElements();
            if (focusables.length === 0) {
              e.preventDefault();
              return;
            }

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const activeElement = document.activeElement as HTMLElement | null;

            if (e.shiftKey) {
              if (activeElement === first || activeElement === dialogNode) {
                e.preventDefault();
                last.focus();
              }
            } else if (activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
          clearTimeout(timer);
          document.body.style.overflow = "";
          document.removeEventListener("keydown", handleKeyDown);
          previousActiveElement.current?.focus();
        };
      }
    }, [open, onClose]);

    if (!open) return null;

    return (
      <div
        className="fixed inset-0 z-modal flex items-center justify-center p-6u medium:p-10u"
        role="presentation"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-scrim backdrop-blur-[calc(var(--uni-sys-u)/2)] transition-opacity animate-in fade-in duration-medium"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Dialog Surface */}
        <Surface
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          tabIndex={-1}
          tone="surface"
          elevation={4}
          rounded="sm"
          className={cn(
            "relative outline-none w-full min-w-[calc(var(--uni-sys-u)*70)] max-w-[calc(var(--uni-sys-u)*78)] expanded:max-w-[calc(var(--uni-sys-u)*170)] flex flex-col border border-outline-variant/30 overflow-hidden",
            "animate-in fade-in zoom-in-95 duration-medium ease-emphasized",
            className
          )}
        >
          <div className="px-8u py-6u border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50 shrink-0">
             <div className="flex items-center gap-4u text-left">
                {icon && <div className="text-primary flex items-center justify-center shrink-0" aria-hidden="true">{icon}</div>}
                <div className="flex flex-col gap-1u">
                  {title && (
                    <Text
                      variant="titleMedium"
                      id={titleId}
                      className="text-on-surface leading-none"
                    >
                      {title}
                    </Text>
                  )}
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10u h-10u rounded-sm flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all relative overflow-hidden shrink-0"
                aria-label="Close dialog"
              >
                  <Ripple />
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="relative z-10">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
              </button>
          </div>

          <div className={cn("flex-1 overflow-y-auto max-h-[75vh]", contentClassName)}>
               <div className="text-on-surface p-8u text-left">
                  <Text
                    variant="bodyMedium"
                    id={descId}
                    as="div"
                    className="text-inherit wrap-break-word font-medium"
                  >
                    {children}
                  </Text>
               </div>
          </div>

            {actions && (
              <div
                className="flex flex-col medium:flex-row justify-end gap-3u w-full p-6u border-t border-outline-variant/10 bg-surface-container-low/30"
              >
                {actions}
              </div>
            )}
        </Surface>
      </div>
    );
  }
);

Dialog.displayName = "Dialog";
