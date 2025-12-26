"use client";

import React, { useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Image } from "./image";
import { IconButton } from "./icon-button";

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
  lightboxEnabled?: boolean;
  columns?: 2 | 3 | 4 | 5;
  gap?: "sm" | "md" | "lg";
}

export const ImageGallery = ({
  images,
  columns,
  gap,
  onImageClick,
  className,
  lightboxEnabled = true,
}: ImageGalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleImageClick = (image: GalleryImage, index: number) => {
    if (lightboxEnabled) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
    onImageClick?.(image, index);
  };

  return (
    <>
      <div className={cn(galleryVariants({ columns, gap }), className)}>
        {images.map((image, index) => (
          <div
            key={image.id}
            className="group cursor-pointer"
            onClick={() => handleImageClick(image, index)}
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
                <div className="absolute bottom-0 left-0 right-0 p-3u bg-gradient-to-t from-scrim/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-short pointer-events-none">
                  <p className="text-body-small text-white truncate">{image.caption}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
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

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      if (e.key === "ArrowRight") setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-scrim animate-in fade-in duration-short"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6u pointer-events-none">
        
        {/* Controls Container (pointer-events-auto to interact) */}
        <div className="absolute inset-0 flex items-center justify-between px-4u w-full h-full pointer-events-none">
             {/* Previous button */}
            <div className="pointer-events-auto">
                <IconButton
                variant="filled"
                ariaLabel="Previous"
                onClick={handlePrevious}
                className="bg-surface/50 text-on-surface hover:bg-surface/80"
                >
                <span className="material-symbols-outlined">chevron_left</span>
                </IconButton>
            </div>

            {/* Next button */}
            <div className="pointer-events-auto">
                <IconButton
                variant="filled"
                ariaLabel="Next"
                onClick={handleNext}
                className="bg-surface/50 text-on-surface hover:bg-surface/80"
                >
                <span className="material-symbols-outlined">chevron_right</span>
                </IconButton>
            </div>
        </div>

        {/* Close button */}
        <div className="absolute top-4u right-4u pointer-events-auto z-20">
            <IconButton
            variant="filled"
            ariaLabel="Close"
            onClick={onClose}
            className="bg-surface/50 text-on-surface hover:bg-surface/80"
            >
            <span className="material-symbols-outlined">close</span>
            </IconButton>
        </div>

        {/* Image */}
        <div className="max-w-[90vw] max-h-[85vh] relative pointer-events-auto flex flex-col items-center">
          <img
            src={images[index].src}
            alt={images[index].alt}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-3 animate-in zoom-in-95 duration-short"
          />
          {images[index].caption && (
            <p className="text-center text-body-medium text-white mt-3u bg-black/50 px-3u py-1u rounded-full backdrop-blur-sm">
              {images[index].caption}
            </p>
          )}
        </div>

        {/* Counter */}
        <div className="absolute bottom-6u left-1/2 -translate-x-1/2 bg-inverse-surface/80 backdrop-blur-md text-inverse-on-surface px-3u py-1u rounded-full text-label-medium pointer-events-auto">
          {index + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};