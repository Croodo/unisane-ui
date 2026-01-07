import React from "react";
import { Columns3 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Button } from "@/src/components/ui/button";
import { ToolbarButton } from "./ToolbarButton";

interface ColumnsPopoverProps<T = unknown> {
  columns: Array<{ key: string | keyof T; header?: string }>;
  hiddenColumns: Set<string>;
  toggleColumnVisibility: (key: string) => void;
  resetColumns: () => void;
}

/**
 * Popover for toggling column visibility
 */
export const ColumnsPopover = <T,>({
  columns,
  hiddenColumns,
  toggleColumnVisibility,
  resetColumns,
}: ColumnsPopoverProps<T>) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div>
          <ToolbarButton
            icon={Columns3}
            label="Columns"
            badge={hiddenColumns.size}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0 w-64">
        <div className="flex flex-col text-left">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">
              Show Columns
            </h3>
          </div>
          <div className="p-2 max-h-64 overflow-y-auto">
            {columns.map((col) => {
              const key = String(col.key);
              const isVisible = !hiddenColumns.has(key);
              const label =
                col.header || key.charAt(0).toUpperCase() + key.slice(1);
              return (
                <label
                  key={key}
                  className="flex items-center gap-3 text-sm text-foreground cursor-pointer hover:bg-accent px-3 py-2 rounded-md select-none transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => toggleColumnVisibility(key)}
                    className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4"
                  />
                  <span className="flex-1 truncate">{label}</span>
                </label>
              );
            })}
          </div>
          <div className="p-2 border-t border-border flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs w-full text-muted-foreground hover:text-foreground"
              onClick={resetColumns}
            >
              Reset to Default
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
