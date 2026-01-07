import React from "react";

interface FilterPillProps {
  label: string;
  value: string;
  onClear: () => void;
}

export const FilterPill: React.FC<FilterPillProps> = ({ label, value, onClear }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-background border border-border text-foreground shadow-sm">
    {label}: <strong className="ml-1">{value}</strong>
    <button
      onClick={onClear}
      className="ml-1.5 text-muted-foreground hover:text-foreground focus:outline-none"
      aria-label={`Remove ${label} filter`}
    >
      ✕
    </button>
  </span>
);
