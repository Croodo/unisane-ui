import { DocLayout } from "@/components/layout";

export default function FoundationsPage() {
  return (
    <DocLayout
      title="Foundations"
      description="Understand the core design principles and token system that power Unisane UI."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FoundationCard
          icon="hexagon"
          title="Design Tokens"
          description="The building blocks of our design system - colors, spacing, typography, and more."
          href="/docs/foundations/design-tokens"
        />
        <FoundationCard
          icon="text_fields"
          title="Typography"
          description="A complete type scale based on Material Design 3 typography roles."
          href="/docs/foundations/typography"
        />
        <FoundationCard
          icon="palette"
          title="Colors"
          description="Dynamic color system with automatic light/dark mode support."
          href="/docs/foundations/colors"
        />
        <FoundationCard
          icon="space_bar"
          title="Spacing"
          description="Consistent spacing scale using the 4px unit system."
          href="/docs/foundations/spacing"
        />
        <FoundationCard
          icon="layers"
          title="Elevation"
          description="Shadow system for creating depth and visual hierarchy."
          href="/docs/foundations/elevation"
        />
        <FoundationCard
          icon="animation"
          title="Motion"
          description="Animation curves and durations for smooth, meaningful transitions."
          href="/docs/foundations/motion"
        />
      </div>
    </DocLayout>
  );
}

function FoundationCard({
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
      <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-on-secondary-container text-[24px]!">
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
