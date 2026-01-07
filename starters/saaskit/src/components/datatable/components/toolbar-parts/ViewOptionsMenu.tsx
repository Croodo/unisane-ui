import React from "react";
import { Settings, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { ToolbarButton } from "./ToolbarButton";

interface ViewOptionsMenuProps {
  onResetPins?: (() => void) | undefined;
  onResetWidths?: (() => void) | undefined;
  onResetAll?: (() => void) | undefined;
  hasViewCustomizations?: boolean | undefined;
}

/**
 * Dropdown menu for resetting view customizations
 */
export const ViewOptionsMenu: React.FC<ViewOptionsMenuProps> = ({
  onResetPins,
  onResetWidths,
  onResetAll,
  hasViewCustomizations = false,
}) => {
  // Don't render if no actions available
  if (!onResetPins && !onResetWidths && !onResetAll) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <ToolbarButton
            icon={Settings}
            label="View"
            active={hasViewCustomizations}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onResetPins && (
          <DropdownMenuItem onClick={onResetPins}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Pins
          </DropdownMenuItem>
        )}
        {onResetWidths && (
          <DropdownMenuItem onClick={onResetWidths}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Widths
          </DropdownMenuItem>
        )}
        {(onResetPins || onResetWidths) && onResetAll && (
          <DropdownMenuSeparator />
        )}
        {onResetAll && (
          <DropdownMenuItem
            onClick={onResetAll}
            className="text-destructive focus:text-destructive"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset All Settings
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
