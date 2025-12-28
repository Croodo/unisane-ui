import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="w-16 h-16 relative mx-auto mb-8">
              <div className="absolute top-0 left-0 w-8 h-8 bg-primary rounded-tl-lg rounded-br-lg mix-blend-multiply dark:mix-blend-screen opacity-90" />
              <div className="absolute top-0 right-0 w-8 h-8 bg-tertiary rounded-tr-lg rounded-bl-lg mix-blend-multiply dark:mix-blend-screen opacity-90" />
              <div className="absolute bottom-0 left-0 w-8 h-8 bg-secondary rounded-bl-lg rounded-tr-lg mix-blend-multiply dark:mix-blend-screen opacity-90" />
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-error rounded-br-lg rounded-tl-lg mix-blend-multiply dark:mix-blend-screen opacity-90" />
            </div>

            <h1 className="text-display-large md:text-[72px] leading-tight font-normal text-on-surface mb-6 tracking-tight">
              <span className="font-medium">Unisane</span>{" "}
              <span className="text-on-surface-variant">UI</span>
            </h1>

            <p className="text-headline-small md:text-headline-medium text-on-surface-variant mb-12 max-w-2xl mx-auto">
              Production-ready Material Design 3 components for React. Beautiful,
              accessible, and infinitely customizable.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-on-primary text-label-large font-medium hover:shadow-1 transition-all duration-200"
              >
                Get Started
                <span className="material-symbols-outlined !text-[20px]">
                  arrow_forward
                </span>
              </Link>
              <Link
                href="/docs/components"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-surface-container-high text-on-surface text-label-large font-medium hover:bg-surface-container-highest transition-all duration-200"
              >
                Browse Components
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon="palette"
            title="Material Design 3"
            description="Built on the latest Material Design guidelines with dynamic color, typography, and motion systems."
          />
          <FeatureCard
            icon="accessibility_new"
            title="Accessible"
            description="All components follow WAI-ARIA standards and support keyboard navigation out of the box."
          />
          <FeatureCard
            icon="tune"
            title="Customizable"
            description="Powered by design tokens and Tailwind CSS. Easily adapt to any brand or design system."
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-surface-container-low rounded-[2rem] p-12 text-center">
          <h2 className="text-headline-large text-on-surface mb-4">
            Ready to build something beautiful?
          </h2>
          <p className="text-body-large text-on-surface-variant mb-8 max-w-xl mx-auto">
            Start with our CLI to add components to your project, or explore the
            full documentation.
          </p>
          <code className="inline-block bg-surface-container px-6 py-3 rounded-xl text-body-large text-on-surface font-mono">
            npx @unisane/cli init
          </code>
        </div>
      </div>
    </div>
  );
}

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
    <div className="p-8 rounded-3xl bg-surface-container">
      <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-on-primary-container !text-[28px]">
          {icon}
        </span>
      </div>
      <h3 className="text-title-large text-on-surface mb-3">{title}</h3>
      <p className="text-body-medium text-on-surface-variant">{description}</p>
    </div>
  );
}
