"use client";

import { Button, Dialog, IconButton } from "@unisane/ui";
import { useState } from "react";
import { HeroBackground } from "../hero-background";

// ─── INTERACTIVE EXAMPLE ─────────────────────────────────────────────────────
export const DialogInteractiveExample = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Open Dialog
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete item?"
        icon={<span className="material-symbols-outlined text-error">delete</span>}
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="filled" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </>
        }
      >
        This action cannot be undone. Are you sure you want to permanently delete this item?
      </Dialog>
    </>
  );
};

// ─── HERO VISUAL ─────────────────────────────────────────────────────────────
export const DialogHeroVisual = () => (
  <HeroBackground tone="tertiary">
    {/* Background App (dimmed) */}
    <div className="absolute inset-8 bg-surface/40 rounded-lg" />

    {/* Dialog Mock */}
    <div className="bg-surface w-80 rounded-xl shadow-xl overflow-hidden border border-outline-variant/30">
      {/* Header */}
      <div className="px-6 py-5 border-b border-outline-variant/10 bg-surface-container-low/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">delete</span>
          <span className="text-title-medium text-on-surface">Delete file?</span>
        </div>
        <IconButton variant="standard" size="sm" ariaLabel="Close dialog">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </IconButton>
      </div>
      {/* Content */}
      <div className="px-6 py-5">
        <p className="text-body-medium text-on-surface-variant">
          This will permanently delete "document.pdf" from your drive. This action cannot be undone.
        </p>
      </div>
      {/* Actions */}
      <div className="flex justify-end gap-2 p-4 border-t border-outline-variant/10 bg-surface-container-low/30">
        <Button variant="text" size="sm">Cancel</Button>
        <Button variant="filled" size="sm">Delete</Button>
      </div>
    </div>
  </HeroBackground>
);

// ─── PLACEMENT VISUALS ─────────────────────────────────────────────────────────
export const DialogPlacementBasic = () => (
  <div className="relative w-80 h-44 rounded-xl overflow-hidden mx-auto bg-surface-container-high">
    {/* Scrim overlay */}
    <div className="absolute inset-0 bg-black/30" />
    {/* Dialog */}
    <div className="absolute inset-4 rounded-xl shadow-lg p-4 flex flex-col bg-surface">
      <div className="text-title-small text-on-surface mb-2">Dialog Title</div>
      <div className="text-body-small text-on-surface-variant flex-1">
        Dialog content goes here...
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <Button variant="text" size="sm">Cancel</Button>
        <Button variant="filled" size="sm">Confirm</Button>
      </div>
    </div>
  </div>
);

export const DialogPlacementWithIcon = () => (
  <div className="relative w-80 h-48 rounded-xl overflow-hidden mx-auto bg-surface-container-high">
    {/* Scrim overlay */}
    <div className="absolute inset-0 bg-black/30" />
    {/* Dialog */}
    <div className="absolute inset-4 rounded-xl shadow-lg overflow-hidden flex flex-col bg-surface">
      <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
        <span className="material-symbols-outlined text-error">warning</span>
        <span className="text-title-small text-on-surface">Warning</span>
      </div>
      <div className="p-4 text-body-small text-on-surface-variant flex-1">
        Are you sure you want to proceed?
      </div>
      <div className="flex justify-end gap-2 p-3 border-t border-outline-variant/20">
        <Button variant="text" size="sm">Cancel</Button>
        <Button variant="filled" size="sm">Continue</Button>
      </div>
    </div>
  </div>
);

// ─── CHOOSING VISUALS ─────────────────────────────────────────────────────────
export const AlertDialogVisual = () => (
  <div className="bg-surface p-3 rounded-lg border border-outline-variant/30 text-center w-32">
    <span className="material-symbols-outlined text-error text-[24px]">warning</span>
    <div className="text-label-small mt-1">Alert</div>
  </div>
);

export const ConfirmDialogVisual = () => (
  <div className="bg-surface p-3 rounded-lg border border-outline-variant/30 text-center w-32">
    <span className="material-symbols-outlined text-primary text-[24px]">help</span>
    <div className="text-label-small mt-1">Confirm</div>
  </div>
);

export const FormDialogVisual = () => (
  <div className="bg-surface p-3 rounded-lg border border-outline-variant/30 text-center w-32">
    <span className="material-symbols-outlined text-secondary text-[24px]">edit_note</span>
    <div className="text-label-small mt-1">Form</div>
  </div>
);
