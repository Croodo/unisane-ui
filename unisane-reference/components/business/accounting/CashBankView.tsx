import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Icons } from '../Icons';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import { Icon } from '../../ui/Icon';

const ACCOUNTS = [
    { name: 'Main Cash Box', type: 'Cash', balance: 42100, bank: 'Physical', status: 'Reconciled', icon: 'payments' },
    { name: 'HDFC Corporate', type: 'Bank', balance: 285400, bank: 'HDFC Bank', status: 'Synced', icon: 'account_balance' },
    { name: 'Petty Cash Site 1', type: 'Cash', balance: 5200, bank: 'Physical', status: 'Un-audited', icon: 'payments' },
    { name: 'SBI GST Account', type: 'Bank', balance: 12500, bank: 'SBI', status: 'Synced', icon: 'account_balance' },
];

export const CashBankView = () => {
  return (
    <div className="h-full overflow-y-auto px-4 md:px-8 py-8 bg-surface animate-in fade-in duration-500 @container pb-32">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex flex-col gap-1.5">
                <Typography variant="labelSmall" className="text-emerald-600 font-black uppercase tracking-widest text-[11px]">Treasury & Liquidity</Typography>
                <Typography variant="headlineMedium" className="font-black text-stone-900 uppercase tracking-tighter">Cash & Bank Accounts</Typography>
            </div>
            <div className="flex gap-2">
                <Button variant="outlined" size="md" icon={<Icon symbol="sync" size={18} />} className="font-black text-[10px] bg-white">SYNC FEEDS</Button>
                <Button variant="filled" size="md" icon={<Icons.Add />} className="shadow-2 font-black text-[10px]">ADD ACCOUNT</Button>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {ACCOUNTS.map((acc, i) => (
                <Card key={i} variant="outlined" className="bg-white border-stone-200 p-6 flex flex-col justify-between h-[220px] group hover:border-emerald-500 transition-all cursor-pointer relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-start">
                        <div className="w-12 h-12 rounded-xs bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:text-emerald-600 transition-colors">
                            <Icon symbol={acc.icon} size={28} />
                        </div>
                        <div className={cn(
                            "px-2 py-0.5 rounded-xs text-[8px] font-black uppercase border border-transparent",
                            acc.status === 'Synced' ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
                        )}>
                            {acc.status}
                        </div>
                    </div>

                    <div className="relative z-10 mt-6">
                        <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">{acc.bank}</Typography>
                        <Typography variant="titleMedium" className="font-black text-stone-900 uppercase truncate mt-1">{acc.name}</Typography>
                    </div>

                    <div className="relative z-10 mt-4 flex items-baseline gap-1">
                        <span className="text-[10px] font-black text-stone-400 uppercase">Balance:</span>
                        <Typography variant="titleLarge" className="font-black text-stone-900 tabular-nums">₹{acc.balance.toLocaleString()}</Typography>
                    </div>

                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                </Card>
            ))}
        </div>

        <div className="mt-12 flex flex-col gap-6">
            <Typography variant="labelMedium" className="text-stone-400 font-black uppercase tracking-widest px-2">Liquidity Analysis</Typography>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                 <Card variant="filled" className="bg-stone-900 text-white p-8 rounded-xs @xl:col-span-2 border-none shadow-3 flex flex-col justify-between h-[240px]">
                    <div className="flex justify-between items-start">
                        <div>
                            <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-widest">Aggregate Cash Position</Typography>
                            <Typography variant="displaySmall" className="font-black mt-2 text-primary-container tracking-tighter">₹3,45,200.00</Typography>
                        </div>
                        <Icon symbol="account_balance_wallet" className="text-primary-container opacity-20" size={64} />
                    </div>
                    <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Bank: ₹2,97,900</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Cash: ₹47,300</span>
                        </div>
                    </div>
                 </Card>

                 <Card variant="outlined" className="bg-white border-stone-200 p-8 rounded-xs flex flex-col justify-between h-[240px]">
                    <div>
                        <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest">Reserve Health</Typography>
                        <Typography variant="titleLarge" className="font-black text-stone-900 mt-2 uppercase">Stable Runway</Typography>
                        <Typography variant="bodySmall" className="text-stone-500 font-bold uppercase mt-2">Sufficient liquidity to cover 45 days of OpEx.</Typography>
                    </div>
                    <Button variant="tonal" size="md" className="w-full font-black text-[10px] h-10 bg-white border border-stone-200">GENERATE CASHFLOW STATEMENT</Button>
                 </Card>
            </div>
        </div>
    </div>
  );
};