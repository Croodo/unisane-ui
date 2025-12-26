# Pagination & Rating

Common UI components for navigation and user feedback.

## Table of Contents

1. [Pagination](#pagination)
2. [Rating](#rating)

---

## Pagination

Navigate through pages of content.

### File: `components/ui/pagination.tsx`

```tsx
"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const paginationButtonVariants = cva(
  "inline-flex items-center justify-center rounded-sm font-medium transition-all duration-short focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
  {
    variants: {
      size: {
        sm: "h-8u min-w-8u px-2u text-label-medium",
        md: "h-10u min-w-10u px-3u text-label-large",
        lg: "h-12u min-w-12u px-4u text-title-medium",
      },
      disabled: {
        true: "opacity-38 cursor-not-allowed",
        false: "cursor-pointer",
      },
    },
    defaultVariants: {
      size: "md",
      disabled: false,
    },
  }
);

const pageButtonVariants = cva("", {
  variants: {
    active: {
      true: "bg-primary text-on-primary shadow-1",
      false: "bg-surface text-on-surface hover:bg-on-surface/8",
    },
  },
  defaultVariants: {
    active: false,
  },
});

const navButtonVariants = cva("bg-surface text-on-surface", {
  variants: {
    isDisabled: {
      true: "opacity-38",
      false: "hover:bg-on-surface/8",
    },
  },
  defaultVariants: {
    isDisabled: false,
  },
});

interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      siblingCount = 1,
      showFirstLast = true,
      showPrevNext = true,
      size = "md",
      disabled = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const range = (start: number, end: number) => {
      const length = end - start + 1;
      return Array.from({ length }, (_, idx) => start + idx);
    };

    const generatePagination = () => {
      const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
      const totalBlocks = totalNumbers + 2; // + 2 ellipsis

      if (totalPages <= totalBlocks) {
        return range(1, totalPages);
      }

      const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
      const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

      const showLeftEllipsis = leftSiblingIndex > 2;
      const showRightEllipsis = rightSiblingIndex < totalPages - 1;

      if (!showLeftEllipsis && showRightEllipsis) {
        const leftItemCount = 3 + 2 * siblingCount;
        const leftRange = range(1, leftItemCount);
        return [...leftRange, "ellipsis", totalPages];
      }

      if (showLeftEllipsis && !showRightEllipsis) {
        const rightItemCount = 3 + 2 * siblingCount;
        const rightRange = range(totalPages - rightItemCount + 1, totalPages);
        return [1, "ellipsis", ...rightRange];
      }

      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [1, "ellipsis", ...middleRange, "ellipsis", totalPages];
    };

    const pages = generatePagination();

    const pageButton = (page: number, isActive: boolean) => (
      <button
        key={page}
        type="button"
        onClick={() => !disabled && onPageChange(page)}
        disabled={disabled}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          paginationButtonVariants({ size, disabled }),
          pageButtonVariants({ active: isActive })
        )}
      >
        {page}
      </button>
    );

    const navButton = (
      direction: "first" | "prev" | "next" | "last",
      isDisabled: boolean
    ) => {
      const icons = {
        first: "first_page",
        prev: "chevron_left",
        next: "chevron_right",
        last: "last_page",
      };

      const labels = {
        first: "First page",
        prev: "Previous page",
        next: "Next page",
        last: "Last page",
      };

      const handlers = {
        first: () => onPageChange(1),
        prev: () => onPageChange(currentPage - 1),
        next: () => onPageChange(currentPage + 1),
        last: () => onPageChange(totalPages),
      };

      return (
        <button
          type="button"
          onClick={() => !disabled && !isDisabled && handlers[direction]()}
          disabled={disabled || isDisabled}
          aria-label={labels[direction]}
          className={cn(
            paginationButtonVariants({ size, disabled }),
            navButtonVariants({ isDisabled: isDisabled || disabled })
          )}
        >
          <span className="material-symbols-outlined">{icons[direction]}</span>
        </button>
      );
    };

    return (
      <nav
        ref={ref}
        role="navigation"
        aria-label="Pagination"
        className={cn("flex items-center gap-1u", className)}
        {...props}
      >
        {showFirstLast && navButton("first", currentPage === 1)}
        {showPrevNext && navButton("prev", currentPage === 1)}

        {pages.map((page, index) => {
          if (page === "ellipsis") {
            return (
              <span
                key={`ellipsis-${index}`}
                className={cn(
                  paginationButtonVariants({ size }),
                  "bg-transparent text-on-surface-variant cursor-default"
                )}
                aria-hidden="true"
              >
                ...
              </span>
            );
          }
          return pageButton(page as number, page === currentPage);
        })}

        {showPrevNext && navButton("next", currentPage === totalPages)}
        {showFirstLast && navButton("last", currentPage === totalPages)}
      </nav>
    );
  }
);

Pagination.displayName = "Pagination";

// Simple pagination variant
interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageInfo?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SimplePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageInfo = true,
  disabled = false,
  className,
}: SimplePaginationProps) => {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <Button
        variant="outlined"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        leftIcon={<span className="material-symbols-outlined">chevron_left</span>}
      >
        Previous
      </Button>

      {showPageInfo && (
        <span className="text-body-medium text-on-surface-variant">
          Page {currentPage} of {totalPages}
        </span>
      )}

      <Button
        variant="outlined"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        rightIcon={<span className="material-symbols-outlined">chevron_right</span>}
      >
        Next
      </Button>
    </div>
  );
};
```

### Usage Example

```tsx
// Full pagination
const [currentPage, setCurrentPage] = useState(1);
const totalPages = 20;

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  siblingCount={1}
/>

// Compact pagination (no first/last)
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  showFirstLast={false}
/>

// Small size
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  size="sm"
/>

// Simple pagination
<SimplePagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
/>

// With data table
const itemsPerPage = 10;
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const currentItems = allItems.slice(startIndex, endIndex);

<div>
  <Table data={currentItems} />
  <Pagination
    currentPage={currentPage}
    totalPages={Math.ceil(allItems.length / itemsPerPage)}
    onPageChange={setCurrentPage}
  />
</div>
```

---

## Rating

Star rating component for user feedback and display.

### File: `components/ui/rating.tsx`

```tsx
"use client";

import { forwardRef, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const ratingStarVariants = cva(
  "transition-all duration-short focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded-sm",
  {
    variants: {
      size: {
        sm: "w-5u h-5u",
        md: "w-6u h-6u",
        lg: "w-8u h-8u",
        xl: "w-10u h-10u",
      },
      interactive: {
        true: "cursor-pointer hover:scale-110",
        false: "cursor-default",
      },
      disabled: {
        true: "opacity-38",
        false: "",
      },
      filled: {
        true: "text-warning",
        false: "text-on-surface-variant",
      },
    },
    defaultVariants: {
      size: "md",
      interactive: true,
      disabled: false,
      filled: false,
    },
  }
);

interface RatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  max?: number;
  precision?: 0.5 | 1;
  size?: "sm" | "md" | "lg" | "xl";
  readOnly?: boolean;
  disabled?: boolean;
  showValue?: boolean;
  emptyIcon?: React.ReactNode;
  filledIcon?: React.ReactNode;
  halfIcon?: React.ReactNode;
}

export const Rating = forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      value: controlledValue,
      defaultValue = 0,
      onChange,
      max = 5,
      precision = 1,
      size = "md",
      readOnly = false,
      disabled = false,
      showValue = false,
      emptyIcon,
      filledIcon,
      halfIcon,
      className = "",
      ...props
    },
    ref
  ) => {
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const [internalValue, setInternalValue] = useState(defaultValue);

    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const displayValue = hoverValue ?? value;

    const handleClick = (newValue: number) => {
      if (readOnly || disabled) return;

      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    const handleMouseMove = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
      if (readOnly || disabled) return;

      const { left, width } = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - left) / width;

      if (precision === 0.5) {
        setHoverValue(index + (percent > 0.5 ? 1 : 0.5));
      } else {
        setHoverValue(index + 1);
      }
    };

    const handleMouseLeave = () => {
      if (readOnly || disabled) return;
      setHoverValue(null);
    };

    const getIconForPosition = (position: number) => {
      const diff = displayValue - position;

      if (diff >= 1) {
        return (
          filledIcon || (
            <span className="material-symbols-outlined fill">star</span>
          )
        );
      }

      if (diff >= 0.5 && precision === 0.5) {
        return (
          halfIcon || (
            <span className="material-symbols-outlined fill">star_half</span>
          )
        );
      }

      return (
        emptyIcon || <span className="material-symbols-outlined">star</span>
      );
    };

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-1u", className)}
        {...props}
      >
        <div
          className="inline-flex items-center gap-0.5u"
          role="radiogroup"
          aria-label="Rating"
          onMouseLeave={handleMouseLeave}
        >
          {Array.from({ length: max }, (_, index) => (
            <button
              key={index}
              type="button"
              role="radio"
              aria-checked={value === index + 1}
              aria-label={`${index + 1} star${index + 1 > 1 ? "s" : ""}`}
              disabled={disabled}
              className={cn(
                ratingStarVariants({
                  size,
                  interactive: !readOnly && !disabled,
                  disabled,
                  filled: displayValue > index,
                })
              )}
              onClick={() => handleClick(index + 1)}
              onMouseMove={(e) => handleMouseMove(index, e)}
            >
              {getIconForPosition(index)}
            </button>
          ))}
        </div>

        {showValue && (
          <span className="text-label-large text-on-surface-variant ml-2u">
            {value.toFixed(precision === 0.5 ? 1 : 0)}
          </span>
        )}
      </div>
    );
  }
);

Rating.displayName = "Rating";

// RatingDisplay - Read-only compact rating display
const ratingDisplayStarVariants = cva("material-symbols-outlined", {
  variants: {
    size: {
      sm: "w-4u h-4u",
      md: "w-5u h-5u",
      lg: "w-6u h-6u",
    },
    filled: {
      true: "fill text-warning",
      false: "text-on-surface-variant",
    },
  },
  defaultVariants: {
    size: "sm",
    filled: false,
  },
});

interface RatingDisplayProps {
  value: number;
  max?: number;
  showValue?: boolean;
  count?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const RatingDisplay = ({
  value,
  max = 5,
  showValue = true,
  count,
  size = "sm",
  className,
}: RatingDisplayProps) => {
  const filledStars = Math.floor(value);
  const hasHalfStar = value % 1 >= 0.5;
  const emptyStars = max - filledStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("inline-flex items-center gap-1u", className)}>
      <div className="inline-flex items-center gap-0.5u">
        {Array.from({ length: filledStars }, (_, i) => (
          <span
            key={`filled-${i}`}
            className={ratingDisplayStarVariants({ size, filled: true })}
          >
            star
          </span>
        ))}
        {hasHalfStar && (
          <span className={ratingDisplayStarVariants({ size, filled: true })}>
            star_half
          </span>
        )}
        {Array.from({ length: emptyStars }, (_, i) => (
          <span
            key={`empty-${i}`}
            className={ratingDisplayStarVariants({ size, filled: false })}
          >
            star
          </span>
        ))}
      </div>

      {showValue && (
        <span className="text-label-medium text-on-surface-variant">
          {value.toFixed(1)}
        </span>
      )}

      {count !== undefined && (
        <span className="text-label-medium text-on-surface-variant">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
};
```

### Usage Example

```tsx
// Interactive rating
const [rating, setRating] = useState(0);

<Rating
  value={rating}
  onChange={setRating}
  showValue
/>

// Half-star precision
<Rating
  value={rating}
  onChange={setRating}
  precision={0.5}
/>

// Read-only rating
<Rating value={4.5} readOnly precision={0.5} />

// Different sizes
<div className="space-y-4u">
  <Rating size="sm" value={4} readOnly />
  <Rating size="md" value={4} readOnly />
  <Rating size="lg" value={4} readOnly />
  <Rating size="xl" value={4} readOnly />
</div>

// Disabled state
<Rating value={3} disabled />

// Custom max stars
<Rating max={10} value={7} onChange={setRating} />

// Rating display (compact)
<RatingDisplay value={4.7} count={1234} />

// In product card
<Card>
  <Image src="/product.jpg" alt="Product" />
  <Typography variant="title-medium">Product Name</Typography>
  <RatingDisplay value={4.5} count={89} />
  <Typography variant="body-small" color="muted">$99.99</Typography>
</Card>

// With form
<Form>
  <FormField name="rating" label="Rate this product">
    <Rating
      value={formData.rating}
      onChange={(value) => setFormData({ ...formData, rating: value })}
    />
  </FormField>
</Form>
```

---

## Best Practices

### Pagination Usage

```tsx
// ✅ Calculate total pages correctly
const totalPages = Math.ceil(totalItems / itemsPerPage);

// ✅ Reset to page 1 when filters change
useEffect(() => {
  setCurrentPage(1);
}, [filters]);

// ✅ Show simple pagination on mobile
const isMobile = useMediaQuery("(max-width: 599px)");

{isMobile ? (
  <SimplePagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={setCurrentPage}
  />
) : (
  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={setCurrentPage}
  />
)}

// ✅ Show item count
<div className="flex items-center justify-between">
  <span className="text-body-small text-on-surface-variant">
    Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
  </span>
  <Pagination {...paginationProps} />
</div>
```

### Rating Patterns

```tsx
// ✅ Use RatingDisplay for showing existing ratings
<RatingDisplay value={product.averageRating} count={product.reviewCount} />

// ✅ Use interactive Rating for collecting feedback
<Rating value={userRating} onChange={setUserRating} />

// ✅ Show half stars for display, whole stars for input
<RatingDisplay value={4.7} precision={0.5} /> // Shows 4.5 stars visually
<Rating precision={1} /> // User can only select whole stars

// ✅ Provide clear labels
<div className="space-y-2u">
  <Label>How would you rate this product?</Label>
  <Rating value={rating} onChange={setRating} />
  <span className="text-body-small text-on-surface-variant">
    {rating === 0 && "Select a rating"}
    {rating === 1 && "Poor"}
    {rating === 2 && "Fair"}
    {rating === 3 && "Good"}
    {rating === 4 && "Very Good"}
    {rating === 5 && "Excellent"}
  </span>
</div>
```

### Accessibility

```tsx
// ✅ Provide proper ARIA labels for pagination
<nav role="navigation" aria-label="Pagination">
  <Pagination {...props} />
</nav>

// ✅ Use semantic page numbers
<button aria-current="page">5</button> // Current page
<button>6</button> // Other pages

// ✅ Rating should have radiogroup role
<div role="radiogroup" aria-label="Rating">
  {/* star buttons */}
</div>

// ✅ Each star should have descriptive label
<button aria-label="4 stars" aria-checked={rating === 4}>
  <Icon />
</button>
```

### Performance

```tsx
// ✅ Memoize pagination component
const PaginationMemo = React.memo(Pagination);

// ✅ Debounce page changes for API calls
const debouncedPageChange = useDebounce((page: number) => {
  fetchData(page);
}, 300);

<Pagination onPageChange={debouncedPageChange} />

// ✅ Use server-side pagination for large datasets
// Don't load all items in memory
const { data, totalPages } = await fetchPaginatedData(currentPage, pageSize);
```

### UX Considerations

```tsx
// ✅ Disable pagination during loading
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  disabled={isLoading}
/>

// ✅ Scroll to top on page change
const handlePageChange = (page: number) => {
  setCurrentPage(page);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ✅ Show loading state for ratings
{isLoadingRating ? (
  <Skeleton width={120} height={24} />
) : (
  <RatingDisplay value={rating} count={reviewCount} />
)}
```
