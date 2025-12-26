# Navigation System

A flexible, composable navigation system for building any layout pattern.

> **Complete Documentation**: For full component code examples and API reference, see [Design System - Navigation](../design-system/08-navigation.md).

---

## Philosophy

Unlike opinionated sidebar components, Unisane's navigation system provides **smart primitives** that compose into any navigation pattern you need.

### Core Principles

1. **Flexibility**: Build any navigation pattern (sidebar, rail, top nav, hybrid)
2. **Composable**: Mix and match primitives to create custom layouts
3. **Smart Hooks**: Complex behaviors (hover intent, state management) handled for you
4. **Type-Safe**: Full TypeScript support with autocomplete
5. **Accessible**: WCAG AA compliant with keyboard navigation

---

## Components

### Core Primitives

- **Nav** - Base navigation container
- **NavItem** - Single interactive navigation item
- **NavGroup** - Organizes items into collapsible sections

### Hooks

- **useNavigationState** - Manage active item, collapsed state, mobile drawer
- **useNavigationHover** - Sophisticated hover system (rail + drawer pattern)
- **useNavigationItems** - Process and query navigation hierarchies
- **useNavigationBreakpoint** - Responsive breakpoint detection

---

## Quick Start

```tsx
import {
  Nav,
  NavItem,
  NavGroup,
  useNavigationState,
} from "@unisane/ui";

function AppLayout({ children }) {
  const { active, setActive, collapsed, setCollapsed } = useNavigationState();

  return (
    <div className="flex h-screen">
      <Nav
        vertical
        collapsed={collapsed}
        width={{ expanded: '280px', collapsed: '80px' }}
      >
        <NavGroup label="Platform">
          <NavItem
            active={active === 'dashboard'}
            onClick={() => setActive('dashboard')}
            icon={<Icon>dashboard</Icon>}
          >
            Dashboard
          </NavItem>
          <NavItem
            active={active === 'analytics'}
            onClick={() => setActive('analytics')}
            icon={<Icon>analytics</Icon>}
          >
            Analytics
          </NavItem>
        </NavGroup>
      </Nav>

      <main className="flex-1">{children}</main>
    </div>
  );
}
```

---

## Patterns

### Pattern 1: Simple Sidebar

Standard collapsible sidebar for most applications.

```tsx
function SimpleS idebarLayout({ children }) {
  const { active, setActive, collapsed, setCollapsed } = useNavigationState({
    persistState: true,
  });

  return (
    <div className="flex h-screen bg-surface-container-low">
      {/* Sidebar */}
      <Nav
        vertical
        collapsed={collapsed}
        width={{ expanded: '280px', collapsed: '80px' }}
        className="shadow-1"
      >
        {/* Header */}
        <div className="p-4u border-b border-outline-variant">
          {collapsed ? <LogoIcon /> : <LogoFull />}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-2u">
          <NavGroup label="Main">
            <NavItem
              active={active === 'dashboard'}
              onClick={() => setActive('dashboard')}
              icon={<Icon>dashboard</Icon>}
              compact={collapsed}
            >
              Dashboard
            </NavItem>
            <NavItem
              active={active === 'projects'}
              onClick={() => setActive('projects')}
              icon={<Icon>folder</Icon>}
              badge={3}
              compact={collapsed}
            >
              Projects
            </NavItem>
          </NavGroup>

          <NavGroup label="System" showDivider>
            <NavItem
              active={active === 'settings'}
              onClick={() => setActive('settings')}
              icon={<Icon>settings</Icon>}
              compact={collapsed}
            >
              Settings
            </NavItem>
          </NavGroup>
        </div>

        {/* Footer */}
        <div className="p-4u border-t border-outline-variant">
          <IconButton
            icon={collapsed ? <Icon>menu_open</Icon> : <Icon>menu</Icon>}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          />
        </div>
      </Nav>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

**Use for**: Most applications, admin panels, dashboards

---

### Pattern 2: Rail + Hover Drawer

Icon rail with expandable drawer on hover (reference navigation system).

```tsx
function RailDrawerLayout({ children }) {
  const navItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home',
      items: [], // No subitems = drawer stays closed
    },
    {
      id: 'components',
      label: 'Components',
      icon: 'layers',
      items: [
        { id: 'button', label: 'Button', href: '/components/button' },
        { id: 'card', label: 'Card', href: '/components/card' },
        {
          id: 'forms',
          label: 'Forms',
          items: [
            { id: 'text-field', label: 'TextField' },
            { id: 'checkbox', label: 'Checkbox' },
          ],
        },
      ],
    },
  ];

  const {
    hoveredItem,
    activeItem,
    isDrawerVisible,
    isPushMode,
    effectiveItem,
    handleItemHover,
    handleItemClick,
    handleRailLeave,
    handleDrawerEnter,
    handleDrawerLeave,
  } = useNavigationHover({
    items: navItems,
    activeItem: 'home',
  });

  return (
    <div className="flex h-screen">
      {/* Rail */}
      <nav
        className="flex flex-col w-20u bg-surface-container-low border-r border-outline-variant z-50"
        onMouseLeave={handleRailLeave}
      >
        <div className="flex-1 flex flex-col gap-2u p-2u">
          {navItems.map((item) => {
            const isActive = activeItem === item.id;
            const isHovered = hoveredItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={() => handleItemHover(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1u p-2u rounded-sm",
                  "transition-all duration-short",
                  isActive && "bg-secondary-container",
                  !isActive && "hover:bg-surface-variant"
                )}
              >
                <Icon>{item.icon}</Icon>
                <span className="text-label-small">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Drawer */}
      <div
        onMouseEnter={handleDrawerEnter}
        onMouseLeave={handleDrawerLeave}
        className={cn(
          "fixed top-0 h-screen bg-surface-container-low",
          "border-r border-outline-variant z-40",
          "transition-transform duration-medium ease-emphasized",
          isDrawerVisible ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          left: '80px',
          width: '280px',
        }}
      >
        {effectiveItem?.items && effectiveItem.items.length > 0 && (
          <div className="p-6u">
            <h2 className="text-title-large mb-4u">{effectiveItem.label}</h2>

            {effectiveItem.items.map((item) => (
              <NavItem
                key={item.id}
                href={item.href}
                icon={item.icon ? <Icon>{item.icon}</Icon> : undefined}
              >
                {item.label}
              </NavItem>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <main className={cn("flex-1", isPushMode && "ml-280px")}>
        {children}
      </main>
    </div>
  );
}
```

**Use for**: Documentation sites, large applications with deep hierarchies

**Features**:
- 150ms hover delay (prevents flickering)
- 300ms exit grace period (diagonal mouse movement)
- Click to lock drawer open
- Smooth content persistence during animations

---

### Pattern 3: Top Nav + Sidebar Hybrid

Horizontal top navigation with contextual sidebar.

```tsx
function HybridLayout({ children }) {
  const topNavItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/' },
    { id: 'projects', label: 'Projects', href: '/projects' },
    { id: 'team', label: 'Team', href: '/team' },
  ];

  const { active, setActive } = useNavigationState();

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navigation */}
      <nav className="flex items-center h-16u px-6u border-b border-outline-variant bg-surface">
        <Logo className="mr-8u" />

        <div className="flex gap-1u">
          {topNavItems.map((item) => (
            <NavItem
              key={item.id}
              active={active === item.id}
              onClick={() => setActive(item.id)}
              href={item.href}
              className="px-4u"
            >
              {item.label}
            </NavItem>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2u">
          <SearchButton />
          <ThemeToggle />
          <UserMenu />
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (contextual) */}
        <Nav vertical width="240px">
          <div className="p-4u">
            <NavGroup label="Quick Actions">
              <NavItem icon={<Icon>add</Icon>}>New Project</NavItem>
              <NavItem icon={<Icon>folder</Icon>}>Browse Files</NavItem>
            </NavGroup>
          </div>
        </Nav>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Use for**: Complex applications, SaaS products, admin panels with multiple sections

---

### Pattern 4: Mobile Bottom Navigation

Mobile-first navigation with bottom tab bar.

```tsx
function MobileLayout({ children }) {
  const { isMobile } = useNavigationBreakpoint();
  const { active, setActive } = useNavigationState();

  const navItems = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'explore', label: 'Explore', icon: 'explore' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications', badge: 3 },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  if (!isMobile) {
    return <DesktopLayout>{children}</DesktopLayout>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Content */}
      <main className="flex-1 overflow-auto pb-16u">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16u bg-surface border-t border-outline-variant z-50">
        <div className="flex h-full">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1u relative",
                "transition-colors",
                active === item.id
                  ? "text-primary"
                  : "text-on-surface-variant"
              )}
            >
              {item.badge && (
                <span className="absolute top-2u right-1/4 w-4u h-4u bg-error text-on-error text-label-small rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              <Icon>{item.icon}</Icon>
              <span className="text-label-small">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
```

**Use for**: Mobile apps, progressive web apps, mobile-first designs

---

## API Reference

### Nav

Base navigation container.

```tsx
<Nav
  vertical={boolean}
  variant="default|compact|comfortable"
  collapsed={boolean}
  width={{expanded: string, collapsed: string} | string}
  className={string}
  as="nav|aside|div"
>
```

### NavItem

Interactive navigation element.

```tsx
<NavItem
  icon={ReactNode}
  badge={string | number}
  active={boolean}
  disabled={boolean}
  href={string}
  onClick={(e) => void}
  variant="default|compact|comfortable"
  compact={boolean}
  as="button|a|div"
  external={boolean}
>
```

### NavGroup

Organizes items into sections.

```tsx
<NavGroup
  label={string}
  collapsible={boolean}
  defaultOpen={boolean}
  showDivider={boolean}
  variant="default|compact|comfortable"
  onOpenChange={(open) => void}
>
```

### useNavigationState

Manages navigation state.

```tsx
const {
  active,
  setActive,
  collapsed,
  setCollapsed,
  open,
  setOpen,
} = useNavigationState({
  defaultActive: 'home',
  defaultCollapsed: false,
  persistState: true,
  storageKey: 'my-nav',
  onActiveChange: (id) => {},
  onCollapsedChange: (collapsed) => {},
});
```

### useNavigationHover

Implements rail + drawer hover system.

```tsx
const {
  hoveredItem,
  activeItem,
  isDrawerVisible,
  isPushMode,
  effectiveItem,
  handleItemHover,
  handleItemClick,
  handleRailLeave,
  handleDrawerEnter,
  handleDrawerLeave,
} = useNavigationHover({
  items: navItems,
  activeItem: 'home',
  hoverDelay: 150,
  exitDelay: 300,
  enabled: true,
  onItemClick: (id) => {},
});
```

---

## Best Practices

### ✅ Do

- Use `NavGroup` to organize related items
- Persist navigation state with `useNavigationState({ persistState: true })`
- Use `compact` mode for icon-only collapsed sidebars
- Provide clear labels and icons for accessibility
- Use responsive patterns with `useNavigationBreakpoint`

### ❌ Don't

- Don't nest navigation more than 3 levels deep
- Don't use navigation for primary content
- Don't forget mobile breakpoints
- Don't hide critical actions in collapsed state

---

## Accessibility

All navigation components include:

- **Keyboard navigation**: Tab, Enter, Space, Arrow keys
- **ARIA attributes**: `aria-current`, `aria-expanded`, `aria-label`
- **Focus indicators**: Visible focus rings
- **Screen reader support**: Semantic HTML and labels

---

## Examples

See the patterns above for complete, production-ready examples.

Additional examples:
- [Simple Sidebar](../examples/navigation/simple-sidebar.tsx)
- [Rail + Drawer](../examples/navigation/rail-drawer.tsx)
- [Hybrid Layout](../examples/navigation/hybrid-layout.tsx)
- [Mobile Bottom Nav](../examples/navigation/mobile-bottom-nav.tsx)

---

## Migration

### From shadcn/ui Sidebar

```tsx
// shadcn/ui (old)
<SidebarProvider>
  <Sidebar>
    <SidebarHeader>...</SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>Item</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</SidebarProvider>

// Unisane (new)
const nav = useNavigationState();

<Nav vertical collapsed={nav.collapsed}>
  <NavGroup label="Menu">
    <NavItem onClick={() => nav.setActive('item')}>
      Item
    </NavItem>
  </NavGroup>
</Nav>
```

**Benefits**:
- Less boilerplate
- More flexible
- Better TypeScript support
- Easier to customize

---

## Changelog

### v0.1.0
- Initial release
- Core primitives (Nav, NavItem, NavGroup)
- Smart hooks (useNavigationState, useNavigationHover)
- Full TypeScript support
- WCAG AA accessibility
