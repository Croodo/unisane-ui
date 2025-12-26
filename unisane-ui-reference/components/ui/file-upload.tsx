"use client";

import React, { useRef, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Alert } from "./alert";
import { IconButton } from "./icon-button";

const fileUploadVariants = cva(
  "border-2 border-dashed rounded-lg p-8u text-center cursor-pointer transition-all duration-short relative overflow-hidden",
  {
    variants: {
      dragging: {
        true: "border-primary bg-primary/5",
        false: "border-outline-variant hover:bg-surface-container-high",
      },
      disabled: {
        true: "opacity-38 cursor-not-allowed",
        false: "hover:border-primary",
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
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                handleClick();
            }
        }}
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

        <div className="flex flex-col items-center gap-3u relative z-10 pointer-events-none">
          <div className="w-12u h-12u rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined w-8u h-8u !text-[32px]">
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
          key={`${file.name}-${index}`}
          className="flex items-center gap-3u p-3u bg-surface-container rounded-lg border border-outline-variant/50"
        >
          <div className="w-10u h-10u rounded bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0">
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