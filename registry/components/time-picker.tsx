"use client";

import React, { useState } from "react";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { IconButton } from "./icon-button";
import { Icon } from "@/primitives/icon";
import { cn } from "@/lib/utils";
import { TextField } from "./text-field";

export interface TimePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (time: string) => void;
  initialTime?: string; // "HH:MM" 24h format
}

export const TimePicker: React.FC<TimePickerProps> = ({
  open,
  onClose,
  onSelect,
  initialTime = "12:00",
}) => {
  // Parsing initial time correctly
  const parts = (initialTime || "12:00").split(":");
  const hStr = parts[0] || "12";
  const mStr = parts[1] || "00";
  const initH = parseInt(hStr);
  const initM = parseInt(mStr);

  const [hours, setHours] = useState(initH % 12 || 12);
  const [minutes, setMinutes] = useState(initM);
  const [period, setPeriod] = useState<"AM" | "PM">(initH >= 12 ? "PM" : "AM");

  // View State
  const [inputType, setInputType] = useState<"dial" | "keyboard">("dial");
  const [dialMode, setDialMode] = useState<"hour" | "minute">("hour");

  const getRotation = () => {
    if (dialMode === "hour") {
      return (hours % 12) * 30; // 360 / 12 = 30 deg
    }
    return minutes * 6; // 360 / 60 = 6 deg
  };

  const handleClockClick = () => {
    if (dialMode === "hour") {
      setDialMode("minute");
    }
  };

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const handleSave = () => {
    let finalHours = hours;
    // Convert back to 24h for saving
    if (period === "PM" && hours !== 12) finalHours += 12;
    if (period === "AM" && hours === 12) finalHours = 0;

    // Basic clamping for safety
    if (finalHours < 0) finalHours = 0;
    if (finalHours > 23) finalHours = 23;
    let finalMinutes = minutes;
    if (finalMinutes < 0) finalMinutes = 0;
    if (finalMinutes > 59) finalMinutes = 59;

    onSelect?.(formatTime(finalHours, finalMinutes));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="" contentClassName="p-0 gap-0">
      <div className="flex flex-col items-center w-full pb-4">
        {/* Header Label */}
        <div className="w-full px-6 pt-6 pb-4">
          <span className="text-label-medium font-medium text-on-surface-variant">
            {inputType === "dial" ? "Select time" : "Enter time"}
          </span>
        </div>

        {/* Display / Inputs */}
        <div className="flex items-center gap-2 justify-center w-full px-6 mb-6">
          {inputType === "dial" ? (
            <>
              {/* Interactive Large Display */}
              <div
                className={cn(
                  "rounded-sm px-4 py-3 h-20 min-w-24 flex items-center justify-center text-display-large cursor-pointer transition-colors border-2",
                  dialMode === "hour"
                    ? "bg-primary-container text-on-primary-container border-transparent"
                    : "bg-surface-container-highest text-on-surface border-transparent hover:bg-surface-container-highest/80"
                )}
                onClick={() => setDialMode("hour")}
                role="button"
                aria-label={`Hours: ${hours}`}
                aria-pressed={dialMode === "hour"}
              >
                {hours.toString().padStart(2, "0")}
              </div>

              <span className="text-display-large text-on-surface mb-2" aria-hidden="true">
                :
              </span>

              <div
                className={cn(
                  "rounded-sm px-4 py-3 h-20 min-w-24 flex items-center justify-center text-display-large cursor-pointer transition-colors border-2",
                  dialMode === "minute"
                    ? "bg-primary-container text-on-primary-container border-transparent"
                    : "bg-surface-container-highest text-on-surface border-transparent hover:bg-surface-container-highest/80"
                )}
                onClick={() => setDialMode("minute")}
                role="button"
                aria-label={`Minutes: ${minutes}`}
                aria-pressed={dialMode === "minute"}
              >
                {minutes.toString().padStart(2, "0")}
              </div>
            </>
          ) : (
            <div className="flex gap-2 items-center">
              <TextField
                variant="outlined"
                className="w-24"
                label="Hour"
                type="number"
                min={1}
                max={12}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
              <span className="text-display-large">:</span>
              <TextField
                variant="outlined"
                className="w-24"
                label="Minute"
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </div>
          )}

          {/* AM/PM Column */}
          <div className="flex flex-col ml-3 border border-outline rounded-sm overflow-hidden bg-surface shrink-0 h-20" role="radiogroup" aria-label="AM/PM">
            <button
              onClick={() => setPeriod("AM")}
              role="radio"
              aria-checked={period === "AM"}
              className={cn(
                "flex-1 px-4 text-label-medium font-medium transition-colors hover:bg-surface-variant/20 border-b border-outline",
                period === "AM"
                  ? "bg-tertiary-container text-on-tertiary-container"
                  : "text-on-surface-variant"
              )}
            >
              AM
            </button>
            <button
              onClick={() => setPeriod("PM")}
              role="radio"
              aria-checked={period === "PM"}
              className={cn(
                "flex-1 px-4 text-label-medium font-medium transition-colors hover:bg-surface-variant/20",
                period === "PM"
                  ? "bg-tertiary-container text-on-tertiary-container"
                  : "text-on-surface-variant"
              )}
            >
              PM
            </button>
          </div>
        </div>

        {/* Clock Face (Only in Dial Mode) */}
        {inputType === "dial" && (
          <div className="relative flex justify-center w-full mb-4 animate-in fade-in zoom-in-95 duration-emphasized">
            <div
              className="w-[calc(var(--unit)*64)] h-[calc(var(--unit)*64)] rounded-full bg-surface-container-highest relative cursor-pointer touch-none select-none shrink-0"
              onClick={handleClockClick}
              role="listbox"
              aria-label={dialMode === "hour" ? "Select hour" : "Select minute"}
            >
              {/* Center Dot */}
              <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full z-20" />

              {/* Hand */}
              <div
                className="absolute top-1/2 left-1/2 h-[calc(var(--unit)*25)] w-0_5u bg-primary origin-bottom z-10 transition-transform duration-long ease-smooth"
                style={{
                  transform: `translate(-50%, -100%) rotate(${getRotation()}deg)`,
                }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary border-2 border-surface -mt-1" />
                {/* Hand Selection Circle */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary -mt-6 opacity-20" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1_5u h-1_5u rounded-full bg-primary -mt-[calc(var(--unit)*0.75)] border border-surface" />
              </div>

              {/* Numbers */}
              {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
                const angle = num * 30 - 90;
                const rad = angle * (Math.PI / 180);
                const x = 50 + 42 * Math.cos(rad); // %
                const y = 50 + 42 * Math.sin(rad); // %

                const isSelected = dialMode === "hour" && hours === num;

                return (
                  <div
                    key={num}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center rounded-full text-body-medium transition-colors z-0",
                      isSelected ? "text-on-primary font-medium" : "text-on-surface"
                    )}
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center w-full px-4 mt-2">
          <IconButton
            variant="standard"
            ariaLabel={
              inputType === "dial" ? "Switch to keyboard" : "Switch to clock"
            }
            onClick={() =>
              setInputType(inputType === "dial" ? "keyboard" : "dial")
            }
            icon={
              <Icon
                symbol={inputType === "dial" ? "keyboard" : "schedule"}
                size={24}
              />
            }
          />
          <div className="flex gap-2">
            <Button variant="text" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="text" onClick={handleSave}>
              OK
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
