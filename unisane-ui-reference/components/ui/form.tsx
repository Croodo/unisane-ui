"use client";

import React, { createContext, forwardRef, useContext, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Label } from "./label";

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