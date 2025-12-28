"use client";

import { useState } from "react";
import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Calendar } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const CalendarHeroVisual = () => (
  <HeroBackground tone="secondary">
    {/* Mock Calendar */}
    <div className="relative bg-surface w-72 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30">
      <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
        <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
        <span className="text-title-medium text-on-surface">December 2024</span>
        <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div key={i} className="text-label-small text-on-surface-variant text-center py-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {[...Array(31)].map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-full flex items-center justify-center text-body-small ${
                i === 14
                  ? "bg-primary text-on-primary"
                  : "text-on-surface hover:bg-on-surface/8"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  </HeroBackground>
);

// ─── INTERACTIVE EXAMPLES ────────────────────────────────────────────────────
const CalendarBasicExample = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return (
    <Calendar
      selectedDate={date}
      onDateSelect={setDate}
      className="max-w-xs"
    />
  );
};

export const calendarDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "calendar",
  name: "Calendar",
  description:
    "Calendar allows users to select a date from a grid of days, with navigation between months.",
  category: "selection",
  status: "stable",
  icon: "calendar_month",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Calendar"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <CalendarHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose between calendar and date picker based on the use case.",
    columns: {
      emphasis: "Component",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Calendar",
        component: (
          <div className="w-24 h-20 bg-surface-container rounded-sm p-2">
            <div className="grid grid-cols-7 gap-0_5u">
              {[...Array(21)].map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === 10 ? "bg-primary" : "bg-outline-variant/30"}`} />
              ))}
            </div>
          </div>
        ),
        rationale: "When users need to see the full month context.",
        examples: "Event scheduling, Date range selection",
      },
      {
        emphasis: "Date Picker",
        component: (
          <div className="w-32 h-10 bg-surface-container-high rounded-lg px-3 flex items-center justify-between">
            <span className="text-body-small text-on-surface">Dec 15, 2024</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">calendar_today</span>
          </div>
        ),
        rationale: "When space is limited or date entry is secondary.",
        examples: "Forms, Filters, Quick date entry",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Calendars can be inline or shown in dialogs/popovers.",
    examples: [
      {
        title: "Inline calendar",
        visual: <CalendarBasicExample />,
        caption: "Calendar displayed inline for date selection",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "selectedDate",
      type: "Date",
      description: "The currently selected date.",
    },
    {
      name: "onDateSelect",
      type: "(date: Date) => void",
      description: "Callback fired when a date is selected.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes to apply.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses role='application' for proper screen reader context.",
      "Month and year are announced via aria-live.",
      "Each date button has descriptive aria-label.",
      "Selected state is communicated via aria-selected.",
    ],
    keyboard: [
      { key: "Arrow Keys", description: "Navigate between days" },
      { key: "Enter / Space", description: "Select the focused date" },
      { key: "Tab", description: "Move focus to navigation buttons" },
    ],
    focus: [
      "Focus ring visible on all interactive elements.",
      "Tab navigation follows logical order.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use controlled state to manage selected date.",
    code: `import { Calendar } from "@unisane/ui";
import { useState } from "react";

function DateSelector() {
  const [selectedDate, setSelectedDate] = useState<Date>();

  return (
    <Calendar
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
    />
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "date-picker",
      reason: "Use for compact date input with popover calendar.",
    },
    {
      slug: "time-picker",
      reason: "Use for time selection alongside date.",
    },
  ],
};
