
import React, { useState, useMemo } from 'react';
import { TextField } from '../../ui/TextField';
import { Typography } from '../../ui/Typography';
import { Icons } from '../Icons';
import { Divider } from '../../ui/Divider';
import { IconButton } from '../../ui/IconButton';
import { Select } from '../../ui/Select';
import { cn } from '../../../lib/utils';

interface JVLine {
    account: string;
    type: 'Debit' | 'Credit';
    amount: string;
}

export const JournalVoucherForm = ({ onSave, onCancel }: any) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<JVLine[]>([
    { account: 'Sales Account', type: 'Credit', amount: '' },
    { account: 'HDFC Bank', type: 'Debit', amount: '' },
  ]);
  const [narration, setNarration] = useState('');

  const totalDebit = useMemo(() => lines.filter(l => l.type === 'Debit').reduce((a, b) => a + Number(b.amount || 0), 0), [lines]);
  const totalCredit = useMemo(() => lines.filter(l => l.type === 'Credit').reduce((a, b) => a + Number(b.amount || 0), 0), [lines]);
  const difference = totalDebit - totalCredit;

  const addLine = () => setLines([...lines, { account: '', type: 'Debit', amount: '' }]);
  const updateLine = (idx: number, field: keyof JVLine, val: string) => {
    const newLines = [...lines];
    newLines[idx] = { ...newLines[idx], [field]: val };
    setLines(newLines);
  };

  return (
    <div className="flex flex-col bg-white h-full @container">
      <div className="p-8 md:p-10 flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TextField label="JV DATE" type="date" value={date} onChange={e => setDate(e.target.value)} labelClassName="bg-white" />
            <TextField label="VOUCHER NO" placeholder="Auto-generated" disabled labelClassName="bg-white" />
        </div>

        <Divider className="opacity-40" />

        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-[2fr_1fr_1fr_48px] gap-4 px-2">
                <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[10px]">Ledger Account</Typography>
                <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[10px]">DR / CR</Typography>
                <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[10px] text-right">Amount</Typography>
                <div />
            </div>

            {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-[2fr_1fr_1fr_48px] gap-4 items-start animate-in slide-in-from-top-2">
                    <Select 
                        label="SELECT ACCOUNT" 
                        value={line.account} 
                        onChange={v => updateLine(i, 'account', v)}
                        options={[
                            { label: 'Sales Account', value: 'Sales Account' },
                            { label: 'HDFC Bank', value: 'HDFC Bank' },
                            { label: 'Capital Account', value: 'Capital Account' },
                            { label: 'Office Rent Expense', value: 'Office Rent Expense' },
                        ]}
                    />
                    <Select 
                        label="TYPE" 
                        value={line.type} 
                        onChange={v => updateLine(i, 'type', v as any)}
                        options={[{label: 'Debit (DR)', value: 'Debit'}, {label: 'Credit (CR)', value: 'Credit'}]}
                    />
                    <TextField 
                        type="number" 
                        label="AMOUNT" 
                        value={line.amount} 
                        onChange={e => updateLine(i, 'amount', e.target.value)}
                        labelClassName="bg-white"
                        className="font-black"
                    />
                    <IconButton onClick={() => setLines(lines.filter((_, idx) => idx !== i))} className="mt-2 text-stone-300 hover:text-error">
                        <Icons.Delete size={20} />
                    </IconButton>
                </div>
            ))}
            <IconButton onClick={addLine} className="rounded-xs bg-stone-100 hover:bg-stone-900 hover:text-white mt-2">
              <Icons.Add />
            </IconButton>
        </div>

        <Divider className="opacity-40" />

        <div className="flex justify-between items-center bg-stone-50 p-6 rounded-xs border border-stone-100">
            <div className="flex gap-10">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-stone-400 uppercase">Debit Total</span>
                    <span className="font-black text-stone-900 tabular-nums">₹{totalDebit.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-stone-400 uppercase">Credit Total</span>
                    <span className="font-black text-stone-900 tabular-nums">₹{totalCredit.toLocaleString()}</span>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-stone-400 uppercase">Balance Match</span>
                <span className={cn("font-black tabular-nums", difference === 0 ? "text-emerald-600" : "text-error")}>
                    {difference === 0 ? "BALANCED" : `₹${Math.abs(difference).toLocaleString()} MISMATCH`}
                </span>
            </div>
        </div>

        <TextField label="NARRATION / REMARKS" multiline rows={2} value={narration} onChange={e => setNarration(e.target.value)} labelClassName="bg-white" />
      </div>
    </div>
  );
};
