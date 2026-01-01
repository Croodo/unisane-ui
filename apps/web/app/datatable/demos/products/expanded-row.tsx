"use client";

import { Typography, Icon } from "@unisane/ui";
import type { Product } from "./types";

export function ProductExpandedRow({ row }: { row: Product }) {
  const margin = row.price - row.cost;
  const marginPercent = ((margin / row.price) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div>
        <Typography variant="labelMedium" className="text-on-surface-variant mb-2">
          Product Details
        </Typography>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon symbol="qr_code" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small font-mono">{row.sku}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon symbol="category" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small capitalize">{row.category} / {row.subcategory}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon symbol="scale" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">{row.weight} kg</span>
          </div>
        </div>
      </div>

      <div>
        <Typography variant="labelMedium" className="text-on-surface-variant mb-2">
          Pricing
        </Typography>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon symbol="sell" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">
              Price: <span className="font-mono font-medium">${row.price.toFixed(2)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Icon symbol="payments" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">
              Cost: <span className="font-mono">${row.cost.toFixed(2)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Icon symbol="trending_up" className="w-4 h-4 text-primary" />
            <span className="text-body-small text-primary font-medium">
              Margin: ${margin.toFixed(2)} ({marginPercent}%)
            </span>
          </div>
        </div>
      </div>

      <div>
        <Typography variant="labelMedium" className="text-on-surface-variant mb-2">
          Inventory
        </Typography>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon symbol="inventory_2" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">{row.quantity} units in stock</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon symbol="visibility" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small capitalize">{row.visibility.replace(/_/g, " ")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon symbol="schedule" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">Status: {row.status.replace(/_/g, " ")}</span>
          </div>
        </div>
      </div>

      <div>
        <Typography variant="labelMedium" className="text-on-surface-variant mb-2">
          Performance
        </Typography>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon symbol="star" className="w-4 h-4 text-amber-500" />
            <span className="text-body-small">{row.rating.toFixed(1)} rating ({row.reviewCount} reviews)</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon symbol="calendar_today" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">Created: {row.createdAt}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon symbol="update" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">Updated: {row.updatedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
