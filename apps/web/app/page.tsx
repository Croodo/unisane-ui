"use client";

import Link from "next/link";
import {
  Button,
  Card,
  Typography,
  Switch,
  Slider,
  Checkbox,
  Chip,
  Avatar,
  Badge,
  Fab,
  TextField,
  Progress,
  Surface,
} from "@unisane/ui";
import { UnisaneLogo } from "@/components/ui/unisane-logo";
import { HeroBackground } from "@/lib/docs/hero-background";

export default function HomePage() {
  return (
    <div className="@container">
      {/* Hero - matches DocLayout pattern */}
      <header className="mb-12 @3xl:mb-20 flex flex-col @3xl:flex-row gap-6 @3xl:gap-8 items-stretch @3xl:min-h-80 @5xl:min-h-[480px]">
        {/* Text Content */}
        <div className="@3xl:w-[50%] @5xl:w-[40%] shrink-0 flex flex-col justify-center order-2 @3xl:order-1">
          <h1 className="text-[2.5rem] @2xl:text-[3.5rem] @4xl:text-[5.5rem] leading-none font-semibold @3xl:font-medium mb-4 @3xl:mb-6 tracking-tight text-on-surface">
            Build beautiful
            <br />
            <span className="text-primary">React apps</span>
          </h1>
          <Typography
            variant="titleMedium"
            className="text-on-surface-variant leading-relaxed @3xl:text-title-large mb-8"
          >
            50+ accessible, customizable components designed for modern web
            applications. TypeScript-first with Tailwind CSS.
          </Typography>

          <div>
            <Button asChild variant="filled" size="lg">
              <Link href="/docs/getting-started">Get Started</Link>
            </Button>
          </div>
        </div>

        {/* Hero Visual */}
        <Surface
          elevation={0}
          className="w-full @3xl:w-[50%] @5xl:w-[60%] h-60 @2xl:h-72 @3xl:h-auto @3xl:min-h-full rounded-xl overflow-hidden order-1 @3xl:order-2"
        >
          <ComponentShowcase />
        </Surface>
      </header>

      {/* Stats */}
      <section className="py-12 @3xl:py-16 border-y border-outline-variant/10 -mx-6 @3xl:-mx-8 px-6 @3xl:px-8 bg-surface-container-lowest/50">
        <div className="grid grid-cols-2 @lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="text-center">
            <Typography variant="displaySmall" className="text-on-surface mb-1">
              50+
            </Typography>
            <Typography variant="bodyMedium" className="text-on-surface-variant">
              Components
            </Typography>
          </div>
          <div className="text-center">
            <Typography variant="displaySmall" className="text-on-surface mb-1">
              200+
            </Typography>
            <Typography variant="bodyMedium" className="text-on-surface-variant">
              Variants
            </Typography>
          </div>
          <div className="text-center">
            <Typography variant="displaySmall" className="text-on-surface mb-1">
              100%
            </Typography>
            <Typography variant="bodyMedium" className="text-on-surface-variant">
              Accessible
            </Typography>
          </div>
          <div className="text-center">
            <Typography variant="displaySmall" className="text-on-surface mb-1">
              {"<5kb"}
            </Typography>
            <Typography variant="bodyMedium" className="text-on-surface-variant">
              Avg. size
            </Typography>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 @3xl:py-24 max-w-6xl mx-auto">
        <Typography
          variant="headlineMedium"
          className="@3xl:text-headline-large text-on-surface mb-4"
        >
          Built for developers
        </Typography>
        <Typography
          variant="titleMedium"
          className="text-on-surface-variant mb-12 max-w-2xl"
        >
          Modern tools and practices for exceptional developer experience
        </Typography>

        <div className="grid @lg:grid-cols-2 @3xl:grid-cols-3 gap-6">
          <FeatureCard
            icon="palette"
            title="Dynamic Theming"
            description="10 themes, dark mode, and runtime switching with CSS variables."
          />
          <FeatureCard
            icon="accessibility_new"
            title="Accessible"
            description="WAI-ARIA compliant with keyboard navigation and screen reader support."
          />
          <FeatureCard
            icon="code"
            title="TypeScript"
            description="Full type safety with IntelliSense for every prop and callback."
          />
          <FeatureCard
            icon="speed"
            title="Performant"
            description="Tree-shakeable with optimized bundle sizes. Ship only what you use."
          />
          <FeatureCard
            icon="brush"
            title="Tailwind CSS"
            description="Design tokens and utility classes. Extend any component easily."
          />
          <FeatureCard
            icon="widgets"
            title="Composable"
            description="Low-level primitives for building custom components when needed."
          />
        </div>
      </section>

      {/* Component Bento Grid */}
      <section className="py-16 @3xl:py-24 border-t border-outline-variant/10 max-w-6xl mx-auto">
        <Typography
          variant="headlineMedium"
          className="@3xl:text-headline-large text-on-surface mb-4"
        >
          Components for every need
        </Typography>
        <Typography
          variant="titleMedium"
          className="text-on-surface-variant mb-12 max-w-2xl"
        >
          From buttons to complex layouts, everything you need to build
        </Typography>

        <ComponentBentoGrid />

        <div className="mt-12">
          <Button asChild variant="tonal" size="lg">
            <Link href="/docs/components">View all components</Link>
          </Button>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 @3xl:py-24 border-t border-outline-variant/10 max-w-6xl mx-auto">
        <div className="max-w-2xl">
          <UnisaneLogo size={48} className="mb-6" />
          <Typography
            variant="headlineMedium"
            className="@3xl:text-headline-large text-on-surface mb-4"
          >
            Ready to get started?
          </Typography>
          <Typography
            variant="titleMedium"
            className="text-on-surface-variant mb-8"
          >
            Add Unisane UI to your project in seconds
          </Typography>
          <div className="flex flex-wrap gap-4">
            <Button asChild variant="filled" size="lg">
              <Link href="/docs/getting-started">Read the docs</Link>
            </Button>
            <Button asChild variant="outlined" size="lg">
              <a
                href="https://github.com/anthropics/unisane-ui"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── COMPONENT SHOWCASE (Hero) ─────────────────────────────────────────────────

function ComponentShowcase() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-surface-container-lowest">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-tertiary/5 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="relative z-10 flex h-full w-full">
        {/* Navigation Rail - Hidden on small */}
        <div className="hidden @3xl:flex flex-col items-center py-4 w-14 shrink-0 border-r border-outline-variant/10 bg-surface-container-low/50">
          <nav className="flex flex-col gap-1 w-full px-1.5 mt-2">
            {[
              { icon: "home", active: true },
              { icon: "analytics", active: false },
              { icon: "folder", active: false },
              { icon: "settings", active: false },
            ].map((item) => (
              <div
                key={item.icon}
                className={`w-full h-9 rounded-lg flex items-center justify-center transition-colors ${
                  item.active
                    ? "bg-secondary-container text-on-secondary-container"
                    : "text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              </div>
            ))}
          </nav>
          <div className="mt-auto">
            <Avatar size="sm" fallback="U" className="bg-tertiary text-on-tertiary" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden p-2 @3xl:p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div>
              <Typography variant="titleSmall" className="text-on-surface">Dashboard</Typography>
              <Typography variant="labelSmall" className="text-on-surface-variant">3 tasks pending</Typography>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">search</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center relative">
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">notifications</span>
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-error" />
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="flex-1 grid grid-cols-2 @3xl:grid-cols-12 gap-2 overflow-hidden">
            {/* Stats Card */}
            <Card variant="filled" className="col-span-1 @3xl:col-span-4 p-2.5 flex flex-col justify-between rounded-lg">
              <div className="flex items-center justify-between">
                <Typography variant="labelSmall" className="text-on-surface-variant">Revenue</Typography>
                <span className="material-symbols-outlined text-primary text-[14px]">trending_up</span>
              </div>
              <div>
                <Typography variant="titleLarge" className="text-on-surface">$24.8k</Typography>
                <Typography variant="labelSmall" className="text-primary">+12%</Typography>
              </div>
            </Card>

            {/* Weather Card */}
            <div className="col-span-1 @3xl:col-span-4 bg-linear-to-br from-tertiary-container to-secondary-container rounded-lg p-2.5 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <Typography variant="labelSmall" className="text-on-tertiary-container/80">Seattle</Typography>
                  <Typography variant="headlineSmall" className="text-on-tertiary-container">72°</Typography>
                </div>
                <span className="material-symbols-outlined text-on-tertiary-container text-[24px]">partly_cloudy_day</span>
              </div>
              <Typography variant="labelSmall" className="text-on-tertiary-container/70">Partly Cloudy</Typography>
            </div>

            {/* User Card */}
            <Card variant="elevated" className="col-span-1 @3xl:col-span-4 p-2.5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Avatar size="sm" fallback="S" className="bg-primary text-on-primary" />
                <div className="flex-1 min-w-0">
                  <Typography variant="labelMedium">Sarah J.</Typography>
                  <Typography variant="labelSmall" className="text-on-surface-variant">Designer</Typography>
                </div>
              </div>
              <div className="flex gap-3">
                <div>
                  <Typography variant="labelLarge" className="text-primary">248</Typography>
                  <Typography variant="labelSmall" className="text-on-surface-variant">Projects</Typography>
                </div>
                <div>
                  <Typography variant="labelLarge">12k</Typography>
                  <Typography variant="labelSmall" className="text-on-surface-variant">Followers</Typography>
                </div>
              </div>
            </Card>

            {/* Task List */}
            <Card variant="elevated" className="col-span-1 @3xl:col-span-6 p-2.5 flex flex-col rounded-lg">
              <Typography variant="labelMedium" className="text-on-surface-variant mb-2">Tasks</Typography>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Checkbox defaultChecked className="scale-90" />
                  <Typography variant="labelSmall" className="line-through text-on-surface/50">Design review</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox className="scale-90" />
                  <Typography variant="labelSmall">Update docs</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox className="scale-90" />
                  <Typography variant="labelSmall">Code review</Typography>
                </div>
              </div>
            </Card>

            {/* Devices List */}
            <Card variant="outlined" className="col-span-1 @3xl:col-span-6 p-2.5 flex flex-col rounded-lg">
              <Typography variant="labelMedium" className="text-on-surface-variant mb-2">Devices</Typography>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-primary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-primary-container text-[12px]">lightbulb</span>
                    </div>
                    <Typography variant="labelSmall">Lights</Typography>
                  </div>
                  <Switch defaultChecked className="scale-75 origin-right" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-tertiary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-tertiary-container text-[12px]">thermostat</span>
                    </div>
                    <Typography variant="labelSmall">Climate</Typography>
                  </div>
                  <Switch className="scale-75 origin-right" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT BENTO GRID ──────────────────────────────────────────────────────

function ComponentBentoGrid() {
  return (
    <div className="grid grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-3 gap-4">
      {/* Buttons */}
      <BentoCard title="Buttons" href="/docs/components/button">
        <HeroBackground tone="primary" className="rounded-md">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="filled">Filled</Button>
            <Button variant="tonal">Tonal</Button>
            <Button variant="outlined">Outlined</Button>
            <Button variant="elevated">Elevated</Button>
            <Button variant="text">Text</Button>
          </div>
        </HeroBackground>
      </BentoCard>

      {/* Cards */}
      <BentoCard title="Cards" href="/docs/components/card">
        <HeroBackground tone="secondary" className="rounded-md">
          <Card variant="elevated" className="p-4 max-w-[200px]">
            <div className="flex items-center gap-3">
              <Avatar size="md" fallback="JD" className="bg-primary text-on-primary" />
              <div>
                <Typography variant="titleSmall">John Doe</Typography>
                <Typography variant="bodySmall" className="text-on-surface-variant">
                  Designer
                </Typography>
              </div>
            </div>
          </Card>
        </HeroBackground>
      </BentoCard>

      {/* Chips */}
      <BentoCard title="Chips" href="/docs/components/chip">
        <HeroBackground tone="tertiary" className="rounded-md">
          <div className="flex flex-wrap gap-2 justify-center">
            <Chip variant="filter" label="React" selected />
            <Chip variant="filter" label="TypeScript" />
            <Chip variant="filter" label="Tailwind" />
            <Chip variant="assist" label="Add filter" icon={<span className="material-symbols-outlined text-[18px]">add</span>} />
          </div>
        </HeroBackground>
      </BentoCard>

      {/* Text Fields */}
      <BentoCard title="Text Fields" href="/docs/components/text-field">
        <HeroBackground tone="surface" className="rounded-md">
          <div className="w-full max-w-[280px] space-y-3">
            <TextField label="Email" placeholder="Enter your email" variant="outlined" />
            <TextField label="Password" placeholder="Enter password" variant="filled" type="password" />
          </div>
        </HeroBackground>
      </BentoCard>

      {/* Switches & Checkboxes */}
      <BentoCard title="Selection Controls" href="/docs/components/switch">
        <HeroBackground tone="primary" className="rounded-md">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Switch defaultChecked />
              <Switch />
            </div>
            <div className="flex items-center gap-4">
              <Checkbox defaultChecked />
              <Checkbox />
              <Checkbox indeterminate />
            </div>
          </div>
        </HeroBackground>
      </BentoCard>

      {/* Progress */}
      <BentoCard title="Progress" href="/docs/components/progress">
        <HeroBackground tone="secondary" className="rounded-md">
          <div className="w-full max-w-[280px] space-y-4">
            <Progress value={65} />
            <Progress value={40} variant="circular" className="mx-auto" />
          </div>
        </HeroBackground>
      </BentoCard>

      {/* Avatars */}
      <BentoCard title="Avatars" href="/docs/components/avatar">
        <HeroBackground tone="tertiary" className="rounded-md">
          <div className="flex items-center gap-3">
            <Avatar size="lg" fallback="A" className="bg-primary text-on-primary" />
            <Avatar size="lg" fallback="B" className="bg-secondary text-on-secondary" />
            <Avatar size="lg" fallback="C" className="bg-tertiary text-on-tertiary" />
            <Badge content="3" color="error">
              <Avatar size="lg" fallback="D" className="bg-error text-on-error" />
            </Badge>
          </div>
        </HeroBackground>
      </BentoCard>

      {/* Sliders */}
      <BentoCard title="Sliders" href="/docs/components/slider">
        <HeroBackground tone="surface" className="rounded-md">
          <div className="w-full max-w-[280px] space-y-6">
            <Slider defaultValue={30} />
            <Slider defaultValue={70} />
          </div>
        </HeroBackground>
      </BentoCard>

      {/* FAB */}
      <BentoCard title="FAB" href="/docs/components/fab">
        <HeroBackground tone="primary" className="rounded-md">
          <div className="flex items-center gap-4">
            <Fab icon={<span className="material-symbols-outlined">add</span>} aria-label="Add" size="sm" />
            <Fab icon={<span className="material-symbols-outlined">edit</span>} aria-label="Edit" />
            <Fab icon={<span className="material-symbols-outlined">navigation</span>} aria-label="Navigate" size="lg" variant="secondary" />
          </div>
        </HeroBackground>
      </BentoCard>
    </div>
  );
}

// ─── FEATURE CARD ──────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg bg-surface-container/50 border border-outline-variant/10 hover:border-outline-variant/20 transition-colors">
      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-primary text-[22px]">
          {icon}
        </span>
      </div>
      <Typography variant="titleMedium" className="text-on-surface mb-2">
        {title}
      </Typography>
      <Typography variant="bodyMedium" className="text-on-surface-variant leading-relaxed">
        {description}
      </Typography>
    </div>
  );
}

// ─── BENTO CARD ────────────────────────────────────────────────────────────────

function BentoCard({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="group block">
      <div className="h-full rounded-lg bg-surface-container/30 border border-outline-variant/10 hover:border-outline-variant/20 transition-colors overflow-hidden">
        <div className="h-[180px]">{children}</div>
        <div className="p-4 flex items-center justify-between border-t border-outline-variant/10">
          <Typography variant="titleMedium" className="text-on-surface group-hover:text-primary transition-colors">
            {title}
          </Typography>
          <span className="material-symbols-outlined text-on-surface-variant/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all text-[18px]">
            arrow_forward
          </span>
        </div>
      </div>
    </Link>
  );
}
