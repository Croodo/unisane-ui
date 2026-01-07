import React from "react";
import type { BulkAction } from "../types";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/button";

interface BulkActionsOverlayProps {
  hasSelection: boolean;
  bulkActions: BulkAction[];
  selectedRows: Set<string>;
  onClearSelection: () => void;
}

export const BulkActionsOverlay: React.FC<BulkActionsOverlayProps> = ({
  hasSelection,
  bulkActions,
  selectedRows,
  onClearSelection,
}) => {
  if (!hasSelection || !bulkActions.length) return null;
  // Retained for compatibility; currently unused now that bulk actions live in the toolbar.
  return null;
};
