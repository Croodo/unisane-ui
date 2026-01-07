import Link from "next/link";
import { Card, CardContent } from "@/src/components/ui/card";
import { ChevronRight } from "lucide-react";

interface DeveloperLinkCardProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

export function DeveloperLinkCard({
  href,
  icon: Icon,
  title,
  description,
}: DeveloperLinkCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium">{title}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {description}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
