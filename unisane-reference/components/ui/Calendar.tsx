import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { IconButton } from './IconButton';
import { Icon } from './Icon';
import { Typography } from './Typography';

export type DateRange = {
  from: Date | undefined;
  to?: Date | undefined;
};

interface CalendarProps {
  mode?: 'single' | 'range';
  selected?: Date | DateRange;
  onSelect?: (date: any) => void;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  value?: Date;
  onChange?: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  mode = 'single',
  selected,
  onSelect,
  value,
  onChange,
  className,
}) => {
  const activeSelected = selected ?? (mode === 'single' ? value : undefined);
  
  const getInitialViewDate = () => {
    if (activeSelected instanceof Date) return activeSelected;
    if (activeSelected && 'from' in activeSelected && activeSelected.from) return activeSelected.from;
    return new Date();
  };

  const [viewDate, setViewDate] = useState<Date>(getInitialViewDate());
  const [currentView, setCurrentView] = useState<'days' | 'years'>('days');
  
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const handleYearClick = (year: number) => { setViewDate(new Date(year, viewDate.getMonth(), 1)); setCurrentView('days'); };
  
  const isSameDay = (d1?: Date, d2?: Date) => {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (mode === 'single') {
       onSelect?.(clickedDate);
       onChange?.(clickedDate);
    } else if (mode === 'range') {
        const currentRange = activeSelected as DateRange || { from: undefined, to: undefined };
        let newRange: DateRange;
        if (!currentRange.from || (currentRange.from && currentRange.to)) {
            newRange = { from: clickedDate, to: undefined };
        } else {
            newRange = clickedDate < currentRange.from ? { from: clickedDate, to: currentRange.from } : { from: currentRange.from, to: clickedDate };
        }
        onSelect?.(newRange);
    }
  };
  
  const getDayState = (day: number) => {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      if (mode === 'single') return isSameDay(date, activeSelected as Date) ? 'selected' : 'default';
      if (mode === 'range') {
          const range = activeSelected as DateRange;
          if (!range?.from) return 'default';
          const isFrom = isSameDay(date, range.from);
          const isTo = isSameDay(date, range.to);
          if (isFrom && isTo) return 'range-single';
          if (isFrom) return 'range-start';
          if (isTo) return 'range-end';
          if (range.from && range.to && date > range.from && date < range.to) return 'range-middle';
      }
      return 'default';
  };

  const generateDays = () => {
    const count = daysInMonth(viewDate);
    const start = startDayOfMonth(viewDate);
    const days = [];
    for (let i = 0; i < start; i++) days.push(null);
    for (let i = 1; i <= count; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className={cn("w-full max-w-[320px] p-4u bg-surface border border-outline-variant/30 rounded-xs select-none", className)}>
       <div className="flex items-center justify-between mb-4u h-10u px-1u">
           <button onClick={() => setCurrentView(currentView === 'days' ? 'years' : 'days')} className="flex items-center gap-1u text-[11px] font-black uppercase tracking-widest text-on-surface hover:bg-surface-container-high rounded-xs px-2u py-1u transition-all">
               {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
               <Icon symbol="arrow_drop_down" className={cn("transition-transform", currentView === 'years' && "rotate-180")} />
           </button>
           {currentView === 'days' && (
               <div className="flex gap-1u">
                   <IconButton variant="standard" size="sm" onClick={handlePrevMonth}><Icon symbol="chevron_left" size={20} /></IconButton>
                   <IconButton variant="standard" size="sm" onClick={handleNextMonth}><Icon symbol="chevron_right" size={20} /></IconButton>
               </div>
           )}
       </div>
       
       {currentView === 'days' ? (
           <>
               <div className="grid grid-cols-7 mb-2u text-center">
                   {weekDays.map((d, i) => (
                       <span key={i} className="text-[10px] text-on-surface-variant font-black uppercase tracking-tight flex items-center justify-center h-10u w-10u mx-auto">{d}</span>
                   ))}
               </div>
               <div className="grid grid-cols-7 gap-y-1u justify-items-center">
                   {generateDays().map((day, idx) => {
                       if (!day) return <div key={idx} className="w-10u h-10u" />;
                       const state = getDayState(day);
                       const isSelected = state === 'selected' || state === 'range-start' || state === 'range-end' || state === 'range-single';
                       const isMiddle = state === 'range-middle';
                       const today = isSameDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), day), new Date());

                       return (
                           <button
                               key={idx}
                               onClick={() => handleDateClick(day)}
                               className={cn(
                                   "w-10u h-10u flex items-center justify-center text-[12px] font-black tabular-nums relative outline-none transition-all rounded-xs",
                                   isMiddle && "bg-primary/10 text-primary w-full rounded-none",
                                   state === 'range-start' && "bg-primary text-on-primary w-full rounded-l-xs rounded-r-none",
                                   state === 'range-end' && "bg-primary text-on-primary w-full rounded-r-xs rounded-l-none",
                                   isSelected && "bg-primary text-on-primary",
                                   !isSelected && !isMiddle && "hover:bg-surface-container-high text-on-surface",
                                   today && !isSelected && !isMiddle && "border border-primary text-primary"
                               )}
                           >
                               <span className="relative z-10">{day}</span>
                           </button>
                       )
                   })}
               </div>
           </>
       ) : (
           <div className="h-[280px] overflow-y-auto grid grid-cols-3 gap-2u p-2u no-scrollbar">
               {Array.from({ length: 110 }).map((_, i) => {
                   const year = new Date().getFullYear() - 100 + i;
                   return (
                       <button key={year} onClick={() => handleYearClick(year)} className={cn("py-2u rounded-xs text-[11px] font-black uppercase tracking-widest transition-all", year === viewDate.getFullYear() ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high")}>
                           {year}
                       </button>
                   );
               })}
           </div>
       )}
    </div>
  );
};