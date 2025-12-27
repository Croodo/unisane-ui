"use client";

import { ComponentDoc } from "../types";
import { Avatar, AvatarGroup, Card } from "@unisane/ui";

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
const AvatarHeroVisual = () => (
  <div className="relative w-full h-full bg-linear-to-br from-secondary-container to-primary-container flex items-center justify-center p-8 overflow-hidden isolate">
    {/* Decorative Circles */}
    <div className="absolute top-[-40px] left-[-40px] w-56 h-56 bg-secondary/20 rounded-full blur-3xl" />
    <div className="absolute bottom-[-50px] right-[-30px] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

    {/* Mock Team Card */}
    <div className="relative bg-surface w-[300px] rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 z-10">
      <div className="px-5u py-4u border-b border-outline-variant/20">
        <span className="text-title-medium text-on-surface">Project Team</span>
      </div>
      <div className="p-4u space-y-4u">
        <div className="flex items-center gap-3u">
          <Avatar fallback="JD" size="md" />
          <div>
            <div className="text-body-medium text-on-surface">John Doe</div>
            <div className="text-body-small text-on-surface-variant">Lead Designer</div>
          </div>
        </div>
        <div className="flex items-center gap-3u">
          <Avatar fallback="AS" size="md" />
          <div>
            <div className="text-body-medium text-on-surface">Alice Smith</div>
            <div className="text-body-small text-on-surface-variant">Developer</div>
          </div>
        </div>
        <div className="pt-2u border-t border-outline-variant/20">
          <div className="text-label-small text-on-surface-variant mb-2u">Team Members</div>
          <AvatarGroup max={4}>
            <Avatar fallback="A" size="sm" />
            <Avatar fallback="B" size="sm" />
            <Avatar fallback="C" size="sm" />
            <Avatar fallback="D" size="sm" />
            <Avatar fallback="E" size="sm" />
            <Avatar fallback="F" size="sm" />
          </AvatarGroup>
        </div>
      </div>
    </div>
  </div>
);

export const avatarDoc: ComponentDoc = {
  // ─── BASIC INFO ─────────────────────────────────────────────────────────────
  slug: "avatar",
  name: "Avatar",
  description: "Avatars display user profile images, initials, or icons.",
  category: "data-display",
  status: "stable",
  icon: "account_circle",

  // ─── IMPORT INFO ────────────────────────────────────────────────────────────
  importPath: "@unisane/ui",
  exports: ["Avatar", "AvatarGroup"],

  // ─── HERO VISUAL ───────────────────────────────────────────────────────────
  heroVisual: <AvatarHeroVisual />,

  // ─── CHOOSING SECTION ──────────────────────────────────────────────────────
  choosing: {
    description:
      "Avatars can display images, initials, or fallback icons. Choose based on available data.",
    columns: {
      emphasis: "Type",
      component: "Example",
      rationale: "When to use",
      examples: "Common uses",
    },
    rows: [
      {
        emphasis: "With Image",
        component: (
          <Avatar src="https://i.pravatar.cc/150?img=1" alt="User" />
        ),
        rationale:
          "Display user's profile photo when available.",
        examples: "User profiles, Comments, Messages",
      },
      {
        emphasis: "With Initials",
        component: (
          <Avatar fallback="JD" />
        ),
        rationale:
          "Show initials when no image is available.",
        examples: "New users, Loading state, Anonymous",
      },
      {
        emphasis: "Fallback",
        component: (
          <Avatar />
        ),
        rationale:
          "Default icon when no information is available.",
        examples: "Unknown user, Placeholder, System",
      },
    ],
  },

  // ─── HIERARCHY SECTION ─────────────────────────────────────────────────────
  hierarchy: {
    description:
      "Avatars come in multiple sizes to fit different contexts.",
    items: [
      {
        component: <Avatar fallback="SM" size="sm" />,
        title: "Small",
        subtitle: "32px - Lists, comments",
      },
      {
        component: <Avatar fallback="MD" size="md" />,
        title: "Medium",
        subtitle: "40px - Default size",
      },
      {
        component: <Avatar fallback="LG" size="lg" />,
        title: "Large",
        subtitle: "48px - Profiles, cards",
      },
      {
        component: <Avatar fallback="XL" size="xl" />,
        title: "Extra Large",
        subtitle: "56px - Hero sections",
      },
    ],
  },

  // ─── PLACEMENT SECTION ─────────────────────────────────────────────────────
  placement: {
    description:
      "Avatars are commonly used in user lists, comments, and profile sections.",
    examples: [
      {
        title: "User list",
        visual: (
          <Card variant="outlined" padding="none" className="max-w-[280px] mx-auto overflow-hidden">
            {[
              { name: "Alice Johnson", role: "Designer", initials: "AJ" },
              { name: "Bob Smith", role: "Developer", initials: "BS" },
              { name: "Carol White", role: "Manager", initials: "CW" },
            ].map((user) => (
              <div key={user.name} className="flex items-center gap-3u px-4u py-3u border-b border-outline-variant/20 last:border-0">
                <Avatar fallback={user.initials} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-body-medium text-on-surface truncate">{user.name}</div>
                  <div className="text-body-small text-on-surface-variant">{user.role}</div>
                </div>
              </div>
            ))}
          </Card>
        ),
        caption: "Avatars in a user list with details",
      },
      {
        title: "Avatar group",
        visual: (
          <Card variant="outlined" padding="md" className="max-w-[280px] mx-auto">
            <div className="text-title-small text-on-surface mb-3u">Shared with</div>
            <AvatarGroup max={4}>
              <Avatar fallback="A" />
              <Avatar fallback="B" />
              <Avatar fallback="C" />
              <Avatar fallback="D" />
              <Avatar fallback="E" />
            </AvatarGroup>
          </Card>
        ),
        caption: "Stacked avatars showing multiple users",
      },
    ],
  },

  // ─── PROPS ──────────────────────────────────────────────────────────────────
  props: [
    {
      name: "src",
      type: "string",
      description: "URL of the avatar image.",
    },
    {
      name: "alt",
      type: "string",
      description: "Alt text for the image for accessibility.",
    },
    {
      name: "fallback",
      type: "string",
      description: "Text to display when no image (first character is used).",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg" | "xl"',
      default: '"md"',
      description: "The size of the avatar.",
    },
    {
      name: "variant",
      type: '"circular" | "rounded" | "square"',
      default: '"circular"',
      description: "The shape of the avatar.",
    },
    {
      name: "className",
      type: "string",
      description: "Additional CSS classes to apply.",
    },
  ],

  // ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
  subComponents: [
    {
      name: "AvatarGroup",
      description: "Displays multiple avatars in a stacked layout.",
      props: [
        { name: "children", type: "ReactNode", required: true, description: "Avatar components to display." },
        { name: "max", type: "number", default: "5", description: "Maximum avatars to show before +N indicator." },
        { name: "className", type: "string", description: "Additional CSS classes." },
      ],
    },
  ],

  // ─── ACCESSIBILITY ──────────────────────────────────────────────────────────
  accessibility: {
    screenReader: [
      "Uses role='img' with aria-label for screen readers.",
      "Image alt text is announced when present.",
      "Fallback text is used as label when no image.",
    ],
    keyboard: [
      { key: "N/A", description: "Avatars are not interactive by default" },
    ],
    focus: [
      "Avatars do not receive focus unless made interactive.",
      "When used as buttons, focus ring is visible.",
    ],
  },

  // ─── IMPLEMENTATION ────────────────────────────────────────────────────────
  implementation: {
    description: "Display user avatars with image or fallback initials.",
    code: `import { Avatar, AvatarGroup } from "@unisane/ui";

function UserProfile({ user }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar
        src={user.avatarUrl}
        alt={user.name}
        fallback={user.initials}
        size="lg"
      />
      <div>
        <div className="font-medium">{user.name}</div>
        <div className="text-sm text-gray-500">{user.email}</div>
      </div>
    </div>
  );
}

function TeamMembers({ members }) {
  return (
    <div>
      <h3>Team Members</h3>
      <AvatarGroup max={5}>
        {members.map(member => (
          <Avatar
            key={member.id}
            src={member.avatar}
            fallback={member.initials}
            alt={member.name}
          />
        ))}
      </AvatarGroup>
    </div>
  );
}`,
  },

  // ─── RELATED COMPONENTS ─────────────────────────────────────────────────────
  related: [
    {
      slug: "badge",
      reason: "Use to add status indicators to avatars.",
    },
    {
      slug: "list",
      reason: "Often used with avatars for user lists.",
    },
    {
      slug: "card",
      reason: "Avatars commonly appear in card headers.",
    },
  ],
};
