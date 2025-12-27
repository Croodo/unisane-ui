"use client";

import { useState } from "react";
import { ComponentDoc } from "../types";
import { Rating } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const RatingHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-primary-container to-tertiary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-40px] left-[-40px] w-56 h-56 bg-primary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-50px] right-[-30px] w-64 h-64 bg-tertiary/20 rounded-full blur-3xl" />

    {/* Mock Review Card */}
    <div className="relative bg-surface w-[280px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 z-10 p-6u">
      <div className="flex items-center gap-3u mb-4u">
        <div className="w-12u h-12u rounded-full bg-secondary-container flex items-center justify-center">
          <span className="text-title-medium text-on-secondary-container">JD</span>
        </div>
        <div>
          <div className="text-title-small text-on-surface">John Doe</div>
          <div className="text-body-small text-on-surface-variant">2 days ago</div>
        </div>
      </div>
      <div className="flex items-center gap-1u mb-3u">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`material-symbols-outlined ${i <= 4 ? "text-primary" : "text-outline"}`}>
            star
          </span>
        ))}
        <span className="text-body-medium text-on-surface-variant ml-2u">4.0</span>
      </div>
      <p className="text-body-medium text-on-surface-variant">
        Great product! Highly recommend.
      </p>
    </div>
  </div>
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
