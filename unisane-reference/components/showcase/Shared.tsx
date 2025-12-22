import React from 'react';
import { Typography } from '../ui/Typography';
import { cn } from '../../lib/utils';

export const ShowcaseSection = ({ title, description, children, className }: { title: string, description?: string, children: React.ReactNode, className?: string }) => (
  <section className={cn("flex flex-col gap-8 py-12 border-b border-stone-100 last:border-0", className)}>
    <div className="flex flex-col gap-2 max-w-4xl">
      <Typography variant="headlineSmall" className="font-black text-stone-900 uppercase tracking-tighter text-2xl">
        {title}
      </Typography>
      {description && (
        <Typography variant="bodyMedium" className="text-stone-500 font-bold uppercase text-xs tracking-widest leading-relaxed max-w-2xl">
          {description}
        </Typography>
      )}
    </div>
    <div className="grid grid-cols-1 gap-12 w-full">
      {children}
    </div>
  </section>
);

export const ComponentBlock = ({ label, children, className, span = 1 }: { label: string, children: React.ReactNode, className?: string, span?: number }) => (
  <div className={cn("flex flex-col gap-6", span === 2 ? "md:col-span-2" : "")}>
    <div className="flex items-center gap-4">
        <div className="h-px bg-stone-200 w-8" />
        <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">{label}</span>
        <div className="h-px bg-stone-200 flex-1" />
    </div>
    <div className={cn("p-8 border border-stone-100 bg-stone-50/30 rounded-xs flex flex-wrap gap-6 items-center justify-center min-h-[160px] relative group hover:bg-stone-50 transition-colors", className)}>
       {children}
       <div className="absolute inset-0 border-2 border-dashed border-stone-200 rounded-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
    </div>
  </div>
);
