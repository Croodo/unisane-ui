"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import { DocLayout, DocSection } from "@/components/layout";
import {
  getComponentBySlug,
  getAdjacentComponents,
} from "@/lib/docs/data";
import {
  PropsTable,
  ChoosingTable,
  HierarchyGrid,
  PlacementExamples,
  AccessibilityInfo,
  RelatedComponents,
  CodeBlock,
  CliCommand,
  SubComponentsSection,
  PageNavigation,
  ExampleGrid,
} from "@/components/docs";

interface ComponentPageProps {
  params: Promise<{ slug: string }>;
}

export default function ComponentPage({ params }: ComponentPageProps) {
  const { slug } = use(params);
  const component = getComponentBySlug(slug);

  if (!component) {
    notFound();
  }

  const { previous, next } = getAdjacentComponents(slug);

  // Build table of contents based on available sections
  // Order: Installation → Usage → Design guidance → API → Accessibility → Related
  const toc: Array<{ id: string; label: string }> = [];

  // Installation first - how to add to project
  toc.push({ id: "installation", label: "Installation" });
  // Interactive examples
  if (component.examples?.length) {
    toc.push({ id: "examples", label: "Examples" });
  }
  // Usage - code example
  if (component.implementation) {
    toc.push({ id: "usage", label: "Usage" });
  }
  // Design guidance sections
  if (component.choosing) {
    toc.push({ id: "choosing", label: `Choosing ${component.name.toLowerCase()}` });
  }
  if (component.hierarchy) {
    toc.push({ id: "hierarchy", label: "Hierarchy" });
  }
  if (component.placement) {
    toc.push({ id: "placement", label: "Placement" });
  }
  // API documentation
  if (component.props?.length) {
    toc.push({ id: "api", label: "API Reference" });
  }
  if (component.subComponents?.length) {
    toc.push({ id: "sub-components", label: "Sub-components" });
  }
  // Accessibility
  if (component.accessibility) {
    toc.push({ id: "accessibility", label: "Accessibility" });
  }
  // Related components last
  if (component.related?.length) {
    toc.push({ id: "related", label: "Related" });
  }

  return (
    <DocLayout
      title={component.name}
      description={component.description}
      toc={toc}
      heroContent={component.heroVisual}
    >
      {/* ─── INSTALLATION SECTION ───────────────────────────────────────────────── */}
      <DocSection
        id="installation"
        title="Installation"
        description="Add this component to your project using the CLI."
      >
        <CliCommand command={`@unisane/cli add ${slug}`} />
      </DocSection>

      {/* ─── EXAMPLES SECTION ──────────────────────────────────────────────────────── */}
      {component.examples?.length ? (
        <DocSection
          id="examples"
          title="Examples"
          description="Interactive examples to explore the component."
        >
          <ExampleGrid examples={component.examples} />
        </DocSection>
      ) : null}

      {/* ─── USAGE SECTION ───────────────────────────────────────────────────────── */}
      {component.implementation && (
        <DocSection
          id="usage"
          title="Usage"
          description={component.implementation.description}
        >
          <CodeBlock code={component.implementation.code} language="tsx" />
        </DocSection>
      )}

      {/* ─── CHOOSING SECTION ───────────────────────────────────────────────────── */}
      {component.choosing && (
        <DocSection
          id="choosing"
          title={`Choosing ${component.name.toLowerCase()}`}
          description={component.choosing.description}
        >
          <ChoosingTable choosing={component.choosing} />
        </DocSection>
      )}

      {/* ─── HIERARCHY SECTION ──────────────────────────────────────────────────── */}
      {component.hierarchy && (
        <DocSection
          id="hierarchy"
          title="Hierarchy"
          description={component.hierarchy.description}
        >
          <HierarchyGrid hierarchy={component.hierarchy} />
        </DocSection>
      )}

      {/* ─── PLACEMENT SECTION ──────────────────────────────────────────────────── */}
      {component.placement && (
        <DocSection
          id="placement"
          title="Placement"
          description={component.placement.description}
        >
          <PlacementExamples placement={component.placement} />
        </DocSection>
      )}

      {/* ─── API REFERENCE ──────────────────────────────────────────────────────── */}
      {component.props?.length ? (
        <DocSection
          id="api"
          title="API Reference"
          description="Properties for this component. All standard HTML attributes are also supported."
        >
          <PropsTable props={component.props} />
        </DocSection>
      ) : null}

      {/* ─── SUB-COMPONENTS ─────────────────────────────────────────────────────── */}
      {component.subComponents?.length && (
        <DocSection
          id="sub-components"
          title="Sub-components"
          description="Additional components for building structured layouts."
        >
          <SubComponentsSection subComponents={component.subComponents} />
        </DocSection>
      )}

      {/* ─── ACCESSIBILITY ──────────────────────────────────────────────────────── */}
      {component.accessibility && (
        <DocSection id="accessibility" title="Accessibility">
          <AccessibilityInfo accessibility={component.accessibility} />
        </DocSection>
      )}

      {/* ─── RELATED COMPONENTS ─────────────────────────────────────────────────── */}
      {component.related?.length && (
        <DocSection
          id="related"
          title="Related Components"
          description="Other components that work well with this one."
        >
          <RelatedComponents related={component.related} />
        </DocSection>
      )}

      {/* ─── NAVIGATION ─────────────────────────────────────────────────────────── */}
      <PageNavigation previous={previous} next={next} className="pt-8 border-t border-outline-variant/15" />
    </DocLayout>
  );
}
