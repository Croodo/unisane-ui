# unisane

The unified CLI for building and managing Unisane SaaS applications.

## Installation

```bash
# Global installation (recommended)
npm install -g unisane
# or
pnpm add -g unisane

# Or use with npx
npx unisane <command>
```

## Commands

### Project Setup

```bash
# Create a new project
unisane create my-app
unisane create my-app --template saaskit
```

### Add Resources

```bash
# Add UI components
unisane add ui button card dialog table
unisane add ui --all

# Add business modules
unisane add module auth
unisane add module billing
unisane add module tenants

# Add integrations
unisane add integration stripe
unisane add integration resend
```

### List Resources

```bash
unisane list modules
unisane list integrations
unisane ls modules  # alias
```

### Code Generation

```bash
unisane generate routes    # Generate API routes
unisane generate sdk       # Generate SDK clients/hooks
unisane generate types     # Generate TypeScript types
unisane gen routes         # alias
unisane g sdk              # short alias
```

### Environment

```bash
unisane env check          # Validate env vars
unisane env init           # Create .env.local
```

### Development

```bash
unisane doctor             # Run health checks
unisane doctor --fix       # Auto-fix issues
unisane upgrade            # Upgrade packages
unisane info               # Show versions
```

## Quick Start

```bash
# Create a new project
npx create-unisane my-saas

# Navigate to project
cd my-saas

# Setup environment
unisane env init

# Add features
unisane add module auth billing tenants

# Generate code
unisane gen routes
unisane gen sdk

# Start development
pnpm dev
```

## Documentation

Visit [unisane.dev/docs](https://unisane.dev/docs) for full documentation.

## License

MIT
