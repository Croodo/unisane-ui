import React, { useState } from "react";
import type { Column, FilterValue, FilterRendererProps } from "../types";

interface ColumnFilterProps<T> {
  column: Column<T>;
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  onApply: () => void;
  onClear: () => void;
  immediate?: boolean;
}

export function ColumnFilter<T>({
  column,
  value,
  onChange,
  onApply,
  onClear,
  immediate = false,
}: ColumnFilterProps<T>) {
  const [tempValue, setTempValue] = useState<FilterValue>(value);

  const handleCheckboxChange = (optionValue: string) => {
    const current = Array.isArray(tempValue) ? tempValue : [];
    const updated = current.includes(optionValue)
      ? current.filter((v) => v !== optionValue)
      : [...current, optionValue];
    setTempValue(updated);
    if (immediate) {
      onChange(updated);
    }
  };

  const handleApply = () => {
    onChange(tempValue);
    onApply();
  };

  const handleClear = () => {
    const emptyValue = column.type === "select" ? [] : "";
    setTempValue(emptyValue);
    onChange(emptyValue);
    onClear();
  };

  // Sync tempValue when external value changes
  React.useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleInputChange = (val: string) => {
    setTempValue(val);
    if (immediate) {
      onChange(val);
    }
  };

  return (
    <div className="flex flex-col text-left font-normal cursor-auto">
      {!immediate && (
        <div className="px-4 py-3 border-b border-border bg-background rounded-t-md">
          <h3 className="text-sm font-medium text-foreground">
            Filter by {column.header}
          </h3>
        </div>
      )}

      <div className={`p-3 max-h-60 overflow-y-auto ${immediate ? "p-0" : ""}`}>
        {column.filterRenderer ? (
          column.filterRenderer({
            value: tempValue,
            onChange: (val: any) => {
              setTempValue(val);
              if (immediate) onChange(val);
            },
          })
        ) : column.type === "select" && column.filterOptions ? (
          <div className="space-y-1">
            {column.filterOptions.map((option: { label: string; value: string | number; count?: number }) => (
              <label
                key={option.value}
                className="flex items-center gap-3 text-sm text-foreground cursor-pointer hover:bg-accent px-2 py-1.5 rounded-md transition-colors"
              >
                <input
                  type="checkbox"
                  checked={
                    Array.isArray(tempValue)
                      ? (tempValue as unknown[]).map(String).includes(String(option.value))
                      : false
                  }
                  onChange={() => handleCheckboxChange(String(option.value))}
                  className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4"
                />
                <span className="flex-1">{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {option.count}
                  </span>
                )}
              </label>
            ))}
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              autoFocus={!immediate}
              placeholder={`Search ${column.header}...`}
              value={typeof tempValue === "string" ? tempValue : ""}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground"
              onKeyDown={(e) => !immediate && e.key === "Enter" && handleApply()}
            />
          </div>
        )}
      </div>

      {!immediate && (
        <div className="p-2 border-t border-border flex justify-between gap-2 bg-background rounded-b-md">
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-all"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
