# Advanced Components

Advanced UI components for specialized use cases.

## Table of Contents

1. [ScrollArea](#scrollarea)
2. [Accordion](#accordion)
3. [Breadcrumb](#breadcrumb)
4. [Stepper](#stepper)
5. [Timeline](#timeline)

---

## ScrollArea

Custom scrollbar with smooth scrolling.

### File: `components/ui/scroll-area.tsx`

```tsx
"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const scrollAreaVariants = cva("relative", {
  variants: {
    showScrollbar: {
      hover: "scrollbar-hover",
      always: "scrollbar-visible",
      never: "no-scrollbar",
    },
    orientation: {
      vertical: "overflow-y-auto overflow-x-hidden",
      horizontal: "overflow-x-auto overflow-y-hidden",
      both: "overflow-auto",
    },
  },
  defaultVariants: {
    showScrollbar: "hover",
    orientation: "vertical",
  },
});

interface ScrollAreaProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof scrollAreaVariants> {
  maxHeight?: string | number;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      maxHeight,
      showScrollbar,
      orientation,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const maxHeightStyle =
      typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;

    return (
      <div
        ref={ref}
        className={cn(scrollAreaVariants({ showScrollbar, orientation }), className)}
        style={{ maxHeight: maxHeightStyle }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = "ScrollArea";
```

### CSS (add to your global styles):

```css
/* Custom scrollbar styles */
.scrollbar-visible {
  scrollbar-width: thin;
  scrollbar-color: var(--color-outline-variant) transparent;
}

.scrollbar-visible::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scrollbar-visible::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-visible::-webkit-scrollbar-thumb {
  background-color: var(--color-outline-variant);
  border-radius: 4px;
}

.scrollbar-visible::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-outline);
}

/* Hover-only scrollbar */
.scrollbar-hover {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.scrollbar-hover:hover {
  scrollbar-color: var(--color-outline-variant) transparent;
}

.scrollbar-hover::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scrollbar-hover::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-hover::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 4px;
}

.scrollbar-hover:hover::-webkit-scrollbar-thumb {
  background-color: var(--color-outline-variant);
}

.scrollbar-hover::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-outline);
}
```

### Usage Example

```tsx
// Vertical scroll with max height
<ScrollArea maxHeight="400px">
  <List>
    {items.map(item => <ListItem key={item.id}>{item.name}</ListItem>)}
  </List>
</ScrollArea>

// Horizontal scroll
<ScrollArea orientation="horizontal" showScrollbar="always">
  <div className="flex gap-4u min-w-max">
    {images.map(img => <Image key={img.id} src={img.src} />)}
  </div>
</ScrollArea>

// Chat messages scroll
<ScrollArea maxHeight="500px" showScrollbar="hover" className="p-4u">
  {messages.map(msg => (
    <div key={msg.id} className="mb-3u">
      <ChatMessage message={msg} />
    </div>
  ))}
</ScrollArea>

// Hidden scrollbar (touch devices)
<ScrollArea showScrollbar="never" maxHeight="100vh">
  <MobileContent />
</ScrollArea>
```

---

## Accordion

Collapsible content sections.

### File: `components/ui/accordion.tsx`

```tsx
"use client";

import { createContext, useContext, useState, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Ripple } from "@/components/ui/ripple";
import { stateLayers } from "@/utils/state-layers";
import { focusRing } from "@/utils/focus-ring";
import { animations } from "@/utils/animations";

interface AccordionContextType {
  openItems: string[];
  toggleItem: (value: string) => void;
  multiple?: boolean;
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

interface AccordionProps {
  children: React.ReactNode;
  defaultValue?: string | string[];
  multiple?: boolean;
  className?: string;
}

export const Accordion = ({ children, defaultValue = [], multiple = false, className }: AccordionProps) => {
  const [openItems, setOpenItems] = useState<string[]>(
    Array.isArray(defaultValue) ? defaultValue : [defaultValue]
  );

  const toggleItem = (value: string) => {
    setOpenItems((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return multiple ? [...prev, value] : [value];
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, multiple }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  );
};

// Accordion Item
const accordionItemVariants = cva("border-b border-outline-variant last:border-b-0");

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const AccordionItem = ({ value, children, className }: AccordionItemProps) => {
  return (
    <div className={cn(accordionItemVariants(), className)}>
      {children}
    </div>
  );
};

// Accordion Trigger
const accordionTriggerVariants = cva(
  cn("w-full flex items-center justify-between py-4u px-4u text-title-medium font-medium text-on-surface text-left relative overflow-hidden", stateLayers.hover, focusRing.default, animations.transition.colors)
);

const accordionIconVariants = cva(
  cn("material-symbols-outlined text-on-surface-variant", animations.transition.transform),
  {
    variants: {
      open: {
        true: "rotate-180",
        false: "",
      },
    },
    defaultVariants: {
      open: false,
    },
  }
);

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ value, children, className, ...props }, ref) => {
    const context = useContext(AccordionContext);
    if (!context) throw new Error("AccordionTrigger must be used within Accordion");

    const isOpen = context.openItems.includes(value);

    return (
      <button
        ref={ref}
        onClick={() => context.toggleItem(value)}
        aria-expanded={isOpen}
        className={cn(accordionTriggerVariants(), className)}
        {...props}
      >
        <Ripple />
        <span className="relative z-10">{children}</span>
        <span className={cn(accordionIconVariants({ open: isOpen }), "relative z-10")}>
          expand_more
        </span>
      </button>
    );
  }
);

AccordionTrigger.displayName = "AccordionTrigger";

// Accordion Content
const accordionContentVariants = cva(
  "overflow-hidden transition-all duration-emphasized ease-smooth",
  {
    variants: {
      open: {
        true: "max-h-250u opacity-100",
        false: "max-h-0 opacity-0",
      },
    },
    defaultVariants: {
      open: false,
    },
  }
);

interface AccordionContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const AccordionContent = ({ value, children, className }: AccordionContentProps) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error("AccordionContent must be used within Accordion");

  const isOpen = context.openItems.includes(value);

  return (
    <div className={cn(accordionContentVariants({ open: isOpen }))}>
      <div className={cn("px-4u pb-4u text-body-medium text-on-surface-variant", className)}>
        {children}
      </div>
    </div>
  );
};
```

### Usage Example

```tsx
// Single open item
<Accordion defaultValue="item1">
  <AccordionItem value="item1">
    <AccordionTrigger value="item1">What is Material Design 3?</AccordionTrigger>
    <AccordionContent value="item1">
      Material Design 3 is the latest version of Google's design system...
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="item2">
    <AccordionTrigger value="item2">How do I customize themes?</AccordionTrigger>
    <AccordionContent value="item2">
      You can customize themes by modifying the CSS custom properties...
    </AccordionContent>
  </AccordionItem>
</Accordion>

// Multiple items can be open
<Accordion multiple defaultValue={["item1", "item2"]}>
  <AccordionItem value="item1">
    <AccordionTrigger value="item1">Section 1</AccordionTrigger>
    <AccordionContent value="item1">Content 1</AccordionContent>
  </AccordionItem>

  <AccordionItem value="item2">
    <AccordionTrigger value="item2">Section 2</AccordionTrigger>
    <AccordionContent value="item2">Content 2</AccordionContent>
  </AccordionItem>
</Accordion>
```

---

## Breadcrumb

Navigation trail showing current location.

### File: `components/ui/breadcrumb.tsx`

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

const breadcrumbLinkVariants = cva("flex items-center gap-1u text-body-medium", {
  variants: {
    variant: {
      link: "text-primary hover:underline",
      current: "text-on-surface",
      ellipsis: "text-on-surface-variant",
    },
  },
  defaultVariants: {
    variant: "link",
  },
});

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, separator, maxItems, className, ...props }, ref) => {
    const defaultSeparator = (
      <span className="material-symbols-outlined text-on-surface-variant w-4u h-4u">
        chevron_right
      </span>
    );

    const displayedItems = maxItems && items.length > maxItems
      ? [
          ...items.slice(0, 1),
          { label: "...", href: undefined },
          ...items.slice(-(maxItems - 2)),
        ]
      : items;

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={className}
        {...props}
      >
        <ol className="flex items-center gap-2u flex-wrap">
          {displayedItems.map((item, index) => {
            const isLast = index === displayedItems.length - 1;
            const isEllipsis = item.label === "...";

            return (
              <li key={index} className="flex items-center gap-2u">
                {item.href && !isLast ? (
                  <a
                    href={item.href}
                    className={cn(breadcrumbLinkVariants({ variant: "link" }))}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <span
                    className={cn(
                      breadcrumbLinkVariants({
                        variant: isLast ? "current" : "ellipsis",
                      })
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                )}

                {!isLast && (
                  <span className="text-on-surface-variant" aria-hidden="true">
                    {separator || defaultSeparator}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);

Breadcrumb.displayName = "Breadcrumb";
```

### Usage Example

```tsx
// Simple breadcrumb
<Breadcrumb
  items={[
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "Laptops", href: "/products/laptops" },
    { label: "MacBook Pro" },
  ]}
/>

// With icons
<Breadcrumb
  items={[
    {
      label: "Home",
      href: "/",
      icon: <span className="material-symbols-outlined text-[20px]">home</span>,
    },
    { label: "Settings", href: "/settings" },
    { label: "Profile" },
  ]}
/>

// Custom separator
<Breadcrumb
  items={items}
  separator={<span className="text-on-surface-variant">/</span>}
/>

// Collapse long paths
<Breadcrumb
  items={longItemsList}
  maxItems={4}
/>
```

---

## Stepper

Step-by-step progress indicator.

### File: `components/ui/stepper.tsx`

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

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
                <div className={cn(stepIndicatorVariants({ status, clickable: isClickable }))}>
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
```

### Usage Example

```tsx
const [currentStep, setCurrentStep] = useState(0);

const steps = [
  { label: "Account", description: "Create your account" },
  { label: "Profile", description: "Add personal info" },
  { label: "Verify", description: "Verify email" },
  { label: "Complete", description: "All done!" },
];

// Horizontal stepper
<Stepper
  steps={steps}
  currentStep={currentStep}
  orientation="horizontal"
  onStepClick={(step) => setCurrentStep(step)}
/>

// Vertical stepper with icons
<Stepper
  steps={[
    {
      label: "Choose plan",
      icon: <span className="material-symbols-outlined">shopping_cart</span>,
    },
    {
      label: "Payment",
      icon: <span className="material-symbols-outlined">payment</span>,
    },
    {
      label: "Confirmation",
      icon: <span className="material-symbols-outlined">check_circle</span>,
    },
  ]}
  currentStep={currentStep}
  orientation="vertical"
/>
```

---

## Timeline

Chronological display of events.

### File: `components/ui/timeline.tsx`

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const timelineIconVariants = cva(
  "w-10u h-10u rounded-full flex items-center justify-center",
  {
    variants: {
      iconColor: {
        primary: "bg-primary text-on-primary",
        secondary: "bg-secondary text-on-secondary",
        success: "bg-success text-on-success",
        error: "bg-error text-on-error",
        warning: "bg-warning text-on-warning",
      },
    },
    defaultVariants: {
      iconColor: "primary",
    },
  }
);

interface TimelineItemProps extends VariantProps<typeof timelineIconVariants> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  time?: string;
  isLast?: boolean;
  className?: string;
}

export const TimelineItem = forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ children, icon, iconColor, time, isLast = false, className }, ref) => {
    return (
      <div ref={ref} className={cn("flex gap-4u", className)}>
        {/* Icon column */}
        <div className="flex flex-col items-center">
          <div className={cn(timelineIconVariants({ iconColor }))}>
            {icon || <span className="material-symbols-outlined w-5u h-5u">circle</span>}
          </div>
          {!isLast && (
            <div className="w-px flex-1 bg-outline-variant mt-2u" />
          )}
        </div>

        {/* Content column */}
        <div className="flex-1 pb-8u">
          {time && (
            <div className="text-label-small text-on-surface-variant mb-1u">
              {time}
            </div>
          )}
          <div className="text-body-medium text-on-surface">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

TimelineItem.displayName = "TimelineItem";

// Timeline container
interface TimelineProps {
  children: React.ReactNode;
  className?: string;
}

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }
);

Timeline.displayName = "Timeline";
```

### Usage Example

```tsx
<Timeline>
  <TimelineItem
    icon={<span className="material-symbols-outlined">check</span>}
    iconColor="success"
    time="2 hours ago"
  >
    <div className="font-medium mb-1u">Order confirmed</div>
    <p className="text-body-small text-on-surface-variant">
      Your order #12345 has been confirmed and is being prepared.
    </p>
  </TimelineItem>

  <TimelineItem
    icon={<span className="material-symbols-outlined">local_shipping</span>}
    iconColor="primary"
    time="1 hour ago"
  >
    <div className="font-medium mb-1u">Shipped</div>
    <p className="text-body-small text-on-surface-variant">
      Package has been handed to courier service.
    </p>
  </TimelineItem>

  <TimelineItem
    icon={<span className="material-symbols-outlined">schedule</span>}
    iconColor="warning"
    time="Expected today"
    isLast
  >
    <div className="font-medium mb-1u">Out for delivery</div>
    <p className="text-body-small text-on-surface-variant">
      Your package is on the way!
    </p>
  </TimelineItem>
</Timeline>
```

---

## Best Practices

### ScrollArea Usage

```tsx
// ✅ Set explicit max height
<ScrollArea maxHeight="400px">
  <LongContent />
</ScrollArea>

// ✅ Use hover scrollbar for clean UI
<ScrollArea showScrollbar="hover">
  <Content />
</ScrollArea>

// ✅ Hide scrollbar on mobile (touch scroll)
const isMobile = useIsMobile();
<ScrollArea showScrollbar={isMobile ? "never" : "hover"}>
  <Content />
</ScrollArea>
```

### Accordion Patterns

```tsx
// ✅ FAQ section
<Accordion>
  {faqs.map(faq => (
    <AccordionItem key={faq.id} value={faq.id}>
      <AccordionTrigger value={faq.id}>{faq.question}</AccordionTrigger>
      <AccordionContent value={faq.id}>{faq.answer}</AccordionContent>
    </AccordionItem>
  ))}
</Accordion>

// ✅ Settings groups (multiple open)
<Accordion multiple defaultValue={["general", "privacy"]}>
  <AccordionItem value="general">
    <AccordionTrigger value="general">General Settings</AccordionTrigger>
    <AccordionContent value="general">
      <SettingsForm />
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### Breadcrumb Navigation

```tsx
// ✅ Generate from route
const breadcrumbs = pathname.split("/").filter(Boolean).map((segment, index, arr) => ({
  label: segment.charAt(0).toUpperCase() + segment.slice(1),
  href: index < arr.length - 1 ? "/" + arr.slice(0, index + 1).join("/") : undefined,
}));

<Breadcrumb items={breadcrumbs} />

// ✅ Collapse long paths
<Breadcrumb items={longPath} maxItems={4} />
```

### Stepper UX

```tsx
// ✅ Allow back navigation
<Stepper
  steps={steps}
  currentStep={currentStep}
  onStepClick={(step) => {
    if (step < currentStep) {
      setCurrentStep(step); // Allow going back
    }
  }}
/>

// ✅ Disable navigation for incomplete steps
<Stepper
  steps={steps}
  currentStep={currentStep}
  onStepClick={(step) => {
    if (step < currentStep && !hasErrors) {
      setCurrentStep(step);
    }
  }}
/>
```

### Timeline Design

```tsx
// ✅ Color-code by status
<Timeline>
  <TimelineItem iconColor="success">Completed</TimelineItem>
  <TimelineItem iconColor="primary">In Progress</TimelineItem>
  <TimelineItem iconColor="warning" isLast>Pending</TimelineItem>
</Timeline>

// ✅ Show relative time
import { formatDistanceToNow } from 'date-fns';

<TimelineItem time={formatDistanceToNow(event.date, { addSuffix: true })}>
  {event.description}
</TimelineItem>
```

### Accessibility

```tsx
// ✅ Proper ARIA for accordion
<button aria-expanded={isOpen} aria-controls="panel-id">
  Trigger
</button>
<div id="panel-id" role="region">
  Content
</div>

// ✅ Breadcrumb navigation
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li aria-current="page">Current</li>
  </ol>
</nav>

// ✅ Stepper with proper labels
<Stepper
  steps={steps}
  currentStep={2}
  aria-label="Registration steps"
/>
```
