# @unisane/media

Image processing, avatars, and media transformation.

## Layer

6 - Extended

## Features

- Image transformation (resize, format conversion)
- Preset-based transformations (avatars, thumbnails)
- SVG avatar generation with initials
- Responsive image variant generation
- Sharp-based image processing

## Architecture Compliance

| Pattern | Status | Notes |
|---------|--------|-------|
| `selectRepo()` | 🔒 | N/A - no database layer |
| `getTenantId()` | 🔒 | N/A - pure utility functions |
| `tenantFilter()` | 🔒 | N/A - no database layer |
| Keys builder | ✅ | `mediaKeys` in domain/keys.ts |

## Usage

```typescript
import {
  transformImage,
  transformWithPreset,
  optimizeImage,
  generateVariants,
  getImageMetadata,
  generateAvatarSvg,
  getAvatarUrl,
  isSharpAvailable,
} from "@unisane/media";

// Check if sharp is available
const available = await isSharpAvailable();

// Get image metadata
const metadata = await getImageMetadata(buffer);
// { width: 1920, height: 1080, format: 'jpeg', sizeBytes: 123456 }

// Transform image with custom options
const result = await transformImage(buffer, {
  width: 800,
  height: 600,
  format: "webp",
  quality: 80,
  fit: "cover",
});

// Transform with preset
const avatar = await transformWithPreset(buffer, "AVATAR_MD");
const thumbnail = await transformWithPreset(buffer, "THUMBNAIL");

// Optimize image (auto-resize if too large)
const optimized = await optimizeImage(buffer, {
  maxWidth: 1920,
  quality: 85,
  format: "webp",
});

// Generate responsive variants
const variants = await generateVariants(buffer, [320, 640, 960, 1280]);
// Map<number, TransformResult>

// Generate SVG avatar
const { svg, dataUrl, width, height } = generateAvatarSvg({
  initials: "JD",
  preset: "AVATAR_MD",
});

// Get avatar URL (with file fallback)
const avatarUrl = getAvatarUrl({
  avatarFileUrl: user.avatarUrl,
  displayName: user.name,
  email: user.email,
});
```

## Presets

Uses presets from `@unisane/kernel`:
- `AVATAR_SM` - 32x32 small avatar
- `AVATAR_MD` - 64x64 medium avatar
- `AVATAR_LG` - 128x128 large avatar
- `THUMBNAIL` - 200x200 thumbnail
- `PREVIEW` - 400x400 preview
- `FULL` - 1920x1080 full size

## Exports

- `transformImage` - Transform image with custom options
- `transformWithPreset` - Transform using preset
- `optimizeImage` - Optimize with size constraints
- `generateVariants` - Generate responsive variants
- `getImageMetadata` - Extract image metadata
- `isSharpAvailable` - Check Sharp availability
- `generateAvatarSvg` - Generate SVG avatar
- `getAvatarUrl` - Get avatar URL with fallback
- `mediaKeys` - Cache key builder
- `MEDIA_EVENTS` - Event constants
