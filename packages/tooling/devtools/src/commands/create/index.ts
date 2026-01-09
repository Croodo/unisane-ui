/**
 * @module commands/create
 *
 * Create a new Unisane project from a starter template.
 * Similar to: create-next-app, create-turbo, npm create
 */

import fse from 'fs-extra';
const { copySync, ensureDirSync, existsSync, readFileSync, writeFileSync, removeSync } = fse;
import path from 'path';
import { execSync } from 'child_process';
import { log, prompt } from '@unisane/cli-core';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

export interface CreateOptions {
  /** Project name / directory */
  name?: string;
  /** Starter template to use */
  template?: 'saaskit' | 'minimal' | 'api-only';
  /** Package manager to use */
  packageManager?: 'pnpm' | 'npm' | 'yarn' | 'bun';
  /** Skip git initialization */
  skipGit?: boolean;
  /** Skip dependency installation */
  skipInstall?: boolean;
  /** Use TypeScript strict mode */
  typescript?: boolean;
  /** Include example code */
  example?: boolean;
}

export interface CreateResult {
  projectPath: string;
  template: string;
  packageManager: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Configuration
// ════════════════════════════════════════════════════════════════════════════

const TEMPLATES = {
  saaskit: {
    name: 'SaaS Kit',
    description: 'Full-featured SaaS starter with auth, billing, teams',
    features: ['Authentication', 'Billing', 'Multi-tenancy', 'Admin dashboard'],
  },
  minimal: {
    name: 'Minimal',
    description: 'Bare-bones starter with core infrastructure only',
    features: ['Authentication', 'Basic UI'],
  },
  'api-only': {
    name: 'API Only',
    description: 'Headless API backend without frontend',
    features: ['REST API', 'Authentication', 'Database'],
  },
} as const;

const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn', 'bun'] as const;

type TemplateName = keyof typeof TEMPLATES;
type PackageManager = typeof PACKAGE_MANAGERS[number];

// ════════════════════════════════════════════════════════════════════════════
// Main Command
// ════════════════════════════════════════════════════════════════════════════

export async function create(options: CreateOptions): Promise<number> {
  log.section('Create New Unisane Project');

  // Interactive prompts if options not provided
  let projectName = options.name;
  let template = options.template;
  let packageManager = options.packageManager;

  // Prompt for project name
  if (!projectName) {
    const response = await prompt.text({
      message: 'What is your project named?',
      initial: 'my-unisane-app',
      validate: (value) => {
        if (!value) return 'Project name is required';
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Project name can only contain lowercase letters, numbers, and hyphens';
        }
        return true;
      },
    });
    if (!response) {
      log.warn('Cancelled');
      return 1;
    }
    projectName = response;
  }

  // Check if directory exists
  const projectPath = path.resolve(process.cwd(), projectName);
  if (existsSync(projectPath)) {
    log.error(`Directory "${projectName}" already exists`);
    return 1;
  }

  // Prompt for template
  if (!template) {
    const response = await prompt.select({
      message: 'Which template would you like to use?',
      choices: Object.entries(TEMPLATES).map(([key, value]) => ({
        title: value.name,
        description: value.description,
        value: key,
      })),
    });
    if (!response) {
      log.warn('Cancelled');
      return 1;
    }
    template = response as TemplateName;
  }

  // Prompt for package manager
  if (!packageManager) {
    const detected = detectPackageManager();
    const response = await prompt.select({
      message: 'Which package manager do you want to use?',
      choices: PACKAGE_MANAGERS.map((pm) => ({
        title: pm,
        value: pm,
        description: pm === detected ? '(detected)' : undefined,
      })),
      initial: PACKAGE_MANAGERS.indexOf(detected),
    });
    if (!response) {
      log.warn('Cancelled');
      return 1;
    }
    packageManager = response as PackageManager;
  }

  // Show summary
  log.newline();
  log.info('Creating project with:');
  log.kv('Name', projectName);
  log.kv('Template', TEMPLATES[template!].name);
  log.kv('Package Manager', packageManager);
  log.kv('Location', projectPath);
  log.newline();

  const confirmed = await prompt.confirm({
    message: 'Proceed with these settings?',
    initial: true,
  });

  if (!confirmed) {
    log.warn('Cancelled');
    return 1;
  }

  // Create project
  const spinner = log.spinner('Creating project...');
  spinner.start();

  try {
    // Create directory
    ensureDirSync(projectPath);

    // Copy template files
    spinner.text = 'Copying template files...';
    await copyTemplate(projectPath, template!);

    // Update package.json with project name
    spinner.text = 'Configuring project...';
    await updatePackageJson(projectPath, projectName);

    // Initialize git
    if (!options.skipGit) {
      spinner.text = 'Initializing git repository...';
      initGit(projectPath);
    }

    // Install dependencies
    if (!options.skipInstall) {
      spinner.text = 'Installing dependencies...';
      installDependencies(projectPath, packageManager!);
    }

    spinner.succeed('Project created successfully!');
  } catch (error) {
    spinner.fail('Failed to create project');
    if (existsSync(projectPath)) {
      removeSync(projectPath);
    }
    throw error;
  }

  // Show next steps
  log.newline();
  log.success('Your project is ready!');
  log.newline();
  log.info('Next steps:');
  log.dim(`  cd ${projectName}`);
  if (options.skipInstall) {
    log.dim(`  ${packageManager} install`);
  }
  log.dim(`  cp .env.example .env.local`);
  log.dim(`  ${packageManager} dev`);
  log.newline();
  log.dim('Documentation: https://unisane.dev/docs');

  return 0;
}

// ════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ════════════════════════════════════════════════════════════════════════════

function detectPackageManager(): 'pnpm' | 'npm' | 'yarn' | 'bun' {
  const userAgent = process.env.npm_config_user_agent ?? '';
  if (userAgent.includes('pnpm')) return 'pnpm';
  if (userAgent.includes('yarn')) return 'yarn';
  if (userAgent.includes('bun')) return 'bun';
  return 'pnpm'; // Default to pnpm
}

async function copyTemplate(projectPath: string, template: string): Promise<void> {
  // In a real implementation, this would download from a registry or copy from templates/
  // For now, create a minimal structure
  const dirs = ['src', 'src/app', 'src/components', 'src/lib', 'public'];
  for (const dir of dirs) {
    ensureDirSync(path.join(projectPath, dir));
  }

  // Create minimal files
  const files: Record<string, string> = {
    'package.json': JSON.stringify(
      {
        name: 'unisane-app',
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint',
          'check-types': 'tsc --noEmit',
        },
        dependencies: {
          next: '^15.0.0',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
        },
        devDependencies: {
          '@types/node': '^20.0.0',
          '@types/react': '^19.0.0',
          typescript: '^5.3.0',
        },
      },
      null,
      2
    ),
    'tsconfig.json': JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          lib: ['dom', 'dom.iterable', 'esnext'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          plugins: [{ name: 'next' }],
          paths: {
            '@/*': ['./src/*'],
          },
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
        exclude: ['node_modules'],
      },
      null,
      2
    ),
    '.env.example': `# Database
DATABASE_URL=

# Authentication
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Stripe (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
`,
    '.gitignore': `# Dependencies
node_modules
.pnpm-store

# Next.js
.next
out

# Build
dist
build

# Environment
.env
.env.local
.env.*.local

# IDE
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`,
    'src/app/page.tsx': `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to Unisane</h1>
      <p className="mt-4 text-lg text-gray-600">
        Get started by editing <code className="font-mono">src/app/page.tsx</code>
      </p>
    </main>
  );
}
`,
    'src/app/layout.tsx': `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unisane App',
  description: 'Built with Unisane',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
    'next.config.js': `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
`,
    'README.md': `# Unisane App

This project was created with [Unisane](https://unisane.dev).

## Getting Started

\`\`\`bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start development server
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Learn More

- [Unisane Documentation](https://unisane.dev/docs)
- [Next.js Documentation](https://nextjs.org/docs)
`,
  };

  for (const [filename, content] of Object.entries(files)) {
    writeFileSync(path.join(projectPath, filename), content);
  }
}

async function updatePackageJson(projectPath: string, projectName: string): Promise<void> {
  const pkgPath = path.join(projectPath, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.name = projectName;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

function initGit(projectPath: string): void {
  try {
    execSync('git init', { cwd: projectPath, stdio: 'ignore' });
    execSync('git add -A', { cwd: projectPath, stdio: 'ignore' });
    execSync('git commit -m "Initial commit from Unisane CLI"', {
      cwd: projectPath,
      stdio: 'ignore',
    });
  } catch {
    // Git init failed, but that's okay
  }
}

function installDependencies(projectPath: string, packageManager: string): void {
  const commands: Record<string, string> = {
    pnpm: 'pnpm install',
    npm: 'npm install',
    yarn: 'yarn',
    bun: 'bun install',
  };
  const command = commands[packageManager];
  if (command) {
    execSync(command, { cwd: projectPath, stdio: 'inherit' });
  }
}
