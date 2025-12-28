"use client";

import { DocLayout, DocSection } from "@/components/layout";
import { CliCommand } from "@/components/docs/cli-command";
import { Card, Typography, Tabs, TabsList, TabsTrigger, TabsContent } from "@unisane/ui";

const TOC_ITEMS = [
  { id: "requirements", label: "Requirements" },
  { id: "automatic", label: "Automatic Installation" },
  { id: "manual", label: "Manual Installation" },
  { id: "project-structure", label: "Project Structure" },
];

export default function InstallationPage() {
  return (
    <DocLayout
      title="Installation"
      description="Get started with Unisane UI by installing the CLI or adding components manually to your React project."
      toc={TOC_ITEMS}
    >
      {/* Requirements */}
      <DocSection
        id="requirements"
        title="Requirements"
        description="Before you begin, make sure your development environment meets these requirements."
      >
        <div className="grid grid-cols-1 @lg:grid-cols-3 gap-4">
          <RequirementCard
            icon="code"
            title="React 18+"
            description="Unisane UI is built for React 18 and above with full support for Server Components."
          />
          <RequirementCard
            icon="css"
            title="Tailwind CSS v4"
            description="Components use Tailwind CSS v4 for styling. Make sure it's configured in your project."
          />
          <RequirementCard
            icon="folder"
            title="TypeScript"
            description="Full TypeScript support with comprehensive type definitions included."
          />
        </div>
      </DocSection>

      {/* Automatic Installation */}
      <DocSection
        id="automatic"
        title="Automatic Installation"
        description="The fastest way to get started is using the Unisane CLI. It will set up everything for you automatically."
      >
        <div className="space-y-8">
          {/* Step 1: Init */}
          <div className="space-y-4">
            <StepHeader number={1} title="Initialize Unisane UI" />
            <Typography variant="bodyMedium" className="text-on-surface-variant max-w-2xl">
              Run the init command to set up your project. This will install dependencies, configure Tailwind CSS,
              and create the necessary configuration files.
            </Typography>
            <CliCommand command="@unisane/cli init" />
          </div>

          {/* Step 2: Add Components */}
          <div className="space-y-4">
            <StepHeader number={2} title="Add components" />
            <Typography variant="bodyMedium" className="text-on-surface-variant max-w-2xl">
              Add the components you need to your project. You can add them one at a time or all at once.
            </Typography>
            <CliCommand command="@unisane/cli add button card" />
          </div>

          {/* Step 3: Import and Use */}
          <div className="space-y-4">
            <StepHeader number={3} title="Import and use" />
            <Typography variant="bodyMedium" className="text-on-surface-variant max-w-2xl">
              Import the components from your components directory and start building.
            </Typography>
            <CodeBlock
              code={`import { Button, Card } from "@/components/ui";

export function MyComponent() {
  return (
    <Card>
      <Button variant="filled">Click me</Button>
    </Card>
  );
}`}
            />
          </div>
        </div>
      </DocSection>

      {/* Manual Installation */}
      <DocSection
        id="manual"
        title="Manual Installation"
        description="If you prefer to set things up manually, follow these steps."
      >
        <Tabs defaultValue="nextjs" className="w-full">
          <TabsList>
            <TabsTrigger value="nextjs">Next.js</TabsTrigger>
            <TabsTrigger value="vite">Vite</TabsTrigger>
            <TabsTrigger value="remix">Remix</TabsTrigger>
          </TabsList>

          <TabsContent value="nextjs" className="space-y-8">
            <ManualStep
              number={1}
              title="Install dependencies"
              description="Install Tailwind CSS and its peer dependencies."
            >
              <CodeBlock
                code={`npm install tailwindcss @tailwindcss/postcss postcss
npm install class-variance-authority clsx tailwind-merge`}
                language="bash"
              />
            </ManualStep>

            <ManualStep
              number={2}
              title="Configure PostCSS"
              description="Create or update your postcss.config.mjs file."
            >
              <CodeBlock
                code={`/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;`}
                language="javascript"
              />
            </ManualStep>

            <ManualStep
              number={3}
              title="Configure Tailwind"
              description="Import Tailwind in your global CSS file."
            >
              <CodeBlock
                code={`@import "tailwindcss";

/* Your custom styles here */`}
                language="css"
              />
            </ManualStep>

            <ManualStep
              number={4}
              title="Add the cn utility"
              description="Create a utility function for merging class names."
            >
              <CodeBlock
                code={`import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`}
                language="typescript"
              />
            </ManualStep>
          </TabsContent>

          <TabsContent value="vite" className="space-y-8">
            <ManualStep
              number={1}
              title="Install dependencies"
              description="Install Tailwind CSS and Vite plugin."
            >
              <CodeBlock
                code={`npm install tailwindcss @tailwindcss/vite
npm install class-variance-authority clsx tailwind-merge`}
                language="bash"
              />
            </ManualStep>

            <ManualStep
              number={2}
              title="Configure Vite"
              description="Add the Tailwind plugin to your vite.config.ts."
            >
              <CodeBlock
                code={`import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})`}
                language="typescript"
              />
            </ManualStep>

            <ManualStep
              number={3}
              title="Import Tailwind"
              description="Add Tailwind to your main CSS file."
            >
              <CodeBlock
                code={`@import "tailwindcss";`}
                language="css"
              />
            </ManualStep>
          </TabsContent>

          <TabsContent value="remix" className="space-y-8">
            <ManualStep
              number={1}
              title="Install dependencies"
              description="Install Tailwind CSS and Vite plugin for Remix."
            >
              <CodeBlock
                code={`npm install tailwindcss @tailwindcss/vite
npm install class-variance-authority clsx tailwind-merge`}
                language="bash"
              />
            </ManualStep>

            <ManualStep
              number={2}
              title="Configure Vite"
              description="Add the Tailwind plugin to your vite.config.ts."
            >
              <CodeBlock
                code={`import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [remix(), tailwindcss()],
});`}
                language="typescript"
              />
            </ManualStep>
          </TabsContent>
        </Tabs>
      </DocSection>

      {/* Project Structure */}
      <DocSection
        id="project-structure"
        title="Project Structure"
        description="After installation, your project will have the following structure for Unisane UI components."
      >
        <Card variant="filled" className="p-6 font-mono text-body-small">
          <div className="space-y-1 text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">folder</span>
              <span className="text-on-surface font-medium">components/</span>
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">folder</span>
                <span className="text-on-surface font-medium">ui/</span>
              </div>
              <div className="pl-6 space-y-1">
                <FileItem name="button.tsx" description="Button component" />
                <FileItem name="card.tsx" description="Card component" />
                <FileItem name="index.ts" description="Barrel exports" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="material-symbols-outlined text-[18px] text-secondary">folder</span>
              <span className="text-on-surface font-medium">lib/</span>
            </div>
            <div className="pl-6">
              <FileItem name="utils.ts" description="Utility functions (cn)" />
            </div>
          </div>
        </Card>

        <div className="mt-8 p-4 rounded-lg bg-primary-container/30 border border-primary/20">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-primary shrink-0">lightbulb</span>
            <div>
              <Typography variant="titleSmall" className="mb-1">Pro tip</Typography>
              <Typography variant="bodySmall" className="text-on-surface-variant">
                The CLI automatically handles component dependencies. When you add a component that depends on others,
                they will be installed automatically.
              </Typography>
            </div>
          </div>
        </div>
      </DocSection>
    </DocLayout>
  );
}

// Helper Components

function RequirementCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <Card variant="outlined" className="p-5">
      <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-on-secondary-container text-[20px]">{icon}</span>
      </div>
      <Typography variant="titleMedium" className="mb-1">{title}</Typography>
      <Typography variant="bodySmall" className="text-on-surface-variant">{description}</Typography>
    </Card>
  );
}

function StepHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
        <span className="text-label-large text-on-primary font-medium">{number}</span>
      </div>
      <Typography variant="titleLarge">{title}</Typography>
    </div>
  );
}

function ManualStep({ number, title, description, children }: { number: number; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <StepHeader number={number} title={title} />
      <Typography variant="bodyMedium" className="text-on-surface-variant max-w-2xl">
        {description}
      </Typography>
      {children}
    </div>
  );
}

function CodeBlock({ code, language = "tsx" }: { code: string; language?: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-outline-variant/20 bg-surface-container-low">
      <pre className="p-4 overflow-x-auto">
        <code className="text-body-small font-mono text-on-surface">{code}</code>
      </pre>
    </div>
  );
}

function FileItem({ name, description }: { name: string; description: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-[16px] text-outline">description</span>
      <span className="text-on-surface">{name}</span>
      <span className="text-outline">—</span>
      <span>{description}</span>
    </div>
  );
}
