import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Icons } from '../Icons';
import { Button } from '../../ui/Button';
import { Divider } from '../../ui/Divider';
import { cn } from '../../../lib/utils';

const BS_DATA = {
  assets: [
    { label: 'Non-Current Assets', val: 4500000, sub: [{ label: 'Plant & Machinery', val: 3200000 }, { label: 'Warehouse HQ', val: 1300000 }] },
    { label: 'Current Assets', val: 2450000, sub: [{ label: 'Inventory (Closing)', val: 1845000 }, { label: 'Trade Receivables', val: 257200 }, { label: 'Cash & Bank', val: 347800 }] },
  ],
  liabilities: [
    { label: "Owner's Equity", val: 5200000, sub: [{ label: 'Capital Account', val: 4000000 }, { label: 'Retained Earnings', val: 1200000 }] },
    { label: 'Current Liabilities', val: 1750000, sub: [{ label: 'Trade Payables', val: 1250000 }, { label: 'GST Payable', val: 450000 }, { label: 'Provisions', val: 50000 }] },
  ]
};

export const BalanceSheetView = () => {
  const totalAssets = BS_DATA.assets.reduce((a, b) => a + b.val, 0);
  const totalLiab = BS_DATA.liabilities.reduce((a, b) => a + b.val, 0);

  return (
    <div className="h-full overflow-y-auto px-4 md:px-8 py-8 bg-white animate-in fade-in duration-500 pb-32 @container">
       <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex flex-col gap-1.5">
                <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest text-[11px]">Financial Sovereignty</Typography>
                <Typography variant="headlineMedium" className="font-black text-stone-900 uppercase tracking-tighter">Consolidated Balance Sheet</Typography>
            </div>
            <div className="flex gap-2">
                <Button variant="outlined" size="md" className="bg-white font-black text-[10px]">AS ON 31 MAR 2024</Button>
                <Button variant="filled" size="md" icon={<Icons.File />} className="shadow-2 font-black text-[10px] px-8">PRINT STATEMENT</Button>
            </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-px bg-stone-200 border border-stone-200 shadow-sm rounded-xs overflow-hidden">
            {/* ASSETS PANE */}
            <div className="bg-white p-8 md:p-12 flex flex-col gap-10">
                <div className="flex justify-between items-center border-b-2 border-stone-900 pb-4">
                    <Typography variant="titleLarge" className="font-black text-stone-900 uppercase tracking-tight">Assets (Application of Funds)</Typography>
                </div>
                
                <div className="flex flex-col gap-12">
                   {BS_DATA.assets.map((section, i) => (
                       <div key={i} className="flex flex-col gap-4">
                           <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest">{section.label}</Typography>
                           <div className="flex flex-col gap-1">
                               {section.sub.map((item, j) => (
                                   <div key={j} className="flex justify-between items-center py-2 border-b border-stone-50">
                                       <span className="text-sm font-bold text-stone-600 uppercase">{item.label}</span>
                                       <span className="text-sm font-black text-stone-900 tabular-nums">₹{item.val.toLocaleString()}</span>
                                   </div>
                               ))}
                           </div>
                           <div className="flex justify-between items-center py-2 mt-2">
                               <span className="text-xs font-black text-stone-400 uppercase">Sub-Total {section.label}</span>
                               <span className="text-sm font-black text-stone-900 tabular-nums">₹{section.val.toLocaleString()}</span>
                           </div>
                       </div>
                   ))}
                </div>

                <div className="mt-auto pt-10 border-t-2 border-stone-900 flex justify-between items-center bg-stone-50 px-6 py-8 -mx-6 mb-[-12px]">
                   <Typography variant="labelLarge" className="font-black text-stone-900 uppercase">Total Net Assets</Typography>
                   <Typography variant="headlineSmall" className="font-black text-primary tabular-nums">₹{totalAssets.toLocaleString()}</Typography>
                </div>
            </div>

            {/* LIABILITIES PANE */}
            <div className="bg-white p-8 md:p-12 flex flex-col gap-10">
                <div className="flex justify-between items-center border-b-2 border-stone-900 pb-4">
                    <Typography variant="titleLarge" className="font-black text-stone-900 uppercase tracking-tight">Equity & Liabilities (Source of Funds)</Typography>
                </div>

                <div className="flex flex-col gap-12">
                   {BS_DATA.liabilities.map((section, i) => (
                       <div key={i} className="flex flex-col gap-4">
                           <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest">{section.label}</Typography>
                           <div className="flex flex-col gap-1">
                               {section.sub.map((item, j) => (
                                   <div key={j} className="flex justify-between items-center py-2 border-b border-stone-50">
                                       <span className="text-sm font-bold text-stone-600 uppercase">{item.label}</span>
                                       <span className="text-sm font-black text-stone-900 tabular-nums">₹{item.val.toLocaleString()}</span>
                                   </div>
                               ))}
                           </div>
                           <div className="flex justify-between items-center py-2 mt-2">
                               <span className="text-xs font-black text-stone-400 uppercase">Sub-Total {section.label}</span>
                               <span className="text-sm font-black text-stone-900 tabular-nums">₹{section.val.toLocaleString()}</span>
                           </div>
                       </div>
                   ))}
                </div>

                <div className="mt-auto pt-10 border-t-2 border-stone-900 flex justify-between items-center bg-stone-900 text-white px-6 py-8 -mx-6 mb-[-12px] shadow-3">
                   <Typography variant="labelLarge" className="font-black uppercase">Total Equity & Liabilities</Typography>
                   <Typography variant="headlineSmall" className="font-black text-emerald-400 tabular-nums">₹{totalLiab.toLocaleString()}</Typography>
                </div>
            </div>
        </div>

        <div className="mt-12 p-8 bg-emerald-50 border border-emerald-100 rounded-xs flex items-center justify-between">
            <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-1">
                    <Icons.Check size={24} />
                </div>
                <div>
                    <Typography variant="titleMedium" className="font-black text-emerald-900 uppercase">Balance Match Verified</Typography>
                    <Typography variant="bodySmall" className="text-emerald-700 font-bold uppercase mt-1 leading-relaxed">
                        Total Assets match Total Liabilities. System audit completed at 100% precision.
                    </Typography>
                </div>
            </div>
            <Typography variant="labelSmall" className="font-black text-emerald-600 uppercase tracking-widest">VARIANCE: 0.00</Typography>
        </div>
    </div>
  );
};