"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Stepper, Card, Button } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const StepperHeroVisual = () => (
  <HeroBackground tone="tertiary">
    {/* Mock Stepper */}
    <div className="relative bg-surface w-80 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30 p-6">
      <div className="flex items-start gap-0 w-full">
        {/* Step 1 - Completed */}
        <div className="flex flex-col items-center relative flex-1">
          <div className="absolute top-4 left-1/2 w-full h-0.5 bg-primary z-0" />
          <div className="w-8 h-8 rounded-sm flex items-center justify-center text-label-small font-medium bg-primary border-2 border-primary text-on-primary z-10">
            <span className="material-symbols-outlined text-[18px]">check</span>
          </div>
          <div className="mt-3 text-center">
            <span className="text-label-small font-medium text-on-surface-variant">Details</span>
          </div>
        </div>
        {/* Step 2 - Active */}
        <div className="flex flex-col items-center relative flex-1">
          <div className="absolute top-4 left-1/2 w-full h-0.5 bg-outline-variant/30 z-0" />
          <div className="w-8 h-8 rounded-sm flex items-center justify-center text-label-small font-medium bg-primary border-2 border-primary text-on-primary z-10 scale-110">
            2
          </div>
          <div className="mt-3 text-center">
            <span className="text-label-small font-medium text-on-surface">Payment</span>
          </div>
        </div>
        {/* Step 3 - Pending */}
        <div className="flex flex-col items-center relative flex-none">
          <div className="w-8 h-8 rounded-sm flex items-center justify-center text-label-small font-medium bg-surface border-2 border-outline-variant text-on-surface-variant z-10">
            3
          </div>
          <div className="mt-3 text-center">
            <span className="text-label-small font-medium text-on-surface-variant">Confirm</span>
          </div>
        </div>
      </div>
    </div>
  </HeroBackground>
);

export const stepperDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "stepper",
  name: "Stepper",
  description:
    "Steppers guide users through multi-step processes, showing progress and remaining steps.",
  category: "navigation",
  status: "stable",
  icon: "linear_scale",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Stepper", "Step", "StepLabel", "StepDescription"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <StepperHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Stepper steps have three states: completed, active, and pending.",
    columns: {
      emphasis: "State",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Completed",
        component: (
          <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[18px]">check</span>
          </div>
        ),
        rationale:
          "Previous steps that have been finished.",
        examples: "Validated form sections, Previous stages",
      },
      {
        emphasis: "Active",
        component: (
          <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-primary border-2 border-primary text-on-primary scale-110 text-label-small font-medium">
            2
          </div>
        ),
        rationale:
          "The current step user is working on.",
        examples: "Current form section, Active stage",
      },
      {
        emphasis: "Pending",
        component: (
          <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-surface border-2 border-outline-variant text-on-surface-variant text-label-small font-medium">
            3
          </div>
        ),
        rationale:
          "Future steps not yet reached.",
        examples: "Upcoming sections, Future stages",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Steppers can be horizontal or vertical based on layout needs.",
    items: [
      {
        component: (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-xs flex items-center justify-center bg-primary text-on-primary text-[10px]">1</div>
            <div className="w-8 h-0.5 bg-primary" />
            <div className="w-6 h-6 rounded-xs flex items-center justify-center bg-primary text-on-primary text-[10px]">2</div>
            <div className="w-8 h-0.5 bg-outline-variant/30" />
            <div className="w-6 h-6 rounded-xs flex items-center justify-center border border-outline-variant text-on-surface-variant text-[10px]">3</div>
          </div>
        ),
        title: "Horizontal",
        subtitle: "Default layout",
      },
      {
        component: (
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-xs flex items-center justify-center bg-primary text-on-primary text-[10px]">1</div>
            <div className="w-0.5 h-4 bg-primary" />
            <div className="w-6 h-6 rounded-xs flex items-center justify-center bg-primary text-on-primary text-[10px]">2</div>
          </div>
        ),
        title: "Vertical",
        subtitle: "For narrow spaces",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Steppers are placed at the top of multi-step forms or wizards.",
    examples: [
      {
        title: "Checkout flow",
        visual: (
          <Card variant="outlined" padding="lg" className="max-w-80 mx-auto">
            <Stepper
              steps={[
                { label: "Cart" },
                { label: "Shipping" },
                { label: "Payment" },
              ]}
              activeStep={1}
            />
          </Card>
        ),
        caption: "Three-step checkout process",
      },
      {
        title: "With descriptions",
        visual: (
          <Card variant="outlined" padding="lg" className="max-w-80 mx-auto">
            <Stepper
              steps={[
                { label: "Account", description: "Create login" },
                { label: "Profile", description: "Add details" },
                { label: "Complete", description: "All done" },
              ]}
              activeStep={0}
            />
          </Card>
        ),
        caption: "Steps with descriptive subtitles",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "steps",
      type: "Array<{ label: string; description?: string }>",
      description: "Array of step definitions with labels and optional descriptions.",
    },
    {
      name: "activeStep",
      type: "number",
      default: "0",
      description: "Index of the currently active step (0-indexed).",
    },
    {
      name: "children",
      type: "ReactNode",
      description: "Alternative to steps prop for custom step rendering.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes.",
    },
  ],

  // ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "Step",
      description: "Individual step component for custom rendering.",
      props: [
        { name: "stepNumber", type: "number", required: true, description: "The step number to display." },
        { name: "active", type: "boolean", description: "Whether this step is currently active." },
        { name: "completed", type: "boolean", description: "Whether this step is completed." },
        { name: "orientation", type: '"horizontal" | "vertical"', description: "Layout orientation." },
        { name: "onClick", type: "() => void", description: "Click handler for interactive steps." },
      ],
    },
    {
      name: "StepLabel",
      description: "Label wrapper for step titles.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Step title text." },
      ],
    },
    {
      name: "StepDescription",
      description: "Description text below step labels.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Description text." },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Steps are announced with their number and label.",
      "Active step uses aria-current='step'.",
      "Completed steps indicate their status.",
    ],
    keyboard: [
      { key: "Tab", description: "Moves focus between interactive steps" },
      { key: "Enter / Space", description: "Activates step if clickable" },
    ],
    focus: [
      "Interactive steps have visible focus ring.",
      "Active step is visually emphasized.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Use controlled state to manage step progression.",
    code: `import { Stepper, Button, Card } from "@unisane/ui";
import { useState } from "react";

function CheckoutWizard() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { label: "Cart", description: "Review items" },
    { label: "Shipping", description: "Enter address" },
    { label: "Payment", description: "Add payment" },
    { label: "Confirm", description: "Place order" },
  ];

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <Card>
      <Stepper steps={steps} activeStep={activeStep} />

      <div className="mt-8">
        {/* Step content based on activeStep */}
        {activeStep === 0 && <CartReview />}
        {activeStep === 1 && <ShippingForm />}
        {activeStep === 2 && <PaymentForm />}
        {activeStep === 3 && <OrderConfirmation />}
      </div>

      <div className="flex justify-between mt-6">
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        <Button variant="filled" onClick={handleNext}>
          {activeStep === steps.length - 1 ? "Place Order" : "Continue"}
        </Button>
      </div>
    </Card>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "progress",
      reason: "Use for continuous progress indication.",
    },
    {
      slug: "tabs",
      reason: "Use for non-linear content navigation.",
    },
    {
      slug: "card",
      reason: "Container for step content sections.",
    },
  ],
};
