# Unisane UI Website Plan

Comprehensive plan for building a world-class documentation and marketing website using our own components.

**Last Updated:** 2025-12-24
**Status:** Phase 1 Complete, Phase 2 In Progress

---

## Core Principles

### Design System First
1. **Use Our Components** - Dogfood everything, showcase real usage
2. **No Unnecessary Overrides** - Only use className when truly needed
3. **System Consistency** - Always use radius themes, spacing units (4u, 6u, etc.), M3 typography
4. **Semantic Colors** - Use design tokens (bg-surface, text-on-surface-variant, etc.)

### Developer Experience
1. **Fast Load Times** - Optimized assets, static generation
2. **Easy Navigation** - Clear structure, fast search
3. **Copy Everything** - One-click code copying everywhere
4. **Live Previews** - See components in action with theme controls

---

## Goals

1. **Showcase Excellence** - Demonstrate Unisane UI's capabilities through the site itself
2. **Developer-First** - Make it incredibly easy to find, understand, and use components
3. **Performance** - Fast, accessible, and SEO-optimized
4. **Best-in-Class UX** - Better than shadcn/ui, MUI, Chakra documentation
5. **Brand Identity** - Establish Unisane UI as a premium, professional design system

---

## Inspiration & Reference

### Learning From The Best
- **Material Design 3** - Official M3 website structure and presentation
- **shadcn/ui** - Clean design, excellent code preview, copy functionality
- **Tailwind CSS** - Beautiful landing page, clear navigation
- **Radix UI** - Detailed component APIs, accessibility focus
- **Next.js** - Modern design, great developer experience

### What We Do Better
- ✅ Live theme switching (dark mode, density, radius) in ComponentPreview
- ✅ Built entirely with our own components (true dogfooding)
- ✅ Industrial unit spacing system (scales with density)
- ✅ Comprehensive M3 implementation
- ✅ Navigation system with sophisticated hover-intent

---

## Site Architecture

```
apps/web/
├── app/
│   ├── (marketing)/              # Route group for landing page
│   │   ├── page.tsx              # Landing page (Hero + Features + CTA)
│   │   └── layout.tsx            # Marketing layout (no sidebar)
│   │
│   ├── docs/
│   │   ├── layout.tsx            # Docs layout (with navigation)
│   │   ├── page.tsx              # Docs home / getting started
│   │   │
│   │   ├── getting-started/
│   │   │   ├── installation/page.tsx
│   │   │   ├── theming/page.tsx
│   │   │   └── first-component/page.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── [slug]/page.tsx   # Dynamic component pages
│   │   │   └── page.tsx          # Components overview
│   │   │
│   │   ├── customization/
│   │   │   ├── colors/page.tsx
│   │   │   ├── dark-mode/page.tsx
│   │   │   ├── density/page.tsx
│   │   │   └── spacing/page.tsx
│   │   │
│   │   └── patterns/
│   │       ├── navigation/page.tsx
│   │       ├── forms/page.tsx
│   │       └── layouts/page.tsx
│   │
│   ├── examples/                 # Full page examples (future)
│   │   ├── dashboard/page.tsx
│   │   └── e-commerce/page.tsx
│   │
│   └── layout.tsx                # Root layout (ThemeProvider)
│
├── components/
│   ├── marketing/                # Landing page components
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── ComponentShowcase.tsx
│   │   └── QuickStart.tsx
│   │
│   ├── docs/                     # ✅ COMPLETED
│   │   ├── ComponentPreview.tsx  # ✅ With theme controls
│   │   ├── CodeBlock.tsx         # ✅ Syntax highlighting + copy
│   │   ├── PropsTable.tsx        # ✅ API documentation
│   │   ├── DocsNav.tsx           # Navigation rail + drawer
│   │   └── TableOfContents.tsx   # Sticky TOC
│   │
│   └── ui/                       # Shared UI components
│       └── (use @unisane/ui directly)
│
├── content/                      # MDX content (future)
│   ├── docs/
│   └── components/
│
└── lib/
    ├── components.ts             # Component registry/metadata
    ├── navigation.ts             # Navigation structure
    └── utils.ts                  # Helper utilities
```

---

## Implementation Status

### ✅ Phase 1: Foundation (COMPLETE)

**Completed:**
1. ✅ Clean project structure
2. ✅ ThemeProvider setup (system theme, standard density)
3. ✅ ComponentPreview with theme controls
4. ✅ CodeBlock with syntax highlighting (Shiki)
5. ✅ PropsTable for API documentation
6. ✅ Test/demo page at `/docs`

**Files Created:**
- `apps/web/components/docs/ComponentPreview.tsx` (220 lines)
- `apps/web/components/docs/CodeBlock.tsx` (185 lines)
- `apps/web/components/docs/PropsTable.tsx` (155 lines)
- `apps/web/components/docs/index.ts` (exports)
- `apps/web/app/docs/page.tsx` (demo page, 288 lines)

**Dependencies Added:**
- `shiki` - Syntax highlighting
- `@types/react-syntax-highlighter` - TypeScript types

---

### 🔄 Phase 2: Landing Page (IN PROGRESS)

**To Build:**
1. Hero section
2. Features grid
3. Component showcase
4. Quick start section
5. Footer

**Target Route:** `app/(marketing)/page.tsx`

**Components Needed:**
- `components/marketing/Hero.tsx`
- `components/marketing/Features.tsx`
- `components/marketing/ComponentShowcase.tsx`
- `components/marketing/QuickStart.tsx`
- `components/marketing/Footer.tsx`

---

### 📋 Phase 3: Documentation Layout (PLANNED)

**To Build:**
1. Navigation rail + drawer (using our navigation system)
2. Top app bar with search and theme switcher
3. Table of contents (sticky sidebar)
4. Breadcrumbs
5. Page navigation (prev/next)

**Target Layout:** `app/docs/layout.tsx`

**Components Needed:**
- `components/docs/DocsNav.tsx` - Main navigation
- `components/docs/DocsTopBar.tsx` - Header with search
- `components/docs/TableOfContents.tsx` - TOC sidebar
- `components/docs/Breadcrumbs.tsx` - Navigation path
- `components/docs/PageNav.tsx` - Prev/next links

---

### 📋 Phase 4: Component Pages (PLANNED)

**Template Structure:**
```tsx
// app/docs/components/[slug]/page.tsx
{
  header: { title, description, badges },
  quickActions: { install, api, source },
  preview: ComponentPreview,
  installation: CodeBlock,
  usage: CodeBlock,
  variants: [ { name, description, preview, code } ],
  apiReference: PropsTable,
  accessibility: AccessibilityInfo,
  examples: [ ... ],
  related: [ ... ]
}
```

**To Build:**
- Component page template
- Component metadata system
- Auto-generate props from TypeScript
- 61 component pages (or use template)

---

## Page Designs

### 1. Landing Page (`/`)

**Sections:**

#### Hero Section
```tsx
<section className="min-h-screen flex items-center justify-center">
  <div className="max-w-7xl mx-auto px-6u py-16u">
    <div className="text-center space-y-6u">
      <Badge variant="tonal">v0.1.0 • Production Ready</Badge>

      <h1 className="text-display-large font-bold">
        Build Better UIs, <span className="text-primary">Faster</span>
      </h1>

      <p className="text-title-large text-on-surface-variant max-w-3xl mx-auto">
        A Material 3 design system with 61 accessible components,
        sophisticated theming, and exceptional developer experience.
      </p>

      <div className="flex gap-4u justify-center">
        <Button variant="filled" size="lg">Get Started</Button>
        <Button variant="outlined" size="lg">Browse Components</Button>
      </div>

      <CodeBlock
        code={installCode}
        language="bash"
        showCopy
      />
    </div>
  </div>
</section>
```

#### Features Section
```tsx
<section className="py-24u">
  <div className="max-w-7xl mx-auto px-6u">
    <h2 className="text-headline-large text-center mb-12u">
      Everything you need to ship fast
    </h2>

    <div className="grid md:grid-cols-3 gap-6u">
      <FeatureCard
        icon="palette"
        title="Sophisticated Theming"
        description="Dark mode, 4 density presets, 3 radius themes."
      />
      <FeatureCard
        icon="accessibility"
        title="Accessible by Default"
        description="WCAG AA compliant. Keyboard navigation, screen reader tested."
      />
      <FeatureCard
        icon="speed"
        title="Performance First"
        description="Tree-shakeable. Static CSS. Fast builds."
      />
      {/* 6 more features */}
    </div>
  </div>
</section>
```

#### Component Showcase
```tsx
<section className="py-24u bg-surface-container-low">
  <div className="max-w-7xl mx-auto px-6u">
    <h2 className="text-headline-large text-center mb-12u">
      61 Production-Ready Components
    </h2>

    <div className="grid md:grid-cols-3 gap-6u">
      {featuredComponents.map(component => (
        <Card key={component.slug} className="p-6u">
          <div className="aspect-video mb-4u">
            <ComponentPreview showControls={false}>
              <component.Preview />
            </ComponentPreview>
          </div>
          <h3 className="text-title-large font-semibold mb-2u">
            {component.name}
          </h3>
          <p className="text-body-medium text-on-surface-variant">
            {component.description}
          </p>
        </Card>
      ))}
    </div>
  </div>
</section>
```

---

### 2. Documentation Layout (`/docs/*`)

**Layout Structure:**
```tsx
<div className="flex min-h-screen">
  {/* Navigation Rail + Drawer */}
  <DocsNav items={navItems} />

  {/* Main Content */}
  <div className="flex-1 flex flex-col">
    {/* Top Bar */}
    <DocsTopBar />

    <div className="flex flex-1">
      {/* Article Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6u py-12u">
        <Breadcrumbs />
        <article>{children}</article>
        <PageNav prev={prev} next={next} />
      </main>

      {/* Table of Contents */}
      <aside className="w-64 sticky top-0 p-6u">
        <TableOfContents headings={headings} />
      </aside>
    </div>
  </div>
</div>
```

---

### 3. Component Page Template

**Structure:**
```tsx
export default function ComponentPage({ params }) {
  const component = getComponent(params.slug);

  return (
    <article className="space-y-12u">
      {/* Header */}
      <header>
        <h1 className="text-display-medium mb-2u">{component.name}</h1>
        <p className="text-title-large text-on-surface-variant">
          {component.description}
        </p>
        <div className="flex gap-2u mt-4u">
          {component.badges.map(badge => (
            <Badge key={badge}>{badge}</Badge>
          ))}
        </div>
      </header>

      {/* Quick Actions */}
      <div className="flex gap-2u">
        <Button variant="filled" onClick={copyInstall}>
          Install
        </Button>
        <Button variant="outlined" href="#api">
          API Reference
        </Button>
        <Button variant="text" href={component.source}>
          View Source
        </Button>
      </div>

      {/* Preview */}
      <section>
        <h2 className="text-headline-medium mb-4u">Preview</h2>
        <ComponentPreview>
          <component.DefaultExample />
        </ComponentPreview>
      </section>

      {/* Installation */}
      <section>
        <h2 className="text-headline-medium mb-4u">Installation</h2>
        <CodeBlock
          code={`npx @unisane/cli add ${component.slug}`}
          language="bash"
          showCopy
        />
      </section>

      {/* Usage */}
      <section>
        <h2 className="text-headline-medium mb-4u">Usage</h2>
        <CodeBlock
          code={component.usageCode}
          language="tsx"
          showCopy
        />
      </section>

      {/* Variants */}
      <section>
        <h2 className="text-headline-medium mb-4u">Variants</h2>
        {component.variants.map(variant => (
          <div key={variant.name} className="mb-8u">
            <h3 className="text-title-large mb-4u">{variant.name}</h3>
            <ComponentPreview>
              <variant.Example />
            </ComponentPreview>
            <CodeBlock
              code={variant.code}
              language="tsx"
              showCopy
            />
          </div>
        ))}
      </section>

      {/* API */}
      <section id="api">
        <h2 className="text-headline-medium mb-4u">API Reference</h2>
        <PropsTable props={component.props} />
      </section>

      {/* Accessibility */}
      <section>
        <h2 className="text-headline-medium mb-4u">Accessibility</h2>
        <ul className="space-y-2u">
          {component.a11y.map(feature => (
            <li key={feature}>✅ {feature}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
```

---

## Technical Stack

### Core
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 + @unisane/ui
- **Components:** @unisane/ui (dogfooding)
- **Language:** TypeScript (strict)

### Features
- **Syntax Highlighting:** Shiki
- **MDX:** @next/mdx (for content)
- **Search:** Algolia or Pagefind (TBD)
- **Analytics:** Vercel Analytics (optional)

### Build & Deploy
- **Hosting:** Vercel
- **Build:** Static generation (SSG)
- **Performance:** Edge network, image optimization

---

## Design System Usage

### Typography Scale
```tsx
// Headings
text-display-large    // Hero titles
text-display-medium   // Page titles
text-headline-large   // Section headings
text-headline-medium  // Subsection headings
text-title-large      // Card titles
text-title-medium     // Small headings

// Body
text-body-large       // Main content
text-body-medium      // Secondary content
text-label-large      // Buttons, labels
```

### Spacing Units
```tsx
// Gaps & Padding
gap-4u, gap-6u, gap-8u, gap-12u, gap-16u
px-6u, py-4u, p-8u

// Margins
mb-2u, mb-4u, mb-6u, mb-8u, mb-12u
mt-4u, mt-6u, mt-8u

// Spacing
space-y-4u, space-y-6u, space-y-8u, space-y-12u, space-y-16u
```

### Semantic Colors
```tsx
// Backgrounds
bg-surface
bg-surface-container
bg-surface-container-low
bg-surface-container-lowest
bg-primary, bg-secondary

// Text
text-on-surface
text-on-surface-variant
text-on-primary
text-primary

// Borders
border-outline-variant
```

---

## Features to Implement

### Phase 1: Core ✅ (COMPLETE)
- [x] Clean project structure
- [x] ComponentPreview
- [x] CodeBlock
- [x] PropsTable
- [x] Demo page

### Phase 2: Landing Page (CURRENT)
- [ ] Hero section
- [ ] Features grid
- [ ] Component showcase
- [ ] Quick start section
- [ ] Footer

### Phase 3: Docs Layout
- [ ] Navigation rail + drawer
- [ ] Top bar with search
- [ ] Table of contents
- [ ] Breadcrumbs
- [ ] Page navigation

### Phase 4: Content
- [ ] Getting started pages
- [ ] Component pages (template)
- [ ] Customization guides
- [ ] Pattern documentation

### Phase 5: Advanced
- [ ] Search functionality
- [ ] Interactive playground
- [ ] Example templates
- [ ] Blog (optional)

### Phase 6: Polish
- [ ] SEO optimization
- [ ] OG images
- [ ] Performance tuning
- [ ] Analytics
- [ ] Mobile optimization

---

## Success Metrics

### Performance
- Lighthouse score: 95+
- First Contentful Paint: <1s
- Time to Interactive: <2s
- Bundle size: <200KB initial

### SEO
- Google PageSpeed: 90+
- Search rankings for key terms
- Organic traffic growth

### Engagement
- Time on site
- Pages per session
- Component installs via CLI
- Copy button clicks

---

## Next Steps

### Immediate (This Session)
1. ✅ Update website plan (this file)
2. Build Hero section component
3. Build Features section component
4. Build ComponentShowcase component
5. Create landing page

### Week 1
- Complete landing page
- Build docs navigation layout
- Create 5 component pages

### Week 2
- Complete all component pages
- Add search functionality
- Build getting started guides

### Week 3
- Interactive playground
- Example templates
- Pattern documentation

### Week 4
- SEO optimization
- Performance tuning
- Beta launch

---

## Questions & Decisions

### Resolved
- ✅ Use our own components throughout (no external UI libraries)
- ✅ Use Shiki for syntax highlighting (faster than Prism)
- ✅ Use our navigation system for docs (dogfooding)
- ✅ Industrial units for all spacing (4u, 6u, etc.)
- ✅ No unnecessary className overrides

### To Decide
- [ ] Search: Algolia (free tier) or Pagefind (self-hosted)?
- [ ] Analytics: Vercel Analytics or Google Analytics?
- [ ] Domain: unisane-ui.com or unisane.design?
- [ ] Blog: Include or skip for v1?

---

**Target Launch:** 3-4 weeks
**Current Phase:** 2 (Landing Page)
**Progress:** 25% complete
