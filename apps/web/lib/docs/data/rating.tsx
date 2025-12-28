"use client";

import { useState } from "react";
import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Rating } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const RatingHeroVisual = () => (
  <HeroBackground tone="tertiary">
    {/* Mock Review Card */}
    <div className="relative bg-surface w-72 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center">
          <span className="text-title-medium text-on-secondary-container">JD</span>
        </div>
        <div>
          <div className="text-title-small text-on-surface">John Doe</div>
          <div className="text-body-small text-on-surface-variant">2 days ago</div>
        </div>
      </div>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`material-symbols-outlined ${i <= 4 ? "text-primary" : "text-outline"}`}>
            star
          </span>
        ))}
        <span className="text-body-medium text-on-surface-variant ml-2">4.0</span>
      </div>
      <p className="text-body-medium text-on-surface-variant">
        Great product! Highly recommend.
      </p>
    </div>
  </HeroBackground>
);

// ─── INTERACTIVE EXAMPLES ────────────────────────────────────────────────────
const RatingBasicExample = () => {
  const [value, setValue] = useState(3);
  return (
    <Rating value={value} onChange={setValue} showValue />
  );
};

const RatingHalfExample = () => {
  const [value, setValue] = useState(3.5);
  return (
    <Rating value={value} onChange={setValue} allowHalf showValue />
  );
};

export const ratingDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "rating",
  name: "Rating",
  description:
    "Rating allows users to provide feedback by selecting a number of stars.",
  category: "selection",
  status: "stable",
  icon: "star",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Rating"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <RatingHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Rating components come in different configurations for various feedback needs.",
    columns: {
      emphasis: "Type",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Whole stars",
        component: <Rating value={4} max={5} size="md" />,
        rationale: "Simple rating without granularity.",
        examples: "Quick reviews, Simple feedback",
      },
      {
        emphasis: "Half stars",
        component: <Rating value={3.5} max={5} allowHalf size="md" />,
        rationale: "More precise rating needed.",
        examples: "Product reviews, Detailed feedback",
      },
      {
        emphasis: "With value",
        component: <Rating value={4} max={5} showValue size="md" />,
        rationale: "When numeric value adds context.",
        examples: "Review summaries, Aggregated ratings",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Ratings are used in reviews, feedback forms, and content evaluation.",
    examples: [
      {
        title: "Basic rating",
        visual: <RatingBasicExample />,
        caption: "Click stars to rate",
      },
      {
        title: "Half star rating",
        visual: <RatingHalfExample />,
        caption: "Allows half-star precision",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "Current rating value.",
    },
    {
      name: "onChange",
      type: "(value: number) => void",
      description: "Callback fired when rating changes.",
    },
    {
      name: "max",
      type: "number",
      default: "5",
      description: "Maximum number of stars.",
    },
    {
      name: "allowHalf",
      type: "boolean",
      default: "false",
      description: "Allow half-star ratings.",
    },
    {
      name: "showValue",
      type: "boolean",
      default: "false",
      description: "Display numeric value next to stars.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "Size of the rating stars.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Disable rating interaction.",
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses role='radiogroup' for proper semantics.",
      "Each star is a radio button with aria-checked.",
      "Current rating announced via aria-label.",
    ],
    keyboard: [
      { key: "Arrow Left/Right", description: "Change rating value" },
      { key: "Tab", description: "Move focus between stars" },
    ],
    focus: [
      "Focus ring visible on individual stars.",
      "Hover preview shows potential rating.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Control rating with state.",
    code: `import { Rating } from "@unisane/ui";
import { useState } from "react";

function ProductRating() {
  const [rating, setRating] = useState(0);

  return (
    <div>
      <p>Rate this product:</p>
      <Rating
        value={rating}
        onChange={setRating}
        allowHalf
        showValue
      />
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "slider",
      reason: "Use for numeric input on a continuous scale.",
    },
    {
      slug: "checkbox",
      reason: "Use for binary feedback (like/dislike).",
    },
  ],
};
