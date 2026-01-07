import { AVATAR_COLORS, MEDIA_PRESETS } from "@unisane/kernel";
import type { MediaPreset } from "@unisane/kernel";

type AvatarInput = {
  initials: string;
  preset?: MediaPreset;
  backgroundColor?: string;
  textColor?: string;
};

/**
 * Generate an SVG avatar with initials.
 * Returns a data URL that can be used directly in <img src="...">
 */
export function generateAvatarSvg(input: AvatarInput): {
  svg: string;
  dataUrl: string;
  width: number;
  height: number;
} {
  const preset = input.preset ?? "AVATAR_MD";
  const { width, height } = MEDIA_PRESETS[preset];
  const initials = input.initials.toUpperCase().slice(0, 2);

  // Deterministic color based on initials
  const colorIndex = initials.charCodeAt(0) % AVATAR_COLORS.length;
  const backgroundColor = input.backgroundColor ?? AVATAR_COLORS[colorIndex];
  const textColor = input.textColor ?? "#ffffff";

  // Font size scales with avatar size
  const fontSize = Math.floor(width * 0.4);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="${textColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="500">${initials}</text>
</svg>`;

  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return { svg, dataUrl, width, height };
}

/**
 * Get avatar URL - either from storage or generate SVG.
 * For actual file uploads, use storage module and return the URL.
 * This function provides a fallback SVG avatar.
 */
export function getAvatarUrl(input: {
  avatarFileUrl?: string | null;
  displayName?: string;
  email?: string;
  preset?: MediaPreset;
}): string {
  // If avatar file exists, return it
  if (input.avatarFileUrl) {
    return input.avatarFileUrl;
  }

  // Generate initials from name or email
  let initials = "?";
  if (input.displayName) {
    const parts = input.displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      initials = `${parts[0]![0]}${parts[parts.length - 1]![0]}`;
    } else if (parts[0]) {
      initials = parts[0].slice(0, 2);
    }
  } else if (input.email) {
    initials = input.email.slice(0, 2);
  }

  const { dataUrl } = generateAvatarSvg({
    initials,
    preset: input.preset ?? "AVATAR_MD",
  });

  return dataUrl;
}
