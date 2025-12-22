import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { Divider } from '../../ui/Divider';
import { BarChart } from '../../ui/Charts';
import { Button } from '../../ui/Button';

const PL_ITEMS = {
    revenue: [
        { label: 'Direct Sales Revenue', val: 842000 },
        { label: 'Service Income', val: 12500 },
        { label: 'Scrap Sales', val: 4500 },
    ],
    cogs: [
        { label: 'Raw Material Consumption', val: 312000 },
        { label: 'Direct Labor (Factory)', val: 85000 },
        { label: 'Factory Power & Fuel', val: 14200 },
    ],
    expenses: [
        { label: 'Administrative Salaries', val: 45000 },
        { label: 'Rent & Office OpEx', val: 25000 },
        { label: 'Marketing & Sales', val: 12500 },
        { label: 'Finance Charges', val: 1200 },
    ]
};

export const ProfitLossView = () => {
  const totalRevenue = PL_ITEMS.revenue.reduce((a, b) => a + b.val, 0);
  const totalCogs = PL_ITEMS.cogs.reduce((a, b) => a + b.val, 0);
  const grossProfit = totalRevenue - totalCogs;
  const totalOpEx = PL_ITEMS.expenses.reduce((a, b) => a + b.val, 0);
  const netProfit = grossProfit - totalOpEx;

  return (
    <div className="h-full overflow-y-auto px-4 md:px-8 py-8 bg-stone-50 animate-in fade-in duration-500 @container pb-32">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex flex-col gap-1.5">
                <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest text-[11px]">Performance Analytics</Typography>
                <Typography variant="headlineMedium" className="font-black text-stone-900 uppercase tracking-tighter">Profit & Loss Statement</Typography>
            </div>
            <div className="flex gap-2">
                <Button variant="outlined" size="md" className="bg-white font-black text-[10px]">FISCAL YEAR 23-24</Button>
                <Button variant="filled" size="md" icon={<Icons.File />} className="bg-stone-900 text-white shadow-2 font-black text-[10px] px-8">DOWNLOAD FULL P&L</Button>
            </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            {/* Detailed Statement */}
            <Card variant="elevated" className="bg-white shadow-2 border-stone-100 rounded-none p-8 md:p-12 flex flex-col gap-10">
                <section className="flex flex-col gap-4">
                    <Typography variant="titleSmall" className="font-black uppercase tracking-widest text-stone-400">Revenue (A)</Typography>
                    <div className="flex flex-col gap-2">
                        {PL_ITEMS.revenue.map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-stone-50">
                                <span className="text-sm font-bold text-stone-600 uppercase">{item.label}</span>
                                <span className="text-sm font-black text-stone-900 tabular-nums">₹{item.val.toLocaleString()}</span>
                            </div>
                        ))}
                        <div className="flex justify-between items-center py-4 text-primary bg-primary/5 px-4 -mx-4">
                            <span className="text-sm font-black uppercase">Total Revenue</span>
                            <span className="text-base font-black tabular-nums">₹{totalRevenue.toLocaleString()}</span>
                        </div>
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <Typography variant="titleSmall" className="font-black uppercase tracking-widest text-stone-400">Cost of Goods Sold (B)</Typography>
                    <div className="flex flex-col gap-2">
                        {PL_ITEMS.cogs.map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-stone-50">
                                <span className="text-sm font-bold text-stone-600 uppercase">{item.label}</span>
                                <span className="text-sm font-black text-stone-900 tabular-nums">₹{item.val.toLocaleString()}</span>
                            </div>
                        ))}
                        <div className="flex justify-between items-center py-4 text-stone-500 bg-stone-50 px-4 -mx-4">
                            <span className="text-sm font-black uppercase">Gross Profit (A - B)</span>
                            <span className="text-base font-black tabular-nums">₹{grossProfit.toLocaleString()}</span>
                        </div>
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <Typography variant="titleSmall" className="font-black uppercase tracking-widest text-stone-400">Indirect Expenses (C)</Typography>
                    <div className="flex flex-col gap-2">
                        {PL_ITEMS.expenses.map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-stone-50">
                                <span className="text-sm font-bold text-stone-600 uppercase">{item.label}</span>
                                <span className="text-sm font-black text-stone-900 tabular-nums">₹{item.val.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="mt-8 p-8 bg-stone-900 text-white flex justify-between items-center">
                    <div className="flex flex-col">
                        <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-widest">Net Operating Profit</Typography>
                        <Typography variant="bodySmall" className="text-emerald-400 font-bold uppercase mt-1">Protocol Success: Healthy Margins</Typography>
                    </div>
                    <Typography variant="displaySmall" className="font-black tabular-nums text-emerald-500">₹{netProfit.toLocaleString()}</Typography>
                </div>
            </Card>

            {/* Visual Analytics Side */}
            <div className="flex flex-col gap-8">
                 <Card variant="outlined" className="bg-white border-stone-200 p-8 rounded-xs h-auto min-h-[400px]">
                    <Typography variant="titleSmall" className="font-black text-stone-800 uppercase tracking-tight mb-8">Monthly Net Yield Trend</Typography>
                    <BarChart 
                        height={240}
                        color="bg-primary"
                        data={[
                            { label: 'MAY', value: 85000 },
                            { label: 'JUN', value: 42000 },
                            { label: 'JUL', value: 105000 },
                            { label: 'AUG', value: 92000 },
                            { label: 'SEP', value: 148000 },
                            { label: 'OCT', value: netProfit / 100 }, // Scale for chart
                        ]}
                    />
                 </Card>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card variant="outlined" className="bg-white border-stone-200 p-6 rounded-xs">
                        <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[9px] tracking-widest">Gross Margin %</Typography>
                        <Typography variant="headlineSmall" className="font-black text-stone-900 mt-2">51.8%</Typography>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase mt-2 block">Top 10% Industry</span>
                    </Card>
                    <Card variant="outlined" className="bg-white border-stone-200 p-6 rounded-xs">
                        <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[9px] tracking-widest">OpEx Ratio</Typography>
                        <Typography variant="headlineSmall" className="font-black text-stone-900 mt-2">9.8%</Typography>
                        <span className="text-[10px] font-bold text-stone-400 uppercase mt-2 block">Lean Operations</span>
                    </Card>
                 </div>

                 <Card variant="filled" className="bg-amber-50 border border-amber-100 p-6 rounded-xs flex items-start gap-4">
                    <Icons.Warning size={24} className="text-amber-600 mt-1 shrink-0" />
                    <div>
                        <Typography variant="titleSmall" className="font-black uppercase text-amber-900">Tax Provision Alert</Typography>
                        <Typography variant="bodySmall" className="text-amber-800 font-bold uppercase mt-1 leading-relaxed">
                            Based on net profit, estimated quarterly advance tax liability is ₹52,400. Ensure payment by 15th Dec.
                        </Typography>
                    </div>
                 </Card>
            </div>
        </div>
    </div>
  );
};