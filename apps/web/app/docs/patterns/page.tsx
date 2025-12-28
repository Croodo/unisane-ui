import { DocLayout } from "@/components/layout";

export default function PatternsPage() {
  return (
    <DocLayout
      title="Patterns"
      description="Common UI patterns and layouts built with Unisane UI components."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PatternCard
          icon="view_sidebar"
          title="App Layouts"
          description="Responsive application layouts with navigation rails, drawers, and content areas."
          href="/docs/patterns/layouts"
        />
        <PatternCard
          icon="edit_note"
          title="Forms"
          description="Form patterns for data entry, validation, and submission."
          href="/docs/patterns/forms"
        />
        <PatternCard
          icon="menu"
          title="Navigation"
          description="Navigation patterns for different screen sizes and use cases."
          href="/docs/patterns/navigation"
        />
        <PatternCard
          icon="table_chart"
          title="Data Display"
          description="Patterns for displaying lists, tables, and data-rich interfaces."
          href="/docs/patterns/data"
        />
      </div>
    </DocLayout>
  );
}

function PatternCard({
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
      className="group block p-6 rounded-3xl bg-surface-container hover:bg-surface-container-high border border-outline-variant transition-all duration-200 hover:shadow-1"
    >
      <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-on-tertiary-container text-[24px]!">
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
