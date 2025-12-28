"use client";

import { useState } from "react";
import { cn } from "@unisane/ui/lib/utils";
import { IconButton, Tabs, TabsList, TabsTrigger } from "@unisane/ui";

type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

interface CliCommandProps {
  /** The package/command to run (e.g., "@unisane/cli add button") */
  command: string;
  className?: string;
}

const PACKAGE_MANAGERS: { id: PackageManager; label: string; runner: string }[] = [
  { id: "pnpm", label: "pnpm", runner: "pnpm dlx" },
  { id: "npm", label: "npm", runner: "npx" },
  { id: "yarn", label: "yarn", runner: "yarn dlx" },
  { id: "bun", label: "bun", runner: "bunx" },
];

export function CliCommand({ command, className }: CliCommandProps) {
  const [activeManager, setActiveManager] = useState<PackageManager>("pnpm");
  const [copied, setCopied] = useState(false);

  const getFullCommand = (manager: PackageManager) => {
    const pm = PACKAGE_MANAGERS.find((p) => p.id === manager);
    return `${pm?.runner} ${command}`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getFullCommand(activeManager));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("rounded-lg overflow-hidden border border-outline-variant/15", className)}>
      {/* Package Manager Tabs */}
      <Tabs value={activeManager} onValueChange={(value) => setActiveManager(value as PackageManager)}>
        <TabsList className="bg-surface-container-low">
          {PACKAGE_MANAGERS.map((pm) => (
            <TabsTrigger key={pm.id} value={pm.id} className="text-label-medium">
              {pm.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Command Display */}
      <div className="flex items-center justify-between gap-4 p-4 bg-surface-container-low font-mono">
        <code className="text-body-medium text-on-surface overflow-x-auto">
          {getFullCommand(activeManager)}
        </code>
        <IconButton
          variant="standard"
          size="sm"
          ariaLabel={copied ? "Copied!" : "Copy command"}
          onClick={handleCopy}
          className="shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">
            {copied ? "check" : "content_copy"}
          </span>
        </IconButton>
      </div>
    </div>
  );
}
