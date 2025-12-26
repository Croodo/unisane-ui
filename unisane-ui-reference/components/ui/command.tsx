"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from "react";

interface CommandContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

interface CommandProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Command = ({ children, open: controlledOpen, onOpenChange }: CommandProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
    if (!value) setSearch("");
  };

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <CommandContext.Provider value={{ open, setOpen, search, setSearch }}>
      {children}
    </CommandContext.Provider>
  );
};

// Command Dialog
export const CommandDialog = ({ children }: { children: React.ReactNode }) => {
  const context = useContext(CommandContext);
  if (!context) throw new Error("CommandDialog must be used within Command");

  if (!context.open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-scrim z-modal animate-in fade-in duration-short"
        onClick={() => context.setOpen(false)}
      />

      {/* Command Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-modal w-full max-w-[600px] px-4u">
        <div className="bg-surface-container rounded-lg shadow-4 animate-in fade-in zoom-in-95 duration-short">
          {children}
        </div>
      </div>
    </>
  );
};

// Command Input
export const CommandInput = ({ placeholder = "Type a command or search..." }: { placeholder?: string }) => {
  const context = useContext(CommandContext);
  if (!context) throw new Error("CommandInput must be used within Command");

  return (
    <div className="flex items-center gap-3u px-4u border-b border-outline-variant">
      <span className="material-symbols-outlined text-on-surface-variant">search</span>
      <input
        value={context.search}
        onChange={(e) => context.setSearch(e.target.value)}
        placeholder={placeholder}
        className="flex-1 h-14u bg-transparent text-body-large text-on-surface outline-none placeholder:text-on-surface-variant"
        autoFocus
      />
      <kbd className="hidden sm:inline-flex h-6u items-center gap-1u rounded bg-surface-container-high px-2u text-label-small text-on-surface-variant">
        <span className="text-xs">⌘</span>K
      </kbd>
    </div>
  );
};

// Command List
export const CommandList = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="max-h-[400px] overflow-y-auto py-2u">
      {children}
    </div>
  );
};

// Command Group
export const CommandGroup = ({ heading, children }: { heading?: string; children: React.ReactNode }) => {
  return (
    <div className="px-2u pb-2u">
      {heading && (
        <div className="px-3u py-2u text-label-small font-medium text-on-surface-variant">
          {heading}
        </div>
      )}
      {children}
    </div>
  );
};

// Command Item
interface CommandItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
  keywords?: string[];
}

export const CommandItem = ({ children, onSelect, icon, shortcut, keywords = [] }: CommandItemProps) => {
  const context = useContext(CommandContext);
  if (!context) throw new Error("CommandItem must be used within Command");

  // Filter based on search
  const searchLower = context.search.toLowerCase();
  const childText = typeof children === "string" ? children : "";
  const matches =
    childText.toLowerCase().includes(searchLower) ||
    keywords.some((k) => k.toLowerCase().includes(searchLower));

  if (context.search && !matches) return null;

  return (
    <button
      onClick={() => {
        onSelect?.();
        context.setOpen(false);
      }}
      className="w-full flex items-center justify-between gap-3u px-3u h-12u rounded-sm hover:bg-on-surface/8 transition-colors duration-short text-left"
    >
      <div className="flex items-center gap-3u">
        {icon && <span className="w-5u h-5u flex items-center justify-center text-on-surface-variant">{icon}</span>}
        <span className="text-body-medium text-on-surface">{children}</span>
      </div>
      {shortcut && (
        <kbd className="text-label-small text-on-surface-variant">{shortcut}</kbd>
      )}
    </button>
  );
};

// Command Empty
export const CommandEmpty = ({ children = "No results found." }: { children?: React.ReactNode }) => {
  const context = useContext(CommandContext);
  if (!context) throw new Error("CommandEmpty must be used within Command");

  return (
    <div className="py-6u text-center text-body-medium text-on-surface-variant">
      {children}
    </div>
  );
};