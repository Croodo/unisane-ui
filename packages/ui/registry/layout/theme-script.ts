/**
 * Blocking script to prevent theme flicker on page load.
 *
 * This script:
 * 1. Runs synchronously before any paint
 * 2. Reads stored preferences from localStorage
 * 3. Falls back to provided defaults
 * 4. Applies DOM attributes AND injects critical inline CSS
 *
 * The inline CSS injection is KEY - it prevents flicker because
 * styles are applied before external CSS loads.
 */

export interface ThemeDefaults {
  scheme?: "tonal" | "monochrome" | "neutral";
  colorTheme?: "blue" | "purple" | "pink" | "red" | "orange" | "yellow" | "green" | "cyan" | "neutral" | "black";
  theme?: "light" | "dark" | "system";
  density?: "compact" | "standard" | "comfortable" | "dense";
  radius?: "none" | "minimal" | "sharp" | "standard" | "soft";
  contrast?: "standard" | "medium" | "high";
}

// Color hue mapping (must match globals.css)
const COLOR_THEMES: Record<string, { hue: number; chroma: number }> = {
  blue: { hue: 240, chroma: 0.13 },
  purple: { hue: 285, chroma: 0.14 },
  pink: { hue: 340, chroma: 0.15 },
  red: { hue: 25, chroma: 0.16 },
  orange: { hue: 55, chroma: 0.16 },
  yellow: { hue: 85, chroma: 0.14 },
  green: { hue: 145, chroma: 0.14 },
  cyan: { hue: 195, chroma: 0.12 },
  neutral: { hue: 60, chroma: 0.02 },
  black: { hue: 0, chroma: 0 },
};

const DEFAULT_STORAGE_KEY = "unisane-theme";

export function getThemeScript(
  defaults: ThemeDefaults = {},
  storageKey: string = DEFAULT_STORAGE_KEY
): string {
  // Serialize defaults
  const d = {
    scheme: defaults.scheme ?? "tonal",
    colorTheme: defaults.colorTheme ?? "blue",
    theme: defaults.theme ?? "system",
    density: defaults.density ?? "standard",
    radius: defaults.radius ?? "standard",
    contrast: defaults.contrast ?? "standard",
  };

  // Serialize color map for the script
  const colorMapJSON = JSON.stringify(COLOR_THEMES);

  return `
(function() {
  try {
    var stored = localStorage.getItem('${storageKey}');
    var s = stored ? JSON.parse(stored) : {};
    var root = document.documentElement;

    // Merge stored values with defaults (stored takes precedence)
    var colorTheme = s.colorTheme || '${d.colorTheme}';
    var scheme = s.scheme || '${d.scheme}';
    var contrast = s.contrast || '${d.contrast}';
    var density = s.density || '${d.density}';
    var radius = s.radius || '${d.radius}';
    var themeMode = s.theme || '${d.theme}';

    // Color map
    var colors = ${colorMapJSON};
    var color = colors[colorTheme] || colors.blue;

    // CRITICAL: Inject inline CSS to prevent flicker
    // These styles load BEFORE external CSS, preventing flash
    var style = document.createElement('style');
    style.id = 'unisane-theme-init';
    style.textContent = [
      ':root {',
      '  --hue: ' + color.hue + ';',
      '  --chroma: ' + color.chroma + ';',
      '  color-scheme: ' + (themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light') + ';',
      '}',
      // Prevent FOUC by hiding until CSS loads
      'body { opacity: 1; }'
    ].join('\\n');
    document.head.appendChild(style);

    // Apply DOM attributes
    root.setAttribute('data-theme', colorTheme);
    root.setAttribute('data-density', density);
    root.setAttribute('data-radius', radius);
    root.setAttribute('data-scheme', scheme);
    root.setAttribute('data-contrast', contrast);
    root.setAttribute('data-theme-mode', themeMode);

    // Dark mode class
    var isDark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  } catch (e) {
    console.error('Theme init error:', e);
  }
})();
`.trim();
}
