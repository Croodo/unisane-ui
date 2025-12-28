"use client";

import React, { useState, useCallback } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";
import { Surface } from "@ui/primitives/surface";
import { Text } from "@ui/primitives/text";
import { IconButton } from "./icon-button";
import { Ripple } from "./ripple";

const calendarVariants = cva("w-full max-w-sm rounded-sm overflow-hidden", {
  variants: {
    variant: {
      default: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type CalendarProps = VariantProps<typeof calendarVariants> & {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
};

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  className,
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const [focusedDay, setFocusedDay] = useState<number | null>(null);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
    setFocusedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
    setFocusedDay(null);
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    onDateSelect?.(newDate);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent, day: number) => {
    const daysInMonth = getDaysInMonth(currentMonth);
    let newDay = day;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        newDay = day > 1 ? day - 1 : daysInMonth;
        break;
      case "ArrowRight":
        e.preventDefault();
        newDay = day < daysInMonth ? day + 1 : 1;
        break;
      case "ArrowUp":
        e.preventDefault();
        newDay = day > 7 ? day - 7 : day + daysInMonth - 7;
        break;
      case "ArrowDown":
        e.preventDefault();
        newDay = day + 7 <= daysInMonth ? day + 7 : day + 7 - daysInMonth;
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        handleDateClick(day);
        return;
      default:
        return;
    }

    setFocusedDay(newDay);
  }, [currentMonth]);

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <Surface
      tone="surface"
      elevation={1}
      className={cn(calendarVariants({ className }))}
      role="application"
      aria-label={`Calendar, ${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-outline-variant">
        <IconButton
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          }
          onClick={handlePreviousMonth}
          ariaLabel="Previous month"
        />

        <Text variant="titleMedium" aria-live="polite">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>

        <IconButton
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          }
          onClick={handleNextMonth}
          ariaLabel="Next month"
        />
      </div>

      <div className="grid grid-cols-7 gap-1 p-2" role="row">
        {dayNames.map((day) => (
          <div key={day} className="text-center py-2" role="columnheader">
            <Text variant="labelSmall" className="text-on-surface-variant">
              {day}
            </Text>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-2 pb-4" role="grid" aria-label="Calendar dates">
        {days.map((day, index) => (
          <div key={index} className="aspect-square" role="gridcell">
            {day ? (
              <button
                className={cn(
                  "relative w-full h-full rounded-full flex items-center justify-center overflow-hidden",
                  "transition-colors duration-short ease-standard",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  selectedDate &&
                    isSameDay(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth(),
                        day
                      ),
                      selectedDate
                    )
                    ? "bg-primary text-on-primary"
                    : "text-on-surface hover:bg-on-surface/8"
                )}
                onClick={() => handleDateClick(day)}
                onKeyDown={(e) => handleKeyDown(e, day)}
                aria-label={`${monthNames[currentMonth.getMonth()]} ${day}, ${currentMonth.getFullYear()}`}
                aria-selected={
                  selectedDate &&
                  isSameDay(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      day
                    ),
                    selectedDate
                  )
                }
                tabIndex={focusedDay === day || (focusedDay === null && day === 1) ? 0 : -1}
                ref={(el) => {
                  if (focusedDay === day && el) {
                    el.focus();
                  }
                }}
              >
                <Ripple />
                <Text variant="bodyMedium" className="relative z-10">{day}</Text>
              </button>
            ) : (
              <div aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </Surface>
  );
};
