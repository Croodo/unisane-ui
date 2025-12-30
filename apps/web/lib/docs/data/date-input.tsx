"use client";

import { useState } from "react";
import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { DateInput } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const DateInputHeroVisual = () => (
  <HeroBackground tone="primary">
    {/* Mock Segment-based Date Input */}
    <div className="relative bg-surface w-80 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30 p-6">
      <div className="text-label-small text-primary mb-1 px-1">Date</div>
      <div className="bg-surface border-2 border-primary rounded-lg px-4 py-3 flex items-center gap-1">
        <span className="bg-primary/10 text-on-surface text-body-large font-medium px-1 rounded-xs">12</span>
        <span className="text-on-surface-variant text-body-large">/</span>
        <span className="text-on-surface text-body-large font-medium px-1">25</span>
        <span className="text-on-surface-variant text-body-large">/</span>
        <span className="text-on-surface text-body-large font-medium px-1">2024</span>
        <span className="material-symbols-outlined text-on-surface-variant ml-auto">calendar_today</span>
      </div>
      {/* Keyboard hint */}
      <div className="mt-4 flex items-center gap-2 text-label-small text-on-surface-variant">
        <div className="flex gap-1">
          <span className="px-1.5 py-0.5 bg-surface-container rounded text-[10px]">↑</span>
          <span className="px-1.5 py-0.5 bg-surface-container rounded text-[10px]">↓</span>
        </div>
        <span>to adjust</span>
        <div className="flex gap-1">
          <span className="px-1.5 py-0.5 bg-surface-container rounded text-[10px]">←</span>
          <span className="px-1.5 py-0.5 bg-surface-container rounded text-[10px]">→</span>
        </div>
        <span>to navigate</span>
      </div>
    </div>
  </HeroBackground>
);

// ─── INTERACTIVE EXAMPLES ────────────────────────────────────────────────────
const DateInputBasicExample = () => {
  const [date, setDate] = useState<Date | undefined>();
  return (
    <div className="w-full max-w-xs">
      <DateInput
        label="Date of Birth"
        value={date}
        onChange={setDate}
      />
      {date && (
        <p className="text-label-small text-on-surface-variant mt-2">
          Selected: {date.toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

const DateInputVariantsExample = () => {
  const [date1, setDate1] = useState<Date | undefined>();
  const [date2, setDate2] = useState<Date | undefined>();
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      <DateInput
        label="Outlined"
        variant="outlined"
        value={date1}
        onChange={setDate1}
      />
      <DateInput
        label="Filled"
        variant="filled"
        value={date2}
        onChange={setDate2}
      />
    </div>
  );
};

const DateInputWithIconExample = () => {
  const [date, setDate] = useState<Date | undefined>();
  return (
    <div className="w-full max-w-xs">
      <DateInput
        label="Event Date"
        value={date}
        onChange={setDate}
        trailingIcon={
          <span className="material-symbols-outlined text-[20px]">event</span>
        }
      />
    </div>
  );
};

const DateInputStatesExample = () => {
  const [errorDate, setErrorDate] = useState<Date | undefined>();
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      <DateInput
        label="With Helper Text"
        helperText="Enter your date of birth"
      />
      <DateInput
        label="Error State"
        error
        helperText="Please enter a valid date"
        value={errorDate}
        onChange={setErrorDate}
      />
      <DateInput
        label="Disabled"
        disabled
        value={new Date(2024, 11, 25)}
      />
    </div>
  );
};

const DateInputConstraintsExample = () => {
  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
  const [date, setDate] = useState<Date | undefined>();

  return (
    <div className="w-full max-w-xs">
      <DateInput
        label="Appointment Date"
        value={date}
        onChange={setDate}
        min={minDate}
        max={maxDate}
        helperText="Select a date within the next 3 months"
      />
    </div>
  );
};

export const dateInputDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "date-input",
  name: "Date Input",
  description:
    "A segment-based date input where each part (month, day, year) is individually editable with keyboard support.",
  category: "text-inputs",
  status: "stable",
  icon: "edit_calendar",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["DateInput"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <DateInputHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose between segment-based date input and date picker based on user interaction preference.",
    columns: {
      emphasis: "Component",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Date Input",
        component: (
          <div className="w-36 h-10 bg-surface border border-outline-variant rounded-lg px-3 flex items-center gap-0.5">
            <span className="text-body-small text-on-surface">12</span>
            <span className="text-on-surface-variant">/</span>
            <span className="text-body-small text-on-surface">25</span>
            <span className="text-on-surface-variant">/</span>
            <span className="text-body-small text-on-surface">2024</span>
          </div>
        ),
        rationale: "Fast keyboard-driven input without leaving the field.",
        examples: "Forms, Quick date entry, Known dates",
      },
      {
        emphasis: "Date Picker",
        component: (
          <div className="w-32 h-10 bg-surface border border-outline-variant rounded-lg px-3 flex items-center justify-between">
            <span className="text-body-small text-on-surface">Dec 25</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">calendar_today</span>
          </div>
        ),
        rationale: "Visual calendar selection for exploring dates.",
        examples: "Booking, Event scheduling, Date ranges",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Date inputs are ideal for forms where users know the date they want to enter.",
    examples: [
      {
        title: "Basic Usage",
        visual: <DateInputBasicExample />,
        caption: "Type numbers or use arrow keys to adjust segments",
      },
      {
        title: "Variants",
        visual: <DateInputVariantsExample />,
        caption: "Outlined (default) and filled variants",
      },
      {
        title: "With Trailing Icon",
        visual: <DateInputWithIconExample />,
        caption: "Add a trailing icon for visual context",
      },
      {
        title: "States",
        visual: <DateInputStatesExample />,
        caption: "Helper text, error, and disabled states",
      },
      {
        title: "Min/Max Constraints",
        visual: <DateInputConstraintsExample />,
        caption: "Constrain selectable dates to a range",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "value",
      type: "Date | undefined",
      description: "The currently selected date value.",
    },
    {
      name: "onChange",
      type: "(date: Date | undefined) => void",
      description: "Callback fired when the date changes.",
    },
    {
      name: "label",
      type: "string",
      default: '"Date"',
      description: "Label text displayed above the input.",
    },
    {
      name: "variant",
      type: '"outlined" | "filled"',
      default: '"outlined"',
      description: "Visual style variant of the input.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Whether the input is disabled.",
    },
    {
      name: "error",
      type: "boolean",
      default: "false",
      description: "Whether to show error styling.",
    },
    {
      name: "helperText",
      type: "string",
      description: "Helper or error text displayed below the input.",
    },
    {
      name: "min",
      type: "Date",
      description: "Minimum allowed date. Dates before this are invalid.",
    },
    {
      name: "max",
      type: "Date",
      description: "Maximum allowed date. Dates after this are invalid.",
    },
    {
      name: "trailingIcon",
      type: "ReactNode",
      description: "Icon or element displayed at the end of the input.",
    },
    {
      name: "labelBg",
      type: "string",
      description: "Background color class for the floating label (outlined variant).",
    },
    {
      name: "onFocus",
      type: "() => void",
      description: "Callback when a segment receives focus.",
    },
    {
      name: "onBlur",
      type: "() => void",
      description: "Callback when all segments lose focus.",
    },
    {
      name: "id",
      type: "string",
      description: "Custom ID for the input element.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes for the container.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Each segment has proper aria-label (month, day, year).",
      "Segments use spinbutton role with aria-valuenow, aria-valuemin, aria-valuemax.",
      "Helper text is linked via aria-describedby.",
      "Label is associated with the first segment via htmlFor.",
    ],
    keyboard: [
      { key: "Tab", description: "Move between segments and other form fields" },
      { key: "Arrow Up/Down", description: "Increment/decrement the focused segment value" },
      { key: "Arrow Left/Right", description: "Move between segments" },
      { key: "0-9", description: "Type numbers directly into the segment" },
      { key: "Backspace", description: "Delete last digit or clear segment" },
      { key: "Delete", description: "Clear the entire segment" },
    ],
    focus: [
      "Visible focus ring on the input container.",
      "Focused segment is highlighted with primary color background.",
      "Focus moves logically between segments with arrow keys.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description:
      "The DateInput component uses segment-based editing for precise keyboard control. Each segment (month, day, year) is individually focusable and accepts numeric input.",
    code: `import { DateInput } from "@unisane/ui";
import { useState } from "react";

function BirthDateForm() {
  const [birthDate, setBirthDate] = useState<Date>();
  const [error, setError] = useState(false);

  const validateAge = (date: Date | undefined) => {
    if (!date) {
      setError(false);
      setBirthDate(undefined);
      return;
    }

    const age = new Date().getFullYear() - date.getFullYear();
    if (age < 18) {
      setError(true);
    } else {
      setError(false);
    }
    setBirthDate(date);
  };

  return (
    <DateInput
      label="Date of Birth"
      value={birthDate}
      onChange={validateAge}
      error={error}
      helperText={error ? "You must be 18 or older" : "MM/DD/YYYY format"}
      max={new Date()} // Can't be born in the future
    />
  );
}`,
  },

  // ─── GUIDELINES ──────────────────────────────────────────────────────────────
  guidelines: [
    { type: "do", text: "Use for known dates where users can type directly (birthdays, specific events)." },
    { type: "do", text: "Provide clear helper text about the expected format." },
    { type: "do", text: "Use min/max constraints to prevent invalid date selection." },
    { type: "do", text: "Combine with a calendar icon button if users might want visual selection too." },
    { type: "dont", text: "Don't use when users need to explore or browse dates visually." },
    { type: "dont", text: "Avoid for date ranges - use two separate inputs or a date range picker." },
    { type: "dont", text: "Don't disable without providing context why." },
  ],

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "date-picker",
      reason: "Use when users need a visual calendar to select dates.",
    },
    {
      slug: "calendar",
      reason: "Use for inline date display and selection.",
    },
    {
      slug: "time-picker",
      reason: "Use alongside date input for datetime selection.",
    },
    {
      slug: "text-field",
      reason: "Base input styling that date input extends.",
    },
  ],
};
