# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for version management and changelog generation.

## Adding a Changeset

When you make changes that should be released, run:

```bash
pnpm changeset
```

This will prompt you to:
1. Select which packages have changed
2. Choose the bump type (major, minor, patch)
3. Write a summary of the changes

## Version Bumping

To apply changesets and bump versions:

```bash
pnpm changeset version
```

This will:
- Consume all changesets
- Update package versions
- Update CHANGELOGs

## Publishing

To publish all changed packages:

```bash
pnpm changeset publish
```

## Linked Packages

Some packages are "linked" - they always share the same version:

- **Foundation**: `@unisane/kernel`, `@unisane/gateway`, `@unisane/contracts`
- **Auth**: `@unisane/auth`, `@unisane/identity`
- **UI**: `@unisane/ui-core`, `@unisane/ui-cli`, `@unisane/ui-tokens`
- **CLI**: `create-unisane`, `unisane`, `@unisane/cli-core`

## Ignored Packages

These packages are not versioned through changesets:
- Config packages (`eslint-config`, `typescript-config`, `tailwind-config`)
- Starters (`saaskit`)
