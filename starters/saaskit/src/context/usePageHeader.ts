"use client";

import { create } from "zustand";
import React from "react";

type PageHeaderState = {
  title: React.ReactNode | null;
  subtitle?: React.ReactNode | null;
  actions?: React.ReactNode | null;
  setTitle: (v: React.ReactNode | null) => void;
  setSubtitle: (v: React.ReactNode | null) => void;
  setActions: (v: React.ReactNode | null) => void;
  reset: () => void;
};

export const usePageHeader = create<PageHeaderState>((set) => ({
  title: null,
  subtitle: null,
  actions: null,
  setTitle: (v) => set({ title: v }),
  setSubtitle: (v) => set({ subtitle: v }),
  setActions: (v) => set({ actions: v }),
  reset: () => set({ title: null, subtitle: null, actions: null }),
}));

// Helper component to declaratively set header values from a page/client component.
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title?: React.ReactNode | null;
  subtitle?: React.ReactNode | null;
  actions?: React.ReactNode | null;
}) {
  const setTitle = usePageHeader((s) => s.setTitle);
  const setSubtitle = usePageHeader((s) => s.setSubtitle);
  const setActions = usePageHeader((s) => s.setActions);
  const reset = usePageHeader((s) => s.reset);
  React.useEffect(() => {
    if (typeof title !== "undefined") setTitle(title);
    if (typeof subtitle !== "undefined") setSubtitle(subtitle);
    if (typeof actions !== "undefined") setActions(actions);
    return () => reset();
  }, [title, subtitle, actions, setTitle, setSubtitle, setActions, reset]);
  return null;
}
