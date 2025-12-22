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
import { InvoiceForm } from './InvoiceForm';
import { InvoiceDetail } from './InvoiceDetail';
import { SalesDashboard } from './SalesDashboard';
import { TransactionForm } from '../parties/TransactionForm';
import { Icon } from '../../ui/Icon';
import { RegistryHeader, RegistryList, RegistrySelectionWrapper } from '../shared/RegistryComponents';

const MOCK_SALES = [
  { id: 'INV-2023-101', party: 'Elite Builders Pvt Ltd', date: '26 Oct 2023', amount: 45000, status: 'Paid', type: 'invoices', source: 'SO-2023-991' },
  { id: 'INV-2023-102', party: 'Raj Construction Co', date: '25 Oct 2023', amount: 12400, status: 'Final', type: 'invoices', source: 'Direct' },
  { id: 'QTN-2023-440', party: 'Metro Slabs Hub', date: '22 Oct 2023', amount: 88000, status: 'Draft', type: 'quotes' },
  { id: 'SO-2023-991', party: 'Elite Builders Pvt Ltd', date: '20 Oct 2023', amount: 12500, status: 'Processing', type: 'orders' },
  { id: 'DC-2023-005', party: 'Elite Builders Pvt Ltd', date: '26 Oct 2023', amount: 0, status: 'In-Transit', type: 'challans' },
  { id: 'CN-2023-012', party: 'Raj Construction Co', date: '24 Oct 2023', amount: 2400, status: 'Final', type: 'returns' },
];

export const SalesModule = ({ subType }: { subType: string }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ open: boolean, message: string }>({ open: false, message: '' });

  useEffect(() => {
    setSelectedId(null);
  }, [subType]);

  if (subType === 'overview') {
    return (
      <div className="h-full overflow-y-auto px-4 md:px-8 py-8 bg-surface">
         <header className="mb-10 flex flex-col gap-1.5">
            <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest text-[11px]">Revenue Cycle</Typography>
            <Typography variant="headlineMedium" className="font-black text-stone-900 uppercase tracking-tighter">Sales Operations Hub</Typography>
         </header>
         <SalesDashboard />
      </div>
    );
  }

  const filtered = MOCK_SALES.filter(s => s.type === subType && (s.party.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search)));
  const selected = MOCK_SALES.find(s => s.id === selectedId);

  const getModuleConfig = () => {
    switch(subType) {
        case 'quotes': return { label: 'Quotations', icon: <Icon symbol="request_quote" /> };
        case 'orders': return { label: 'Sales Orders', icon: <Icon symbol="reorder" /> };
        case 'challans': return { label: 'Delivery Challans', icon: <Icon symbol="local_shipping" /> };
        case 'returns': return { label: 'Credit Notes', icon: <Icon symbol="assignment_return" /> };
        default: return { label: 'Tax Invoices', icon: <Icons.Sales /> };
    }
  };

  const config = getModuleConfig();

  return (
    <div className="h-full @container relative isolate">
      <ListDetailLayout
        showDetailMobile={!!selectedId}
        onBackClick={() => setSelectedId(null)}
        list={
          <div className="flex flex-col h-full bg-stone-50 border-r border-stone-200">
             <RegistryHeader 
               label="Commercial Docs"
               title={config.label}
               searchValue={search}
               onSearchChange={setSearch}
               searchPlaceholder={`Search ${config.label}...`}
               action={
                 <Button variant="filled" size="md" icon={<Icons.Add />} onClick={() => setActiveView('invoice')} className="rounded-xs shadow-1 font-black px-4 text-[10px]">
                   ADD {subType.toUpperCase().slice(0,-1)}
                 </Button>
               }
             />

             <RegistryList isEmpty={filtered.length === 0} emptyIcon={React.isValidElement(config.icon) ? React.cloneElement(config.icon as React.ReactElement<any>, { size: 64, strokeWidth: 1 }) : <Icons.Sales size={64} strokeWidth={1} />}>
                {filtered.map(s => {
                    const isActive = selectedId === s.id;
                    return (
                      <RegistrySelectionWrapper key={s.id} isActive={isActive}>
                        <ListItem
                          headline={s.party}
                          supportingText={`${s.id} • ${s.date}`}
                          className={cn(
                            "rounded-xs min-h-[88px] py-3 px-3 transition-all border border-transparent items-start", 
                            isActive ? "bg-white border-stone-200 shadow-sm z-10" : "hover:bg-white/50"
                          )}
                          onClick={() => setSelectedId(s.id)}
                          leadingIcon={
                            <div className={cn(
                                "w-10 h-10 rounded-xs flex items-center justify-center font-black transition-colors shrink-0 mt-0.5", 
                                isActive ? "bg-primary text-white" : "bg-stone-200 text-stone-500"
                            )}>
                                {React.isValidElement(config.icon) && React.cloneElement(config.icon as React.ReactElement<any>, { size: 20 })}
                            </div>
                          }
                          trailingIcon={
                            <div className="flex flex-col items-end gap-1.5 pt-1">
                                <span className="font-black text-[13px] tabular-nums text-stone-900">₹{s.amount.toLocaleString()}</span>
                                <Chip label={s.status} className={cn("h-4 text-[7px] font-black uppercase px-1.5 border-none rounded-xs", s.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')} />
                            </div>
                          }
                        />
                      </RegistrySelectionWrapper>
                    )
                })}
             </RegistryList>
          </div>
        }
        detail={<InvoiceDetail invoice={selected} onEdit={() => setActiveView('invoice')} onPrint={() => window.print()} onRecordPayment={() => setActiveView('payment')} />}
      />

      <Sheet 
        open={activeView === 'invoice'} 
        onClose={() => setActiveView(null)} 
        title={`GENERATE ${subType.toUpperCase().slice(0, -1)}`} 
        icon={config.icon}
        size="lg"
        footerLeft={
          <div className="flex flex-col">
             <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[10px]">Registry Valuation</Typography>
             <Typography variant="headlineSmall" className="font-black text-primary leading-none">₹{selected?.amount.toLocaleString() || '0.00'}</Typography>
          </div>
        }
        footerRight={
          <>
             <Button variant="text" size="md" onClick={() => setActiveView(null)} className="text-stone-400 font-black">ABORT</Button>
             <Button variant="filled" size="md" className="px-10 shadow-2 uppercase tracking-widest font-black" onClick={() => { setActiveView(null); setNotification({ open: true, message: 'Document finalized.' }); }}>COMMIT ENTRY</Button>
          </>
        }
      >
        <InvoiceForm onCancel={() => setActiveView(null)} onSave={() => {}} />
      </Sheet>

      <Sheet 
        open={activeView === 'payment'} 
        onClose={() => setActiveView(null)} 
        title="RECORD COLLECTION" 
        icon={<Icons.Money />}
        footerRight={
          <>
             <Button variant="text" size="md" onClick={() => setActiveView(null)} className="text-stone-400 font-black">CANCEL</Button>
             <Button variant="filled" size="md" className="px-10 shadow-2 font-black" onClick={() => { setActiveView(null); setNotification({ open: true, message: 'Payment recorded.' }); }}>CONFIRM RECEIPT</Button>
          </>
        }
      >
        <TransactionForm party={{ name: selected?.party, balance: selected?.amount }} type="customers" onCancel={() => setActiveView(null)} onSave={() => {}} />
      </Sheet>

      <Snackbar open={notification.open} message={notification.message} onClose={() => setNotification({ ...notification, open: false })} />
    </div>
  );
};