import React, { useState, useEffect } from 'react';
import { ListDetailLayout } from '../../ui/CanonicalLayouts';
import { ListItem } from '../../ui/List';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { Avatar } from '../../ui/Avatar';
import { Sheet } from '../../ui/Sheet';
import { Snackbar } from '../../ui/Snackbar';
import { PartyForm } from './PartyForm';
import { PartiesDashboard } from './PartiesDashboard';
import { PartyDetailView } from './PartyDetailView';
import { RegistryHeader, RegistryList, RegistrySelectionWrapper, RegistryContainer } from '../shared/RegistryComponents';

// Centralized Mock Data
const MOCK_PARTIES = [
  { id: 'PRTY-001', name: 'Elite Builders Pvt Ltd', type: 'customers', balance: 45000, phone: '9876543210', email: 'accounts@elitebuilders.com', group: 'Premium', gstin: '27AAACE1234F1Z5', pan: 'AAACE1234F', contactPerson: 'Mr. Arvind Sharma', paymentTerms: 'NET 30 DAYS', creditRating: 'A+', creditLimit: 100000, address: 'Suite 405, Dynasty Business Park, Mumbai', lastTransaction: '26 Oct 2023' },
  { id: 'PRTY-002', name: 'Raj Construction Co', type: 'customers', balance: -12000, phone: '8765432109', email: 'raj.const@gmail.com', group: 'Standard', gstin: '27BBBCF5678G2Z0', pan: 'BBBCF5678G', contactPerson: 'Rajesh Gupta', paymentTerms: 'NET 15 DAYS', creditRating: 'B', creditLimit: 50000, address: 'Gala 12, Industrial Estate, Thane', lastTransaction: '24 Oct 2023' },
  { id: 'PRTY-003', name: 'Stone Mines India', type: 'suppliers', balance: 88000, phone: '7654321098', email: 'sales@stonemines.in', group: 'Preferred', gstin: '08CCCCG9012H3Z1', pan: 'CCCCG9012H', contactPerson: 'Vikram Singh', paymentTerms: 'DUE ON RECEIPT', creditRating: 'A', creditLimit: 500000, address: 'Mining Zone A, Makrana, Rajasthan', lastTransaction: '22 Oct 2023' },
];

export const PartiesModule = ({ type, onSelectItem }: { type: string, onSelectItem?: (p: any) => void }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [notification, setNotification] = useState<{ open: boolean, message: string }>({ open: false, message: '' });

  useEffect(() => {
    setSelectedId(null);
    setSearch('');
  }, [type]);

  if (type === 'overview') {
    return (
      <div className="h-full overflow-y-auto px-4 md:px-8 py-8 bg-surface">
         <header className="mb-10 flex flex-col gap-1.5">
            <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest text-[11px]">Commercial Network</Typography>
            <Typography variant="headlineMedium" className="font-black text-stone-900 uppercase tracking-tighter">Relationship Hub</Typography>
         </header>
         <PartiesDashboard />
      </div>
    );
  }

  const filtered = MOCK_PARTIES.filter(p => p.type === type && (p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search)));
  const selected = MOCK_PARTIES.find(p => p.id === selectedId);

  return (
    <div className="h-full @container relative isolate">
      <ListDetailLayout
        showDetailMobile={!!selectedId}
        onBackClick={() => setSelectedId(null)}
        list={
          <RegistryContainer className="bg-stone-50 border-r border-stone-200">
            <RegistryHeader 
              label="Entity Registry"
              title={type === 'customers' ? 'Customers' : 'Suppliers'}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by name or contact..."
              action={
                <Button variant="filled" size="md" icon={<Icons.Add />} onClick={() => { setFormMode('add'); setActiveView('party'); }} className="rounded-xs shadow-1 font-black text-[10px] px-6">
                  REGISTER PARTY
                </Button>
              }
            />

            <RegistryList isEmpty={filtered.length === 0} emptyIcon={<Icons.Parties size={48} strokeWidth={1} />}>
              {filtered.map(p => {
                const isActive = selectedId === p.id;
                const isDebit = p.balance < 0;
                return (
                  <RegistrySelectionWrapper key={p.id} isActive={isActive}>
                    <ListItem
                      headline={p.name}
                      supportingText={`${p.phone} • ${p.group}`}
                      className={cn(
                        "rounded-xs min-h-[88px] py-3 px-3 transition-all border border-transparent items-start", 
                        isActive ? "bg-white border-stone-200 shadow-sm z-10" : "hover:bg-white/50"
                      )}
                      onClick={() => { setSelectedId(p.id); if (onSelectItem) onSelectItem(p); }}
                      leadingIcon={
                        <Avatar size="md" fallback={p.name[0]} className={cn(
                            "rounded-xs font-black transition-colors shrink-0 mt-0.5", 
                            isActive ? "bg-primary text-white" : "bg-stone-200 text-stone-500"
                        )} />
                      }
                      trailingIcon={
                        <div className="flex flex-col items-end gap-1.5 pt-1">
                            <span className={cn("font-black text-[13px] tabular-nums", isDebit ? "text-emerald-600" : "text-stone-900")}>
                                ₹{Math.abs(p.balance).toLocaleString()}
                            </span>
                            <Typography variant="labelSmall" className="text-[8px] font-black uppercase text-stone-400 leading-none">
                                {isDebit ? 'ADVANCE' : 'DUE'}
                            </Typography>
                        </div>
                      }
                    />
                  </RegistrySelectionWrapper>
                )
              })}
            </RegistryList>
          </RegistryContainer>
        }
        detail={
          <PartyDetailView 
            party={selected} 
            onEdit={() => { setFormMode('edit'); setActiveView('party'); }}
            onRecordPayment={() => setActiveView('transaction')}
          />
        }
      />

      <Sheet 
        open={activeView === 'party'} 
        onClose={() => setActiveView(null)} 
        title={formMode === 'add' ? `NEW ${type.toUpperCase().slice(0,-1)}` : `UPDATE ${selected?.name}`}
        icon={<Icons.Parties />}
        size="lg"
        footerRight={
          <>
            <Button variant="text" size="md" onClick={() => setActiveView(null)} className="text-stone-400 font-black">CANCEL</Button>
            <Button variant="filled" size="md" className="font-black px-10 shadow-2 uppercase tracking-widest" onClick={() => { setActiveView(null); setNotification({ open: true, message: 'Registry updated.' }); }}>COMMIT ENTRY</Button>
          </>
        }
      >
        <PartyForm 
            type={type} 
            initialData={formMode === 'edit' ? selected : null} 
            onCancel={() => setActiveView(null)} 
            onSave={() => {}} 
        />
      </Sheet>

      <Snackbar open={notification.open} message={notification.message} onClose={() => setNotification({ ...notification, open: false })} />
    </div>
  );
};