"use client";

import { DocLayout, DocSection } from "@/components/layout";
import { Card, Typography, Button, SegmentedButton } from "@unisane/ui";
import { useTheme } from "@unisane/ui";
import { useState } from "react";

const TOC_ITEMS = [
  { id: "theme-provider", label: "ThemeProvider Setup" },
  { id: "color-modes", label: "Light & Dark Mode" },
  { id: "color-themes", label: "Color Themes" },
  { id: "radius-styles", label: "Border Radius" },
  { id: "density", label: "Density" },
  { id: "programmatic", label: "Programmatic Control" },
];

export default function ThemingPage() {
  return (
    <DocLayout
      title="Theming"
      description="Customize the look and feel of your application with Unisane UI's powerful theming system."
      toc={TOC_ITEMS}
    >
      {/* ThemeProvider Setup */}
      <DocSection
        id="theme-provider"
        title="ThemeProvider Setup"
        description="Wrap your application with ThemeProvider to enable theming across all components."
      >
        <div className="space-y-8">
          <Typography variant="bodyMedium" className="text-on-surface-variant max-w-2xl">
            The ThemeProvider manages your application's theme state, including color mode, color theme,
            border radius, and density. It persists user preferences to localStorage automatically.
          </Typography>

          <CodeBlock
            title="app/layout.tsx"
            code={`import { ThemeProvider } from "@unisane/ui";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          defaultConfig={{
            theme: "system",
            colorTheme: "blue",
            radius: "standard",
            density: "standard",
          }}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}`}
          />

          <InfoCard icon="info" variant="info">
            Add <code className="mx-1 px-1.5 py-0.5 bg-surface-container rounded text-body-small">suppressHydrationWarning</code> to
            your html tag to prevent hydration warnings when theme is applied.
          </InfoCard>
        </div>
      </DocSection>

      {/* Color Modes */}
      <DocSection
        id="color-modes"
        title="Light & Dark Mode"
        description="Support light, dark, and system-based color modes out of the box."
      >
        <div className="space-y-8">
          <div className="grid grid-cols-1 @md:grid-cols-3 gap-4">
            <ModeCard
              mode="light"
              icon="light_mode"
              title="Light Mode"
              description="Bright interface optimized for well-lit environments."
            />
            <ModeCard
              mode="dark"
              icon="dark_mode"
              title="Dark Mode"
              description="Reduced eye strain for low-light conditions."
            />
            <ModeCard
              mode="system"
              icon="contrast"
              title="System"
              description="Automatically matches device preferences."
            />
          </div>

          <ThemeSwitcherDemo />

          <CodeBlock
            title="Using the useTheme hook"
            code={`import { useTheme } from "@unisane/ui";

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <button onClick={() => setTheme(
      theme === "light" ? "dark" : "light"
    )}>
      Current: {resolvedTheme}
    </button>
  );
}`}
          />
        </div>
      </DocSection>

      {/* Color Themes */}
      <DocSection
        id="color-themes"
        title="Color Themes"
        description="Choose from a palette of carefully crafted color themes."
      >
        <div className="space-y-8">
          <Typography variant="bodyMedium" className="text-on-surface-variant max-w-2xl">
            Each color theme provides a complete set of primary, secondary, and tertiary colors
            that work harmoniously together in both light and dark modes.
          </Typography>

          <ColorThemeGrid />

          <CodeBlock
            title="Setting a color theme"
            code={`import { ThemeProvider } from "@unisane/ui";

// Via defaultConfig
<ThemeProvider defaultConfig={{ colorTheme: "purple" }}>
  {children}
</ThemeProvider>

// Or programmatically
const { setColorTheme } = useTheme();
setColorTheme("green");`}
          />
        </div>
      </DocSection>

      {/* Radius Styles */}
      <DocSection
        id="radius-styles"
        title="Border Radius"
        description="Adjust the roundness of components to match your design language."
      >
        <div className="space-y-8">
          <RadiusDemo />

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="py-3 pr-4 text-label-large text-on-surface">Style</th>
                  <th className="py-3 pr-4 text-label-large text-on-surface">Value</th>
                  <th className="py-3 text-label-large text-on-surface">Best for</th>
                </tr>
              </thead>
              <tbody className="text-body-medium text-on-surface-variant">
                <tr className="border-b border-outline-variant/50">
                  <td className="py-3 pr-4 font-mono text-primary">none</td>
                  <td className="py-3 pr-4">0px</td>
                  <td className="py-3">Sharp, modern interfaces</td>
                </tr>
                <tr className="border-b border-outline-variant/50">
                  <td className="py-3 pr-4 font-mono text-primary">minimal</td>
                  <td className="py-3 pr-4">2px</td>
                  <td className="py-3">Subtle softness</td>
                </tr>
                <tr className="border-b border-outline-variant/50">
                  <td className="py-3 pr-4 font-mono text-primary">sharp</td>
                  <td className="py-3 pr-4">4px</td>
                  <td className="py-3">Professional, technical apps</td>
                </tr>
                <tr className="border-b border-outline-variant/50">
                  <td className="py-3 pr-4 font-mono text-primary">standard</td>
                  <td className="py-3 pr-4">8px</td>
                  <td className="py-3">Balanced, Material Design default</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono text-primary">soft</td>
                  <td className="py-3 pr-4">16px</td>
                  <td className="py-3">Friendly, approachable feel</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DocSection>

      {/* Density */}
      <DocSection
        id="density"
        title="Density"
        description="Control spacing and sizing to accommodate different use cases."
      >
        <div className="space-y-8">
          <DensityDemo />

          <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
            <Card variant="outlined" className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary">density_small</span>
                <Typography variant="titleMedium">Compact / Dense</Typography>
              </div>
              <Typography variant="bodySmall" className="text-on-surface-variant">
                Tighter spacing for data-dense interfaces like dashboards and tables.
              </Typography>
            </Card>
            <Card variant="outlined" className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary">density_medium</span>
                <Typography variant="titleMedium">Standard</Typography>
              </div>
              <Typography variant="bodySmall" className="text-on-surface-variant">
                Default spacing for most applications. Balances readability and density.
              </Typography>
            </Card>
            <Card variant="outlined" className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary">density_large</span>
                <Typography variant="titleMedium">Comfortable</Typography>
              </div>
              <Typography variant="bodySmall" className="text-on-surface-variant">
                Generous spacing for touch interfaces and accessibility needs.
              </Typography>
            </Card>
          </div>
        </div>
      </DocSection>

      {/* Programmatic Control */}
      <DocSection
        id="programmatic"
        title="Programmatic Control"
        description="Access and modify theme settings anywhere in your application."
      >
        <div className="space-y-8">
          <CodeBlock
            title="Full useTheme API"
            code={`import { useTheme } from "@unisane/ui";

function ThemeSettings() {
  const {
    // Current values
    theme,           // "light" | "dark" | "system"
    resolvedTheme,   // "light" | "dark" (actual applied theme)
    colorTheme,      // "blue" | "purple" | "pink" | ...
    radius,          // "none" | "minimal" | "sharp" | "standard" | "soft"
    density,         // "compact" | "dense" | "standard" | "comfortable"
    scheme,          // "tonal" | "monochrome" | "neutral"
    contrast,        // "standard" | "medium" | "high"

    // Setters
    setTheme,
    setColorTheme,
    setRadius,
    setDensity,
    setScheme,
    setContrast,
  } = useTheme();

  // Example: Reset to defaults
  const resetTheme = () => {
    setTheme("system");
    setColorTheme("blue");
    setRadius("standard");
    setDensity("standard");
  };

  return (
    <button onClick={resetTheme}>
      Reset to Defaults
    </button>
  );
}`}
          />

          <InfoCard icon="lightbulb" variant="tip">
            Theme preferences are automatically persisted to localStorage under the key{" "}
            <code className="mx-1 px-1.5 py-0.5 bg-surface-container rounded text-body-small">unisane-theme</code>.
            Users will see their preferences restored on subsequent visits.
          </InfoCard>

          <Typography variant="titleMedium" className="mt-8">Available Hooks</Typography>
          <div className="grid grid-cols-1 @md:grid-cols-3 gap-4">
            <Card variant="filled" className="p-4">
              <Typography variant="labelLarge" className="font-mono text-primary mb-2">useTheme()</Typography>
              <Typography variant="bodySmall" className="text-on-surface-variant">
                Full access to all theme settings and setters.
              </Typography>
            </Card>
            <Card variant="filled" className="p-4">
              <Typography variant="labelLarge" className="font-mono text-primary mb-2">useColorScheme()</Typography>
              <Typography variant="bodySmall" className="text-on-surface-variant">
                Focused access to light/dark mode only.
              </Typography>
            </Card>
            <Card variant="filled" className="p-4">
              <Typography variant="labelLarge" className="font-mono text-primary mb-2">useDensity()</Typography>
              <Typography variant="bodySmall" className="text-on-surface-variant">
                Focused access to density settings only.
              </Typography>
            </Card>
          </div>
        </div>
      </DocSection>
    </DocLayout>
  );
}

// ─── DEMO COMPONENTS ───────────────────────────────────────────────────────────

function ThemeSwitcherDemo() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <Card variant="outlined" className="p-6">
      <Typography variant="titleMedium" className="mb-4">Try it out</Typography>
      <div className="flex flex-wrap gap-3 mb-4">
        <Button
          variant={theme === "light" ? "filled" : "outlined"}
          onClick={() => setTheme("light")}
        >
          <span className="material-symbols-outlined mr-2 text-[18px]">light_mode</span>
          Light
        </Button>
        <Button
          variant={theme === "dark" ? "filled" : "outlined"}
          onClick={() => setTheme("dark")}
        >
          <span className="material-symbols-outlined mr-2 text-[18px]">dark_mode</span>
          Dark
        </Button>
        <Button
          variant={theme === "system" ? "filled" : "outlined"}
          onClick={() => setTheme("system")}
        >
          <span className="material-symbols-outlined mr-2 text-[18px]">contrast</span>
          System
        </Button>
      </div>
      <Typography variant="bodySmall" className="text-on-surface-variant">
        Current mode: <span className="text-primary font-medium">{theme}</span> →
        Resolved: <span className="text-primary font-medium">{resolvedTheme}</span>
      </Typography>
    </Card>
  );
}

function ColorThemeGrid() {
  const { colorTheme, setColorTheme } = useTheme();

  const themes: Array<{ value: typeof colorTheme; label: string; color: string }> = [
    { value: "blue", label: "Blue", color: "bg-[#0087A4]" },
    { value: "purple", label: "Purple", color: "bg-[#7B4EA8]" },
    { value: "pink", label: "Pink", color: "bg-[#C14B7A]" },
    { value: "red", label: "Red", color: "bg-[#C53637]" },
    { value: "orange", label: "Orange", color: "bg-[#C46A00]" },
    { value: "yellow", label: "Yellow", color: "bg-[#8A7500]" },
    { value: "green", label: "Green", color: "bg-[#3A7D44]" },
    { value: "cyan", label: "Cyan", color: "bg-[#007B8A]" },
    { value: "neutral", label: "Neutral", color: "bg-[#5E6668]" },
    { value: "black", label: "Black", color: "bg-[#1A1A1A]" },
  ];

  return (
    <div className="grid grid-cols-2 @sm:grid-cols-5 gap-3">
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setColorTheme(t.value)}
          className={`relative p-4 rounded-lg border-2 transition-all ${
            colorTheme === t.value
              ? "border-primary bg-primary-container/30"
              : "border-outline-variant/30 hover:border-outline-variant"
          }`}
        >
          <div className={`w-8 h-8 rounded-full ${t.color} mx-auto mb-2`} />
          <Typography variant="labelMedium" className="text-center">
            {t.label}
          </Typography>
          {colorTheme === t.value && (
            <span className="absolute top-2 right-2 material-symbols-outlined text-primary text-[16px]">
              check_circle
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function RadiusDemo() {
  const { radius, setRadius } = useTheme();

  const radiusOptions: Array<{ value: typeof radius; label: string }> = [
    { value: "none", label: "None" },
    { value: "minimal", label: "Minimal" },
    { value: "sharp", label: "Sharp" },
    { value: "standard", label: "Standard" },
    { value: "soft", label: "Soft" },
  ];

  return (
    <Card variant="outlined" className="p-6">
      <Typography variant="titleMedium" className="mb-4">Border Radius Preview</Typography>
      <div className="flex flex-wrap gap-2 mb-6">
        {radiusOptions.map((r) => (
          <Button
            key={r.value}
            variant={radius === r.value ? "filled" : "outlined"}
            size="sm"
            onClick={() => setRadius(r.value)}
          >
            {r.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="w-24 h-24 bg-primary-container flex items-center justify-center rounded-sm">
          <Typography variant="labelSmall" className="text-on-primary-container">Card</Typography>
        </div>
        <Button variant="filled">Button</Button>
        <Button variant="tonal">Tonal</Button>
        <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-on-secondary-container">favorite</span>
        </div>
      </div>
    </Card>
  );
}

function DensityDemo() {
  const { density, setDensity } = useTheme();

  const densityOptions: Array<{ value: typeof density; label: string }> = [
    { value: "compact", label: "Compact" },
    { value: "dense", label: "Dense" },
    { value: "standard", label: "Standard" },
    { value: "comfortable", label: "Comfortable" },
  ];

  return (
    <Card variant="outlined" className="p-6">
      <Typography variant="titleMedium" className="mb-4">Density Preview</Typography>
      <div className="flex flex-wrap gap-2 mb-6">
        {densityOptions.map((d) => (
          <Button
            key={d.value}
            variant={density === d.value ? "filled" : "outlined"}
            size="sm"
            onClick={() => setDensity(d.value)}
          >
            {d.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <Button variant="filled">Primary</Button>
          <Button variant="tonal">Secondary</Button>
          <Button variant="outlined">Tertiary</Button>
        </div>
        <Typography variant="bodySmall" className="text-on-surface-variant">
          Current density: <span className="text-primary font-medium">{density}</span>
        </Typography>
      </div>
    </Card>
  );
}

// ─── HELPER COMPONENTS ─────────────────────────────────────────────────────────

function ModeCard({
  mode,
  icon,
  title,
  description,
}: {
  mode: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Card variant="outlined" className="p-5">
      <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-on-primary-container text-[20px]">{icon}</span>
      </div>
      <Typography variant="titleMedium" className="mb-1">{title}</Typography>
      <Typography variant="bodySmall" className="text-on-surface-variant">{description}</Typography>
    </Card>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-outline-variant/20">
      <div className="px-4 py-2 bg-surface-container border-b border-outline-variant/20">
        <Typography variant="labelMedium" className="text-on-surface-variant font-mono">
          {title}
        </Typography>
      </div>
      <div className="bg-surface-container-low">
        <pre className="p-4 overflow-x-auto">
          <code className="text-body-small font-mono text-on-surface">{code}</code>
        </pre>
      </div>
    </div>
  );
}

function InfoCard({ icon, variant, children }: { icon: string; variant: "info" | "tip"; children: React.ReactNode }) {
  const styles = {
    info: "bg-primary-container/30 border-primary/20",
    tip: "bg-tertiary-container/30 border-tertiary/20",
  };
  const iconColor = variant === "info" ? "text-primary" : "text-tertiary";

  return (
    <div className={`p-4 rounded-lg border ${styles[variant]}`}>
      <div className="flex gap-3">
        <span className={`material-symbols-outlined ${iconColor} shrink-0`}>{icon}</span>
        <Typography variant="bodySmall" className="text-on-surface-variant">
          {children}
        </Typography>
      </div>
    </div>
  );
}
