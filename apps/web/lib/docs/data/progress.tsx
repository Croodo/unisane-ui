"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Progress, Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const ProgressHeroVisual = () => (
  <HeroBackground tone="error">
    {/* Mock Upload Card */}
    <div className="relative bg-surface w-80 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30">
      <div className="px-5 py-4 border-b border-outline-variant/20">
        <span className="text-title-medium text-on-surface">Uploading Files</span>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-body-small text-on-surface">document.pdf</span>
            <span className="text-body-small text-on-surface-variant">75%</span>
          </div>
          <Progress value={75} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-body-small text-on-surface">image.png</span>
            <span className="text-body-small text-on-surface-variant">Loading...</span>
          </div>
          <Progress indeterminate />
        </div>
        <div className="flex items-center justify-center pt-2">
          <Progress variant="circular" value={45} />
        </div>
      </div>
    </div>
  </HeroBackground>
);

export const progressDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "progress",
  name: "Progress",
  description:
    "Progress indicators express an unspecified wait time or display the length of a process.",
  category: "communication",
  status: "stable",
  icon: "autorenew",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Progress"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <ProgressHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Progress indicators come in linear and circular variants. Choose based on the context and space available.",
    columns: {
      emphasis: "Type",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "Linear Determinate",
        component: (
          <div className="w-32">
            <Progress value={65} />
          </div>
        ),
        rationale:
          "Shows exact progress when the duration is known.",
        examples: "File uploads, Downloads, Form completion",
      },
      {
        emphasis: "Linear Indeterminate",
        component: (
          <div className="w-32">
            <Progress indeterminate />
          </div>
        ),
        rationale:
          "Shows ongoing activity when duration is unknown.",
        examples: "Loading content, API calls, Processing",
      },
      {
        emphasis: "Circular Determinate",
        component: (
          <Progress variant="circular" value={65} />
        ),
        rationale:
          "Compact progress indicator for constrained spaces.",
        examples: "Button loading, Card progress, Stats",
      },
      {
        emphasis: "Circular Indeterminate",
        component: (
          <Progress variant="circular" indeterminate />
        ),
        rationale:
          "Spinning indicator for unknown wait times.",
        examples: "Page loading, Refreshing, Submitting",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Progress indicators can be linear or circular, determinate or indeterminate.",
    items: [
      {
        component: <Progress value={50} className="w-32" />,
        title: "Linear",
        subtitle: "Full-width indicator",
      },
      {
        component: <Progress variant="circular" value={50} />,
        title: "Circular",
        subtitle: "Compact indicator",
      },
      {
        component: <Progress indeterminate className="w-32" />,
        title: "Indeterminate",
        subtitle: "Unknown duration",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Progress indicators are commonly used for file uploads, page loading, and form submissions.",
    examples: [
      {
        title: "File upload",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-72 mx-auto">
            <div className="text-title-small text-on-surface mb-4">Uploading</div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-body-small mb-1">
                  <span className="text-on-surface">file.pdf</span>
                  <span className="text-on-surface-variant">100%</span>
                </div>
                <Progress value={100} />
              </div>
              <div>
                <div className="flex justify-between text-body-small mb-1">
                  <span className="text-on-surface">image.jpg</span>
                  <span className="text-on-surface-variant">45%</span>
                </div>
                <Progress value={45} />
              </div>
            </div>
          </Card>
        ),
        caption: "Linear progress bars showing upload status",
      },
      {
        title: "Loading state",
        visual: (
          <Card variant="outlined" padding="lg" className="max-w-52 mx-auto">
            <div className="flex flex-col items-center gap-4">
              <Progress variant="circular" indeterminate />
              <span className="text-body-medium text-on-surface-variant">Loading...</span>
            </div>
          </Card>
        ),
        caption: "Circular spinner for loading content",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "value",
      type: "number",
      default: "0",
      description: "The progress value (0-100). Ignored when indeterminate.",
    },
    {
      name: "variant",
      type: '"linear" | "circular"',
      default: '"linear"',
      description: "The shape of the progress indicator.",
    },
    {
      name: "indeterminate",
      type: "boolean",
      default: "false",
      description: "If true, shows an animated indeterminate state.",
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
      "Uses role='progressbar' for screen reader support.",
      "aria-valuemin, aria-valuemax, and aria-valuenow are set appropriately.",
      "Indeterminate state removes aria-valuenow.",
    ],
    keyboard: [
      { key: "N/A", description: "Progress indicators are not interactive" },
    ],
    focus: [
      "Progress indicators do not receive focus.",
      "Consider adding text descriptions for important progress updates.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Track progress state and display with appropriate variant.",
    code: `import { Progress } from "@unisane/ui";
import { useState, useEffect } from "react";

function FileUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const simulateUpload = () => {
    setUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="space-y-4">
      <button onClick={simulateUpload} disabled={uploading}>
        Upload File
      </button>

      {uploading && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "skeleton",
      reason: "Use for content placeholder while loading.",
    },
    {
      slug: "button",
      reason: "Can include loading state with circular progress.",
    },
    {
      slug: "snackbar",
      reason: "Use to announce progress completion.",
    },
  ],
};
