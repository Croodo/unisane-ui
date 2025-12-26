# Inputs & Forms

Form controls and input components for user data collection following Material Design 3 specifications.

## Table of Contents

1. [TextField](#textfield)
2. [Select](#select)
3. [Checkbox](#checkbox)
4. [Radio](#radio)
5. [Switch](#switch)
6. [Slider](#slider)
7. [Design Tokens](#design-tokens)
8. [Best Practices](#best-practices)

---

## TextField

Text input with floating label, helper text, and error states.

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Height | 56dp | `h-14u` |
| Container shape (filled) | Extra Small (4dp top corners) | `rounded-t-xs` |
| Container shape (outlined) | Extra Small (4dp all) | `rounded-xs` |
| Horizontal padding | 16dp | `px-4u` |
| Vertical padding (to text) | 16dp top, 16dp bottom | `py-4u` |
| Leading icon size | 24dp | `w-6u h-6u` |
| Trailing icon size | 24dp | `w-6u h-6u` |
| Icon spacing from edge | 12dp | `3u` |
| Input typography | Body Large | `text-body-large` |
| Label typography | Body Small (floating) | `text-body-small` |
| Supporting text typography | Body Small | `text-body-small` |
| Min width | 56dp (no label), 88dp (with label) | `min-w-14u` / `min-w-22u` |
| Max width | 488dp | `max-w-122u` |
| State layer opacity (hover) | 8% | `opacity-8` |
| State layer opacity (focus) | 0% (indicator instead) | - |
| Disabled opacity | 38% | `opacity-38` |
| Active indicator height | 2dp | `border-b-2` |

> **Sources**: [m3.material.io/components/text-fields/specs](https://m3.material.io/components/text-fields/specs), [material-web.dev/components/text-field](https://material-web.dev/components/text-field/)

### Variants

**Filled TextField**: Higher visual emphasis, uses background fill with bottom indicator.

**Outlined TextField**: Medium emphasis, uses border outline on all sides.

### File: `components/ui/text-field.tsx`

```tsx
"use client";

import { forwardRef, InputHTMLAttributes, useState, useId } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Material Design 3 TextField
 *
 * M3 Spec:
 * - Height: 56dp
 * - Shape: Extra Small (4dp corners)
 * - Padding: 16dp horizontal
 * - Typography: Body Large (input), Body Small (label, supporting)
 * - Icon size: 24dp
 *
 * @see https://m3.material.io/components/text-fields/specs
 */
const textFieldVariants = cva(
  "w-full h-14u text-body-large text-on-surface transition-colors duration-short focus:outline-none placeholder:text-on-surface-variant disabled:opacity-38 disabled:cursor-not-allowed peer",
  {
    variants: {
      variant: {
        filled:
          "bg-surface-container-highest rounded-t-xs border-b-2 border-on-surface-variant focus:border-primary px-4u pt-6u pb-2u",
        outlined:
          "bg-transparent rounded-xs border-2 border-outline focus:border-primary px-4u py-4u",
      },
      error: {
        true: "",
        false: "",
      },
      hasLeadingIcon: {
        true: "",
        false: "",
      },
      hasTrailingIcon: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      // Filled with icons
      { variant: "filled", hasLeadingIcon: true, className: "pl-12u" },
      { variant: "filled", hasTrailingIcon: true, className: "pr-12u" },
      // Outlined with icons
      { variant: "outlined", hasLeadingIcon: true, className: "pl-12u" },
      { variant: "outlined", hasTrailingIcon: true, className: "pr-12u" },
      // Error states
      {
        variant: "filled",
        error: true,
        className: "border-error focus:border-error",
      },
      {
        variant: "outlined",
        error: true,
        className: "border-error focus:border-error",
      },
    ],
    defaultVariants: {
      variant: "filled",
      error: false,
      hasLeadingIcon: false,
      hasTrailingIcon: false,
    },
  }
);

interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    Omit<
      VariantProps<typeof textFieldVariants>,
      "hasLeadingIcon" | "hasTrailingIcon"
    > {
  label?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  variant?: "filled" | "outlined";
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      helperText,
      error = false,
      variant = "filled",
      leadingIcon,
      trailingIcon,
      className,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = Boolean(props.value || props.defaultValue);

    return (
      <div className="w-full">
        <div className="relative">
          {/* Leading icon - 24dp, 12dp from edge */}
          {leadingIcon && (
            <div
              className={cn(
                "absolute left-3u top-1/2 -translate-y-1/2 w-6u h-6u flex items-center justify-center",
                error ? "text-error" : "text-on-surface-variant"
              )}
            >
              {leadingIcon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            className={cn(
              textFieldVariants({
                variant,
                error,
                hasLeadingIcon: !!leadingIcon,
                hasTrailingIcon: !!trailingIcon,
              }),
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {/* Floating label */}
          {label && (
            <label
              htmlFor={id}
              className={cn(
                "absolute left-4u transition-all duration-short pointer-events-none",
                leadingIcon && "left-12u",
                // Floating state
                isFocused || hasValue
                  ? "top-2u text-body-small"
                  : "top-1/2 -translate-y-1/2 text-body-large",
                // Colors
                error
                  ? "text-error"
                  : isFocused
                    ? "text-primary"
                    : "text-on-surface-variant"
              )}
            >
              {label}
            </label>
          )}

          {/* Trailing icon - 24dp, 12dp from edge */}
          {trailingIcon && (
            <div
              className={cn(
                "absolute right-3u top-1/2 -translate-y-1/2 w-6u h-6u flex items-center justify-center",
                error ? "text-error" : "text-on-surface-variant"
              )}
            >
              {trailingIcon}
            </div>
          )}
        </div>

        {/* Supporting text - Body Small */}
        {helperText && (
          <p
            className={cn(
              "mt-1u px-4u text-body-small",
              error ? "text-error" : "text-on-surface-variant"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"filled" \| "outlined"` | `"filled"` | Visual style variant |
| `label` | `string` | `undefined` | Floating label text |
| `helperText` | `string` | `undefined` | Supporting/error text below input |
| `error` | `boolean` | `false` | Error state styling |
| `leadingIcon` | `ReactNode` | `undefined` | Icon before input (24dp) |
| `trailingIcon` | `ReactNode` | `undefined` | Icon after input (24dp) |

### Usage Examples

```tsx
// Filled (default)
<TextField
  label="Email"
  type="email"
  placeholder="you@example.com"
/>

// Outlined
<TextField
  variant="outlined"
  label="Username"
/>

// With helper text
<TextField
  label="Password"
  type="password"
  helperText="Must be at least 8 characters"
/>

// Error state
<TextField
  label="Email"
  error
  helperText="Invalid email format"
/>

// With icons
<TextField
  label="Search"
  leadingIcon={<SearchIcon className="w-6u h-6u" />}
/>

<TextField
  label="Password"
  type="password"
  trailingIcon={
    <button type="button" onClick={toggleVisibility}>
      <EyeIcon className="w-6u h-6u" />
    </button>
  }
/>
```

---

## Select

Dropdown selection with menu.

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Height | 56dp | `h-14u` |
| Shape | Extra Small (4dp) | `rounded-xs` |
| Horizontal padding | 16dp | `px-4u` |
| Trailing icon | 24dp expand_more | `w-6u h-6u` |
| Typography | Body Large | `text-body-large` |

> **Source**: [m3.material.io/components/menus/specs](https://m3.material.io/components/menus/specs)

### File: `components/ui/select.tsx`

```tsx
"use client";

import { forwardRef, SelectHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Material Design 3 Select
 *
 * M3 Spec:
 * - Height: 56dp
 * - Shape: Extra Small (4dp)
 * - Padding: 16dp horizontal
 * - Trailing icon: 24dp expand_more
 *
 * @see https://m3.material.io/components/menus/specs
 */

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
  variant?: "filled" | "outlined";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error = false,
      variant = "filled",
      options,
      placeholder,
      className,
      id: providedId,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "block mb-1u px-4u text-body-small font-medium",
              error ? "text-error" : "text-on-surface-variant"
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            className={cn(
              "w-full h-14u px-4u pr-12u text-body-large text-on-surface appearance-none cursor-pointer",
              "transition-colors duration-short focus:outline-none",
              "disabled:opacity-38 disabled:cursor-not-allowed",
              variant === "filled"
                ? "bg-surface-container-highest rounded-t-xs border-b-2"
                : "bg-transparent rounded-xs border-2",
              error
                ? "border-error focus:border-error"
                : "border-outline focus:border-primary",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown arrow - 24dp */}
          <div className="absolute right-3u top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-6u h-6u flex items-center justify-center">
            <svg
              className="w-6u h-6u"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>

        {helperText && (
          <p
            className={cn(
              "mt-1u px-4u text-body-small",
              error ? "text-error" : "text-on-surface-variant"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
```

### Usage Examples

```tsx
<Select
  label="Country"
  options={[
    { value: "us", label: "United States" },
    { value: "uk", label: "United Kingdom" },
    { value: "ca", label: "Canada" },
  ]}
  placeholder="Select a country"
/>

// Outlined variant
<Select
  variant="outlined"
  label="Category"
  options={categories}
/>

// With error
<Select
  label="Category"
  error
  helperText="Please select a category"
  options={categories}
/>
```

---

## Checkbox

Selection control for multiple choices.

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Container size | 18dp × 18dp | `w-4.5u h-4.5u` |
| State layer size | 40dp × 40dp | `w-10u h-10u` |
| Touch target | 48dp × 48dp | `min-w-12u min-h-12u` |
| Container shape | 2dp | `rounded-sm` |
| Icon (checkmark) | 18dp viewBox | - |
| Mark stroke width | 2dp | `stroke-2` |
| State layer opacity (hover) | 8% | `opacity-8` |
| State layer opacity (focus) | 12% | `opacity-12` |
| State layer opacity (pressed) | 12% | `opacity-12` |
| Disabled opacity | 38% | `opacity-38` |

> **Sources**: [m3.material.io/components/checkbox/specs](https://m3.material.io/components/checkbox/specs), [material-web.dev/components/checkbox](https://material-web.dev/components/checkbox/)

### File: `components/ui/checkbox.tsx`

```tsx
"use client";

import { forwardRef, InputHTMLAttributes, useId, useEffect, useRef } from "react";
import { Ripple } from "./ripple";
import { cn } from "@/lib/utils";

/**
 * Material Design 3 Checkbox
 *
 * M3 Spec:
 * - Container: 18dp × 18dp
 * - State layer: 40dp × 40dp
 * - Touch target: 48dp × 48dp
 * - Shape: 2dp corner radius
 * - Mark stroke: 2dp
 *
 * @see https://m3.material.io/components/checkbox/specs
 */
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: boolean;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error = false,
      indeterminate = false,
      disabled = false,
      className = "",
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = Boolean(indeterminate);
      }
    }, [indeterminate]);

    const setInputRef = (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    return (
      <label
        htmlFor={id}
        className={cn(
          "inline-flex items-center cursor-pointer select-none gap-3u group relative",
          disabled && "opacity-38 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        {/* Touch target container - 48dp with 40dp state layer */}
        <div className="relative flex items-center justify-center w-10u h-10u">
          {/* State layer - 40dp */}
          <div
            className={cn(
              "absolute inset-0 rounded-full overflow-hidden transition-colors z-0",
              "group-hover:bg-on-surface/8",
              "group-focus-within:bg-on-surface/12",
              error && "group-hover:bg-error/8 group-focus-within:bg-error/12"
            )}
          >
            <Ripple
              center
              disabled={disabled}
              className={cn(error ? "text-error" : "text-primary")}
            />
          </div>

          <input
            ref={setInputRef}
            type="checkbox"
            id={id}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />

          {/* Checkbox container - 18dp with 2dp corner radius */}
          <div
            className={cn(
              "relative z-10 w-4.5u h-4.5u rounded-sm border-2 flex items-center justify-center",
              "bg-transparent transition-all duration-snappy ease-emphasized",
              // Unchecked
              !error && "border-on-surface-variant group-hover:border-on-surface",
              // Checked
              "peer-checked:bg-primary peer-checked:border-primary",
              // Indeterminate
              "peer-indeterminate:bg-primary peer-indeterminate:border-primary",
              // Error states
              error && "border-error peer-checked:bg-error peer-checked:border-error",
              // Focus ring
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2"
            )}
          >
            {/* Checkmark - 18dp viewBox, 2dp stroke */}
            <svg
              className={cn(
                "w-full h-full p-0.5 transition-transform duration-snappy",
                "opacity-0 scale-50",
                "peer-checked:opacity-100 peer-checked:scale-100",
                error ? "text-on-error" : "text-on-primary"
              )}
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 5 7 13 3 9" />
            </svg>

            {/* Indeterminate mark - horizontal line */}
            <svg
              className={cn(
                "absolute w-full h-full p-1 transition-transform duration-snappy",
                "opacity-0 scale-50",
                "peer-indeterminate:opacity-100 peer-indeterminate:scale-100",
                props.checked && "hidden",
                error ? "text-on-error" : "text-on-primary"
              )}
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="4" y1="9" x2="14" y2="9" />
            </svg>
          </div>
        </div>

        {label && (
          <span className="text-body-medium text-on-surface">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
```

### Usage Examples

```tsx
// Basic
<Checkbox label="I agree to the terms and conditions" />

// Controlled
const [checked, setChecked] = useState(false);
<Checkbox
  label="Subscribe to newsletter"
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
/>

// Indeterminate (for "select all")
<Checkbox
  label="Select all"
  checked={allChecked}
  indeterminate={someChecked && !allChecked}
  onChange={handleSelectAll}
/>

// Error state
<Checkbox
  label="Required agreement"
  error
/>
```

---

## Radio

Single selection from a set of options.

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Outer circle size | 20dp × 20dp | `w-5u h-5u` |
| Inner dot size | 10dp × 10dp | `w-2.5u h-2.5u` |
| State layer size | 40dp × 40dp | `w-10u h-10u` |
| Touch target | 48dp × 48dp | `min-w-12u min-h-12u` |
| Border width | 2dp | `border-2` |
| State layer opacity (hover) | 8% | `opacity-8` |
| State layer opacity (focus) | 12% | `opacity-12` |
| State layer opacity (pressed) | 12% | `opacity-12` |
| Disabled opacity | 38% | `opacity-38` |

> **Source**: [m3.material.io/components/radio-button/specs](https://m3.material.io/components/radio-button/specs)

### File: `components/ui/radio.tsx`

```tsx
"use client";

import { forwardRef, InputHTMLAttributes, useId } from "react";
import { Ripple } from "./ripple";
import { cn } from "@/lib/utils";

/**
 * Material Design 3 Radio Button
 *
 * M3 Spec:
 * - Outer circle: 20dp × 20dp
 * - Inner dot: 10dp × 10dp
 * - State layer: 40dp × 40dp
 * - Border: 2dp
 *
 * @see https://m3.material.io/components/radio-button/specs
 */
interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: boolean;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      disabled = false,
      error = false,
      className = "",
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;

    return (
      <label
        htmlFor={id}
        className={cn(
          "inline-flex items-center gap-3u cursor-pointer group select-none relative",
          disabled && "opacity-38 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        {/* Touch target with 40dp state layer */}
        <div className="relative flex items-center justify-center w-10u h-10u">
          {/* State layer - 40dp, circular */}
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-colors z-0 overflow-hidden",
              "group-hover:bg-on-surface/8",
              "group-focus-within:bg-primary/12",
              error && "group-hover:bg-error/8 group-focus-within:bg-error/12"
            )}
          >
            <Ripple
              center
              disabled={disabled}
              className={cn(error ? "text-error" : "text-primary")}
            />
          </div>

          <input
            ref={ref}
            type="radio"
            id={id}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />

          {/* Radio outer circle - 20dp, 2dp border */}
          <div
            className={cn(
              "relative z-10 w-5u h-5u rounded-full border-2 flex items-center justify-center",
              "bg-transparent transition-colors duration-snappy ease-emphasized",
              // Unchecked
              !error && "border-on-surface-variant group-hover:border-on-surface",
              // Checked
              "peer-checked:border-primary",
              // Error
              error && "border-error peer-checked:border-error",
              // Focus ring
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2"
            )}
          >
            {/* Inner dot - 10dp, scales in on check */}
            <div
              className={cn(
                "w-2.5u h-2.5u rounded-full transition-transform duration-snappy ease-emphasized",
                "scale-0 peer-checked:scale-100",
                !error ? "bg-primary" : "bg-error"
              )}
            />
          </div>
        </div>

        {label && (
          <span className="text-body-medium text-on-surface">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Radio.displayName = "Radio";
```

### Usage Examples

```tsx
const [selected, setSelected] = useState("option1");

<div className="space-y-2u">
  <Radio
    label="Option 1"
    name="options"
    value="option1"
    checked={selected === "option1"}
    onChange={(e) => setSelected(e.target.value)}
  />
  <Radio
    label="Option 2"
    name="options"
    value="option2"
    checked={selected === "option2"}
    onChange={(e) => setSelected(e.target.value)}
  />
  <Radio
    label="Option 3"
    name="options"
    value="option3"
    checked={selected === "option3"}
    onChange={(e) => setSelected(e.target.value)}
  />
</div>
```

---

## Switch

Toggle control for on/off states.

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Track width | 52dp | `w-13u` |
| Track height | 32dp | `h-8u` |
| Track shape | Full (16dp radius) | `rounded-full` |
| Handle size (unselected) | 16dp | `w-4u h-4u` |
| Handle size (selected) | 24dp | `w-6u h-6u` |
| Handle size (pressed) | 28dp | `w-7u h-7u` |
| Handle shape | Full (circular) | `rounded-full` |
| Icon size | 16dp | `w-4u h-4u` |
| Touch target | 48dp | `min-h-12u` |
| State layer size | 40dp | `w-10u h-10u` |
| State layer opacity (hover) | 8% | `opacity-8` |
| Disabled opacity | 38% | `opacity-38` |

> **Sources**: [m3.material.io/components/switch/specs](https://m3.material.io/components/switch/specs), [material-components-android Switch.md](https://github.com/material-components/material-components-android/blob/master/docs/components/Switch.md)

### File: `components/ui/switch.tsx`

```tsx
"use client";

import { forwardRef, InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Material Design 3 Switch
 *
 * M3 Spec:
 * - Track: 52dp × 32dp
 * - Handle: 16dp (unselected), 24dp (selected), 28dp (pressed)
 * - Icon: 16dp
 * - Shape: Full (circular)
 *
 * @see https://m3.material.io/components/switch/specs
 */
interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  icons?: boolean;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      disabled = false,
      icons = false,
      className = "",
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;

    return (
      <label
        htmlFor={id}
        className={cn(
          "inline-flex items-center gap-3u cursor-pointer select-none group relative min-h-12u",
          disabled && "opacity-38 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        {/* Track container - 52dp × 32dp */}
        <div className="relative w-13u h-8u shrink-0 group/switch">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            role="switch"
            className="peer sr-only"
            disabled={disabled}
            {...props}
          />

          {/* Track - 52dp × 32dp, full shape */}
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-colors duration-medium ease-standard border-2",
              // Unselected
              "border-outline bg-surface-container-highest",
              // Selected
              "peer-checked:bg-primary peer-checked:border-primary",
              // Focus
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-2"
            )}
          />

          {/* Handle - 16dp unselected, 24dp selected, 28dp pressed */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full",
              "transition-all duration-medium ease-emphasized",
              "flex items-center justify-center z-10",
              // Unselected: 16dp, positioned left
              "w-4u h-4u left-1.5u bg-outline",
              // Hover
              "group-hover:bg-on-surface-variant",
              // Selected: 24dp, translate right, different color
              "peer-checked:w-6u peer-checked:h-6u peer-checked:translate-x-5u peer-checked:bg-on-primary",
              // Pressed: 28dp
              "group-active:w-7u",
              // Pressed + selected adjustment
              "peer-checked:group-active:translate-x-4u"
            )}
          >
            {icons && (
              <>
                {/* Check icon - visible when selected */}
                <svg
                  className={cn(
                    "w-4u h-4u text-primary-container absolute",
                    "transition-opacity duration-snappy",
                    "opacity-0 peer-checked:opacity-100"
                  )}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>

                {/* Close icon - visible when unselected */}
                <svg
                  className={cn(
                    "w-4u h-4u text-surface-container-highest absolute",
                    "transition-opacity duration-snappy",
                    "opacity-100 peer-checked:opacity-0"
                  )}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </>
            )}
          </div>
        </div>

        {label && (
          <span className="text-body-medium text-on-surface">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Switch.displayName = "Switch";
```

### Usage Examples

```tsx
const [enabled, setEnabled] = useState(false);

// Basic
<Switch
  label="Enable notifications"
  checked={enabled}
  onChange={(e) => setEnabled(e.target.checked)}
/>

// With icons
<Switch
  label="Dark mode"
  icons
  checked={darkMode}
  onChange={(e) => setDarkMode(e.target.checked)}
/>

// Without label
<Switch
  checked={enabled}
  onChange={(e) => setEnabled(e.target.checked)}
  aria-label="Toggle feature"
/>
```

---

## Slider

Range input for selecting a value.

### M3 Specification

| Property | M3 Value | Unisane Token |
|----------|----------|---------------|
| Track height (active) | 4dp | `h-1u` |
| Track height (inactive) | 4dp | `h-1u` |
| Handle size | 20dp | `w-5u h-5u` |
| Handle shape | Full (circular) | `rounded-full` |
| State layer size | 40dp | `w-10u h-10u` |
| Touch target height | 44dp | `h-11u` |
| Track shape | Full | `rounded-full` |

> **Source**: [m3.material.io/components/sliders/specs](https://m3.material.io/components/sliders/specs)

### File: `components/ui/slider.tsx`

```tsx
"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Material Design 3 Slider
 *
 * M3 Spec:
 * - Track height: 4dp
 * - Handle: 20dp circular
 * - Touch target: 44dp
 *
 * @see https://m3.material.io/components/sliders/specs
 */
interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  showValue?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ label, showValue = false, min = 0, max = 100, value, className = "", ...props }, ref) => {
    const percentage = ((Number(value) - Number(min)) / (Number(max) - Number(min))) * 100;

    return (
      <div className="w-full">
        {(label || showValue) && (
          <div className="flex justify-between items-center mb-2u">
            {label && (
              <label className="text-body-small font-medium text-on-surface-variant">
                {label}
              </label>
            )}
            {showValue && (
              <span className="text-body-small text-on-surface-variant">
                {value}
              </span>
            )}
          </div>
        )}

        {/* Touch target - 44dp height */}
        <div className="relative h-11u flex items-center">
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            value={value}
            className={cn(
              "w-full h-1u appearance-none bg-transparent cursor-pointer focus:outline-none",
              "disabled:opacity-38 disabled:cursor-not-allowed",
              // Track styling
              "[&::-webkit-slider-track]:h-1u [&::-webkit-slider-track]:bg-primary-container [&::-webkit-slider-track]:rounded-full",
              // Handle - 20dp
              "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5u [&::-webkit-slider-thumb]:h-5u",
              "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
              "[&::-webkit-slider-thumb]:shadow-1 [&::-webkit-slider-thumb]:transition-transform",
              "[&::-webkit-slider-thumb]:hover:scale-110",
              // Firefox
              "[&::-moz-range-track]:h-1u [&::-moz-range-track]:bg-primary-container [&::-moz-range-track]:rounded-full",
              "[&::-moz-range-thumb]:w-5u [&::-moz-range-thumb]:h-5u [&::-moz-range-thumb]:rounded-full",
              "[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-1",
              className
            )}
            style={{
              background: `linear-gradient(to right, var(--uni-sys-color-primary) 0%, var(--uni-sys-color-primary) ${percentage}%, var(--uni-sys-color-primary-container) ${percentage}%, var(--uni-sys-color-primary-container) 100%)`,
            }}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Slider.displayName = "Slider";
```

### Usage Examples

```tsx
const [volume, setVolume] = useState(50);

<Slider
  label="Volume"
  showValue
  min={0}
  max={100}
  value={volume}
  onChange={(e) => setVolume(Number(e.target.value))}
/>

// Custom range
<Slider
  label="Price"
  min={0}
  max={1000}
  step={10}
  value={price}
  onChange={(e) => setPrice(Number(e.target.value))}
/>
```

---

## Design Tokens

### Spacing Scale (with density)

| Token | Base (4dp) | Compact (3.5dp) | Comfortable (4.5dp) |
|-------|------------|-----------------|---------------------|
| `1u` | 4dp | 3.5dp | 4.5dp |
| `2u` | 8dp | 7dp | 9dp |
| `3u` | 12dp | 10.5dp | 13.5dp |
| `4u` | 16dp | 14dp | 18dp |
| `5u` | 20dp | 17.5dp | 22.5dp |
| `6u` | 24dp | 21dp | 27dp |
| `10u` | 40dp | 35dp | 45dp |
| `13u` | 52dp | 45.5dp | 58.5dp |
| `14u` | 56dp | 49dp | 63dp |

### Typography Tokens

| Token | Usage |
|-------|-------|
| `text-body-large` | Input text |
| `text-body-medium` | Labels with input controls |
| `text-body-small` | Floating labels, supporting text |
| `text-label-large` | Button labels |

### State Layer Opacity

| State | Opacity |
|-------|---------|
| Hover | 8% |
| Focus | 12% |
| Pressed | 12% |
| Disabled | 38% (entire component) |

### Color Tokens

| Token | Usage |
|-------|-------|
| `primary` | Active/selected states, focus indicators |
| `on-primary` | Content on primary (checkmark, switch handle) |
| `on-surface` | Input text, labels |
| `on-surface-variant` | Placeholder, supporting text, icons |
| `outline` | Borders, unselected states |
| `surface-container-highest` | Filled input background |
| `error` | Error states |
| `on-error` | Content on error |

---

## Best Practices

### Form Validation

```tsx
const [email, setEmail] = useState("");
const [emailError, setEmailError] = useState("");

const validateEmail = (value: string) => {
  if (!value) {
    setEmailError("Email is required");
    return false;
  }
  if (!/\S+@\S+\.\S+/.test(value)) {
    setEmailError("Invalid email format");
    return false;
  }
  setEmailError("");
  return true;
};

<TextField
  label="Email"
  type="email"
  value={email}
  onChange={(e) => {
    setEmail(e.target.value);
    validateEmail(e.target.value);
  }}
  error={!!emailError}
  helperText={emailError || "We'll never share your email"}
/>
```

### Accessibility

```tsx
// Always provide labels or aria-label
<TextField
  label="First Name"
  required
  aria-required="true"
/>

// Error announcements
<TextField
  label="Email"
  error={!!emailError}
  helperText={emailError}
  aria-invalid={!!emailError}
  aria-describedby="email-error"
/>

// Switch needs accessible name
<Switch
  checked={enabled}
  onChange={(e) => setEnabled(e.target.checked)}
  aria-label="Enable dark mode"
/>
```

### Form Layout

```tsx
<form className="space-y-6u">
  <TextField label="Full name" required />

  <TextField label="Email" type="email" required />

  <Select
    label="Country"
    options={countries}
    required
  />

  <div className="space-y-2u">
    <span className="text-body-small font-medium text-on-surface-variant">
      Notification preferences
    </span>
    <Checkbox label="Email notifications" />
    <Checkbox label="SMS notifications" />
    <Checkbox label="Push notifications" />
  </div>

  <Switch label="Subscribe to newsletter" />

  <Button variant="filled" type="submit">
    Submit
  </Button>
</form>
```

---

## Sources

- [m3.material.io/components/text-fields/specs](https://m3.material.io/components/text-fields/specs)
- [m3.material.io/components/checkbox/specs](https://m3.material.io/components/checkbox/specs)
- [m3.material.io/components/radio-button/specs](https://m3.material.io/components/radio-button/specs)
- [m3.material.io/components/switch/specs](https://m3.material.io/components/switch/specs)
- [m3.material.io/components/sliders/specs](https://m3.material.io/components/sliders/specs)
- [material-web.dev/components/text-field](https://material-web.dev/components/text-field/)
- [material-web.dev/components/checkbox](https://material-web.dev/components/checkbox/)
- [material-web.dev/components/switch](https://material-web.dev/components/switch/)
- [material-components-android Switch.md](https://github.com/material-components/material-components-android/blob/master/docs/components/Switch.md)
