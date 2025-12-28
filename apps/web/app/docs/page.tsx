import { DocLayout } from "@/components/layout";

export default function DocsPage() {
  return (
    <DocLayout
      title="Documentation"
      description="Get started with Unisane UI - a Material Design 3 component library for React."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickLinkCard
          icon="rocket_launch"
          title="Getting Started"
          description="Learn how to install and set up Unisane UI in your project."
          href="/docs/getting-started"
        />
        <QuickLinkCard
          icon="palette"
          title="Foundations"
          description="Understand the design tokens, colors, typography, and spacing system."
          href="/docs/foundations"
        />
        <QuickLinkCard
          icon="widgets"
          title="Components"
          description="Explore our 50+ production-ready React components."
          href="/docs/components"
        />
      </div>
    </DocLayout>
  );
}

function QuickLinkCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group block p-6 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant transition-all duration-200 hover:shadow-1"
    >
      <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-on-primary-container !text-[24px]">
          {icon}
        </span>
      </div>
      <h3 className="text-title-large text-on-surface mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-body-medium text-on-surface-variant">{description}</p>
    </a>
  );
}
