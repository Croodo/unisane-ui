import React, { useState, useEffect } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Icon } from './Icon';
import { cn } from '../../lib/utils';
import { Calendar, DateRange } from './Calendar';
import { Typography } from './Typography';

interface DateRangePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (range: DateRange) => void;
  initialRange?: DateRange;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  open,
  onClose,
  onSelect,
  initialRange,
}) => {
  const [selectedRange, setSelectedRange] = useState<DateRange>(
      initialRange || { from: undefined, to: undefined }
  );

  useEffect(() => {
    if(open && initialRange) {
        setSelectedRange(initialRange);
    }
  }, [open, initialRange]);

  const handleSave = () => {
    onSelect?.(selectedRange);
    onClose();
  };

  const formatDate = (date?: Date) => {
      if (!date) return 'Select date';
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[date.getMonth()]} ${date.getDate()}`;
  };

  const headerText = () => {
      if (!selectedRange.from && !selectedRange.to) return "Start - End";
      if (selectedRange.from && !selectedRange.to) return `${formatDate(selectedRange.from)} - ...`;
      return `${formatDate(selectedRange.from)} - ${formatDate(selectedRange.to)}`;
  };

  return (
    <Dialog 
        open={open} 
        onClose={onClose} 
        title=""
        contentClassName="p-0 gap-0"
    >
        <div className="flex flex-col w-full h-full">
            {/* Header */}
            <div className="px-6 pt-6 pb-3 flex flex-col gap-1 shrink-0">
                 <span className="text-sm font-medium text-on-surface-variant">Select range</span>
                 <div className="flex items-center justify-between">
                     <Typography variant="headlineLarge" className="text-on-surface truncate pr-2">
                        {headerText()}
                     </Typography>
                     <IconButton variant="standard">
                         <Icon symbol="edit" size={20} />
                     </IconButton>
                 </div>
            </div>

            {/* Calendar */}
            <div className="flex justify-center w-full px-2 pb-2">
                <Calendar 
                    mode="range"
                    selected={selectedRange}
                    onSelect={setSelectedRange}
                    className="shadow-none bg-transparent w-full border-none p-0"
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 px-4 pb-4 pt-2">
                <Button variant="text" onClick={onClose}>Cancel</Button>
                <Button variant="text" onClick={handleSave}>Save</Button>
            </div>
        </div>
    </Dialog>
  );
};