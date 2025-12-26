import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Ripple } from "./ripple";
import { cn } from "../../lib/utils";

const listVariants = cva("", {
  variants: {
    dense: {
      true: "py-1u",
      false: "py-2u",
    },
  },
  defaultVariants: {
    dense: false,
  },
});

interface ListProps
  extends React.HTMLAttributes<HTMLUListElement>,
    VariantProps<typeof listVariants> {}

export const List = forwardRef<HTMLUListElement, ListProps>(
  ({ dense = false, className, children, ...props }, ref) => {
    return (
      <ul
        ref={ref}
        className={cn(listVariants({ dense }), className)}
        {...props}
      >
        {children}
      </ul>
    );
  }
);

List.displayName = "List";

// List Item
const listItemVariants = cva(
  "flex items-center gap-4u px-4u min-h-14u py-2u transition-colors duration-short relative overflow-hidden group",
  {
    variants: {
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
      selected: {
        true: "bg-secondary-container text-on-secondary-container",
        false: "",
      },
      disabled: {
        true: "opacity-38 pointer-events-none",
        false: "",
      },
    },
    defaultVariants: {
      interactive: false,
      selected: false,
      disabled: false,
    },
  }
);

interface ListItemProps
  extends React.LiHTMLAttributes<HTMLLIElement>,
    VariantProps<typeof listItemVariants> {
  leadingContent?: React.ReactNode;
  trailingContent?: React.ReactNode;
  overline?: string;
  headline?: string;
  supportingText?: string;
}

export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  (
    {
      interactive = false,
      selected = false,
      disabled = false,
      leadingContent,
      trailingContent,
      overline,
      headline,
      supportingText,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const content = children || (
      <>
        {/* Leading content */}
        {leadingContent && (
          <div className="flex-shrink-0 w-6u h-6u flex items-center justify-center text-on-surface-variant relative z-10">
            {leadingContent}
          </div>
        )}

        {/* Text content */}
        <div className="flex-1 min-w-0 py-2u relative z-10">
          {overline && (
            <div className="text-label-small text-on-surface-variant mb-0.5u">
              {overline}
            </div>
          )}
          {headline && (
            <div className="text-body-large text-on-surface truncate">
              {headline}
            </div>
          )}
          {supportingText && (
            <div className="text-body-medium text-on-surface-variant mt-1u line-clamp-2">
              {supportingText}
            </div>
          )}
        </div>

        {/* Trailing content */}
        {trailingContent && (
          <div className="flex-shrink-0 text-on-surface-variant relative z-10">
            {trailingContent}
          </div>
        )}
      </>
    );

    return (
      <li
        ref={ref}
        className={cn(listItemVariants({ interactive, selected, disabled }), className)}
        {...props}
      >
        {/* State layer for interactive items */}
        {interactive && !selected && (
          <span className="absolute inset-0 pointer-events-none bg-on-surface opacity-0 transition-opacity duration-short group-hover:opacity-8 group-active:opacity-12 z-0" />
        )}

        {/* Ripple effect for interactive items */}
        {interactive && <Ripple disabled={disabled} />}

        {content}
      </li>
    );
  }
);

ListItem.displayName = "ListItem";

// List Divider
export const ListDivider = ({ className }: { className?: string }) => (
  <li className={cn("h-px bg-outline-variant/30 mx-4u", className)} role="separator" />
);

// List Subheader
export const ListSubheader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <li className={cn("px-4u py-2u text-label-small font-medium text-on-surface-variant", className)}>
    {children}
  </li>
);