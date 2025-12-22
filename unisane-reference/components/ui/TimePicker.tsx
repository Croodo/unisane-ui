import React, { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Icon } from './Icon';
import { cn } from '../../lib/utils';
import { TextField } from './TextField';
import { Typography } from './Typography';

interface TimePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (time: string) => void;
  initialTime?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  open,
  onClose,
  onSelect,
  initialTime = "12:00",
}) => {
  const [initH, initM] = initialTime.split(':').map(Number);
  const [hours, setHours] = useState(initH % 12 || 12);
  const [minutes, setMinutes] = useState(initM);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initH >= 12 ? 'PM' : 'AM');
  const [inputType, setInputType] = useState<'dial' | 'keyboard'>('dial');

  const handleSave = () => {
      let h = hours;
      if (period === 'PM' && hours !== 12) h += 12;
      if (period === 'AM' && hours === 12) h = 0;
      onSelect?.(`${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      onClose();
  };

  const DisplayBox = ({ value, label, active, onClick }: any) => (
    <div 
        onClick={onClick}
        className={cn(
            "rounded-xs p-6u flex flex-col items-center justify-center transition-all cursor-pointer border-2",
            active ? "bg-primary-container border-primary shadow-sm" : "bg-surface-container-low border-outline-variant hover:bg-surface-container"
        )}
    >
        <span className={cn("text-[52px] font-black tabular-nums leading-none", active ? "text-primary" : "text-on-surface")}>
            {value.toString().padStart(2, '0')}
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mt-2u">{label}</span>
    </div>
  );

  return (
    <Dialog open={open} onClose={onClose} title="" contentClassName="p-0">
       <div className="flex flex-col bg-surface">
           <div className="p-8u bg-inverse-surface text-inverse-on-surface flex flex-col gap-1u shrink-0">
               <Typography variant="labelSmall" className="text-on-surface-variant font-black uppercase tracking-[0.3em]">RECORD CLOCK TIME</Typography>
               <Typography variant="headlineSmall" className="font-black text-primary-container uppercase mt-2u">Protocol Scheduling</Typography>
           </div>
           
           <div className="p-8u flex flex-col gap-8u items-center">
               <div className="flex items-center gap-4u">
                   <DisplayBox value={hours} label="HOURS" active={true} />
                   <span className="text-4xl font-black text-outline-variant">:</span>
                   <DisplayBox value={minutes} label="MINUTES" active={false} />
                   
                   <div className="flex flex-col border border-outline-variant rounded-xs overflow-hidden">
                       <button onClick={() => setPeriod('AM')} className={cn("px-6u py-4u text-[12px] font-black uppercase transition-all", period === 'AM' ? "bg-primary text-on-primary" : "bg-surface text-on-surface-variant hover:bg-surface-container-low border-b border-outline-variant")}>AM</button>
                       <button onClick={() => setPeriod('PM')} className={cn("px-6u py-4u text-[12px] font-black uppercase transition-all", period === 'PM' ? "bg-primary text-on-primary" : "bg-surface text-on-surface-variant hover:bg-surface-container-low")}>PM</button>
                   </div>
               </div>

               <div className="p-4u bg-emerald-50 rounded-xs border border-emerald-100 flex items-center gap-3u w-full">
                  <Icon symbol="info" className="text-emerald-600" size={18} />
                  <Typography variant="bodySmall" className="text-emerald-800 font-bold uppercase tracking-tight">Time entries are logged in Local GMT protocol.</Typography>
               </div>
           </div>

           <div className="flex justify-end gap-3u px-6u py-5u border-t border-outline-variant bg-surface-container-low">
               <Button variant="text" onClick={onClose} className="font-black text-on-surface-variant">ABORT</Button>
               <Button variant="filled" onClick={handleSave} className="font-black shadow-1 px-8u">SET TIME</Button>
           </div>
       </div>
    </Dialog>
  );
};