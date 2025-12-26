"use client";

import React, { useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { TextField } from "./text-field";
import { Calendar } from "./calendar";
import { Popover } from "./popover";
import { IconButton } from "./icon-button";

const datePickerVariants = cva("relative w-full", {
  variants: {
    variant: {
      default: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type DatePickerProps = VariantProps<typeof datePickerVariants> & {
  value?: Date;
  onChange?: (date: Date) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "Select a date",
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDateSelect = (date: Date) => {
    onChange?.(date);
    setIsOpen(false);
  };

  return (
    <div className={cn(datePickerVariants({ className }))}>
      <Popover
        open={isOpen}
        onOpenChange={setIsOpen}
        trigger={
          <TextField
            variant="outlined"
            disabled={disabled}
            label={label || "Date"}
            value={value ? formatDate(value) : ""}
            placeholder={placeholder}
            readOnly
            onClick={() => !disabled && setIsOpen(true)}
            trailingIcon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
              </svg>
            }
          />
        }
        content={
          <Calendar selectedDate={value} onDateSelect={handleDateSelect} />
        }
        className="w-full"
      />
    </div>
  );
};
