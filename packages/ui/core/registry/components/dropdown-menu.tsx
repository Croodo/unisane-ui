"use client";

import React, { useState, useRef, useEffect, useId, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn, Slot } from "@/lib/utils";
import {
  Menu,
  MenuItem,
  MenuDivider,
  MenuCheckboxItem,
  MenuRadioItem,
} from "@/primitives/menu";

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLElement>(null);

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        isOpen,
        setIsOpen,
        menuId,
        triggerRef,
      });
    }
    return child;
  });

  return (
    <div className="relative inline-block text-left">{childrenWithProps}</div>
  );
};

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  menuId?: string;
  asChild?: boolean;
  className?: string;
  triggerRef?: React.RefObject<HTMLElement>;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  children,
  isOpen,
  setIsOpen,
  menuId,
  asChild,
  className,
  triggerRef,
}) => {
  const localRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync ref to parent triggerRef
  useEffect(() => {
    if (triggerRef) {
      const refToAssign = asChild ? wrapperRef.current : localRef.current;
      if (refToAssign) {
        (triggerRef as { current: HTMLElement | null }).current = refToAssign;
      }
    }
  }, [triggerRef, asChild]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen?.(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
      case "ArrowDown":
        e.preventDefault();
        setIsOpen?.(true);
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen?.(false);
        break;
    }
  };

  const triggerProps = {
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    "aria-expanded": isOpen,
    "aria-haspopup": "menu" as const,
    "aria-controls": menuId,
  };

  // asChild pattern: merge props into the child element
  if (asChild && React.isValidElement(children)) {
    return (
      <div ref={wrapperRef} className="inline-flex">
        <Slot className={className} {...triggerProps}>
          {children}
        </Slot>
      </div>
    );
  }

  return (
    <button
      ref={localRef}
      type="button"
      className={cn("inline-flex cursor-pointer", className)}
      {...triggerProps}
    >
      {children}
    </button>
  );
};

export type Side = "top" | "bottom" | "left" | "right";
export type Align = "start" | "center" | "end";

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  menuId?: string;
  /** Alignment along the side axis */
  align?: Align;
  /** Preferred side of the trigger to open the menu on */
  side?: Side;
  /** Offset from the trigger element in pixels */
  sideOffset?: number;
  /** Offset along the alignment axis in pixels */
  alignOffset?: number;
  /** Whether to automatically flip/adjust placement when there's not enough space */
  avoidCollisions?: boolean;
  /** Padding from viewport edges for collision detection */
  collisionPadding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  className?: string;
  /** Use portal to render dropdown at document body level (recommended for most cases) */
  portal?: boolean;
  /** Reference to the trigger element for positioning */
  triggerRef?: React.RefObject<HTMLElement>;
}

/**
 * Calculates the optimal position for a floating element with collision detection.
 * Similar to Floating UI's flip and shift middleware.
 */
function computePosition(
  triggerRect: DOMRect,
  menuRect: { width: number; height: number },
  options: {
    side: Side;
    align: Align;
    sideOffset: number;
    alignOffset: number;
    avoidCollisions: boolean;
    collisionPadding: { top: number; right: number; bottom: number; left: number };
  }
): { top: number; left: number; actualSide: Side; actualAlign: Align } {
  const { side, align, sideOffset, alignOffset, avoidCollisions, collisionPadding } = options;
  const { width: menuWidth, height: menuHeight } = menuRect;

  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Calculate available space on each side
  const space = {
    top: triggerRect.top - collisionPadding.top,
    bottom: viewport.height - triggerRect.bottom - collisionPadding.bottom,
    left: triggerRect.left - collisionPadding.left,
    right: viewport.width - triggerRect.right - collisionPadding.right,
  };

  // Determine the best side (flip if necessary)
  let actualSide = side;
  if (avoidCollisions) {
    const sideSpace = {
      top: space.top,
      bottom: space.bottom,
      left: space.left,
      right: space.right,
    };

    const neededSpace = {
      top: menuHeight + sideOffset,
      bottom: menuHeight + sideOffset,
      left: menuWidth + sideOffset,
      right: menuWidth + sideOffset,
    };

    // Check if preferred side has enough space, otherwise flip
    if (sideSpace[side] < neededSpace[side]) {
      // Get opposite side
      const oppositeSide: Record<Side, Side> = {
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left",
      };
      const opposite = oppositeSide[side];

      // If opposite side has more space, flip to it
      if (sideSpace[opposite] > sideSpace[side]) {
        actualSide = opposite;
      } else {
        // Try perpendicular sides if neither primary nor opposite fit well
        const perpendicularSides: Record<Side, [Side, Side]> = {
          top: ["left", "right"],
          bottom: ["left", "right"],
          left: ["top", "bottom"],
          right: ["top", "bottom"],
        };
        const [perp1, perp2] = perpendicularSides[side];

        // Choose perpendicular side with most space
        if (sideSpace[perp1] >= neededSpace[perp1] && sideSpace[perp1] > sideSpace[actualSide]) {
          actualSide = perp1;
        } else if (sideSpace[perp2] >= neededSpace[perp2] && sideSpace[perp2] > sideSpace[actualSide]) {
          actualSide = perp2;
        }
      }
    }
  }

  // Calculate base position based on actual side
  let top = 0;
  let left = 0;

  const isVertical = actualSide === "top" || actualSide === "bottom";

  if (actualSide === "top") {
    top = triggerRect.top - menuHeight - sideOffset;
  } else if (actualSide === "bottom") {
    top = triggerRect.bottom + sideOffset;
  } else if (actualSide === "left") {
    left = triggerRect.left - menuWidth - sideOffset;
  } else if (actualSide === "right") {
    left = triggerRect.right + sideOffset;
  }

  // Calculate alignment position
  let actualAlign = align;

  if (isVertical) {
    // For top/bottom: align along horizontal axis
    if (align === "start") {
      left = triggerRect.left + alignOffset;
    } else if (align === "center") {
      left = triggerRect.left + (triggerRect.width - menuWidth) / 2 + alignOffset;
    } else {
      left = triggerRect.right - menuWidth - alignOffset;
    }

    // Shift horizontally if overflowing (like Floating UI's shift middleware)
    if (avoidCollisions) {
      const minLeft = collisionPadding.left;
      const maxLeft = viewport.width - menuWidth - collisionPadding.right;

      if (left < minLeft) {
        left = minLeft;
        actualAlign = "start";
      } else if (left > maxLeft) {
        left = maxLeft;
        actualAlign = "end";
      }
    }
  } else {
    // For left/right: align along vertical axis
    if (align === "start") {
      top = triggerRect.top + alignOffset;
    } else if (align === "center") {
      top = triggerRect.top + (triggerRect.height - menuHeight) / 2 + alignOffset;
    } else {
      top = triggerRect.bottom - menuHeight - alignOffset;
    }

    // Shift vertically if overflowing
    if (avoidCollisions) {
      const minTop = collisionPadding.top;
      const maxTop = viewport.height - menuHeight - collisionPadding.bottom;

      if (top < minTop) {
        top = minTop;
        actualAlign = "start";
      } else if (top > maxTop) {
        top = maxTop;
        actualAlign = "end";
      }
    }
  }

  // Add scroll offset for fixed positioning
  top += window.scrollY;
  left += window.scrollX;

  return { top, left, actualSide, actualAlign };
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  isOpen,
  setIsOpen,
  menuId,
  align = "start",
  side = "bottom",
  sideOffset = 4,
  alignOffset = 0,
  avoidCollisions = true,
  collisionPadding = 8,
  className,
  portal = false,
  triggerRef,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [computedPlacement, setComputedPlacement] = useState({ side, align });

  // Normalize collision padding
  const normalizedPadding = useMemo(() => {
    if (typeof collisionPadding === "number") {
      return { top: collisionPadding, right: collisionPadding, bottom: collisionPadding, left: collisionPadding };
    }
    return {
      top: collisionPadding.top ?? 8,
      right: collisionPadding.right ?? 8,
      bottom: collisionPadding.bottom ?? 8,
      left: collisionPadding.left ?? 8,
    };
  }, [collisionPadding]);

  // Calculate position with collision detection
  useEffect(() => {
    if (!isOpen || !triggerRef?.current) return;

    const updatePosition = () => {
      const triggerRect = triggerRef.current!.getBoundingClientRect();
      const menuWidth = ref.current?.offsetWidth || 200; // Estimate if not yet rendered
      const menuHeight = ref.current?.offsetHeight || 200;

      const result = computePosition(
        triggerRect,
        { width: menuWidth, height: menuHeight },
        {
          side,
          align,
          sideOffset,
          alignOffset,
          avoidCollisions,
          collisionPadding: normalizedPadding,
        }
      );

      setPosition({ top: result.top, left: result.left });
      setComputedPlacement({ side: result.actualSide, align: result.actualAlign });
    };

    // Initial calculation
    updatePosition();

    // Recalculate on scroll/resize for fixed positioning
    if (portal) {
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen, triggerRef, side, align, sideOffset, alignOffset, avoidCollisions, normalizedPadding, portal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ref.current && ref.current.contains(target)) return;
      if (triggerRef?.current && triggerRef.current.contains(target)) return;
      setIsOpen?.(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen?.(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setIsOpen, triggerRef]);

  if (!isOpen) return null;

  // Get positioning classes for non-portal mode (CSS-based positioning)
  const getPositionClasses = () => {
    if (portal) return "fixed z-popover";

    const classes = ["absolute z-popover"];
    const actualSide = avoidCollisions ? computedPlacement.side : side;
    const actualAlign = avoidCollisions ? computedPlacement.align : align;

    switch (actualSide) {
      case "top":
        classes.push("bottom-full mb-1");
        if (actualAlign === "start") classes.push("left-0");
        else if (actualAlign === "end") classes.push("right-0");
        else classes.push("left-1/2 -translate-x-1/2");
        break;
      case "bottom":
        classes.push("top-full mt-1");
        if (actualAlign === "start") classes.push("left-0");
        else if (actualAlign === "end") classes.push("right-0");
        else classes.push("left-1/2 -translate-x-1/2");
        break;
      case "left":
        classes.push("right-full mr-1");
        if (actualAlign === "start") classes.push("top-0");
        else if (actualAlign === "end") classes.push("bottom-0");
        else classes.push("top-1/2 -translate-y-1/2");
        break;
      case "right":
        classes.push("left-full ml-1");
        if (actualAlign === "start") classes.push("top-0");
        else if (actualAlign === "end") classes.push("bottom-0");
        else classes.push("top-1/2 -translate-y-1/2");
        break;
    }

    return classes.join(" ");
  };

  const content = (
    <div
      ref={ref}
      id={menuId}
      role="menu"
      aria-orientation="vertical"
      data-side={computedPlacement.side}
      data-align={computedPlacement.align}
      className={cn(
        getPositionClasses(),
        "animate-in fade-in-0 zoom-in-95 duration-snappy ease-emphasized"
      )}
      style={portal ? { top: position.top, left: position.left } : undefined}
    >
      <Menu
        open={true}
        className={cn("w-full relative shadow-2 border border-outline-variant/20 overflow-visible", className)}
      >
        {children}
      </Menu>
    </div>
  );

  if (portal && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
};

export const DropdownMenuItem = MenuItem;
export const DropdownMenuCheckboxItem = MenuCheckboxItem;
export const DropdownMenuRadioItem = MenuRadioItem;
export const DropdownMenuSeparator = MenuDivider;

// ─── SUBMENU COMPONENTS ────────────────────────────────────────────────────────

export interface DropdownMenuSubProps {
  children: React.ReactNode;
}

export const DropdownMenuSub: React.FC<DropdownMenuSubProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const subMenuId = useId();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const openSubmenu = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const closeSubmenu = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        isSubOpen: isOpen,
        openSubmenu,
        closeSubmenu,
        subMenuId,
        subTriggerRef: triggerRef,
      });
    }
    return child;
  });

  return <div ref={triggerRef} className="relative">{childrenWithProps}</div>;
};

export interface DropdownMenuSubTriggerProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  isSubOpen?: boolean;
  openSubmenu?: () => void;
  closeSubmenu?: () => void;
  subMenuId?: string;
  className?: string;
  disabled?: boolean;
}

export const DropdownMenuSubTrigger: React.FC<DropdownMenuSubTriggerProps> = ({
  children,
  icon,
  isSubOpen,
  openSubmenu,
  closeSubmenu,
  subMenuId,
  className,
  disabled = false,
}) => {
  const handleMouseEnter = () => {
    if (disabled) return;
    openSubmenu?.();
  };

  const handleMouseLeave = () => {
    closeSubmenu?.();
  };

  return (
    <MenuItem
      icon={icon}
      trailingIcon={
        <span className="material-symbols-outlined text-[18px]">
          arrow_right
        </span>
      }
      className={className}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-expanded={isSubOpen}
      aria-haspopup="menu"
      aria-controls={subMenuId}
    >
      {children}
    </MenuItem>
  );
};

export interface DropdownMenuSubContentProps {
  children: React.ReactNode;
  isSubOpen?: boolean;
  openSubmenu?: () => void;
  closeSubmenu?: () => void;
  subMenuId?: string;
  className?: string;
  /** Reference to the submenu trigger element for position calculation */
  subTriggerRef?: React.RefObject<HTMLElement>;
  /** Offset from the trigger element in pixels */
  sideOffset?: number;
  /** Whether to automatically flip/adjust placement when there's not enough space */
  avoidCollisions?: boolean;
  /** Padding from viewport edges for collision detection */
  collisionPadding?: number;
}

/**
 * Calculates the optimal position for a submenu with collision detection.
 * Handles both horizontal flip (left/right) and vertical shift.
 */
function computeSubmenuPosition(
  triggerRect: DOMRect,
  menuRect: { width: number; height: number },
  options: {
    sideOffset: number;
    avoidCollisions: boolean;
    collisionPadding: number;
  }
): {
  top: number;
  left: number;
  side: "left" | "right";
} {
  const { sideOffset, avoidCollisions, collisionPadding } = options;
  const { width: menuWidth, height: menuHeight } = menuRect;

  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Calculate available space on each side
  const spaceRight = viewport.width - triggerRect.right - collisionPadding;
  const spaceLeft = triggerRect.left - collisionPadding;

  // Determine horizontal side (flip if necessary)
  let side: "left" | "right" = "right";
  let left = triggerRect.right + sideOffset;

  if (avoidCollisions) {
    const neededWidth = menuWidth + sideOffset;

    if (spaceRight < neededWidth && spaceLeft > spaceRight) {
      // Flip to left
      side = "left";
      left = triggerRect.left - menuWidth - sideOffset;
    }
  }

  // Calculate vertical position (align top of submenu with trigger)
  let top = triggerRect.top;

  // Shift vertically if overflowing
  if (avoidCollisions) {
    const minTop = collisionPadding;
    const maxTop = viewport.height - menuHeight - collisionPadding;

    if (top < minTop) {
      top = minTop;
    } else if (top > maxTop) {
      top = maxTop;
    }

    // Also check if submenu would overflow at the bottom
    if (top + menuHeight > viewport.height - collisionPadding) {
      // Align bottom of submenu with bottom of trigger instead
      top = Math.max(collisionPadding, triggerRect.bottom - menuHeight);
    }
  }

  return { top, left, side };
}

export const DropdownMenuSubContent: React.FC<DropdownMenuSubContentProps> = ({
  children,
  isSubOpen,
  openSubmenu,
  closeSubmenu,
  subMenuId,
  className,
  subTriggerRef,
  sideOffset = 4,
  avoidCollisions = true,
  collisionPadding = 8,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, side: "right" as "left" | "right" });

  // Calculate position with collision detection
  useEffect(() => {
    if (!isSubOpen || !subTriggerRef?.current) return;

    const updatePosition = () => {
      const triggerRect = subTriggerRef.current!.getBoundingClientRect();
      const menuWidth = ref.current?.offsetWidth || 180;
      const menuHeight = ref.current?.offsetHeight || 150;

      const result = computeSubmenuPosition(
        triggerRect,
        { width: menuWidth, height: menuHeight },
        { sideOffset, avoidCollisions, collisionPadding }
      );

      setPosition(result);
    };

    // Initial calculation
    updatePosition();

    // Recalculate on scroll/resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isSubOpen, subTriggerRef, sideOffset, avoidCollisions, collisionPadding]);

  if (!isSubOpen) return null;

  return (
    <div
      ref={ref}
      id={subMenuId}
      role="menu"
      aria-orientation="vertical"
      data-side={position.side}
      className={cn(
        "fixed z-popover",
        position.side === "right"
          ? "animate-in fade-in-0 slide-in-from-left-1"
          : "animate-in fade-in-0 slide-in-from-right-1",
        "duration-snappy ease-emphasized"
      )}
      style={{ top: position.top, left: position.left }}
      onMouseEnter={openSubmenu}
      onMouseLeave={closeSubmenu}
    >
      <Menu
        open={true}
        className={cn("min-w-40 shadow-2 border border-outline-variant/20", className)}
      >
        {children}
      </Menu>
    </div>
  );
};
