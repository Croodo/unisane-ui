"use client";

import React, { useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ui/lib/utils";
import { Surface } from "@ui/primitives/surface";
import { Text } from "@ui/primitives/text";
import { IconButton } from "./icon-button";
import { StateLayer } from "@ui/primitives/state-layer";

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
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    onDateSelect?.(newDate);
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

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

        <Text variant="titleMedium">
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

      <div className="grid grid-cols-7 gap-1 p-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center py-2">
            <Text variant="labelSmall" className="text-on-surface-variant">
              {day}
            </Text>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-2 pb-4">
        {days.map((day, index) => (
          <div key={index} className="aspect-square">
            {day ? (
              <button
                className={cn(
                  "relative w-full h-full rounded-sm flex items-center justify-center",
                  "hover:bg-on-surface/10 transition-colors",
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
                    : "text-on-surface"
                )}
                onClick={() => handleDateClick(day)}
                aria-label={`Select ${monthNames[currentMonth.getMonth()]} ${day}, ${currentMonth.getFullYear()}`}
              >
                <StateLayer />
                <Text variant="bodyMedium">{day}</Text>
              </button>
            ) : (
              <div />
            )}
          </div>
        ))}
      </div>
    </Surface>
  );
};
