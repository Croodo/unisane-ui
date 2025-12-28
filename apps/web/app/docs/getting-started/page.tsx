import { DocLayout } from "@/components/layout";
import { Typography, Card } from "@unisane/ui";

export default function GettingStartedPage() {
  return (
    <DocLayout
      title="Get Started"
      description="Learn how to install and configure Unisane UI in your React project."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickLinkCard
          icon="download"
          title="Installation"
          description="Install Unisane UI and its dependencies in your project."
          href="/docs/getting-started/installation"
        />
        <QuickLinkCard
          icon="play_arrow"
          title="Quick Start"
          description="Get up and running with your first component in minutes."
          href="/docs/getting-started/quick-start"
        />
        <QuickLinkCard
          icon="format_paint"
          title="Styling"
          description="Learn how to customize components with Tailwind CSS."
          href="/docs/getting-started/styling"
        />
        <QuickLinkCard
          icon="palette"
          title="Building Themes"
          description="Create custom themes with the design token system."
          href="/docs/getting-started/theming"
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
    <a href={href} className="group block">
      <Card
        variant="outlined"
        className="p-6 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all duration-200 hover:shadow-1"
      >
        <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-on-primary-container text-[24px]!">
            {icon}
          </span>
        </div>
        <Typography variant="titleLarge" component="h3" className="mb-2 group-hover:text-primary transition-colors">
          {title}
        </Typography>
        <Typography variant="bodyMedium" className="text-on-surface-variant">
          {description}
        </Typography>
      </Card>
    </a>
  );
}
