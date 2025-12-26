import Link from "next/link";
import { DocLayout } from "@/components/layout";
import { Typography, Card } from "@unisane/ui";
import {
  COMPONENT_REGISTRY,
  getComponentsByCategory,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  type ComponentCategory,
} from "@/lib/docs/components";

export default function ComponentsPage() {
  const componentsByCategory = getComponentsByCategory();
  const categories = Object.keys(componentsByCategory) as ComponentCategory[];

  return (
    <DocLayout
      title="Components"
      description="Explore our collection of 50+ production-ready React components built with Material Design 3 principles."
    >
      <div className="space-y-16">
        {categories.map((category) => {
          const components = componentsByCategory[category];
          if (components.length === 0) return null;

          return (
            <section key={category}>
              <div className="flex items-center gap-3u mb-6u">
                <span className="material-symbols-outlined text-primary text-[24px]!">
                  {CATEGORY_ICONS[category]}
                </span>
                <Typography variant="headlineMedium" component="h2">
                  {CATEGORY_LABELS[category]}
                </Typography>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4u">
                {components.map((component) => (
                  <Link
                    key={component.slug}
                    href={`/docs/components/${component.slug}`}
                    className="group block"
                  >
                    <Card
                      variant="filled"
                      className="p-5u rounded-2xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 hover:border-outline-variant transition-all duration-200"
                    >
                      <div className="flex items-start gap-4u">
                        <div className="w-10u h-10u rounded-xl bg-primary-container/50 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-[20px]!">
                            {component.icon || "widgets"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Typography variant="titleMedium" component="h3" className="group-hover:text-primary transition-colors">
                            {component.name}
                          </Typography>
                          <Typography variant="bodySmall" className="text-on-surface-variant mt-1u line-clamp-2">
                            {component.description}
                          </Typography>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </DocLayout>
  );
}
