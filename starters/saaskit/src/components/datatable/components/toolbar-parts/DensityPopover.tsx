import React from "react";
import { Rows3, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Button } from "@/src/components/ui/button";
import { ToolbarButton } from "./ToolbarButton";

type DensityOption = "compact" | "standard" | "comfortable";

interface DensityPopoverProps {
  density: DensityOption;
  setDensity: (d: DensityOption) => void;
}

const DENSITY_OPTIONS: DensityOption[] = ["compact", "standard", "comfortable"];

/**
 * Popover for selecting row density
 */
export const DensityPopover: React.FC<DensityPopoverProps> = ({
  density,
  setDensity,
}) => {
  const isActive = density !== "standard";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div>
          <ToolbarButton icon={Rows3} label="Density" active={isActive} />
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0 w-48">
        <div className="flex flex-col text-left">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Row Density</h3>
          </div>
          <div className="p-2 space-y-1">
            {DENSITY_OPTIONS.map((d) => (
              <Button
                key={d}
                variant={density === d ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDensity(d)}
                className={`w-full flex items-center gap-2 justify-start px-3 ${
                  density === d
                    ? "bg-primary/5 text-primary hover:bg-primary/10"
                    : "hover:bg-accent"
                }`}
              >
                <span className="flex-1 text-left capitalize font-normal">
                  {d}
                </span>
                {density === d && <Check size={16} />}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
