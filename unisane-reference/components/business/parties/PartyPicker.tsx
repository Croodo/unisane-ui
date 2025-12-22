
import React, { useState, useMemo } from 'react';
import { Typography } from '../../ui/Typography';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { Avatar } from '../../ui/Avatar';
import { RegistryHeader } from '../shared/RegistryComponents';

const MOCK_PARTIES = [
  { id: 'PRTY-001', name: 'Elite Builders Pvt Ltd', phone: '9876543210', balance: 45000, rating: 'A+', gstin: '27AAACE1234F1Z5' },
  { id: 'PRTY-002', name: 'Raj Construction Co', phone: '8765432109', balance: -12000, rating: 'B', gstin: '27BBBCF5678G2Z0' },
  { id: 'PRTY-003', name: 'Metro Slabs Hub', phone: '7654321098', balance: 88000, rating: 'A', gstin: '08CCCCG9012H3Z1' },
];

interface PartyPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (party: any) => void;
  type?: 'customers' | 'suppliers';
}

export const PartyPicker: React.FC<PartyPickerProps> = ({ open, onClose, onSelect, type = 'customers' }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return MOCK_PARTIES.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.phone.includes(search) ||
      p.gstin.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <Dialog 
        open={open} 
        onClose={onClose} 
        title="Entity Protocol" 
        icon={<Icons.Parties />}
        contentClassName="p-0"
    >
      <div className="flex flex-col h-[550px] bg-stone-50">
        <RegistryHeader 
          label="Commercial Registry"
          title={type === 'customers' ? 'Select Customer' : 'Select Supplier'}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or mobile..."
          className="bg-white"
        />

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
           <div className="grid grid-cols-[1fr_100px_80px] px-4 py-2 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">
              <span>Business Entity</span>
              <span className="text-right">Balance</span>
              <span className="text-right">Rating</span>
           </div>
           {filtered.map((party) => (
                <div 
                    key={party.id} 
                    onClick={() => { onSelect(party); onClose(); }}
                    className="grid grid-cols-[1fr_100px_80px] items-center p-3 rounded-xs border border-transparent hover:border-primary/20 hover:bg-white cursor-pointer group transition-all"
                >
                    <div className="flex items-center gap-3">
                        <Avatar size="sm" fallback={party.name[0]} className="rounded-xs bg-stone-200 text-stone-600 font-black" />
                        <div className="min-w-0">
                            <Typography variant="labelSmall" className="font-black text-stone-800 uppercase tracking-tight truncate block leading-none">{party.name}</Typography>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tight mt-1 block">{party.phone}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <Typography variant="labelSmall" className={cn("font-black tabular-nums", party.balance >= 0 ? "text-stone-900" : "text-emerald-600")}>
                            ₹{Math.abs(party.balance).toLocaleString()}
                        </Typography>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xs">{party.rating}</span>
                    </div>
                </div>
           ))}
        </div>
        
        <footer className="p-4 bg-white border-t border-stone-200 flex justify-between items-center shrink-0">
            <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase text-[10px]">Entities Found: {filtered.length}</Typography>
            <Button variant="text" size="sm" className="text-primary font-black uppercase text-[10px]">Register Party</Button>
        </footer>
      </div>
    </Dialog>
  );
};
