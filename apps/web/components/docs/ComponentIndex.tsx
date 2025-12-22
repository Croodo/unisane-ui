import Link from "next/link";
import React from "react";
import { Card, Icon, Typography } from "@unisane/ui";
import { CardContent, CardHeader, CardTitle } from "./CardBlocks";
import { componentEntries } from "./nav";

export const ComponentIndex: React.FC = () => {
  return (
    <div className="grid gap-6u medium:grid-cols-2 large:grid-cols-3">
      {componentEntries.map((item) => (
        <Link key={item.href} href={item.href} className="group">
          <Card
            variant="outlined"
            padding="md"
            interactive
            className="h-full border-outline-variant/40 group-hover:border-primary/40"
          >
            <CardHeader>
              <Typography
                variant="labelSmall"
                className="text-on-surface-variant font-black uppercase tracking-[0.3em] text-[8px]"
              >
                Component
              </Typography>
              <CardTitle className="flex items-center gap-2u">
                {item.title}
                <Icon
                  symbol="arrow_outward"
                  size="sm"
                  className="text-on-surface-variant group-hover:text-primary"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.description ?? "Use in high-density layouts."}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};
