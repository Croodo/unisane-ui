# Navigation

Components for app navigation and wayfinding following Material Design 3 specifications.

## Table of Contents

1. [Tabs](#tabs)
2. [NavigationRail](#navigationrail)
3. [NavigationBar](#navigationbar)
4. [NavigationDrawer](#navigationdrawer)
5. [TopAppBar](#topappbar)
6. [useNavigation Hook](#usenavigation-hook)
7. [Design Tokens](#design-tokens)
8. [Best Practices](#best-practices)

---

## Tabs

Horizontal navigation between related content sections.

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Height (text only) | 48dp | `h-12u` |
| Height (text + icon) | 72dp | `h-18u` |
| Min tab width | 72dp (scrollable) | `min-w-18u` |
| Max tab width | 264dp | `max-w-66u` |
| Horizontal padding | 12dp | `px-3u` |
| Indicator height | 2dp | `h-0.5u` |
| Icon size | 24dp | `w-6u h-6u` |
| Typography | Label Large | `text-label-large` |
| Elevation | 0dp | - |
| Animation duration | 250ms | `duration-medium` |
| State layer opacity (hover) | 8% | `opacity-8` |

> **Sources**: [m3.material.io/components/tabs/specs](https://m3.material.io/components/tabs/specs), [material-components-android Tabs.md](https://github.com/material-components/material-components-android/blob/master/docs/components/Tabs.md)

### Variants

**Primary Tabs**: Placed at the top of the content pane under a top app bar. Display main content destinations.

**Secondary Tabs**: Used within a content area to further separate related content and establish hierarchy.

### File: `components/ui/tabs.tsx`

```tsx
"use client";

import { createContext, useContext, forwardRef } from "react";
import { Ripple } from "@/components/ui/ripple";
import { cn } from "@/lib/utils";

/**
 * Material Design 3 Tabs
 *
 * M3 Spec:
 * - Height: 48dp (text), 72dp (text + icon)
 * - Indicator: 2dp, primary color
 * - Min width: 72dp (scrollable)
 * - Typography: Label Large
 *
 * @see https://m3.material.io/components/tabs/specs
 */

interface TabsContextType {
  value: string;
  onChange: (value: string) => void;
  variant: "primary" | "secondary";
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  className?: string;
}

export const Tabs = ({
  value,
  onChange,
  variant = "primary",
  children,
  className = "",
}: TabsProps) => {
  return (
    <TabsContext.Provider value={{ value, onChange, variant }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

// TabsList - Container for tab triggers
interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, className = "" }, ref) => {
    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(
          "flex items-center border-b border-outline-variant",
          className
        )}
      >
        {children}
      </div>
    );
  }
);

TabsList.displayName = "TabsList";

// TabsTrigger - Individual tab button
interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, children, icon, disabled = false, className = "" }, ref) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const isActive = context.value === value;
    const hasIcon = !!icon;

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        disabled={disabled}
        onClick={() => context.onChange(value)}
        className={cn(
          // Base - 48dp or 72dp height
          "relative flex flex-col items-center justify-center gap-1u px-4u min-w-18u overflow-hidden group",
          hasIcon ? "h-18u" : "h-12u",
          // Typography
          "text-label-large font-medium",
          // Colors
          isActive ? "text-primary" : "text-on-surface-variant",
          // State layer
          !isActive && "hover:bg-on-surface/8",
          // Disabled
          disabled ? "opacity-38 cursor-not-allowed" : "cursor-pointer",
          // Focus ring
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          // Transition
          "transition-colors duration-short",
          className
        )}
      >
        <Ripple disabled={disabled} />

        {/* Icon - 24dp */}
        {icon && (
          <span className="w-6u h-6u flex items-center justify-center relative z-10">
            {icon}
          </span>
        )}

        {/* Label */}
        <span className="relative z-10">{children}</span>

        {/* Active indicator - 2dp height */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-0.5u bg-primary rounded-t-full z-10",
            "transition-transform duration-medium ease-emphasized origin-bottom",
            isActive ? "scale-y-100" : "scale-y-0"
          )}
        />
      </button>
    );
  }
);

TabsTrigger.displayName = "TabsTrigger";

// TabsContent - Content panel
interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsContent = ({ value, children, className = "" }: TabsContentProps) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");

  if (context.value !== value) return null;

  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
};
```

### Usage Examples

```tsx
const [activeTab, setActiveTab] = useState("overview");

// Primary tabs (text only)
<Tabs value={activeTab} onChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>

  <TabsContent value="overview" className="p-6u">
    <h2>Overview Content</h2>
  </TabsContent>
  <TabsContent value="details" className="p-6u">
    <h2>Details Content</h2>
  </TabsContent>
  <TabsContent value="settings" className="p-6u">
    <h2>Settings Content</h2>
  </TabsContent>
</Tabs>

// Tabs with icons (72dp height)
<Tabs value={activeTab} onChange={setActiveTab}>
  <TabsList>
    <TabsTrigger
      value="flights"
      icon={<FlightIcon className="w-6u h-6u" />}
    >
      Flights
    </TabsTrigger>
    <TabsTrigger
      value="hotels"
      icon={<HotelIcon className="w-6u h-6u" />}
    >
      Hotels
    </TabsTrigger>
  </TabsList>
</Tabs>
```

---

## NavigationRail

Vertical navigation for medium to large screens (tablets, desktops).

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Width | 80dp | `w-20u` |
| Icon size | 24dp | `w-6u h-6u` |
| Active indicator width | 56dp | `w-14u` |
| Active indicator height | 32dp | `h-8u` |
| Active indicator shape | 50% rounded | `rounded-full` |
| Item min height | 60dp | `min-h-15u` |
| Item spacing | 0dp (M3), 4dp (Expressive) | `gap-0` / `gap-1u` |
| Top padding | 4dp | `pt-1u` |
| Bottom padding | 12dp | `pb-3u` |
| Label typography | Label Medium | `text-label-medium` |
| Label max lines | 1 | `truncate` |
| Elevation | 0dp | - |
| State layer opacity (hover) | 8% | `opacity-8` |

> **Sources**: [m3.material.io/components/navigation-rail/specs](https://m3.material.io/components/navigation-rail/specs), [material-components-android NavigationRail.md](https://github.com/material-components/material-components-android/blob/master/docs/components/NavigationRail.md)

### File: `components/ui/navigation-rail.tsx`

```tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Ripple } from "@/components/ui/ripple";

/**
 * Material Design 3 Navigation Rail
 *
 * M3 Spec:
 * - Width: 80dp
 * - Icon: 24dp
 * - Active indicator: 56dp × 32dp, pill shape
 * - Item height: 60dp minimum
 * - 3-7 destinations
 *
 * @see https://m3.material.io/components/navigation-rail/specs
 */

export interface RailItem {
  value: string;
  label: string;
  icon: React.ReactNode | string;
  activeIcon?: React.ReactNode | string;
  badge?: string | number;
  disabled?: boolean;
}

interface NavigationRailProps {
  items: RailItem[];
  value: string;
  onChange: (value: string) => void;
  onItemHover?: (value: string) => void;
  onMouseLeave?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  alignment?: "start" | "center" | "end";
  className?: string;
}

// Helper to render Material Symbols icons
const renderIcon = (icon: React.ReactNode | string, isActive: boolean = false) => {
  if (typeof icon === "string") {
    return (
      <span
        className={cn(
          "material-symbols-outlined !text-[24px] transition-all duration-short",
          isActive && "scale-110"
        )}
        style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
    );
  }
  return icon;
};

export const NavigationRail: React.FC<NavigationRailProps> = ({
  items,
  value,
  onChange,
  onItemHover,
  onMouseLeave,
  header,
  footer,
  alignment = "start",
  className,
}) => {
  return (
    <nav
      className={cn(
        // Container - 80dp wide
        "flex flex-col items-center w-20u h-full",
        "bg-surface-container border-r border-outline-variant",
        "pt-1u pb-3u gap-0 z-50 shrink-0",
        className
      )}
      aria-label="Main Navigation"
      onMouseLeave={onMouseLeave}
    >
      {/* Header area (optional FAB or logo) */}
      {header && (
        <div className="flex flex-col items-center gap-4u pb-2u mb-2u w-full">
          {header}
        </div>
      )}

      {/* Items container */}
      <div
        className={cn(
          "flex flex-col items-center gap-0 w-full flex-1",
          alignment === "center" && "justify-center",
          alignment === "end" && "justify-end"
        )}
      >
        {items.map((item) => {
          const isActive = value === item.value;

          return (
            <button
              key={item.value}
              onClick={() => !item.disabled && onChange(item.value)}
              onMouseEnter={() => !item.disabled && onItemHover?.(item.value)}
              onFocus={() => !item.disabled && onItemHover?.(item.value)}
              disabled={item.disabled}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                // Item container - 60dp min height
                "group flex flex-col items-center gap-1u w-full py-1u min-h-15u",
                "relative select-none cursor-pointer outline-none",
                // Focus ring
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                // Disabled
                item.disabled && "opacity-38 cursor-not-allowed pointer-events-none"
              )}
            >
              {/* Icon container with indicator */}
              <div className="relative flex items-center justify-center">
                {/* Active indicator - 56dp × 32dp pill */}
                <div
                  className={cn(
                    "w-14u h-8u rounded-full flex items-center justify-center",
                    "transition-all duration-medium ease-emphasized overflow-hidden relative",
                    isActive
                      ? "bg-secondary-container text-on-secondary-container"
                      : "text-on-surface-variant bg-transparent hover:bg-on-surface/8"
                  )}
                >
                  <Ripple center disabled={item.disabled} />
                  <span className="z-10 relative">
                    {isActive && item.activeIcon
                      ? renderIcon(item.activeIcon, true)
                      : renderIcon(item.icon, isActive)}
                  </span>
                </div>

                {/* Badge */}
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "absolute -top-1u -right-1u min-w-4u h-4u px-1u",
                      "bg-error text-on-error text-label-small",
                      "flex items-center justify-center rounded-full font-medium",
                      "z-20 pointer-events-none ring-2 ring-surface-container"
                    )}
                  >
                    {typeof item.badge === "number" && item.badge > 99
                      ? "99+"
                      : item.badge}
                  </span>
                )}
              </div>

              {/* Label - Label Medium, single line */}
              <span
                className={cn(
                  "text-label-medium font-medium text-center px-1u max-w-full truncate",
                  "transition-colors duration-short",
                  isActive
                    ? "text-on-surface font-semibold"
                    : "text-on-surface-variant group-hover:text-on-surface"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer area */}
      {footer && (
        <div className="flex flex-col items-center gap-4u pt-2u mt-auto w-full">
          {footer}
        </div>
      )}
    </nav>
  );
};
```

### Usage Examples

```tsx
const [selectedNav, setSelectedNav] = useState("home");

<NavigationRail
  className="fixed left-0 top-0 h-screen hidden md:flex"
  items={[
    { value: "home", label: "Home", icon: "home" },
    { value: "search", label: "Search", icon: "search", badge: 3 },
    { value: "library", label: "Library", icon: "video_library" },
    { value: "profile", label: "Profile", icon: "person" },
  ]}
  value={selectedNav}
  onChange={setSelectedNav}
  header={
    <FAB size="small" icon={<AddIcon />} onClick={handleCreate} />
  }
  footer={
    <IconButton variant="standard" ariaLabel="Settings">
      <SettingsIcon />
    </IconButton>
  }
/>
```

---

## NavigationBar

Bottom navigation for mobile screens.

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Height | 80dp | `h-20u` |
| Icon size | 24dp | `w-6u h-6u` |
| Active indicator width | 56dp | `w-14u` |
| Active indicator height | 32dp | `h-8u` |
| Active indicator shape | 50% rounded | `rounded-full` |
| Top padding | 12dp | `pt-3u` |
| Bottom padding | 16dp | `pb-4u` |
| Icon-label spacing | 4dp | `gap-1u` |
| Label typography | Title Small | `text-title-small` |
| Elevation | 3dp | `shadow-1` |
| Destinations | 3-5 | - |
| State layer opacity (hover) | 8% | `opacity-8` |

> **Sources**: [m3.material.io/components/navigation-bar/specs](https://m3.material.io/components/navigation-bar/specs), [material-components-android BottomNavigation.md](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomNavigation.md)

### File: `components/ui/navigation-bar.tsx`

```tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Ripple } from "@/components/ui/ripple";

/**
 * Material Design 3 Navigation Bar (Bottom Navigation)
 *
 * M3 Spec:
 * - Height: 80dp
 * - Icon: 24dp
 * - Active indicator: 56dp × 32dp
 * - 3-5 destinations
 * - Elevation: 3dp
 *
 * @see https://m3.material.io/components/navigation-bar/specs
 */

export interface NavBarItem {
  value: string;
  label: string;
  icon: React.ReactNode | string;
  activeIcon?: React.ReactNode | string;
  badge?: string | number;
  disabled?: boolean;
}

interface NavigationBarProps {
  items: NavBarItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const renderIcon = (icon: React.ReactNode | string, isActive: boolean = false) => {
  if (typeof icon === "string") {
    return (
      <span
        className="material-symbols-outlined !text-[24px]"
        style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
    );
  }
  return icon;
};

export const NavigationBar: React.FC<NavigationBarProps> = ({
  items,
  value,
  onChange,
  className,
}) => {
  return (
    <nav
      className={cn(
        // Container - 80dp height, elevation 3
        "flex items-center justify-around w-full h-20u",
        "bg-surface-container shadow-1",
        "pt-3u pb-4u",
        className
      )}
      aria-label="Bottom Navigation"
    >
      {items.map((item) => {
        const isActive = value === item.value;

        return (
          <button
            key={item.value}
            onClick={() => !item.disabled && onChange(item.value)}
            disabled={item.disabled}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              // Flexible item width
              "group flex flex-col items-center justify-center gap-1u",
              "flex-1 min-w-[80px] max-w-[168px] py-2u",
              "relative select-none cursor-pointer outline-none",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
              item.disabled && "opacity-38 cursor-not-allowed pointer-events-none"
            )}
          >
            {/* Icon with indicator */}
            <div className="relative flex items-center justify-center">
              {/* Active indicator - 56dp × 32dp */}
              <div
                className={cn(
                  "w-14u h-8u rounded-full flex items-center justify-center",
                  "transition-all duration-medium ease-emphasized overflow-hidden relative",
                  isActive
                    ? "bg-secondary-container text-on-secondary-container"
                    : "text-on-surface-variant bg-transparent"
                )}
              >
                <Ripple center disabled={item.disabled} />
                <span className="z-10 relative">
                  {isActive && item.activeIcon
                    ? renderIcon(item.activeIcon, true)
                    : renderIcon(item.icon, isActive)}
                </span>
              </div>

              {/* Badge */}
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "absolute -top-1u -right-1u min-w-4u h-4u px-1u",
                    "bg-error text-on-error text-label-small",
                    "flex items-center justify-center rounded-full font-medium",
                    "z-20 pointer-events-none"
                  )}
                >
                  {typeof item.badge === "number" && item.badge > 99
                    ? "99+"
                    : item.badge}
                </span>
              )}
            </div>

            {/* Label - Title Small */}
            <span
              className={cn(
                "text-title-small font-medium text-center max-w-full truncate",
                "transition-colors duration-short",
                isActive ? "text-on-surface" : "text-on-surface-variant"
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
```

### Usage Examples

```tsx
const [activeNav, setActiveNav] = useState("home");

<NavigationBar
  className="fixed bottom-0 left-0 right-0 md:hidden"
  items={[
    { value: "home", label: "Home", icon: "home" },
    { value: "explore", label: "Explore", icon: "explore" },
    { value: "saved", label: "Saved", icon: "bookmark", badge: 5 },
    { value: "profile", label: "Profile", icon: "person" },
  ]}
  value={activeNav}
  onChange={setActiveNav}
/>
```

---

## NavigationDrawer

Side drawer for hierarchical navigation with sub-items.

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Width | 360dp (max) | `max-w-90u` |
| Width (compact) | 256dp | `w-64u` |
| Edge gap | 56dp minimum | - |
| Item height | 56dp | `h-14u` |
| Item shape | Full (pill) | `rounded-full` |
| Item horizontal padding | 16dp | `px-4u` |
| Horizontal margin | 12dp | `mx-3u` |
| Icon size | 24dp | `w-6u h-6u` |
| Icon-label spacing | 12dp | `gap-3u` |
| Typography | Label Large | `text-label-large` |
| Headline typography | Title Small | `text-title-small` |
| Corner radius (modal) | 28dp (end corners) | `rounded-e-3xl` |
| Elevation (modal) | 1dp | `shadow-1` |
| State layer opacity (hover) | 8% | `opacity-8` |

> **Sources**: [m3.material.io/components/navigation-drawer/specs](https://m3.material.io/components/navigation-drawer/specs), [material-components-android NavigationDrawer.md](https://github.com/material-components/material-components-android/blob/master/docs/components/NavigationDrawer.md)

### File: `components/ui/navigation-drawer.tsx`

```tsx
"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Ripple } from "@/components/ui/ripple";

/**
 * Material Design 3 Navigation Drawer
 *
 * M3 Spec:
 * - Width: 360dp max, 256dp compact
 * - Item height: 56dp
 * - Item shape: Full (pill)
 * - Icon: 24dp
 * - Modal corner radius: 28dp (end corners)
 *
 * @see https://m3.material.io/components/navigation-drawer/specs
 */

interface NavigationDrawerProps {
  open?: boolean;
  modal?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const NavigationDrawer = forwardRef<HTMLElement, NavigationDrawerProps>(
  (
    {
      open = true,
      modal = false,
      onClose,
      children,
      className,
      style,
      onMouseEnter,
      onMouseLeave,
    },
    ref
  ) => {
    return (
      <aside
        ref={ref}
        className={cn(
          // Base
          "flex flex-col h-full bg-surface-container overflow-y-auto",
          "transition-transform duration-emphasized ease-emphasized",
          // Modal vs Standard
          modal
            ? "fixed inset-y-0 left-0 z-[60] shadow-1 rounded-e-3xl max-w-[85vw] w-[300px]"
            : "fixed inset-y-0 left-0 z-30 w-[300px]",
          // Open state
          open
            ? "translate-x-0 visible"
            : "-translate-x-full invisible",
          className
        )}
        style={style}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </aside>
    );
  }
);

NavigationDrawer.displayName = "NavigationDrawer";

// NavigationDrawerItem - 56dp height, pill shape
interface NavigationDrawerItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode | string;
  activeIcon?: React.ReactNode | string;
  badge?: string | number | React.ReactNode;
}

export const NavigationDrawerItem = forwardRef<HTMLButtonElement, NavigationDrawerItemProps>(
  ({ active, icon, activeIcon, badge, children, disabled, className, ...props }, ref) => {
    const renderIcon = (iconProp: React.ReactNode | string) => {
      if (typeof iconProp === "string") {
        return (
          <span
            className="material-symbols-outlined !text-[24px]"
            style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {iconProp}
          </span>
        );
      }
      return iconProp;
    };

    return (
      <div className="px-3u w-full">
        <button
          ref={ref}
          disabled={disabled}
          className={cn(
            // Item - 56dp height, pill shape
            "flex items-center gap-3u w-full h-14u py-3u px-4u rounded-full",
            "text-label-large font-medium cursor-pointer select-none",
            "group relative overflow-hidden outline-none",
            // Colors
            active
              ? "bg-secondary-container text-on-secondary-container"
              : "bg-transparent text-on-surface-variant hover:bg-on-surface/8",
            // Focus
            "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
            // Disabled
            disabled && "opacity-38 cursor-not-allowed",
            className
          )}
          {...props}
        >
          {/* State layer */}
          <span
            className={cn(
              "absolute inset-0 pointer-events-none transition-opacity duration-short",
              active && "bg-on-secondary-container opacity-0 group-hover:opacity-8 group-active:opacity-12"
            )}
          />
          <Ripple disabled={disabled} />

          {/* Icon - 24dp */}
          {icon && (
            <span
              className={cn(
                "w-6u h-6u flex items-center justify-center relative z-10",
                active ? "text-on-secondary-container" : "text-on-surface-variant"
              )}
            >
              {active && activeIcon ? renderIcon(activeIcon) : renderIcon(icon)}
            </span>
          )}

          {/* Label */}
          <span className="flex-1 text-left relative z-10 truncate">{children}</span>

          {/* Badge */}
          {badge !== undefined && (
            <span className="relative z-10 ml-auto text-label-small font-medium text-on-surface-variant">
              {badge}
            </span>
          )}
        </button>
      </div>
    );
  }
);

NavigationDrawerItem.displayName = "NavigationDrawerItem";

// NavigationDrawerHeadline - Section header
export const NavigationDrawerHeadline = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "px-5u pt-4u pb-2u text-title-small font-medium text-on-surface-variant",
      className
    )}
  >
    {children}
  </div>
);

// NavigationDrawerDivider
export const NavigationDrawerDivider = ({ className }: { className?: string }) => (
  <div className={cn("h-px bg-outline-variant my-2u mx-4u", className)} />
);
```

### Usage Examples

```tsx
// Standard drawer (desktop, alongside rail)
<NavigationDrawer
  open={isDrawerVisible}
  modal={false}
  className="pl-[80px]" // Offset for rail
  onMouseEnter={handleDrawerEnter}
  onMouseLeave={handleDrawerLeave}
>
  <NavigationDrawerHeadline>Components</NavigationDrawerHeadline>

  <NavigationDrawerItem
    active={activeItem === "buttons"}
    icon="smart_button"
    onClick={() => setActiveItem("buttons")}
  >
    Buttons
  </NavigationDrawerItem>

  <NavigationDrawerItem
    icon="input"
    badge={3}
    onClick={() => setActiveItem("inputs")}
  >
    Inputs
  </NavigationDrawerItem>

  <NavigationDrawerDivider />

  <NavigationDrawerItem icon="palette">
    Theming
  </NavigationDrawerItem>
</NavigationDrawer>

// Modal drawer (mobile)
<NavigationDrawer
  open={isMobileMenuOpen}
  modal={true}
  onClose={closeMobileMenu}
>
  <NavigationDrawerHeadline>Menu</NavigationDrawerHeadline>
  {/* items */}
</NavigationDrawer>
```

---

## TopAppBar

Application header bar with title, navigation, and actions.

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Height (small) | 64dp | `h-16u` |
| Height (medium) | 112dp | `h-28u` |
| Height (large) | 152dp | `h-38u` |
| Horizontal padding | 16dp | `px-4u` |
| Icon size | 24dp | `w-6u h-6u` |
| Title typography | Title Large | `text-title-large` |
| Headline typography (large) | Headline Medium | `text-headline-medium` |
| Elevation (on scroll) | 2dp | `shadow-1` |

> **Source**: [m3.material.io/components/top-app-bar/specs](https://m3.material.io/components/top-app-bar/specs)

### File: `components/ui/top-app-bar.tsx`

```tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Material Design 3 Top App Bar
 *
 * M3 Spec:
 * - Height: 64dp (small), 112dp (medium), 152dp (large)
 * - Padding: 16dp horizontal
 * - Title: Title Large
 *
 * @see https://m3.material.io/components/top-app-bar/specs
 */

interface TopAppBarProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  variant?: "center-aligned" | "small" | "medium" | "large";
  navigationIcon?: React.ReactNode;
  actions?: React.ReactNode;
  elevated?: boolean;
}

export const TopAppBar = forwardRef<HTMLElement, TopAppBarProps>(
  (
    {
      title,
      variant = "small",
      navigationIcon,
      actions,
      elevated = false,
      className,
      ...props
    },
    ref
  ) => {
    const isCentered = variant === "center-aligned";
    const isLarge = variant === "large" || variant === "medium";

    return (
      <header
        ref={ref}
        className={cn(
          // Base
          "bg-surface flex items-center px-4u",
          "border-b border-outline-variant",
          // Height per variant
          variant === "small" && "h-16u",
          variant === "center-aligned" && "h-16u",
          variant === "medium" && "h-28u flex-wrap content-end pb-4u",
          variant === "large" && "h-38u flex-wrap content-end pb-6u",
          // Elevation
          elevated && "shadow-1",
          className
        )}
        {...props}
      >
        {/* Navigation icon */}
        {navigationIcon && (
          <div className="mr-4u shrink-0">{navigationIcon}</div>
        )}

        {/* Title */}
        <h1
          className={cn(
            isLarge ? "text-headline-medium w-full" : "text-title-large",
            isCentered && "text-center flex-1",
            !isCentered && !isLarge && "flex-1 truncate"
          )}
        >
          {title}
        </h1>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2u ml-auto shrink-0">{actions}</div>
        )}
      </header>
    );
  }
);

TopAppBar.displayName = "TopAppBar";
```

### Usage Examples

```tsx
// Small (default)
<TopAppBar
  title="My App"
  navigationIcon={
    <IconButton variant="standard" ariaLabel="Menu">
      <MenuIcon />
    </IconButton>
  }
  actions={
    <>
      <IconButton variant="standard" ariaLabel="Search">
        <SearchIcon />
      </IconButton>
      <IconButton variant="standard" ariaLabel="More">
        <MoreIcon />
      </IconButton>
    </>
  }
/>

// Center-aligned
<TopAppBar
  variant="center-aligned"
  title="Settings"
  navigationIcon={
    <IconButton variant="standard" ariaLabel="Back">
      <ArrowBackIcon />
    </IconButton>
  }
/>

// Large
<TopAppBar
  variant="large"
  title="Welcome back"
  navigationIcon={
    <IconButton variant="standard" ariaLabel="Menu">
      <MenuIcon />
    </IconButton>
  }
/>
```

---

## useNavigation Hook

Custom hook for managing Rail + Drawer navigation state.

### File: `hooks/use-navigation.ts`

```tsx
import { useState, useRef, useCallback, useEffect } from "react";

interface NavCategory {
  id: string;
  label: string;
  icon: string;
  badge?: string | number;
  items?: NavSubItem[];
}

interface NavSubItem {
  id: string;
  label: string;
  icon?: string;
}

export const useNavigation = (navData: NavCategory[]) => {
  // Persistent state (user clicked)
  const [activeCategoryId, setActiveCategoryId] = useState<string>("home");
  const [activeSubItemId, setActiveSubItemId] = useState<string>("");
  const [isDrawerLocked, setIsDrawerLocked] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Transient state (hover)
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [lastContentCategoryId, setLastContentCategoryId] = useState<string>("home");

  // Timeout refs for debounced interactions
  const entryTimeoutRef = useRef<number | null>(null);
  const exitTimeoutRef = useRef<number | null>(null);

  // Handle category click
  const handleCategoryClick = useCallback(
    (id: string) => {
      if (entryTimeoutRef.current) clearTimeout(entryTimeoutRef.current);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);

      const category = navData.find((c) => c.id === id);
      const hasItems = category?.items && category.items.length > 0;

      if (activeCategoryId === id) {
        // Toggle lock if clicking same category
        if (hasItems) setIsDrawerLocked((prev) => !prev);
        else setIsDrawerLocked(false);
      } else {
        setActiveCategoryId(id);
        setActiveSubItemId("");
        setIsDrawerLocked(!!hasItems);
      }

      if (!hasItems) setIsMobileMenuOpen(false);
      setHoveredCategoryId(null);
    },
    [activeCategoryId, navData]
  );

  // Handle sub-item click
  const handleSubItemClick = useCallback((id: string) => {
    if (entryTimeoutRef.current) clearTimeout(entryTimeoutRef.current);
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);

    setActiveSubItemId(id);
    setIsDrawerLocked(true);
    setIsMobileMenuOpen(false);
    setHoveredCategoryId(null);
  }, []);

  // Hover with 150ms entry delay
  const handleInteractionEnter = useCallback((id: string) => {
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    if (entryTimeoutRef.current) clearTimeout(entryTimeoutRef.current);

    entryTimeoutRef.current = window.setTimeout(() => {
      setHoveredCategoryId(id);
    }, 150);
  }, []);

  // Leave with 300ms exit delay
  const handleInteractionLeave = useCallback(() => {
    if (entryTimeoutRef.current) clearTimeout(entryTimeoutRef.current);
    exitTimeoutRef.current = window.setTimeout(() => {
      setHoveredCategoryId(null);
    }, 300);
  }, []);

  // Keep drawer open when mouse enters
  const handleDrawerEnter = useCallback(() => {
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    if (entryTimeoutRef.current) clearTimeout(entryTimeoutRef.current);
  }, []);

  // Close drawer after delay when leaving
  const handleDrawerLeave = useCallback(() => {
    exitTimeoutRef.current = window.setTimeout(() => {
      setHoveredCategoryId(null);
    }, 300);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  // Derived state
  const activeCategory = navData.find((c) => c.id === activeCategoryId);
  const hoveredCategory = hoveredCategoryId
    ? navData.find((c) => c.id === hoveredCategoryId)
    : null;
  const hoverHasItems = hoveredCategory?.items && hoveredCategory.items.length > 0;

  let targetCategory = activeCategory;
  if (hoveredCategory && hoverHasItems) {
    targetCategory = hoveredCategory;
  }

  useEffect(() => {
    if (targetCategory?.items?.length && targetCategory) {
      setLastContentCategoryId(targetCategory.id);
    }
  }, [targetCategory]);

  const effectiveCategory = navData.find((c) => c.id === lastContentCategoryId);
  const isDrawerVisible = isDrawerLocked || (!!hoveredCategoryId && hoverHasItems);
  const isPushMode = isDrawerLocked;

  return {
    activeCategoryId,
    activeSubItemId,
    activeCategory,
    effectiveCategory,
    isDrawerVisible,
    isPushMode,
    isMobileMenuOpen,
    handleCategoryClick,
    handleSubItemClick,
    handleInteractionEnter,
    handleInteractionLeave,
    handleDrawerEnter,
    handleDrawerLeave,
    toggleMobileMenu,
  };
};
```

---

## Design Tokens

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `20u` | 80dp | Rail width, Nav Bar height |
| `16u` | 64dp | Top App Bar small height |
| `15u` | 60dp | Rail item min height |
| `14u` | 56dp | Drawer item height, indicator (expanded) |
| `12u` | 48dp | Tab height (text only) |
| `8u` | 32dp | Indicator height |
| `6u` | 24dp | Icon size |
| `4u` | 16dp | Padding |
| `3u` | 12dp | Padding, spacing |

### Typography

| Token | Usage |
|-------|-------|
| `text-title-large` | Top App Bar title |
| `text-title-small` | Nav Bar labels, Drawer headlines |
| `text-label-large` | Tab labels, Drawer items |
| `text-label-medium` | Rail labels |

### State Layer Opacity

| State | Opacity |
|-------|---------|
| Hover | 8% |
| Focus | 12% |
| Pressed | 12% |
| Disabled | 38% |

---

## Best Practices

### Responsive Navigation Pattern

```tsx
// Mobile: Bottom nav bar + modal drawer
<NavigationBar className="md:hidden fixed bottom-0" />
<NavigationDrawer modal={true} open={isMobileMenuOpen} />

// Tablet: Navigation rail only
<NavigationRail className="hidden md:flex lg:hidden" />

// Desktop: Rail + persistent drawer
<NavigationRail className="hidden lg:flex" />
<NavigationDrawer modal={false} open={isDrawerVisible} className="hidden lg:flex" />
```

### Z-Index Layering

| Element | Mobile | Desktop |
|---------|--------|---------|
| Content | 0 | 0 |
| Backdrop | 59 | 20 |
| Rail | - | 50 |
| Drawer (standard) | - | 30 |
| Drawer (modal) | 60 | - |
| Nav Bar | 50 | - |
| Top App Bar | 50 | - |

### Accessibility

```tsx
// Proper ARIA labels
<NavigationRail items={[{
  value: "home",
  label: "Home", // Announced by screen reader
  icon: "home",
}]} />

// Current page indication
aria-current={isActive ? "page" : undefined}

// Tab keyboard navigation
<TabsList onKeyDown={(e) => {
  if (e.key === "ArrowRight") moveToNextTab();
  if (e.key === "ArrowLeft") moveToPreviousTab();
}} />
```

---

## Sources

- [m3.material.io/components/tabs/specs](https://m3.material.io/components/tabs/specs)
- [m3.material.io/components/navigation-rail/specs](https://m3.material.io/components/navigation-rail/specs)
- [m3.material.io/components/navigation-bar/specs](https://m3.material.io/components/navigation-bar/specs)
- [m3.material.io/components/navigation-drawer/specs](https://m3.material.io/components/navigation-drawer/specs)
- [m3.material.io/components/top-app-bar/specs](https://m3.material.io/components/top-app-bar/specs)
- [material-components-android Tabs.md](https://github.com/material-components/material-components-android/blob/master/docs/components/Tabs.md)
- [material-components-android NavigationRail.md](https://github.com/material-components/material-components-android/blob/master/docs/components/NavigationRail.md)
- [material-components-android BottomNavigation.md](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomNavigation.md)
- [material-components-android NavigationDrawer.md](https://github.com/material-components/material-components-android/blob/master/docs/components/NavigationDrawer.md)
