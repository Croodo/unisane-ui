import React from "react";
import { DocsShell } from "./DocsShell";

interface DocsLayoutProps {
  children: React.ReactNode;
}

export const DocsLayout: React.FC<DocsLayoutProps> = ({ children }) => {
  return <DocsShell>{children}</DocsShell>;
};
