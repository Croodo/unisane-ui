"use client";

import { useState } from "react";
import { ComponentDoc } from "../types";
import { Calendar } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const CalendarHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-tertiary-container to-primary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-40px] left-[-40px] w-56 h-56 bg-tertiary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-50px] right-[-30px] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

    {/* Mock Calendar */}
    <div className="relative bg-surface w-[280px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 z-10">
      <div className="px-5u py-4u border-b border-outline-variant/20 flex items-center justify-between">
        <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
        <span className="text-title-medium text-on-surface">December 2024</span>
        <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
      </div>
      <div className="p-4u">
        <div className="grid grid-cols-7 gap-1u mb-2u">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div key={i} className="text-label-small text-on-surface-variant text-center py-1u">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1u">
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
  </div>
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
                <div key={i} className={`w-2u h-2u rounded-full ${i === 10 ? "bg-primary" : "bg-outline-variant/30"}`} />
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
          <div className="w-32 h-10u bg-surface-container-high rounded-lg px-3u flex items-center justify-between">
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
