import React, { useState, useEffect } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Icon } from './Icon';
import { cn } from '../../lib/utils';
import { Calendar } from './Calendar';
import { Typography } from './Typography';
import { TextField } from './TextField';

interface DatePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (date: Date) => void;
  initialDate?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  open,
  onClose,
  onSelect,
  initialDate,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [mode, setMode] = useState<'calendar' | 'input'>('calendar');
  const [inputStr, setInputStr] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if(open && initialDate) {
        setSelectedDate(initialDate);
        setInputStr(initialDate.toLocaleDateString('en-IN'));
    }
  }, [open, initialDate]);

  const handleSave = () => {
    if (mode === 'input') {
        const d = new Date(inputStr);
        if (isNaN(d.getTime())) { setError(true); return; }
        onSelect?.(d);
    } else {
        onSelect?.(selectedDate);
    }
    onClose();
  };

  const dayName = selectedDate.toLocaleDateString('en-IN', { weekday: 'long' }).toUpperCase();
  const formattedDate = selectedDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <Dialog open={open} onClose={onClose} title="" contentClassName="p-0">
        <div className="flex flex-col w-full bg-surface">
            <div className="px-8u py-8u bg-surface-container-high border-b border-outline-variant flex flex-col gap-1u shrink-0">
                <Typography variant="labelSmall" className="text-on-surface-variant font-black uppercase tracking-[0.3em]">
                    {mode === 'calendar' ? 'SELECT PROTOCOL DATE' : 'INPUT REGISTRY DATE'}
                </Typography>
                <div className="flex items-center justify-between mt-2u">
                    <Typography variant="displaySmall" className="font-black text-on-surface tracking-tighter leading-none">
                        {mode === 'calendar' ? `${dayName}, ${formattedDate}` : (inputStr || 'DD/MM/YYYY')}
                    </Typography>
                    <IconButton variant="tonal" className="bg-surface text-on-surface border border-outline-variant" onClick={() => setMode(mode === 'calendar' ? 'input' : 'calendar')}>
                         <Icon symbol={mode === 'calendar' ? "edit" : "calendar_today"} size={20} />
                    </IconButton>
                </div>
            </div>

            <div className="flex justify-center w-full px-4u py-6u min-h-[360px] items-center bg-surface">
                {mode === 'calendar' ? (
                    <Calendar value={selectedDate} onChange={setSelectedDate} className="border-none shadow-none p-0" />
                ) : (
                    <div className="w-full px-4u">
                        <TextField label="VOUCHER DATE" placeholder="DD/MM/YYYY" value={inputStr} onChange={(e) => { setInputStr(e.target.value); setError(false); }} error={error} labelBg="bg-surface" />
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3u px-6u py-5u border-t border-outline-variant bg-surface-container-low">
                <Button variant="text" onClick={onClose} className="font-black text-on-surface-variant">ABORT</Button>
                <Button variant="filled" onClick={handleSave} className="font-black shadow-1 px-8u">COMMIT</Button>
            </div>
        </div>
    </Dialog>
  );
};