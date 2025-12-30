import Link from "next/link";
import { Typography, Card, Surface } from "@unisane/ui";
import {
  COMPONENT_REGISTRY,
  getComponentsByCategory,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  type ComponentCategory,
} from "@/lib/docs/components";

// Stats for the hero section
const stats = [
  { label: "Components", value: COMPONENT_REGISTRY.length.toString() },
  { label: "Categories", value: "9" },
  { label: "Variants", value: "200+" },
];

// Category order for display
const CATEGORY_ORDER: ComponentCategory[] = [
  "actions",
  "containment",
  "communication",
  "selection",
  "text-inputs",
  "navigation",
  "data-display",
  "layout",
  "foundations",
];

export default function ComponentsPage() {
  const componentsByCategory = getComponentsByCategory();

  return (
    <div className="animate-slide-up w-full pb-16 @3xl:pb-32">
      {/* Hero Section */}
      <header className="mb-12 @3xl:mb-16">
        {/* Title & Description */}
        <div className="mb-8 @3xl:mb-12">
          <h1 className="text-[2.5rem] @2xl:text-[3.5rem] @4xl:text-[4.5rem] leading-none font-semibold @3xl:font-medium mb-4 @3xl:mb-6 tracking-tight text-on-surface">
            Components
          </h1>
          <Typography
            variant="titleMedium"
            className="text-on-surface-variant leading-relaxed @3xl:text-title-large max-w-3xl"
          >
            A comprehensive collection of production-ready React components built with
            modern design principles. Accessible, customizable, and beautifully crafted.
          </Typography>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-4 @lg:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-2">
              <span className="text-[2rem] @lg:text-[2.5rem] font-semibold text-primary">
                {stat.value}
              </span>
              <span className="text-body-medium @lg:text-body-large text-on-surface-variant">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* Quick Navigation - Category Pills */}
      <nav className="mb-10 @3xl:mb-14 overflow-x-auto scrollbar-none -mx-4 px-4 @lg:mx-0 @lg:px-0">
        <div className="flex gap-2 @lg:flex-wrap">
          {CATEGORY_ORDER.map((category) => {
            const components = componentsByCategory[category];
            if (components.length === 0) return null;

            return (
              <a
                key={category}
                href={`#${category}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-high hover:bg-primary-container text-on-surface hover:text-on-primary-container transition-colors whitespace-nowrap text-label-large"
              >
                <span className="material-symbols-outlined text-[18px]!">
                  {CATEGORY_ICONS[category]}
                </span>
                {CATEGORY_LABELS[category]}
                <span className="text-label-small text-on-surface-variant/70">
                  {components.length}
                </span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Categories & Components */}
      <div className="space-y-12 @3xl:space-y-16">
        {CATEGORY_ORDER.map((category) => {
          const components = componentsByCategory[category];
          if (components.length === 0) return null;

          return (
            <section key={category} id={category} className="scroll-mt-24">
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6 @lg:mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-container text-[20px]!">
                    {CATEGORY_ICONS[category]}
                  </span>
                </div>
                <div>
                  <Typography variant="headlineSmall" component="h2" className="@lg:text-headline-medium">
                    {CATEGORY_LABELS[category]}
                  </Typography>
                  <Typography variant="bodySmall" className="text-on-surface-variant">
                    {components.length} component{components.length !== 1 ? "s" : ""}
                  </Typography>
                </div>
              </div>

              {/* Component Grid */}
              <div className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3 gap-3 @lg:gap-4">
                {components.map((component) => (
                  <Link
                    key={component.slug}
                    href={`/docs/components/${component.slug}`}
                    className="group block"
                  >
                    <div className="h-full p-4 @lg:p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-low transition-all duration-200">
                      <div className="flex items-start gap-3 @lg:gap-4">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 group-hover:bg-primary-container/50 transition-colors">
                          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]! transition-colors">
                            {component.icon || "widgets"}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Typography
                              variant="titleSmall"
                              component="h3"
                              className="@lg:text-title-medium group-hover:text-primary transition-colors"
                            >
                              {component.name}
                            </Typography>
                            {component.status === "beta" && (
                              <span className="text-label-small px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container">
                                Beta
                              </span>
                            )}
                          </div>
                          <Typography
                            variant="bodySmall"
                            className="text-on-surface-variant line-clamp-2 leading-relaxed"
                          >
                            {component.description}
                          </Typography>
                        </div>

                        {/* Arrow */}
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1">
                          arrow_forward
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
