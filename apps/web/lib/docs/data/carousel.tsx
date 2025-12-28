"use client";

import { ComponentDoc } from "../types";
import { HeroBackground } from "../hero-background";
import { Carousel, CarouselSlide, IconButton } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const CarouselHeroVisual = () => (
  <HeroBackground tone="tertiary">
    {/* Mock Carousel */}
    <div className="relative bg-surface w-80 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30">
      <div className="h-44 bg-surface-container-high relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant text-[48px]">image</span>
        </div>
        {/* Navigation Arrows */}
        <IconButton
          variant="filled"
          size="md"
          ariaLabel="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-surface/80"
        >
          <span className="material-symbols-outlined text-on-surface">chevron_left</span>
        </IconButton>
        <IconButton
          variant="filled"
          size="md"
          ariaLabel="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-surface/80"
        >
          <span className="material-symbols-outlined text-on-surface">chevron_right</span>
        </IconButton>
        {/* Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-on-surface-variant/50" />
          <div className="w-2 h-2 rounded-full bg-on-surface-variant/50" />
        </div>
      </div>
    </div>
  </HeroBackground>
);

// ─── INTERACTIVE EXAMPLES ────────────────────────────────────────────────────
const CarouselBasicExample = () => (
  <div className="w-full max-w-xs h-52">
    <Carousel showControls showIndicators>
      <CarouselSlide>
        <div className="w-full h-full bg-primary-container flex items-center justify-center rounded-lg">
          <span className="text-title-large text-on-primary-container">Slide 1</span>
        </div>
      </CarouselSlide>
      <CarouselSlide>
        <div className="w-full h-full bg-secondary-container flex items-center justify-center rounded-lg">
          <span className="text-title-large text-on-secondary-container">Slide 2</span>
        </div>
      </CarouselSlide>
      <CarouselSlide>
        <div className="w-full h-full bg-tertiary-container flex items-center justify-center rounded-lg">
          <span className="text-title-large text-on-tertiary-container">Slide 3</span>
        </div>
      </CarouselSlide>
    </Carousel>
  </div>
);

export const carouselDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "carousel",
  name: "Carousel",
  description:
    "Carousels display a collection of items that can be navigated through horizontally.",
  category: "containment",
  status: "stable",
  icon: "view_carousel",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Carousel", "CarouselSlide"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <CarouselHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Choose carousel configuration based on content and interaction needs.",
    columns: {
      emphasis: "Feature",
      component: "Preview",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "With Controls",
        component: (
          <div className="w-32 h-16 bg-surface-container rounded-sm relative flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-surface absolute left-1 flex items-center justify-center">
              <span className="text-[8px]">&lt;</span>
            </div>
            <div className="w-8 h-8 bg-primary/20 rounded-sm" />
            <div className="w-4 h-4 rounded-full bg-surface absolute right-1 flex items-center justify-center">
              <span className="text-[8px]">&gt;</span>
            </div>
          </div>
        ),
        rationale: "When manual navigation is needed.",
        examples: "Image galleries, Product showcases",
      },
      {
        emphasis: "Auto-play",
        component: (
          <div className="w-32 h-16 bg-surface-container rounded-sm relative flex items-center justify-center">
            <div className="w-8 h-8 bg-secondary/20 rounded-sm animate-pulse" />
          </div>
        ),
        rationale: "For passive viewing experiences.",
        examples: "Hero banners, Testimonials, Promotions",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Carousels are typically used for featured content and image galleries.",
    examples: [
      {
        title: "Basic carousel",
        visual: <CarouselBasicExample />,
        caption: "Use arrow keys or click controls to navigate",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "CarouselSlide components to display.",
    },
    {
      name: "autoPlay",
      type: "boolean",
      default: "false",
      description: "Automatically advance slides.",
    },
    {
      name: "interval",
      type: "number",
      default: "5000",
      description: "Auto-play interval in milliseconds.",
    },
    {
      name: "showControls",
      type: "boolean",
      default: "true",
      description: "Show navigation arrow buttons.",
    },
    {
      name: "showIndicators",
      type: "boolean",
      default: "true",
      description: "Show dot indicators for slides.",
    },
    {
      name: "aria-label",
      type: "string",
      default: '"Image carousel"',
      description: "Accessible label for the carousel.",
    },
  ],

  // ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "CarouselSlide",
      description: "Container for individual slide content.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Content to display in the slide." },
        { name: "className", type: "string", description: "Additional CSS classes." },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses role='region' with aria-roledescription='carousel'.",
      "Current slide position announced via aria-live.",
      "Each slide has proper role='tabpanel' semantics.",
    ],
    keyboard: [
      { key: "Arrow Left", description: "Go to previous slide" },
      { key: "Arrow Right", description: "Go to next slide" },
      { key: "Home", description: "Go to first slide" },
      { key: "End", description: "Go to last slide" },
    ],
    focus: [
      "Carousel is focusable for keyboard navigation.",
      "Auto-play pauses on hover for accessibility.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Wrap content in CarouselSlide components.",
    code: `import { Carousel, CarouselSlide } from "@unisane/ui";

function ImageGallery() {
  return (
    <Carousel autoPlay interval={4000}>
      <CarouselSlide>
        <img src="/image1.jpg" alt="Gallery image 1" />
      </CarouselSlide>
      <CarouselSlide>
        <img src="/image2.jpg" alt="Gallery image 2" />
      </CarouselSlide>
      <CarouselSlide>
        <img src="/image3.jpg" alt="Gallery image 3" />
      </CarouselSlide>
    </Carousel>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "tabs",
      reason: "Use for content that should be navigated by category.",
    },
    {
      slug: "card",
      reason: "Use for individual content items within slides.",
    },
  ],
};
