# create-unisane

Create a new Unisane SaaS application with a single command.

## Usage

```bash
# Using npx (recommended)
npx create-unisane my-app

# Using pnpm
pnpm create unisane my-app

# Using yarn
yarn create unisane my-app

# Using bun
bun create unisane my-app
```

## Options

```bash
create-unisane [project-directory] [options]

Options:
  -t, --template <name>  Template to use (saaskit, minimal, api-only)
  --use-npm              Use npm as package manager
  --use-yarn             Use yarn as package manager
  --use-pnpm             Use pnpm as package manager
  --use-bun              Use bun as package manager
  --skip-git             Skip git initialization
  --skip-install         Skip dependency installation
  -y, --yes              Use defaults and skip prompts
  -V, --version          Output version number
  -h, --help             Display help
```

## Templates

### SaaS Kit (default)

Full-featured SaaS starter with:
- Authentication (email, OAuth, magic links)
- Billing (Stripe subscriptions)
- Multi-tenancy (teams/organizations)
- Admin dashboard
- UI component library

```bash
npx create-unisane my-app --template saaskit
```

### Minimal

Lightweight starter with core infrastructure:
- Basic authentication
- Essential UI components
- Simple project structure

```bash
npx create-unisane my-app --template minimal
```

### API Only

Headless API backend without frontend:
- REST API with contracts
- Authentication
- Database integration

```bash
npx create-unisane my-app --template api-only
```

## After Creation

```bash
cd my-app
cp .env.example .env.local
# Edit .env.local with your values
pnpm dev
```

## Documentation

Visit [unisane.dev/docs](https://unisane.dev/docs) for full documentation.

## License

MIT
