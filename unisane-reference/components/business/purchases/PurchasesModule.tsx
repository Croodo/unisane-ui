import React, { useState, useEffect } from 'react';
import { ListDetailLayout } from '../../ui/CanonicalLayouts';
import { ListItem } from '../../ui/List';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { Chip } from '../../ui/Chip';
import { Sheet } from '../../ui/Sheet';
import { Snackbar } from '../../ui/Snackbar';
import { PurchaseDashboard } from './PurchaseDashboard';
import { PurchaseBillForm } from './PurchaseBillForm';
import { PurchaseBillDetail } from './PurchaseBillDetail';
import { PurchaseOrderDetailView } from './PurchaseOrderDetailView';
import { DebitNoteDetailView } from './DebitNoteDetailView';
import { TransactionForm } from '../parties/TransactionForm';
import { RegistryHeader, RegistryList, RegistrySelectionWrapper } from '../shared/RegistryComponents';

// Mock Procurement Data
const MOCK_DATA = [
  { id: 'PO-2023-042', party: 'Logistics Hub', date: '19 Oct 2023', amount: 5500, status: 'Ordered', expectedDate: '30 Oct 2023', type: 'orders' },
  { id: 'GRN-2023-01', party: 'Logistics Hub', date: '26 Oct 2023', amount: 0, status: 'Received', type: 'grns' },
  { id: 'PB-2023-881', party: 'Stone Mines India', date: '22 Oct 2023', amount: 88000, status: 'Unpaid', type: 'bills' },
  { id: 'PB-2023-882', party: 'Hard Rock Quarries', date: '21 Oct 2023', amount: 14200, status: 'Paid', type: 'bills' },
  { id: 'DN-2023-001', party: 'Logistics Hub', date: '25 Oct 2023', amount: 1200, status: 'Final', type: 'returns' },
];

export const PurchasesModule = ({ subType }: { subType: string }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ open: boolean, message: string }>({ open: false, message: '' });

  useEffect(() => {
    setSelectedId(null);
  }, [subType]);

  if (subType === 'overview') {
    return (
      <div className="h-full overflow-y-auto px-4 md:px-8 py-8 bg-surface">
         <header className="mb-10 flex flex-col gap-1.5">
            <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-widest text-[11px]">Accounts Payable</Typography>
            <Typography variant="headlineMedium" className="font-black text-stone-900 uppercase tracking-tighter">Procurement Command</Typography>
         </header>
         <PurchaseDashboard />
      </div>
    );
  }

  const filtered = MOCK_DATA.filter(p => p.type === subType && (p.party.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search)));
  const selected = MOCK_DATA.find(p => p.id === selectedId);

  const getModuleTitle = () => {
    switch(subType) {
        case 'orders': return 'Purchase Orders';
        case 'returns': return 'Debit Notes';
        case 'grns': return 'Goods Receipt (GRN)';
        default: return 'Purchase Bills';
    }
  };

  const getStatusColor = (status: string) => {
    if (['Paid', 'Closed', 'Final', 'Received'].includes(status)) return "bg-emerald-100 text-emerald-700";
    if (['Unpaid', 'Ordered'].includes(status)) return "bg-amber-100 text-amber-700";
    return "bg-stone-100 text-stone-600";
  };

  return (
    <div className="h-full @container relative isolate">
      <ListDetailLayout
        showDetailMobile={!!selectedId}
        onBackClick={() => setSelectedId(null)}
        list={
          <div className="flex flex-col h-full bg-stone-50 border-r border-stone-200">
             <RegistryHeader 
               label="Procurement"
               title={getModuleTitle()}
               searchValue={search}
               onSearchChange={setSearch}
               searchPlaceholder={`Filter ${getModuleTitle()}...`}
               action={
                 <Button 
                    variant="filled" 
                    size="md" 
                    icon={<Icons.Add />}
                    onClick={() => setActiveSheet('form')} 
                    className="rounded-xs shadow-1 font-black px-4"
                  >
                    ADD {subType.toUpperCase().slice(0, -1)}
                  </Button>
               }
             />

             <RegistryList isEmpty={filtered.length === 0} emptyIcon={<Icons.Purchases size={48} strokeWidth={1} />}>
              {filtered.map(p => {
                    const isActive = selectedId === p.id;
                    return (
                      <RegistrySelectionWrapper key={p.id} isActive={isActive}>
                        <ListItem
                          headline={p.party}
                          supportingText={`${p.id} • ${p.date}`}
                          className={cn("rounded-xs h-20 transition-all border border-transparent px-4 items-center", isActive ? "bg-white border-stone-200 shadow-sm z-10" : "hover:bg-white/50")}
                          onClick={() => setSelectedId(p.id)}
                          leadingIcon={<div className={cn("w-10 h-10 rounded-xs flex items-center justify-center font-black transition-colors shrink-0", isActive ? "bg-primary text-white" : "bg-stone-200 text-stone-500")}><Icons.Purchases size={20} /></div>}
                          trailingIcon={
                            <div className="flex flex-col items-end gap-1">
                                <span className="font-black text-sm tabular-nums text-stone-900">₹{p.amount.toLocaleString()}</span>
                                <Chip label={p.status} className={cn("h-4 text-[7px] font-black uppercase border-none px-1.5 rounded-xs", getStatusColor(p.status))} />
                            </div>
                          }
                        />
                      </RegistrySelectionWrapper>
                    )
              })}
            </RegistryList>
          </div>
        }
        detail={
            subType === 'orders' ? (
                <PurchaseOrderDetailView order={selected} onEdit={() => setActiveSheet('form')} />
            ) : subType === 'returns' ? (
                <DebitNoteDetailView note={selected} onEdit={() => setActiveSheet('form')} />
            ) : (
                <PurchaseBillDetail bill={selected} onEdit={() => setActiveSheet('form')} onRecordPayment={() => setActiveSheet('payment')} />
            )
        }
      />

      <Sheet 
        open={activeSheet === 'form'} 
        onClose={() => setActiveSheet(null)} 
        title={`RECORD NEW ${subType.toUpperCase().slice(0, -1)}`}
        icon={<Icons.Purchases />}
        size="lg"
        footerLeft={
          <div className="flex flex-col">
             <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[10px]">Net Payable</Typography>
             <Typography variant="headlineSmall" className="font-black text-error leading-none">₹{selected?.amount.toLocaleString() || '0.00'}</Typography>
          </div>
        }
        footerRight={
          <>
            <Button variant="text" size="md" onClick={() => setActiveSheet(null)} className="text-stone-400 font-black">DISCARD</Button>
            <Button variant="filled" size="md" className="px-10 shadow-2 font-black" onClick={() => { setActiveSheet(null); setNotification({ open: true, message: 'Registry updated.' }); }}>SAVE BILL</Button>
          </>
        }
      >
        <PurchaseBillForm onCancel={() => setActiveSheet(null)} onSave={() => {}} />
      </Sheet>

      <Sheet 
        open={activeSheet === 'payment'} 
        onClose={() => setActiveSheet(null)} 
        title="POST OUTWARD PAYMENT"
        icon={<Icons.Money />}
        footerRight={
          <>
             <Button variant="text" size="md" onClick={() => setActiveSheet(null)} className="text-stone-400 font-black">CANCEL</Button>
             <Button variant="filled" size="md" className="px-10 shadow-2 font-black" onClick={() => { setActiveSheet(null); setNotification({ open: true, message: 'Payment adjustment posted.' }); }}>COMMIT PAYMENT</Button>
          </>
        }
      >
        <TransactionForm party={{ name: selected?.party, balance: selected?.amount }} type="suppliers" onCancel={() => setActiveSheet(null)} onSave={() => {}} />
      </Sheet>

      <Snackbar open={notification.open} message={notification.message} onClose={() => setNotification({ ...notification, open: false })} />
    </div>
  );
};