import { notFound } from "next/navigation";
import { DocLayout, DocSection } from "@/components/layout";
import {
  getComponentBySlug,
  getAdjacentComponents,
  COMPONENT_REGISTRY,
} from "@/lib/docs/data";
import {
  PropsTable,
  ChoosingTable,
  HierarchyGrid,
  PlacementExamples,
  AccessibilityInfo,
  RelatedComponents,
  CodeBlock,
  SubComponentsSection,
  PageNavigation,
} from "@/components/docs";

interface ComponentPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return COMPONENT_REGISTRY.map((component) => ({
    slug: component.slug,
  }));
}

export default async function ComponentPage({ params }: ComponentPageProps) {
  const { slug } = await params;
  const component = getComponentBySlug(slug);

  if (!component) {
    notFound();
  }

  const { previous, next } = getAdjacentComponents(slug);

  // Build table of contents based on available sections
  const toc: Array<{ id: string; label: string }> = [];

  if (component.choosing) {
    toc.push({ id: "choosing", label: `Choosing ${component.name.toLowerCase()}` });
  }
  if (component.hierarchy) {
    toc.push({ id: "hierarchy", label: "Hierarchy" });
  }
  if (component.placement) {
    toc.push({ id: "placement", label: "Placement" });
  }
  if (component.props?.length) {
    toc.push({ id: "api", label: "API Reference" });
  }
  if (component.subComponents?.length) {
    toc.push({ id: "sub-components", label: "Sub-components" });
  }
  if (component.accessibility) {
    toc.push({ id: "accessibility", label: "Accessibility" });
  }
  if (component.implementation) {
    toc.push({ id: "implementation", label: "Implementation" });
  }
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
          description="Use these distinct sub-components to structure your card content."
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

      {/* ─── IMPLEMENTATION ─────────────────────────────────────────────────────── */}
      {component.implementation && (
        <DocSection
          id="implementation"
          title="Implementation"
          description={component.implementation.description}
        >
          <CodeBlock code={component.implementation.code} />
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
      <PageNavigation previous={previous} next={next} className="mt-16u pt-8u border-t border-outline-variant/15" />
    </DocLayout>
  );
}
