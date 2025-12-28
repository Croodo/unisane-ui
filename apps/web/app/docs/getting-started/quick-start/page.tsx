"use client";

import { DocLayout, DocSection } from "@/components/layout";
import { CliCommand } from "@/components/docs/cli-command";
import { Card, Typography, Button, IconButton, TextField, Checkbox } from "@unisane/ui";
import { useState } from "react";

const TOC_ITEMS = [
  { id: "first-component", label: "Your First Component" },
  { id: "adding-interactivity", label: "Adding Interactivity" },
  { id: "building-a-form", label: "Building a Form" },
  { id: "next-steps", label: "Next Steps" },
];

export default function QuickStartPage() {
  return (
    <DocLayout
      title="Quick Start"
      description="Build your first interface with Unisane UI in just a few minutes. Follow along with these examples."
      toc={TOC_ITEMS}
    >
      {/* First Component */}
      <DocSection
        id="first-component"
        title="Your First Component"
        description="Let's start by creating a simple card component with a button."
      >
        <div className="space-y-6">
          <Typography variant="bodyMedium" className="text-on-surface-variant max-w-2xl">
            First, add the components you need using the CLI:
          </Typography>
          <CliCommand command="@unisane/cli add button card" />

          <Typography variant="bodyMedium" className="text-on-surface-variant max-w-2xl">
            Then use them in your component:
          </Typography>

          <div className="grid grid-cols-1 @xl:grid-cols-2 gap-6">
            <CodeBlock
              title="app/page.tsx"
              code={`import { Button, Card } from "@/components/ui";

export default function Page() {
  return (
    <Card className="p-6 max-w-sm">
      <h2 className="text-xl font-semibold mb-2">
        Welcome to Unisane UI
      </h2>
      <p className="text-gray-600 mb-4">
        Beautiful, accessible components
        for your next project.
      </p>
      <Button variant="filled">
        Get Started
      </Button>
    </Card>
  );
}`}
            />
            <PreviewCard title="Result">
              <Card className="p-6 max-w-sm">
                <h2 className="text-xl font-semibold mb-2 text-on-surface">
                  Welcome to Unisane UI
                </h2>
                <p className="text-on-surface-variant mb-4">
                  Beautiful, accessible components for your next project.
                </p>
                <Button variant="filled">Get Started</Button>
              </Card>
            </PreviewCard>
          </div>
        </div>
      </DocSection>

      {/* Adding Interactivity */}
      <DocSection
        id="adding-interactivity"
        title="Adding Interactivity"
        description="Unisane UI components work seamlessly with React state and event handlers."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 @xl:grid-cols-2 gap-6">
            <CodeBlock
              title="Counter.tsx"
              code={`"use client";

import { useState } from "react";
import { Button, Card, IconButton } from "@/components/ui";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <Card className="p-6 text-center">
      <p className="text-4xl font-bold mb-4">
        {count}
      </p>
      <div className="flex gap-2 justify-center">
        <IconButton
          variant="tonal"
          onClick={() => setCount(c => c - 1)}
          ariaLabel="Decrease"
        >
          <span className="material-symbols-outlined">
            remove
          </span>
        </IconButton>
        <IconButton
          variant="tonal"
          onClick={() => setCount(c => c + 1)}
          ariaLabel="Increase"
        >
          <span className="material-symbols-outlined">
            add
          </span>
        </IconButton>
      </div>
      <Button
        variant="text"
        onClick={() => setCount(0)}
        className="mt-4"
      >
        Reset
      </Button>
    </Card>
  );
}`}
            />
            <PreviewCard title="Result">
              <CounterDemo />
            </PreviewCard>
          </div>
        </div>
      </DocSection>

      {/* Building a Form */}
      <DocSection
        id="building-a-form"
        title="Building a Form"
        description="Combine form components to create interactive user interfaces."
      >
        <div className="space-y-6">
          <CliCommand command="@unisane/cli add text-field checkbox" />

          <div className="grid grid-cols-1 @xl:grid-cols-2 gap-6">
            <CodeBlock
              title="SignUpForm.tsx"
              code={`"use client";

import { useState } from "react";
import {
  Button, Card, TextField, Checkbox
} from "@/components/ui";

export function SignUpForm() {
  const [agreed, setAgreed] = useState(false);

  return (
    <Card className="p-6 max-w-sm">
      <h2 className="text-xl font-semibold mb-4">
        Create Account
      </h2>

      <form className="space-y-4">
        <TextField
          label="Full Name"
          placeholder="John Doe"
        />
        <TextField
          label="Email"
          type="email"
          placeholder="john@example.com"
        />
        <TextField
          label="Password"
          type="password"
        />

        <Checkbox
          checked={agreed}
          onChange={setAgreed}
          label="I agree to the terms"
        />

        <Button
          variant="filled"
          className="w-full"
          disabled={!agreed}
        >
          Sign Up
        </Button>
      </form>
    </Card>
  );
}`}
            />
            <PreviewCard title="Result">
              <SignUpFormDemo />
            </PreviewCard>
          </div>
        </div>
      </DocSection>

      {/* Next Steps */}
      <DocSection
        id="next-steps"
        title="Next Steps"
        description="Now that you've built your first components, explore more of what Unisane UI has to offer."
      >
        <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
          <NextStepCard
            icon="palette"
            title="Customize Styling"
            description="Learn how to customize components with Tailwind CSS and design tokens."
            href="/docs/getting-started/styling"
          />
          <NextStepCard
            icon="dark_mode"
            title="Build Themes"
            description="Create light and dark themes with the powerful theming system."
            href="/docs/getting-started/theming"
          />
          <NextStepCard
            icon="widgets"
            title="Browse Components"
            description="Explore all 50+ components available in the library."
            href="/docs/components"
          />
          <NextStepCard
            icon="architecture"
            title="Design Patterns"
            description="Learn common patterns for building complex interfaces."
            href="/docs/patterns"
          />
        </div>
      </DocSection>
    </DocLayout>
  );
}

// Demo Components

function CounterDemo() {
  const [count, setCount] = useState(0);

  return (
    <Card className="p-6 text-center">
      <p className="text-4xl font-bold mb-4 text-on-surface">{count}</p>
      <div className="flex gap-2 justify-center">
        <IconButton
          variant="tonal"
          onClick={() => setCount((c) => c - 1)}
          ariaLabel="Decrease"
        >
          <span className="material-symbols-outlined">remove</span>
        </IconButton>
        <IconButton
          variant="tonal"
          onClick={() => setCount((c) => c + 1)}
          ariaLabel="Increase"
        >
          <span className="material-symbols-outlined">add</span>
        </IconButton>
      </div>
      <Button variant="text" onClick={() => setCount(0)} className="mt-4">
        Reset
      </Button>
    </Card>
  );
}

function SignUpFormDemo() {
  const [agreed, setAgreed] = useState(false);

  return (
    <Card className="p-6 max-w-sm">
      <h2 className="text-xl font-semibold mb-4 text-on-surface">Create Account</h2>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <TextField label="Full Name" placeholder="John Doe" />
        <TextField label="Email" type="email" placeholder="john@example.com" />
        <TextField label="Password" type="password" />
        <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} label="I agree to the terms" />
        <Button variant="filled" className="w-full" disabled={!agreed}>
          Sign Up
        </Button>
      </form>
    </Card>
  );
}

// Helper Components

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

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg overflow-hidden border border-outline-variant/20">
      <div className="px-4 py-2 bg-surface-container border-b border-outline-variant/20">
        <Typography variant="labelMedium" className="text-on-surface-variant">
          {title}
        </Typography>
      </div>
      <div className="p-6 bg-surface-container-low flex items-center justify-center min-h-64">
        {children}
      </div>
    </div>
  );
}

function NextStepCard({ icon, title, description, href }: { icon: string; title: string; description: string; href: string }) {
  return (
    <a href={href} className="group block">
      <Card variant="outlined" className="p-5 h-full hover:bg-surface-container transition-colors">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-tertiary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">{icon}</span>
          </div>
          <div>
            <Typography variant="titleMedium" className="mb-1 group-hover:text-primary transition-colors">
              {title}
            </Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant">
              {description}
            </Typography>
          </div>
        </div>
      </Card>
    </a>
  );
}
