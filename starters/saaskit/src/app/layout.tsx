import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
// Material Symbols - using lighter font-400 package
import "@material-symbols/font-400/outlined.css";
import { SessionProvider } from "@/src/context/SessionContext";
import { AppProviders } from "@/src/app/providers";
import { Toaster } from "@unisane/ui/components/toast";
import { ThemeProvider } from "@unisane/ui/layout/theme-provider";
import type { ThemeConfig, Theme } from "@unisane/ui/layout/theme-provider";
import { GlobalErrorBoundary } from "@/src/components/feedback/GlobalErrorBoundary";

export const metadata: Metadata = {
  title: "SaasKit",
  description: "Production-ready SaaS starter kit",
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
      data-density={themeConfig.density}
      data-radius={themeConfig.radius}
      data-scheme={themeConfig.scheme}
      data-contrast={themeConfig.contrast}
      data-elevation={themeConfig.elevation}
      data-color-theme={themeConfig.colorTheme}
      data-theme-mode={themeConfig.theme}
    >
      <body className="antialiased" suppressHydrationWarning>
        <GlobalErrorBoundary>
          <ThemeProvider>
            <AppProviders>
              <SessionProvider>{children}</SessionProvider>
            </AppProviders>
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
