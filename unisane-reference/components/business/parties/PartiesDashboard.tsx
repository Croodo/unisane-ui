import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { BarChart, DonutChart, ChartLegend } from '../../ui/Charts';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { Avatar } from '../../ui/Avatar';
import { Chip } from '../../ui/Chip';
import { Button } from '../../ui/Button';

const TOP_PARTNERS = [
  { name: 'Elite Builders', type: 'Customer', volume: '₹12.4L', rating: 'A+', color: 'bg-primary' },
  { name: 'Stone Mines India', type: 'Supplier', volume: '₹8.2L', rating: 'A', color: 'bg-stone-900' },
  { name: 'Raj Construction', type: 'Customer', volume: '₹4.1L', rating: 'B', color: 'bg-primary/60' },
];

export const PartiesDashboard = () => {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="filled" className="bg-primary p-6 md:p-8 rounded-xs shadow-2 border-none">
            <Typography variant="labelSmall" className="text-white/70 font-black uppercase tracking-widest text-[10px]">Total Receivables</Typography>
            <Typography variant="headlineMedium" className="font-black tracking-tighter mt-2 text-3xl @md:text-4xl text-white">₹4,52,000</Typography>
            <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-white/80">
                <Icons.TrendUp size={16} className="text-emerald-300" />
                <span className="uppercase tracking-tight">Healthy Pipeline</span>
            </div>
        </Card>

        <Card variant="outlined" className="bg-white border-stone-200 p-6 md:p-8 rounded-xs shadow-none">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[10px]">Total Payables</Typography>
            <Typography variant="headlineMedium" className="font-black tracking-tighter mt-2 text-3xl @md:text-4xl text-stone-900">₹2,10,500</Typography>
            <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-error">
                <Icons.Warning size={16} />
                <span className="uppercase tracking-tight">₹45k due this week</span>
            </div>
        </Card>

        <Card variant="outlined" className="bg-stone-50 border-stone-200 p-6 md:p-8 rounded-xs shadow-none">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[10px]">Collection Efficiency</Typography>
            <Typography variant="headlineMedium" className="font-black tracking-tighter mt-2 text-3xl @md:text-4xl text-emerald-600">92.4%</Typography>
            <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-stone-400">
                <Icons.Check size={16} />
                <span className="uppercase tracking-tight">Audit Passed</span>
            </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card variant="outlined" className="bg-white border-stone-200 p-6 md:p-8 rounded-xs h-auto min-h-[400px]">
            <CardHeader className="p-0 mb-8 flex flex-row justify-between items-start">
                <div>
                    <Typography variant="titleMedium" className="font-black text-stone-800 uppercase tracking-tight leading-none">Cash Flow Dynamics</Typography>
                    <Typography variant="bodySmall" className="text-stone-400 font-bold uppercase tracking-tight mt-1.5">Monthly Receipts vs Payments</Typography>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-[9px] font-black text-stone-400 uppercase">In</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-stone-300" /><span className="text-[9px] font-black text-stone-400 uppercase">Out</span></div>
                </div>
            </CardHeader>
            <BarChart 
                height={240}
                data={[
                    { label: 'JUL', value: 45000 },
                    { label: 'AUG', value: 82000 },
                    { label: 'SEP', value: 61000 },
                    { label: 'OCT', value: 95000 },
                ]}
            />
        </Card>

        <Card variant="outlined" className="bg-white border-stone-200 p-6 md:p-8 rounded-xs h-auto min-h-[400px]">
            <CardHeader className="p-0 mb-6 text-center">
                <Typography variant="titleMedium" className="font-black text-stone-800 uppercase tracking-tight">Receivables Aging Buckets</Typography>
            </CardHeader>
            <div className="flex flex-col items-center">
                <DonutChart 
                    height={220}
                    label="DUE"
                    data={[
                        { label: '0-30 Days', value: 70 },
                        { label: '31-60 Days', value: 15 },
                        { label: '61-90 Days', value: 10 },
                        { label: '90+ Days', value: 5 },
                    ]}
                />
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-black text-stone-500 uppercase">0-30 (Healthy)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-secondary" />
                        <span className="text-[10px] font-black text-stone-500 uppercase">31-60 (Follow-up)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-tertiary" />
                        <span className="text-[10px] font-black text-stone-500 uppercase">61-90 (Warning)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-error" />
                        <span className="text-[10px] font-black text-stone-500 uppercase">90+ (Critical)</span>
                    </div>
                </div>
            </div>
        </Card>
      </div>

      {/* Top Partners List */}
      <div className="flex flex-col gap-5">
         <div className="flex justify-between items-center px-2">
            <Typography variant="labelMedium" className="text-stone-400 font-black uppercase tracking-widest">Market Influence</Typography>
            <Button variant="text" size="md" className="text-primary font-black uppercase text-[10px] tracking-widest h-10 px-6 hover:bg-primary/5 rounded-xs">Full Partner Analysis</Button>
         </div>
         <div className="grid grid-cols-1 @lg:grid-cols-3 gap-5">
            {TOP_PARTNERS.map((p, i) => (
                <div key={i} className="bg-white border border-stone-200 p-5 rounded-xs flex flex-col gap-2 hover:border-primary/40 transition-all group cursor-pointer shadow-none hover:shadow-sm">
                    <div className="flex justify-between items-start">
                        <Avatar size="sm" fallback={p.name[0]} className={cn("rounded-xs font-black", p.color, "text-white")} />
                        <Chip label={p.rating} className="h-4 text-[7px] font-black bg-emerald-50 text-emerald-700 border-none rounded-xs px-1.5" />
                    </div>
                    <div className="mt-2">
                        <Typography variant="titleSmall" className="font-black text-stone-900 uppercase tracking-tight leading-none truncate">{p.name}</Typography>
                        <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase text-[9px] mt-1.5 tracking-tight">{p.type} Profile</Typography>
                    </div>
                    <div className="mt-3 pt-3 border-t border-stone-50 flex justify-between items-center">
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Lifecycle Yield</span>
                        <span className="text-[12px] font-black text-stone-900 tabular-nums">{p.volume}</span>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};