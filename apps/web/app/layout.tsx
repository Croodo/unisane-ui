import "./globals.css";
// Material Symbols - using lighter font-400 package (456KB vs 3.7MB full package)
// This provides offline capability while keeping bundle size reasonable
import "@material-symbols/font-400/outlined.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider, Toaster } from "@unisane/ui";
import type { ThemeConfig, Theme } from "@unisane/ui";
import { DocsShell } from "@/components/layout";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Unisane UI - React Component Library",
  description:
    "Production-ready React components with sophisticated theming, accessibility, and exceptional developer experience.",
};

/**
 * Default theme configuration for the app.
 * TypeScript provides autocomplete for all values.
 */
const themeConfig = {
  density: "standard",
  radius: "standard",
  scheme: "tonal",
  contrast: "standard",
  elevation: "subtle",
  colorTheme: "blue",
  theme: "system",
} satisfies Required<ThemeConfig> & { theme: Theme };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={inter.variable}
      suppressHydrationWarning
      data-density={themeConfig.density}
      data-radius={themeConfig.radius}
      data-scheme={themeConfig.scheme}
      data-contrast={themeConfig.contrast}
      data-elevation={themeConfig.elevation}
      data-color-theme={themeConfig.colorTheme}
      data-theme-mode={themeConfig.theme}
    >
      <body suppressHydrationWarning>
        <ThemeProvider>
          <DocsShell>{children}</DocsShell>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
