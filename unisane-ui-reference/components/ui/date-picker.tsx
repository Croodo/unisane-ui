"use client";

import React, { useState } from "react";
import { format, addMonths, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { IconButton } from "./icon-button";

const datePickerDayVariants = cva(
  "h-8u rounded-full text-body-medium transition-all duration-short",
  {
    variants: {
      selected: {
        true: "bg-primary text-on-primary",
        false: "text-on-surface hover:bg-on-surface/8",
      },
      isCurrentDay: {
        true: "border border-primary",
        false: "",
      },
      disabled: {
        true: "opacity-38 cursor-not-allowed",
        false: "cursor-pointer",
      },
    },
    compoundVariants: [
      {
        selected: true,
        isCurrentDay: true,
        className: "border-0",
      },
    ],
    defaultVariants: {
      selected: false,
      isCurrentDay: false,
      disabled: false,
    },
  }
);

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const DatePicker = ({ value, onChange, minDate, maxDate, className }: DatePickerProps) => {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get starting day of week (0 = Sunday)
  const startingDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startingDayOfWeek).fill(null);

  const handleDateClick = (date: Date) => {
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;

    setSelectedDate(date);
    onChange(date);
  };

  return (
    <div className={cn("w-full max-w-80u bg-surface-container rounded-lg p-4u", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4u">
        <IconButton
          variant="standard"
          size="sm"
          ariaLabel="Previous month"
          onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </IconButton>

        <div className="text-title-medium font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </div>

        <IconButton
          variant="standard"
          size="sm"
          ariaLabel="Next month"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </IconButton>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1u mb-2u">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-center text-label-small text-on-surface-variant font-medium h-8u flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1u">
        {/* Empty cells for days before month starts */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} />
        ))}

        {/* Days */}
        {days.map((day) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const isDisabled =
            (minDate && day < minDate) || (maxDate && day > maxDate);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              className={datePickerDayVariants({
                selected: isSelected,
                isCurrentDay: isCurrentDay && !isSelected,
                disabled: isDisabled,
              })}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Footer with today button */}
      <div className="mt-4u pt-4u border-t border-outline-variant">
        <Button
          variant="text"
          size="sm"
          fullWidth
          onClick={() => {
            const today = new Date();
            setCurrentMonth(today);
            handleDateClick(today);
          }}
        >
          Today
        </Button>
      </div>
    </div>
  );
};