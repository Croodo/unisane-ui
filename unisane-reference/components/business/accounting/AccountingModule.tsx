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
import { ExpenseDashboard } from './ExpenseDashboard';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseDetail } from './ExpenseDetail';
import { GeneralLedgerView } from './GeneralLedgerView';
import { CashBankView } from './CashBankView';
import { ProfitLossView } from './ProfitLossView';
import { JournalVoucherForm } from './JournalVoucherForm';
import { DayBookView } from './DayBookView';
import { RegistryHeader, RegistryList, RegistrySelectionWrapper } from '../shared/RegistryComponents';

const MOCK_EXPENSES = [
  { id: 'EXP-101', title: 'Office Rent - October', category: 'Rent', amount: 25000, date: '2023-10-01', paymentMode: 'Bank Transfer', refNo: 'TXN-9921', iGstExpense: true, gstAmount: 4500, notes: 'Monthly HQ rental' },
  { id: 'EXP-102', title: 'Site Electricity Bill', category: 'Utilities', amount: 4200, date: '2023-10-15', paymentMode: 'UPI', refNo: 'PAY-8821', iGstExpense: false, gstAmount: 0, notes: 'Terminal 2 warehouse power' },
  { id: 'EXP-103', title: 'Marketing - Print Ads', category: 'Marketing', amount: 12500, date: '2023-10-22', paymentMode: 'Bank Transfer', refNo: 'TXN-0041', iGstExpense: true, gstAmount: 2250, notes: 'Local construction expo banners' },
  { id: 'EXP-104', title: 'Petty Cash - Tea/Coffee', category: 'Misc', amount: 850, date: '2023-10-26', paymentMode: 'Cash', refNo: '', iGstExpense: false, gstAmount: 0, notes: 'Staff refreshments' },
];

export const AccountingModule = ({ type }: { type: string }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ open: boolean, message: string }>({ open: false, message: '' });

  useEffect(() => {
    setSelectedId(null);
  }, [type]);

  if (type === 'daybook') return <DayBookView />;
  if (type === 'ledger') return <GeneralLedgerView onAddJournal={() => setActiveSheet('journal')} />;
  if (type === 'cashbank') return <CashBankView />;
  if (type === 'pl') return <ProfitLossView />;

  if (type === 'expenses_overview') {
    return (
      <div className="h-full overflow-y-auto px-4 md:px-8 py-8 bg-surface">
         <header className="mb-10 flex flex-col gap-1.5">
            <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest text-[11px]">Financial Health</Typography>
            <Typography variant="headlineMedium" className="font-black text-stone-900 uppercase tracking-tighter">Accounting Command</Typography>
         </header>
         <ExpenseDashboard />
      </div>
    );
  }

  const filtered = MOCK_EXPENSES.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    e.id.includes(search)
  );
  const selected = MOCK_EXPENSES.find(e => e.id === selectedId);

  return (
    <div className="h-full @container relative isolate">
      <ListDetailLayout
        showDetailMobile={!!selectedId}
        onBackClick={() => setSelectedId(null)}
        list={
          <div className="flex flex-col h-full bg-stone-50 border-r border-stone-200">
             <RegistryHeader 
               label="Vouchers"
               title="Expense Audit"
               searchValue={search}
               onSearchChange={setSearch}
               searchPlaceholder="Search description or category..."
               action={
                 <Button variant="filled" size="md" icon={<Icons.Add />} onClick={() => setActiveSheet('expense')} className="rounded-xs shadow-1 font-black">
                   ADD EXPENSE
                 </Button>
               }
             />

             <RegistryList isEmpty={filtered.length === 0} emptyIcon={<Icons.Money size={48} strokeWidth={1} />}>
                {filtered.map(e => {
                    const isActive = selectedId === e.id;
                    return (
                      <RegistrySelectionWrapper key={e.id} isActive={isActive}>
                        <ListItem
                          headline={e.title}
                          supportingText={`${e.category} • ${e.date}`}
                          className={cn("rounded-xs min-h-[80px] transition-all border border-transparent px-4 items-start pt-4", isActive ? "bg-white border-stone-200 shadow-sm z-10" : "hover:bg-white/50")}
                          onClick={() => setSelectedId(e.id)}
                          leadingIcon={<div className={cn("w-10 h-10 rounded-xs flex items-center justify-center font-black transition-colors", isActive ? "bg-rose-600 text-white" : "bg-stone-200 text-stone-500")}><Icons.Money size={20} /></div>}
                          trailingIcon={
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-black text-sm tabular-nums text-stone-900">₹{e.amount.toLocaleString()}</span>
                              <Chip label={e.paymentMode} className="h-4 text-[7px] font-black uppercase px-1.5 border-none bg-stone-800 text-white" />
                            </div>
                          }
                        />
                      </RegistrySelectionWrapper>
                    )
                })}
             </RegistryList>
          </div>
        }
        detail={<ExpenseDetail expense={selected} onEdit={() => setActiveSheet('expense')} onPrint={() => window.print()} />}
      />

      <Sheet 
        open={activeSheet === 'expense'} 
        onClose={() => setActiveSheet(null)} 
        title="RECORD OPERATING EXPENSE"
        icon={<Icons.Money />}
        size="md"
        footerRight={
          <>
             <Button variant="text" size="md" onClick={() => setActiveSheet(null)} className="text-stone-400 font-black">CANCEL</Button>
             <Button variant="filled" size="md" className="px-10 shadow-2 font-black" onClick={() => { setActiveSheet(null); setNotification({ open: true, message: 'Expense recorded in ledger.' }); }}>POST VOUCHER</Button>
          </>
        }
      >
        <ExpenseForm onCancel={() => setActiveSheet(null)} onSave={() => {}} />
      </Sheet>

      <Sheet 
        open={activeSheet === 'journal'} 
        onClose={() => setActiveSheet(null)} 
        title="JOURNAL VOUCHER (JV)"
        icon={<Icons.Terminal />}
        size="lg"
        footerRight={
          <>
             <Button variant="text" size="md" onClick={() => setActiveSheet(null)} className="text-stone-400 font-black">CANCEL</Button>
             <Button variant="filled" size="md" className="px-10 shadow-2 font-black" onClick={() => { setActiveSheet(null); setNotification({ open: true, message: 'Adjustment entry posted.' }); }}>AUTHORIZE JV</Button>
          </>
        }
      >
        <JournalVoucherForm onCancel={() => setActiveSheet(null)} onSave={() => {}} />
      </Sheet>

      <Snackbar open={notification.open} message={notification.message} onClose={() => setNotification({ ...notification, open: false })} />
    </div>
  );
};