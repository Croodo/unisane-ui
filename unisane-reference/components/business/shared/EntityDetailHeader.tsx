import React from 'react';
import { Typography } from '../../ui/Typography';
import { cn } from '../../../lib/utils';

interface EntityDetailHeaderProps {
  id?: string;
  title: string;
  subtitle?: React.ReactNode;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  avatar?: React.ReactNode;
  tabs?: React.ReactNode;
  className?: string;
}

export const EntityDetailHeader: React.FC<EntityDetailHeaderProps> = ({
  id,
  title,
  subtitle,
  status,
  actions,
  avatar,
  tabs,
  className
}) => {
  return (
    <header className={cn(
      "sticky top-0 z-30 bg-white border-b border-stone-200 shrink-0 @container/header",
      className
    )}>
      <div className="px-6u py-5u @[600px]/header:py-6u flex flex-col @[500px]/header:flex-row @[500px]/header:items-start justify-between gap-5u">
        {/* Identity Section */}
        <div className="flex items-start gap-4u md:gap-5u min-w-0 flex-1">
          {avatar && (
            <div className="w-12u h-12u @[600px]/header:w-16u @[600px]/header:h-16u rounded-xs border border-stone-100 overflow-hidden shadow-sm bg-white shrink-0 mt-1u">
              {avatar}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3u gap-y-1u mb-1.5u">
              {id && (
                <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest text-[11px] @[600px]/header:text-[12px] leading-none">
                  {id}
                </Typography>
              )}
              {id && subtitle && <div className="h-3u w-px bg-stone-200 hidden @[400px]/header:block" />}
              {subtitle && (
                <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[11px] @[600px]/header:text-[12px] leading-none">
                  {subtitle}
                </Typography>
              )}
              {status && <div className="inline-flex items-center scale-100 origin-left">{status}</div>}
            </div>

            <Typography 
              variant="headlineMedium" 
              className={cn(
                "font-black text-stone-900 uppercase tracking-tighter leading-[1.05]",
                "text-2xl @[600px]/header:text-3xl @[900px]/header:text-4xl",
                "break-words"
              )}
            >
              {title}
            </Typography>
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-2u shrink-0 flex-wrap @[500px]/header:justify-end @[500px]/header:pt-1.5u">
          {actions}
        </div>
      </div>
      
      {/* Tabs Slot */}
      {tabs && (
        <div className="px-6u border-t border-stone-50 bg-white">
          {tabs}
        </div>
      )}
    </header>
  );
};