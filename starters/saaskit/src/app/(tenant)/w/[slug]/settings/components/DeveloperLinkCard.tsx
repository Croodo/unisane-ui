import Link from "next/link";
import { Card } from "@unisane/ui/components/card";
import { Icon } from "@unisane/ui/primitives/icon";

interface DeveloperLinkCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
}

export function DeveloperLinkCard({
  href,
  icon,
  title,
  description,
}: DeveloperLinkCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:bg-surface-container/50">
        <Card.Content className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container">
            <Icon symbol={icon} size="sm" className="text-on-surface-variant" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium">{title}</h4>
            <p className="text-xs text-on-surface-variant truncate">
              {description}
            </p>
          </div>
          <Icon symbol="chevron_right" size="sm" className="text-on-surface-variant" />
        </Card.Content>
      </Card>
    </Link>
  );
}
