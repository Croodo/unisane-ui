import React, { useState, useEffect, useRef } from 'react';
import { Typography } from '../../ui/Typography';
import { SearchBar } from '../../ui/SearchBar';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { IconButton } from '../../ui/IconButton';
import { Button } from '../../ui/Button';

interface RegistryHeaderProps {
  label: string;
  title: string;
  action?: React.ReactNode;
  subHeader?: React.ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
  variant?: 'sidebar' | 'full';
  hideSearch?: boolean;
  isScrolled?: boolean; 
}

export const RegistryHeader: React.FC<RegistryHeaderProps> = ({
  label,
  title,
  action,
  subHeader,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  className,
  variant = 'sidebar',
  hideSearch = false,
  isScrolled = false
}) => {
  const isFull = variant === 'full';
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  return (
    <header className={cn(
      "shrink-0 flex flex-col bg-white sticky top-0 z-40 transition-all duration-emphasized ease-standard",
      "border-stone-200/60",
      isScrolled 
        ? "h-16u px-4u shadow-sm border-b" 
        : "h-40u @md:h-48u px-6u py-6u border-b",
      className
    )}>
      {/* Expanded Search Surface */}
      <div className={cn(
        "absolute inset-0 z-50 bg-white px-4u flex items-center transition-all duration-standard ease-emphasized",
        (isScrolled && isSearchExpanded) ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      )}>
        <SearchBar 
            ref={searchInputRef}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={e => onSearchChange?.(e.target.value)}
            className="flex-1 bg-transparent border-none shadow-none h-full text-[16px] font-bold"
            leadingIcon={<IconButton onClick={() => setIsSearchExpanded(false)}><Icons.Search className="text-primary" size={20} /></IconButton>}
            trailingIcon={searchValue && (
                <IconButton onClick={() => onSearchChange?.('')}>
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </IconButton>
            )}
        />
        <Button 
            variant="text"
            size="sm"
            onClick={() => setIsSearchExpanded(false)}
            className="ml-2u"
        >
            DONE
        </Button>
      </div>

      {/* Primary Context Row */}
      <div className={cn(
        "flex justify-between items-center w-full transition-all duration-emphasized",
        isScrolled ? "h-full" : "items-start"
      )}>
        <div className={cn(
            "flex transition-all duration-emphasized min-w-0 flex-1",
            isScrolled ? "flex-row items-baseline gap-2u" : "flex-col"
        )}>
          <Typography 
            variant="labelSmall" 
            className={cn(
                "text-primary font-black uppercase tracking-[0.25em] text-[9px] transition-all duration-emphasized",
                isScrolled ? "opacity-40 shrink-0" : "opacity-100 mb-1.5u"
            )}
          >
            {label} {isScrolled && "/"}
          </Typography>
          
          <Typography 
            variant="headlineSmall" 
            className={cn(
                "font-black text-stone-900 uppercase tracking-tighter transition-all duration-emphasized truncate leading-none",
                isScrolled ? "text-[16px] @md:text-[18px]" : "text-[24px] @md:text-[32px]"
            )}
          >
            {title}
          </Typography>
        </div>

        <div className="flex items-center gap-1.5u shrink-0 ml-4u h-full">
            {isScrolled && !hideSearch && (
                <IconButton 
                    variant="tonal" 
                    onClick={() => setIsSearchExpanded(true)}
                    className={cn(
                        "rounded-xs bg-stone-100 transition-all h-10u w-10u active:scale-95",
                        searchValue && "bg-primary/10 text-primary border border-primary/20"
                    )}
                >
                    <Icons.Search size={18} />
                </IconButton>
            )}
            <div className="flex items-center gap-2u">
                {action}
            </div>
        </div>
      </div>
      
      {/* Sub-header Content */}
      <div className={cn(
          "mt-auto flex flex-col gap-4u transition-all duration-emphasized overflow-hidden origin-top",
          isScrolled ? "h-0 opacity-0 pointer-events-none scale-y-95 translate-y-2u" : "opacity-100 pointer-events-auto scale-y-100",
          isFull ? "md:flex-row md:items-center" : ""
      )}>
        {!hideSearch && (
          <div className={cn(isFull ? "flex-1 max-w-xl" : "w-full")}>
            <SearchBar 
              placeholder={searchPlaceholder} 
              value={searchValue} 
              onChange={e => onSearchChange?.(e.target.value)} 
              className="h-12u @md:h-14u bg-stone-50 border-stone-200/60 rounded-xs shadow-none focus-within:bg-white focus-within:border-primary/30 transition-all" 
              leadingIcon={<Icons.Search size={22} className="text-stone-400" />} 
            />
          </div>
        )}
        {subHeader && <div className="min-w-0">{subHeader}</div>}
      </div>
    </header>
  );
};
RegistryHeader.displayName = 'RegistryHeader';

export const RegistryContainer: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const threshold = 32; 
        const currentScroll = e.currentTarget.scrollTop;
        if (currentScroll > threshold && !isScrolled) setIsScrolled(true);
        if (currentScroll <= threshold && isScrolled) setIsScrolled(false);
    };

    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            const type = child.type as any;
            const componentName = type.displayName || type.name;
            if (componentName === 'RegistryHeader') {
                return React.cloneElement(child as React.ReactElement<any>, { isScrolled });
            }
            if (componentName === 'RegistryList') {
                return React.cloneElement(child as React.ReactElement<any>, { onScroll: handleScroll });
            }
        }
        return child;
    });

    return (
        <div className={cn("flex flex-col h-full w-full overflow-hidden bg-white", className)}>
            {childrenWithProps}
        </div>
    );
};

interface RegistryListProps {
  children: React.ReactNode;
  className?: string;
  emptyIcon?: React.ReactNode;
  emptyLabel?: string;
  isEmpty?: boolean;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const RegistryList: React.FC<RegistryListProps> = ({
  children,
  className,
  isEmpty,
  onScroll,
  emptyIcon = <Icons.Inventory size={48} strokeWidth={1} />,
  emptyLabel = "No matching records found"
}) => {
  return (
    <div onScroll={onScroll} className={cn("flex-1 overflow-y-auto p-2u md:p-3u pb-32u relative scroll-smooth bg-stone-50/20 no-scrollbar", className)}>
      {isEmpty ? (
        <div className="py-40u flex flex-col items-center justify-center text-stone-200 gap-8u grayscale animate-in fade-in duration-standard">
           <div className="p-10u rounded-full border-2 border-dashed border-stone-200 bg-white/50">{emptyIcon}</div>
           <Typography variant="labelSmall" className="font-black uppercase tracking-[0.4em] text-stone-300">{emptyLabel}</Typography>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5u max-w-full">{children}</div>
      )}
    </div>
  );
};
RegistryList.displayName = 'RegistryList';

export const RegistrySelectionWrapper: React.FC<{ children: React.ReactNode, isActive: boolean, className?: string }> = ({ children, isActive, className }) => {
  return (
    <div className={cn("relative group transition-all duration-standard", className)}>
      {children}
      <div className={cn(
        "absolute left-0 top-1/2 -translate-y-1/2 w-1.5u h-10u bg-primary rounded-r-full z-20 transition-all duration-emphasized ease-standard",
        isActive ? "opacity-100 scale-y-100 translate-x-0" : "opacity-0 scale-y-0 -translate-x-1u"
      )} />
    </div>
  );
};