import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Icon } from './Icon';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5;
    if (totalPages <= showMax) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 3) pages.push(1, 2, 3, 4, '...', totalPages);
        else if (currentPage >= totalPages - 2) pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        else pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <nav className={cn("flex items-center gap-1.5u", className)} aria-label="Pagination Control">
        <Button variant="tonal" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="w-10u h-10u min-w-0 p-0 rounded-xs bg-surface border border-outline-variant text-on-surface-variant disabled:opacity-20">
            <Icon symbol="chevron_left" size={20} />
        </Button>

        {getPageNumbers().map((page, idx) => (
            <React.Fragment key={idx}>
                {page === '...' ? (
                    <span className="w-8u h-10u flex items-center justify-center text-on-surface-variant font-black text-[11px]">...</span>
                ) : (
                    <button
                        onClick={() => onPageChange(page as number)}
                        className={cn(
                            "w-10u h-10u rounded-xs text-[11px] font-black transition-all tabular-nums",
                            currentPage === page 
                                ? "bg-primary text-on-primary shadow-sm" 
                                : "bg-surface border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:bg-surface-container-high"
                        )}
                        aria-current={currentPage === page ? "page" : undefined}
                    >
                        {page}
                    </button>
                )}
            </React.Fragment>
        ))}

        <Button variant="tonal" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="w-10u h-10u min-w-0 p-0 rounded-xs bg-surface border border-outline-variant text-on-surface-variant disabled:opacity-20">
             <Icon symbol="chevron_right" size={20} />
        </Button>
    </nav>
  );
};