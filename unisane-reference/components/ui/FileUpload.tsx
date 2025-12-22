import React, { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';
import { Typography } from './Typography';
import { IconButton } from './IconButton';
import { LinearProgress } from './Progress';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  accept?: string;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  maxFiles = 5,
  accept,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("flex flex-col gap-4u", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xs p-8u flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-standard group",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-outline-variant bg-surface-container-low hover:bg-surface-container hover:border-primary/40"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
        <div className={cn(
            "w-12u h-12u rounded-full flex items-center justify-center mb-4u transition-colors",
            isDragging ? "bg-primary text-on-primary" : "bg-surface border border-outline-variant text-on-surface-variant group-hover:text-primary group-hover:border-primary/30"
        )}>
            <Icon symbol="cloud_upload" size={24} />
        </div>
        <Typography variant="titleSmall" className="font-black text-on-surface uppercase">
            {isDragging ? "Drop Payload Here" : "Upload Documents"}
        </Typography>
        <Typography variant="bodySmall" className="text-on-surface-variant font-bold uppercase mt-1 tracking-tight">
            Drag & drop or click to browse
        </Typography>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-2u">
            {files.map((file, i) => (
                <div key={i} className="flex items-center gap-3u p-3u bg-surface border border-outline-variant rounded-xs animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="w-8u h-8u bg-surface-container-high rounded-xs flex items-center justify-center text-on-surface-variant shrink-0">
                        <Icon symbol="description" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1u">
                            <span className="text-[11px] font-black text-on-surface uppercase truncate">{file.name}</span>
                            <span className="text-[9px] font-bold text-on-surface-variant tabular-nums">{formatSize(file.size)}</span>
                        </div>
                        <LinearProgress value={100} className="h-1" />
                    </div>
                    <IconButton size="sm" onClick={() => removeFile(i)} className="text-on-surface-variant hover:text-error shrink-0">
                        <Icon symbol="close" size={16} />
                    </IconButton>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};