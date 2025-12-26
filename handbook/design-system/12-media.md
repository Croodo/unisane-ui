# Media

Components for images, videos, and file handling.

## Table of Contents

1. [Image](#image)
2. [ImageGallery](#imagegallery)
3. [FileUpload](#fileupload)
4. [Carousel](#carousel)

---

## Image

Optimized image component with loading states.

### File: `components/ui/image.tsx`

```tsx
"use client";

import { useState, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const imageContainerVariants = cva("relative", {
  variants: {
    aspectRatio: {
      square: "aspect-square",
      video: "aspect-video",
      portrait: "aspect-[3/4]",
      landscape: "aspect-[4/3]",
    },
  },
});

const imageVariants = cva("w-full h-full transition-opacity duration-short", {
  variants: {
    objectFit: {
      cover: "object-cover",
      contain: "object-contain",
      fill: "object-fill",
      none: "object-none",
    },
    loading: {
      true: "opacity-0",
      false: "opacity-100",
    },
  },
  defaultVariants: {
    objectFit: "cover",
    loading: false,
  },
});

interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "loading">,
    VariantProps<typeof imageContainerVariants>,
    Omit<VariantProps<typeof imageVariants>, "loading"> {
  fallback?: React.ReactNode;
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt = "",
      fallback,
      aspectRatio,
      objectFit = "cover",
      className,
      onLoad,
      onError,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(false);
      onLoad?.(e);
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(false);
      setHasError(true);
      onError?.(e);
    };

    if (hasError && fallback) {
      return (
        <div className={cn(imageContainerVariants({ aspectRatio }), className)}>
          {fallback}
        </div>
      );
    }

    return (
      <div className={cn(imageContainerVariants({ aspectRatio }), className)}>
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-surface-container-highest animate-pulse" />
        )}

        {/* Image */}
        <img
          ref={ref}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(imageVariants({ objectFit, loading: isLoading }))}
          {...props}
        />
      </div>
    );
  }
);

Image.displayName = "Image";
```

### Usage Example

```tsx
// Basic image
<Image
  src="/photo.jpg"
  alt="Landscape photo"
  aspectRatio="video"
  className="rounded-lg"
/>

// With fallback
<Image
  src="/photo.jpg"
  alt="Profile"
  aspectRatio="square"
  fallback={
    <div className="w-full h-full bg-surface-container flex items-center justify-center">
      <span className="material-symbols-outlined text-on-surface-variant text-[48px]">
        broken_image
      </span>
    </div>
  }
/>

// Gallery thumbnail
<Image
  src="/thumbnail.jpg"
  alt="Gallery item"
  aspectRatio="square"
  objectFit="cover"
  className="rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
  onClick={() => openLightbox()}
/>
```

---

## ImageGallery

Grid layout for image collections.

### File: `components/ui/image-gallery.tsx`

```tsx
"use client";

import { useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

const galleryVariants = cva("grid", {
  variants: {
    columns: {
      2: "grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
      4: "grid-cols-2 lg:grid-cols-4",
      5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    },
    gap: {
      sm: "gap-2u",
      md: "gap-4u",
      lg: "gap-6u",
    },
  },
  defaultVariants: {
    columns: 3,
    gap: "md",
  },
});

interface ImageGalleryProps extends VariantProps<typeof galleryVariants> {
  images: GalleryImage[];
  onImageClick?: (image: GalleryImage, index: number) => void;
  className?: string;
}

export const ImageGallery = ({
  images,
  columns,
  gap,
  onImageClick,
  className,
}: ImageGalleryProps) => {
  return (
    <div className={cn(galleryVariants({ columns, gap }), className)}>
      {images.map((image, index) => (
        <div
          key={image.id}
          className="group cursor-pointer"
          onClick={() => onImageClick?.(image, index)}
        >
          <div className="relative overflow-hidden rounded-lg">
            <Image
              src={image.src}
              alt={image.alt}
              aspectRatio="square"
              className="group-hover:scale-105 transition-transform duration-emphasized"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-scrim opacity-0 group-hover:opacity-40 transition-opacity duration-short" />

            {/* Caption */}
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-3u bg-gradient-to-t from-scrim/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-short">
                <p className="text-body-small text-white">{image.caption}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Lightbox for full-size viewing
interface LightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
}

export const Lightbox = ({ images, currentIndex, onClose }: LightboxProps) => {
  const [index, setIndex] = useState(currentIndex);

  const handlePrevious = () => {
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-scrim z-modal animate-in fade-in duration-short"
        onClick={onClose}
      />

      {/* Content */}
      <div className="fixed inset-0 z-modal flex items-center justify-center p-6u">
        {/* Close button */}
        <IconButton
          variant="filled"
          ariaLabel="Close"
          onClick={onClose}
          className="absolute top-4u right-4u"
        >
          <span className="material-symbols-outlined">close</span>
        </IconButton>

        {/* Previous button */}
        <IconButton
          variant="filled"
          ariaLabel="Previous"
          onClick={handlePrevious}
          className="absolute left-4u"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </IconButton>

        {/* Image */}
        <div className="max-w-[90vw] max-h-[90vh]">
          <img
            src={images[index].src}
            alt={images[index].alt}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
          {images[index].caption && (
            <p className="text-center text-body-medium text-white mt-3u">
              {images[index].caption}
            </p>
          )}
        </div>

        {/* Next button */}
        <IconButton
          variant="filled"
          ariaLabel="Next"
          onClick={handleNext}
          className="absolute right-4u"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </IconButton>

        {/* Counter */}
        <div className="absolute bottom-4u left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-3u py-2u rounded-full text-label-medium">
          {index + 1} / {images.length}
        </div>
      </div>
    </>
  );
};
```

### Usage Example

```tsx
const [lightboxOpen, setLightboxOpen] = useState(false);
const [lightboxIndex, setLightboxIndex] = useState(0);

const images = [
  { id: "1", src: "/photo1.jpg", alt: "Photo 1", caption: "Beautiful sunset" },
  { id: "2", src: "/photo2.jpg", alt: "Photo 2", caption: "Mountain view" },
  // ...more images
];

<>
  <ImageGallery
    images={images}
    columns={3}
    gap="md"
    onImageClick={(image, index) => {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }}
  />

  {lightboxOpen && (
    <Lightbox
      images={images}
      currentIndex={lightboxIndex}
      onClose={() => setLightboxOpen(false)}
    />
  )}
</>
```

---

## FileUpload

Drag-and-drop file upload component.

### File: `components/ui/file-upload.tsx`

```tsx
"use client";

import { useRef, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const fileUploadVariants = cva(
  "border-2 border-dashed rounded-lg p-8u text-center cursor-pointer transition-all duration-short",
  {
    variants: {
      dragging: {
        true: "border-primary bg-primary/5",
        false: "border-outline-variant",
      },
      disabled: {
        true: "opacity-38 cursor-not-allowed",
        false: "hover:border-primary hover:bg-on-surface/5",
      },
    },
    defaultVariants: {
      dragging: false,
      disabled: false,
    },
  }
);

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export const FileUpload = ({
  accept,
  multiple = false,
  maxSize = 10,
  onFilesSelected,
  disabled = false,
  className,
}: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");

  const validateFiles = (files: File[]): File[] => {
    const maxSizeBytes = maxSize * 1024 * 1024;
    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > maxSizeBytes) {
        setError(`File ${file.name} exceeds ${maxSize}MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    return validFiles;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError("");
    const fileArray = Array.from(files);
    const validFiles = validateFiles(fileArray);

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(fileUploadVariants({ dragging: isDragging, disabled }))}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3u">
          <div className="w-12u h-12u rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined w-8u h-8u">
              cloud_upload
            </span>
          </div>

          <div>
            <p className="text-body-large text-on-surface font-medium mb-1u">
              Drop files here or click to browse
            </p>
            <p className="text-body-small text-on-surface-variant">
              {accept ? `Accepts: ${accept}` : "All file types accepted"}
              {maxSize && ` • Max size: ${maxSize}MB`}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mt-3u" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
    </div>
  );
};

// File list preview
interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
}

export const FileList = ({ files, onRemove }: FileListProps) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: File): string => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "videocam";
    if (file.type.startsWith("audio/")) return "audio_file";
    if (file.type.includes("pdf")) return "picture_as_pdf";
    if (file.type.includes("zip") || file.type.includes("archive")) return "folder_zip";
    return "description";
  };

  return (
    <div className="space-y-2u">
      {files.map((file, index) => (
        <div
          key={index}
          className="flex items-center gap-3u p-3u bg-surface-container rounded-lg"
        >
          <div className="w-10u h-10u rounded bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined">
              {getFileIcon(file)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-body-medium text-on-surface font-medium truncate">
              {file.name}
            </p>
            <p className="text-body-small text-on-surface-variant">
              {formatFileSize(file.size)}
            </p>
          </div>

          <IconButton
            variant="standard"
            size="sm"
            ariaLabel="Remove file"
            onClick={() => onRemove(index)}
          >
            <span className="material-symbols-outlined">close</span>
          </IconButton>
        </div>
      ))}
    </div>
  );
};
```

### Usage Example

```tsx
const [files, setFiles] = useState<File[]>([]);

<div className="space-y-4u">
  <FileUpload
    accept="image/*,.pdf"
    multiple
    maxSize={5}
    onFilesSelected={(newFiles) => setFiles([...files, ...newFiles])}
  />

  {files.length > 0 && (
    <FileList
      files={files}
      onRemove={(index) => setFiles(files.filter((_, i) => i !== index))}
    />
  )}

  <Button
    variant="filled"
    disabled={files.length === 0}
    onClick={() => handleUpload(files)}
  >
    Upload {files.length} file{files.length !== 1 ? "s" : ""}
  </Button>
</div>
```

---

## Carousel

Slideshow for images or content.

### File: `components/ui/carousel.tsx`

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const carouselVariants = cva("relative overflow-hidden rounded-lg");

const indicatorVariants = cva(
  "h-2u rounded-full transition-all duration-short",
  {
    variants: {
      active: {
        true: "bg-primary w-6u",
        false: "bg-on-surface/40 hover:bg-on-surface/60 w-2u",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

interface CarouselProps {
  children: React.ReactNode[];
  autoPlay?: boolean;
  interval?: number; // in milliseconds
  showIndicators?: boolean;
  showControls?: boolean;
  className?: string;
}

export const Carousel = ({
  children,
  autoPlay = false,
  interval = 5000,
  showIndicators = true,
  showControls = true,
  className,
}: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? children.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === children.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (!autoPlay || isPaused) return;

    timeoutRef.current = setTimeout(goToNext, interval);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, autoPlay, isPaused, interval]);

  return (
    <div
      className={cn(carouselVariants(), className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-emphasized ease-smooth"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {children.map((child, index) => (
          <div key={index} className="min-w-full">
            {child}
          </div>
        ))}
      </div>

      {/* Controls */}
      {showControls && children.length > 1 && (
        <>
          <IconButton
            variant="filled"
            ariaLabel="Previous"
            onClick={goToPrevious}
            className="absolute left-4u top-1/2 -translate-y-1/2"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </IconButton>

          <IconButton
            variant="filled"
            ariaLabel="Next"
            onClick={goToNext}
            className="absolute right-4u top-1/2 -translate-y-1/2"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </IconButton>
        </>
      )}

      {/* Indicators */}
      {showIndicators && children.length > 1 && (
        <div className="absolute bottom-4u left-1/2 -translate-x-1/2 flex gap-2u">
          {children.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(indicatorVariants({ active: index === currentIndex }))}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Usage Example

```tsx
<Carousel autoPlay interval={4000} showIndicators showControls>
  <div className="aspect-video bg-gradient-to-r from-primary to-tertiary flex items-center justify-center">
    <h2 className="text-display-medium text-on-primary">Slide 1</h2>
  </div>

  <div className="aspect-video bg-gradient-to-r from-secondary to-primary flex items-center justify-center">
    <h2 className="text-display-medium text-on-secondary">Slide 2</h2>
  </div>

  <div className="aspect-video bg-gradient-to-r from-tertiary to-secondary flex items-center justify-center">
    <h2 className="text-display-medium text-on-tertiary">Slide 3</h2>
  </div>
</Carousel>

// Image carousel
<Carousel autoPlay showIndicators>
  {images.map((img) => (
    <Image key={img.id} src={img.src} alt={img.alt} aspectRatio="video" />
  ))}
</Carousel>
```

---

## Best Practices

### Image Optimization

```tsx
// ✅ Always provide alt text
<Image src="/photo.jpg" alt="Descriptive text" />

// ✅ Use appropriate aspect ratios
<Image src="/photo.jpg" aspectRatio="video" /> // 16:9 for banners
<Image src="/photo.jpg" aspectRatio="square" /> // 1:1 for thumbnails

// ✅ Lazy loading for performance
<Image src="/photo.jpg" loading="lazy" />

// ✅ Responsive images
<Image
  src="/photo-small.jpg"
  srcSet="/photo-small.jpg 400w, /photo-medium.jpg 800w, /photo-large.jpg 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
/>
```

### File Upload UX

```tsx
// ✅ Show upload progress
const [progress, setProgress] = useState(0);

<LinearProgress value={progress} />

// ✅ Validate file types
accept="image/png,image/jpeg,.pdf"

// ✅ Provide clear feedback
<Alert variant="success">Files uploaded successfully!</Alert>
<Alert variant="error">Upload failed. Please try again.</Alert>
```

### Gallery Performance

```tsx
// ✅ Virtual scrolling for large galleries
import { useVirtualizer } from '@tanstack/react-virtual';

// ✅ Thumbnail optimization
<Image
  src={getThumbnail(image.src)} // Load smaller version
  loading="lazy"
/>

// ✅ Progressive image loading
<Image
  src={image.src}
  placeholder={<BlurHash hash={image.blurhash} />}
/>
```

### Carousel Accessibility

```tsx
// ✅ Keyboard navigation
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);

// ✅ Pause on hover
<Carousel
  autoPlay
  onMouseEnter={() => pause()}
  onMouseLeave={() => resume()}
/>

// ✅ ARIA labels
<button aria-label="Go to slide 3 of 5">
  Indicator
</button>
```
