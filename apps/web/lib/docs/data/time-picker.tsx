"use client";

import { useState } from "react";
import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { TimePicker, Button } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const TimePickerHeroVisual = () => (
  <HeroBackground tone="secondary">
    {/* Mock Time Picker */}
    <div className="relative bg-surface w-[280px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 p-6">
      <div className="text-label-medium text-on-surface-variant mb-4">Select time</div>
      <div className="flex items-center gap-2 justify-center mb-6">
        <div className="bg-primary-container text-on-primary-container rounded-lg px-4 py-3 text-display-small">09</div>
        <span className="text-display-small text-on-surface">:</span>
        <div className="bg-surface-container-highest text-on-surface rounded-lg px-4 py-3 text-display-small">30</div>
        <div className="flex flex-col border border-outline rounded-sm overflow-hidden ml-2">
          <div className="px-3 py-1 bg-tertiary-container text-on-tertiary-container text-label-small">AM</div>
          <div className="px-3 py-1 text-on-surface-variant text-label-small border-t border-outline">PM</div>
        </div>
      </div>
      <div className="w-40 h-40 mx-auto rounded-full bg-surface-container-highest relative">
        <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full" />
        <div className="absolute top-1/2 left-1/2 h-14 w-0_5u bg-primary origin-bottom -translate-x-1/2 -translate-y-full rotate-[-60deg]" />
      </div>
    </div>
  </HeroBackground>
);

// ─── INTERACTIVE EXAMPLES ────────────────────────────────────────────────────
const TimePickerExample = () => {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("09:30");

  return (
    <div className="flex flex-col gap-3 items-center">
      <Button variant="tonal" onClick={() => setOpen(true)}>
        Select Time: {time}
      </Button>
      <TimePicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={setTime}
        initialTime={time}
      />
    </div>
  );
};

export const timePickerDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "time-picker",
  name: "Time Picker",
  description:
    "Time picker allows users to select a time using a clock dial or keyboard input.",
  category: "selection",
  status: "stable",
  icon: "schedule",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["TimePicker"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <TimePickerHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Time picker supports both dial and keyboard input modes.",
    columns: {
      emphasis: "Mode",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Clock dial",
        component: (
          <div className="w-16 h-16 rounded-full bg-surface-container-highest relative">
            <div className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full" />
            <div className="absolute top-1/2 left-1/2 h-6 w-0_5u bg-primary origin-bottom -translate-x-1/2 -translate-y-full rotate-45" />
          </div>
        ),
        rationale: "Visual, intuitive time selection.",
        examples: "Mobile apps, Touch interfaces",
      },
      {
        emphasis: "Keyboard input",
        component: (
          <div className="flex gap-1">
            <div className="w-10 h-8 bg-surface-container-high rounded border border-outline-variant flex items-center justify-center text-body-small">09</div>
            <span className="text-body-medium">:</span>
            <div className="w-10 h-8 bg-surface-container-high rounded border border-outline-variant flex items-center justify-center text-body-small">30</div>
          </div>
        ),
        rationale: "Precise, quick time entry.",
        examples: "Desktop apps, Power users",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Time picker opens in a dialog for focused time selection.",
    examples: [
      {
        title: "Time picker dialog",
        visual: <TimePickerExample />,
        caption: "Click to open the time picker",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "open",
      type: "boolean",
      required: true,
      description: "Controls visibility of the picker dialog.",
    },
    {
      name: "onClose",
      type: "() => void",
      required: true,
      description: "Callback fired when picker should close.",
    },
    {
      name: "onSelect",
      type: "(time: string) => void",
      description: "Callback fired when time is selected (format: HH:mm).",
    },
    {
      name: "initialTime",
      type: "string",
      default: '"12:00"',
      description: "Initial time value in HH:mm format.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Dialog has proper role and aria-modal.",
      "Clock dial uses role='listbox' with options.",
      "AM/PM selection uses role='radiogroup'.",
      "Current selection announced via aria-live.",
    ],
    keyboard: [
      { key: "Tab", description: "Navigate between hours, minutes, AM/PM" },
      { key: "Arrow Keys", description: "Change values" },
      { key: "Enter", description: "Confirm selection" },
      { key: "Escape", description: "Close picker" },
    ],
    focus: [
      "Focus trapped within dialog while open.",
      "Focus returns to trigger on close.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Control picker visibility with state.",
    code: `import { TimePicker, Button } from "@unisane/ui";
import { useState } from "react";

function MeetingScheduler() {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("09:00");

  return (
    <div>
      <Button onClick={() => setOpen(true)}>
        Meeting at {time}
      </Button>

      <TimePicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={setTime}
        initialTime={time}
      />
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "date-picker",
      reason: "Use for date selection.",
    },
    {
      slug: "calendar",
      reason: "Use for inline date display.",
    },
    {
      slug: "text-field",
      reason: "Use for free-form time input.",
    },
  ],
};
