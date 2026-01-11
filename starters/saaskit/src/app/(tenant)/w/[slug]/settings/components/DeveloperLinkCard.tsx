import Link from "next/link";
import { Card } from "@unisane/ui/components/card";
import { Icon } from "@unisane/ui/primitives/icon";
import { Typography } from "@unisane/ui/components/typography";

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
      <Card variant="outlined" className="transition-colors hover:bg-surface-container/50">
        <Card.Content className="flex items-center gap-4 p-4">
          <div className="flex size-10 items-center justify-center rounded-sm bg-surface-container">
            <Icon symbol={icon} size="sm" className="text-on-surface-variant" />
          </div>
          <div className="flex-1 min-w-0">
            <Typography variant="titleSmall">{title}</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant truncate">
              {description}
            </Typography>
          </div>
          <Icon symbol="chevron_right" size="sm" className="text-on-surface-variant" />
        </Card.Content>
      </Card>
    </Link>
  );
}
