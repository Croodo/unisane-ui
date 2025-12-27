"use client";

import { useState } from "react";
import { ComponentDoc } from "../types";
import { DatePicker } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const DatePickerHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-primary-container to-tertiary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-40px] left-[-40px] w-56 h-56 bg-primary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-50px] right-[-30px] w-64 h-64 bg-tertiary/20 rounded-full blur-3xl" />

    {/* Mock Date Picker */}
    <div className="relative bg-surface w-[300px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 z-10 p-6u">
      <div className="text-label-medium text-on-surface-variant mb-2u">Date</div>
      <div className="bg-surface border-2 border-outline-variant rounded-lg px-4u py-3u flex items-center justify-between">
        <span className="text-body-medium text-on-surface">December 15, 2024</span>
        <span className="material-symbols-outlined text-on-surface-variant">calendar_today</span>
      </div>
      {/* Mock Calendar Dropdown */}
      <div className="mt-2u bg-surface-container rounded-xl shadow-2 p-4u">
        <div className="flex items-center justify-between mb-3u">
          <span className="text-title-small text-on-surface">December 2024</span>
          <div className="flex gap-2u">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_left</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1u">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-label-small text-on-surface-variant py-1u">{d}</div>
          ))}
          {[...Array(15)].map((_, i) => (
            <div key={i} className={`text-center text-body-small py-1u rounded-full ${i === 14 ? "bg-primary text-on-primary" : "text-on-surface"}`}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── INTERACTIVE EXAMPLES ────────────────────────────────────────────────────
const DatePickerBasicExample = () => {
  const [date, setDate] = useState<Date | undefined>();
  return (
    <div className="w-full max-w-xs">
      <DatePicker
        label="Select Date"
        value={date}
        onChange={setDate}
        placeholder="Choose a date"
      />
    </div>
  );
};

export const datePickerDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "date-picker",
  name: "Date Picker",
  description:
    "Date picker provides a compact input with a popover calendar for selecting dates.",
  category: "selection",
  status: "stable",
  icon: "calendar_today",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["DatePicker"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <DatePickerHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose between date picker and inline calendar based on space and use case.",
    columns: {
      emphasis: "Component",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Date Picker",
        component: (
          <div className="w-32 h-10u bg-surface border border-outline-variant rounded-lg px-3u flex items-center justify-between">
            <span className="text-body-small text-on-surface">Dec 15</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">calendar_today</span>
          </div>
        ),
        rationale: "Compact input for forms and limited space.",
        examples: "Forms, Filters, Date fields",
      },
      {
        emphasis: "Calendar",
        component: (
          <div className="w-24 h-16 bg-surface-container rounded-sm p-2">
            <div className="grid grid-cols-7 gap-0_5u">
              {[...Array(14)].map((_, i) => (
                <div key={i} className={`w-2u h-2u rounded-full ${i === 7 ? "bg-primary" : "bg-outline-variant/30"}`} />
              ))}
            </div>
          </div>
        ),
        rationale: "When users need to see full month context.",
        examples: "Event scheduling, Availability display",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Date pickers are commonly used in forms for date input.",
    examples: [
      {
        title: "Form input",
        visual: <DatePickerBasicExample />,
        caption: "Click to open calendar popover",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "value",
      type: "Date",
      description: "The selected date value.",
    },
    {
      name: "onChange",
      type: "(date: Date) => void",
      description: "Callback fired when date is selected.",
    },
    {
      name: "label",
      type: "string",
      description: "Label for the input field.",
    },
    {
      name: "placeholder",
      type: "string",
      default: '"Select a date"',
      description: "Placeholder text when no date selected.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Disable the date picker.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Input is properly labeled.",
      "Calendar popup is announced when opened.",
      "Selected date is read by screen readers.",
    ],
    keyboard: [
      { key: "Enter/Space", description: "Open calendar popup" },
      { key: "Arrow Keys", description: "Navigate calendar dates" },
      { key: "Escape", description: "Close calendar" },
    ],
    focus: [
      "Focus visible on input field.",
      "Focus trapped in calendar when open.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use controlled state for date value.",
    code: `import { DatePicker } from "@unisane/ui";
import { useState } from "react";

function BookingForm() {
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();

  return (
    <div className="space-y-4">
      <DatePicker
        label="Check-in"
        value={checkIn}
        onChange={setCheckIn}
      />
      <DatePicker
        label="Check-out"
        value={checkOut}
        onChange={setCheckOut}
      />
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "calendar",
      reason: "Use for inline date display.",
    },
    {
      slug: "time-picker",
      reason: "Use for time selection.",
    },
    {
      slug: "text-field",
      reason: "Base input component used internally.",
    },
  ],
};
