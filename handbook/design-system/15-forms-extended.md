# Forms Extended

Additional form components for complex input patterns and validation.

## Table of Contents

1. [ToggleGroup](#togglegroup)
2. [RadioGroup](#radiogroup)
3. [CheckboxGroup](#checkboxgroup)
4. [Form](#form)
5. [Label](#label)

---

## ToggleGroup

Group of toggle buttons for single or multiple selection.

### File: `components/ui/toggle-group.tsx`

```tsx
"use client";

import { createContext, forwardRef, useContext, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Ripple } from "@/components/ui/ripple";
import { stateLayers } from "@/utils/state-layers";
import { focusRing } from "@/utils/focus-ring";
import { animations } from "@/utils/animations";

// Context for managing toggle group state
interface ToggleGroupContextValue {
  value: string | string[];
  onChange: (value: string) => void;
  type: "single" | "multiple";
  disabled?: boolean;
}

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

const toggleGroupVariants = cva("inline-flex", {
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
    size: {
      sm: "gap-1u",
      md: "gap-2u",
      lg: "gap-3u",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    size: "md",
  },
});

// ToggleGroup Root
interface ToggleGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof toggleGroupVariants> {
  type?: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  disabled?: boolean;
}

export const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(
  (
    {
      type = "single",
      value: controlledValue,
      defaultValue,
      onValueChange,
      disabled = false,
      orientation = "horizontal",
      size = "md",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState<string | string[]>(
      defaultValue || (type === "single" ? "" : [])
    );

    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleChange = (itemValue: string) => {
      if (disabled) return;

      let newValue: string | string[];

      if (type === "single") {
        newValue = value === itemValue ? "" : itemValue;
      } else {
        const currentArray = Array.isArray(value) ? value : [];
        newValue = currentArray.includes(itemValue)
          ? currentArray.filter((v) => v !== itemValue)
          : [...currentArray, itemValue];
      }

      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <ToggleGroupContext.Provider value={{ value, onChange: handleChange, type, disabled }}>
        <div
          ref={ref}
          role="group"
          className={cn(toggleGroupVariants({ orientation, size }), className)}
          {...props}
        >
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  }
);

ToggleGroup.displayName = "ToggleGroup";

// ToggleGroupItem
const toggleGroupItemVariants = cva(
  cn("inline-flex items-center justify-center gap-2u px-6u h-10u rounded-sm text-label-large font-medium border border-outline relative overflow-hidden", focusRing.default, animations.transition.all),
  {
    variants: {
      selected: {
        true: "bg-secondary-container text-on-secondary-container border-secondary",
        false: cn("bg-surface text-on-surface", stateLayers.hover),
      },
      disabled: {
        true: "opacity-38 pointer-events-none cursor-not-allowed",
        false: "cursor-pointer",
      },
    },
    defaultVariants: {
      selected: false,
      disabled: false,
    },
  }
);

interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  ariaLabel?: string;
}

export const ToggleGroupItem = forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ value: itemValue, ariaLabel, children, className, disabled: itemDisabled, ...props }, ref) => {
    const context = useContext(ToggleGroupContext);

    if (!context) {
      throw new Error("ToggleGroupItem must be used within ToggleGroup");
    }

    const { value, onChange, type, disabled: groupDisabled } = context;
    const disabled = itemDisabled || groupDisabled;

    const isSelected =
      type === "single" ? value === itemValue : Array.isArray(value) && value.includes(itemValue);

    return (
      <button
        ref={ref}
        type="button"
        role={type === "single" ? "radio" : "checkbox"}
        aria-checked={isSelected}
        aria-label={ariaLabel}
        disabled={disabled}
        data-state={isSelected ? "on" : "off"}
        className={cn(toggleGroupItemVariants({ selected: isSelected, disabled }), className)}
        onClick={() => onChange(itemValue)}
        {...props}
      >
        <Ripple disabled={disabled} />
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

ToggleGroupItem.displayName = "ToggleGroupItem";
```

### Usage Example

```tsx
// Single selection
const [alignment, setAlignment] = useState("left");

<ToggleGroup type="single" value={alignment} onValueChange={setAlignment}>
  <ToggleGroupItem value="left" ariaLabel="Align left">
    <span className="material-symbols-outlined">format_align_left</span>
  </ToggleGroupItem>
  <ToggleGroupItem value="center" ariaLabel="Align center">
    <span className="material-symbols-outlined">format_align_center</span>
  </ToggleGroupItem>
  <ToggleGroupItem value="right" ariaLabel="Align right">
    <span className="material-symbols-outlined">format_align_right</span>
  </ToggleGroupItem>
</ToggleGroup>

// Multiple selection
const [formats, setFormats] = useState<string[]>(["bold"]);

<ToggleGroup type="multiple" value={formats} onValueChange={setFormats}>
  <ToggleGroupItem value="bold" ariaLabel="Bold">
    <span className="material-symbols-outlined">format_bold</span>
  </ToggleGroupItem>
  <ToggleGroupItem value="italic" ariaLabel="Italic">
    <span className="material-symbols-outlined">format_italic</span>
  </ToggleGroupItem>
  <ToggleGroupItem value="underline" ariaLabel="Underline">
    <span className="material-symbols-outlined">format_underlined</span>
  </ToggleGroupItem>
</ToggleGroup>

// Vertical orientation with text
<ToggleGroup type="single" orientation="vertical" size="lg">
  <ToggleGroupItem value="grid">
    <span className="material-symbols-outlined">grid_view</span>
    Grid View
  </ToggleGroupItem>
  <ToggleGroupItem value="list">
    <span className="material-symbols-outlined">view_list</span>
    List View
  </ToggleGroupItem>
</ToggleGroup>

// Disabled state
<ToggleGroup disabled>
  <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
  <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
</ToggleGroup>
```

---

## RadioGroup

Wrapper component for radio buttons with context-based state management.

### File: `components/ui/radio-group.tsx`

```tsx
"use client";

import { createContext, forwardRef, useContext, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Context for managing radio group state
interface RadioGroupContextValue {
  value: string;
  onChange: (value: string) => void;
  name: string;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

const radioGroupVariants = cva("flex", {
  variants: {
    orientation: {
      horizontal: "flex-row flex-wrap",
      vertical: "flex-col",
    },
    gap: {
      sm: "gap-2u",
      md: "gap-4u",
      lg: "gap-6u",
    },
  },
  defaultVariants: {
    orientation: "vertical",
    gap: "md",
  },
});

// RadioGroup Root
interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof radioGroupVariants> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name: string;
  disabled?: boolean;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      value: controlledValue,
      defaultValue = "",
      onValueChange,
      name,
      disabled = false,
      orientation = "vertical",
      gap = "md",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState<string>(defaultValue);
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleChange = (newValue: string) => {
      if (disabled) return;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <RadioGroupContext.Provider value={{ value, onChange: handleChange, name, disabled }}>
        <div
          ref={ref}
          role="radiogroup"
          className={cn(radioGroupVariants({ orientation, gap }), className)}
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

// RadioGroupItem (enhanced Radio with label)
const radioIndicatorVariants = cva(
  "w-5u h-5u rounded-full border-2 transition-all duration-short peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2",
  {
    variants: {
      checked: {
        true: "border-primary bg-primary",
        false: "border-on-surface-variant hover:border-on-surface",
      },
      disabled: {
        true: "opacity-38 cursor-not-allowed",
        false: "cursor-pointer",
      },
    },
    defaultVariants: {
      checked: false,
      disabled: false,
    },
  }
);

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  value: string;
  label?: string;
  description?: string;
}

export const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ value: itemValue, label, description, disabled: itemDisabled, className, ...props }, ref) => {
    const context = useContext(RadioGroupContext);

    if (!context) {
      throw new Error("RadioGroupItem must be used within RadioGroup");
    }

    const { value, onChange, name, disabled: groupDisabled } = context;
    const disabled = itemDisabled || groupDisabled;
    const isChecked = value === itemValue;
    const id = `${name}-${itemValue}`;

    return (
      <div className={cn("flex items-start gap-3u", className)}>
        <div className="relative flex items-center justify-center pt-0.5u">
          <input
            ref={ref}
            type="radio"
            id={id}
            name={name}
            value={itemValue}
            checked={isChecked}
            disabled={disabled}
            onChange={() => onChange(itemValue)}
            className="peer sr-only"
            {...props}
          />
          <div className={radioIndicatorVariants({ checked: isChecked, disabled })}>
            {isChecked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2.5u h-2.5u rounded-full bg-on-primary" />
              </div>
            )}
          </div>
        </div>

        <label
          htmlFor={id}
          className={cn(
            "flex-1 cursor-pointer select-none",
            disabled && "opacity-38 cursor-not-allowed"
          )}
        >
          {label && (
            <div className="text-body-large text-on-surface font-medium">
              {label}
            </div>
          )}
          {description && (
            <div className="text-body-medium text-on-surface-variant mt-0.5u">
              {description}
            </div>
          )}
        </label>
      </div>
    );
  }
);

RadioGroupItem.displayName = "RadioGroupItem";
```

### Usage Example

```tsx
// Basic radio group
const [plan, setPlan] = useState("free");

<RadioGroup name="plan" value={plan} onValueChange={setPlan}>
  <RadioGroupItem
    value="free"
    label="Free Plan"
    description="Perfect for getting started"
  />
  <RadioGroupItem
    value="pro"
    label="Pro Plan"
    description="For professional developers"
  />
  <RadioGroupItem
    value="enterprise"
    label="Enterprise Plan"
    description="For large organizations"
  />
</RadioGroup>

// Horizontal orientation
<RadioGroup name="size" orientation="horizontal" gap="lg">
  <RadioGroupItem value="sm" label="Small" />
  <RadioGroupItem value="md" label="Medium" />
  <RadioGroupItem value="lg" label="Large" />
</RadioGroup>

// With disabled option
<RadioGroup name="option">
  <RadioGroupItem value="option1" label="Option 1" />
  <RadioGroupItem value="option2" label="Option 2" disabled />
  <RadioGroupItem value="option3" label="Option 3" />
</RadioGroup>
```

---

## CheckboxGroup

Wrapper component for checkboxes with context-based state management.

### File: `components/ui/checkbox-group.tsx`

```tsx
"use client";

import { createContext, forwardRef, useContext, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Context for managing checkbox group state
interface CheckboxGroupContextValue {
  value: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);

const checkboxGroupVariants = cva("flex", {
  variants: {
    orientation: {
      horizontal: "flex-row flex-wrap",
      vertical: "flex-col",
    },
    gap: {
      sm: "gap-2u",
      md: "gap-4u",
      lg: "gap-6u",
    },
  },
  defaultVariants: {
    orientation: "vertical",
    gap: "md",
  },
});

// CheckboxGroup Root
interface CheckboxGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof checkboxGroupVariants> {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  disabled?: boolean;
}

export const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  (
    {
      value: controlledValue,
      defaultValue = [],
      onValueChange,
      disabled = false,
      orientation = "vertical",
      gap = "md",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleChange = (itemValue: string) => {
      if (disabled) return;

      const newValue = value.includes(itemValue)
        ? value.filter((v) => v !== itemValue)
        : [...value, itemValue];

      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <CheckboxGroupContext.Provider value={{ value, onChange: handleChange, disabled }}>
        <div
          ref={ref}
          role="group"
          className={cn(checkboxGroupVariants({ orientation, gap }), className)}
          {...props}
        >
          {children}
        </div>
      </CheckboxGroupContext.Provider>
    );
  }
);

CheckboxGroup.displayName = "CheckboxGroup";

// CheckboxGroupItem (enhanced Checkbox with label)
const checkboxIndicatorVariants = cva(
  "w-4.5u h-4.5u rounded-sm border-2 transition-all duration-short peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2",
  {
    variants: {
      checked: {
        true: "border-primary bg-primary",
        false: "border-on-surface-variant hover:border-on-surface",
      },
      disabled: {
        true: "opacity-38 cursor-not-allowed",
        false: "cursor-pointer",
      },
    },
    defaultVariants: {
      checked: false,
      disabled: false,
    },
  }
);

interface CheckboxGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  value: string;
  label?: string;
  description?: string;
}

export const CheckboxGroupItem = forwardRef<HTMLInputElement, CheckboxGroupItemProps>(
  ({ value: itemValue, label, description, disabled: itemDisabled, className, ...props }, ref) => {
    const context = useContext(CheckboxGroupContext);

    if (!context) {
      throw new Error("CheckboxGroupItem must be used within CheckboxGroup");
    }

    const { value, onChange, disabled: groupDisabled } = context;
    const disabled = itemDisabled || groupDisabled;
    const isChecked = value.includes(itemValue);
    const id = `checkbox-${itemValue}`;

    return (
      <div className={cn("flex items-start gap-3u", className)}>
        <div className="relative flex items-center justify-center pt-0.5u">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            value={itemValue}
            checked={isChecked}
            disabled={disabled}
            onChange={() => onChange(itemValue)}
            className="peer sr-only"
            {...props}
          />
          <div className={checkboxIndicatorVariants({ checked: isChecked, disabled })}>
            {isChecked && (
              <svg
                className="w-full h-full text-on-primary"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.25 5.25L7.5 12L3.75 8.25"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>

        <label
          htmlFor={id}
          className={cn(
            "flex-1 cursor-pointer select-none",
            disabled && "opacity-38 cursor-not-allowed"
          )}
        >
          {label && (
            <div className="text-body-large text-on-surface font-medium">
              {label}
            </div>
          )}
          {description && (
            <div className="text-body-medium text-on-surface-variant mt-0.5u">
              {description}
            </div>
          )}
        </label>
      </div>
    );
  }
);

CheckboxGroupItem.displayName = "CheckboxGroupItem";
```

### Usage Example

```tsx
// Basic checkbox group
const [features, setFeatures] = useState<string[]>(["email"]);

<CheckboxGroup value={features} onValueChange={setFeatures}>
  <CheckboxGroupItem
    value="email"
    label="Email Notifications"
    description="Receive email updates"
  />
  <CheckboxGroupItem
    value="sms"
    label="SMS Notifications"
    description="Receive text messages"
  />
  <CheckboxGroupItem
    value="push"
    label="Push Notifications"
    description="Receive push notifications"
  />
</CheckboxGroup>

// Horizontal orientation
<CheckboxGroup orientation="horizontal" gap="lg">
  <CheckboxGroupItem value="feature1" label="Feature 1" />
  <CheckboxGroupItem value="feature2" label="Feature 2" />
  <CheckboxGroupItem value="feature3" label="Feature 3" />
</CheckboxGroup>

// With disabled options
<CheckboxGroup>
  <CheckboxGroupItem value="option1" label="Option 1" />
  <CheckboxGroupItem value="option2" label="Option 2" disabled />
  <CheckboxGroupItem value="option3" label="Option 3" />
</CheckboxGroup>
```

---

## Form

Form wrapper with built-in validation support.

### File: `components/ui/form.tsx`

```tsx
"use client";

import { createContext, forwardRef, useContext, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Form Context
interface FormContextValue {
  errors: Record<string, string>;
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within Form");
  }
  return context;
};

// Form Root
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
}

export const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ onSubmit, children, className, ...props }, ref) => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const setError = (field: string, message: string) => {
      setErrors((prev) => ({ ...prev, [field]: message }));
    };

    const clearError = (field: string) => {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    };

    const clearAllErrors = () => {
      setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      clearAllErrors();
      await onSubmit?.(e);
    };

    return (
      <FormContext.Provider value={{ errors, setError, clearError, clearAllErrors }}>
        <form ref={ref} onSubmit={handleSubmit} className={className} noValidate {...props}>
          {children}
        </form>
      </FormContext.Provider>
    );
  }
);

Form.displayName = "Form";

// FormField - wrapper for form inputs with error display
const formFieldVariants = cva("flex flex-col gap-2u");

interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField = ({
  name,
  label,
  required = false,
  helperText,
  children,
  className,
}: FormFieldProps) => {
  const { errors } = useFormContext();
  const error = errors[name];

  return (
    <div className={cn(formFieldVariants(), className)}>
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error && (
        <span className="text-label-medium text-error" role="alert">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span className="text-label-medium text-on-surface-variant">
          {helperText}
        </span>
      )}
    </div>
  );
};

// Label component (referenced in FormField)
const labelVariants = cva("text-body-medium font-medium text-on-surface");

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required = false, children, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants(), className)}
        {...props}
      >
        {children}
        {required && <span className="text-error ml-0.5u">*</span>}
      </label>
    );
  }
);

Label.displayName = "Label";
```

### Usage Example

```tsx
// Form with validation
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  const formData = new FormData(e.currentTarget);
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validation
  if (!email) {
    setError("email", "Email is required");
    return;
  }
  if (!password) {
    setError("password", "Password is required");
    return;
  }

  // Submit
  await loginUser({ email, password });
};

<Form onSubmit={handleSubmit} className="space-y-6u">
  <FormField
    name="email"
    label="Email"
    required
    helperText="We'll never share your email"
  >
    <TextField
      id="email"
      name="email"
      type="email"
      placeholder="you@example.com"
    />
  </FormField>

  <FormField
    name="password"
    label="Password"
    required
  >
    <TextField
      id="password"
      name="password"
      type="password"
      placeholder="Enter your password"
    />
  </FormField>

  <Button type="submit" variant="filled" fullWidth>
    Sign In
  </Button>
</Form>

// Form with programmatic error handling
const { setError, clearError } = useFormContext();

// Set error from API response
try {
  await submitForm(data);
} catch (error) {
  setError("email", "This email is already taken");
}

// Clear error on input change
<TextField
  onChange={() => clearError("email")}
/>
```

---

## Label

Standalone label component for form inputs.

### File: `components/ui/label.tsx`

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva("text-body-medium font-medium text-on-surface", {
  variants: {
    disabled: {
      true: "opacity-38 cursor-not-allowed",
      false: "cursor-pointer",
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required = false, disabled = false, children, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants({ disabled }), className)}
        {...props}
      >
        {children}
        {required && <span className="text-error ml-0.5u" aria-label="required">*</span>}
      </label>
    );
  }
);

Label.displayName = "Label";
```

### Usage Example

```tsx
// Basic label
<div className="flex flex-col gap-2u">
  <Label htmlFor="username">Username</Label>
  <TextField id="username" name="username" />
</div>

// Required field
<div className="flex flex-col gap-2u">
  <Label htmlFor="email" required>
    Email Address
  </Label>
  <TextField id="email" name="email" type="email" />
</div>

// Disabled label
<div className="flex flex-col gap-2u">
  <Label htmlFor="disabled" disabled>
    Disabled Field
  </Label>
  <TextField id="disabled" disabled />
</div>

// Inline with checkbox
<div className="flex items-center gap-2u">
  <Checkbox id="terms" />
  <Label htmlFor="terms">
    I agree to the terms and conditions
  </Label>
</div>
```

---

## Best Practices

### ToggleGroup Usage

```tsx
// ✅ Use for mutually exclusive options
<ToggleGroup type="single">
  <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
  <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
</ToggleGroup>

// ✅ Use for multiple independent selections
<ToggleGroup type="multiple">
  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
  <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
</ToggleGroup>

// ✅ Provide aria-label for icon-only buttons
<ToggleGroupItem value="left" ariaLabel="Align left">
  <Icon name="align_left" />
</ToggleGroupItem>
```

### RadioGroup vs Select

```tsx
// ✅ Use RadioGroup for 2-5 visible options
<RadioGroup name="plan">
  <RadioGroupItem value="free" label="Free" />
  <RadioGroupItem value="pro" label="Pro" />
</RadioGroup>

// ✅ Use Select for 6+ options or space constraints
<Select>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
  {/* ... many more options */}
</Select>
```

### Form Validation

```tsx
// ✅ Clear all errors on submit
const handleSubmit = (e) => {
  clearAllErrors();
  // validate and set new errors
};

// ✅ Clear field error on change
<TextField
  onChange={() => clearError("email")}
/>

// ✅ Show helper text when no error
<FormField helperText="Enter your email address">
  <TextField />
</FormField>
```

### Accessibility

```tsx
// ✅ Always associate labels with inputs
<Label htmlFor="email">Email</Label>
<TextField id="email" />

// ✅ Mark required fields visually and programmatically
<Label htmlFor="name" required>Name</Label>
<TextField id="name" required />

// ✅ Provide helpful error messages
<FormField name="password">
  {/* Error: "Password is required" not "Required field" */}
</FormField>

// ✅ Use proper ARIA roles
<div role="group"> {/* for CheckboxGroup */}
<div role="radiogroup"> {/* for RadioGroup */}
```

### Form Structure

```tsx
// ✅ Group related fields
<Form>
  <fieldset className="border-none">
    <legend className="text-title-large mb-4u">Personal Information</legend>
    <FormField name="firstName" label="First Name">
      <TextField />
    </FormField>
    <FormField name="lastName" label="Last Name">
      <TextField />
    </FormField>
  </fieldset>
</Form>

// ✅ Use FormField for consistent spacing and error display
<FormField name="email" label="Email" required helperText="We'll never share your email">
  <TextField />
</FormField>
```
