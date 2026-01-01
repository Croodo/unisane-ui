"use client";

import { Typography, Icon } from "@unisane/ui";
import type { User } from "./types";

export function ExpandedRowContent({ row }: { row: User }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <Typography variant="labelMedium" className="text-on-surface-variant mb-2">
          Contact Information
        </Typography>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon symbol="email" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">{row.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon symbol="badge" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">ID: {row.id}</span>
          </div>
        </div>
      </div>
      <div>
        <Typography variant="labelMedium" className="text-on-surface-variant mb-2">
          Work Information
        </Typography>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon symbol="apartment" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">{row.department}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon symbol="payments" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">${row.salary.toLocaleString()}/year</span>
          </div>
        </div>
      </div>
      <div>
        <Typography variant="labelMedium" className="text-on-surface-variant mb-2">
          Activity
        </Typography>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon symbol="folder" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">{row.projects} active projects</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon symbol="calendar_today" className="w-4 h-4 text-on-surface-variant" />
            <span className="text-body-small">Joined {row.joinDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
