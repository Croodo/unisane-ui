import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { BarChart, LineChart, DonutChart } from '../../ui/Charts';
import { Icons } from '../Icons';
import { Button } from '../../ui/Button';
// Added missing import for cn utility
import { cn } from '../../../lib/utils';

export const PurchaseDashboard = () => {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="outlined" className="bg-white border-stone-200 p-6 rounded-xs shadow-none">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">Total Purchases (MTD)</Typography>
            <Typography variant="headlineSmall" className="font-black text-stone-900 mt-1 tabular-nums">₹5,12,000</Typography>
            <div className="flex items-center gap-1 mt-2 text-primary">
                <Icons.TrendDown size={14} />
                <span className="text-[10px] font-bold">-5% vs Last Month</span>
            </div>
        </Card>

        <Card variant="outlined" className="bg-white border-stone-200 p-6 rounded-xs shadow-none">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">Outstanding Payables</Typography>
            <Typography variant="headlineSmall" className="font-black text-error mt-1 tabular-nums">₹1,85,400</Typography>
            <div className="flex items-center gap-1 mt-2 text-error/70">
                <Icons.Warning size={14} />
                <span className="text-[10px] font-bold">₹40k due today</span>
            </div>
        </Card>

        <Card variant="outlined" className="bg-white border-stone-200 p-6 rounded-xs shadow-none">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">Lead Time Efficiency</Typography>
            <Typography variant="headlineSmall" className="font-black text-emerald-600 mt-1 tabular-nums">4.2 Days</Typography>
            <div className="flex items-center gap-1 mt-2 text-emerald-600">
                <span className="text-[10px] font-bold uppercase">Optimal Supply Chain</span>
            </div>
        </Card>

        <Card variant="filled" className="bg-stone-900 text-white p-6 rounded-xs shadow-2 border-none">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">Cost Savings (YTD)</Typography>
            <Typography variant="headlineSmall" className="font-black text-primary-container mt-1">₹84,500</Typography>
            <div className="flex items-center gap-1 mt-2 text-primary-container/80">
                <Icons.Check size={14} />
                <span className="text-[10px] font-bold">Protocol Impact</span>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card variant="outlined" className="xl:col-span-2 bg-white border-stone-200 h-[400px]">
          <CardHeader className="flex flex-row justify-between items-center border-b border-stone-100 py-4 px-6">
            <Typography variant="titleSmall" className="font-black text-stone-800 uppercase tracking-tight">Supply Outflow Trend</Typography>
            <div className="flex gap-2">
                <Button variant="text" size="sm" className="text-[10px] font-black uppercase text-primary">DAILY</Button>
                <Button variant="text" size="sm" className="text-[10px] font-black uppercase text-stone-400">WEEKLY</Button>
            </div>
          </CardHeader>
          <CardContent className="h-full pt-8 px-6">
            <BarChart 
              height={280}
              color="bg-stone-800"
              data={[
                { label: 'W1', value: 310 }, { label: 'W2', value: 420 }, { label: 'W3', value: 550 },
                { label: 'W4', value: 390 }, { label: 'W5', value: 680 }, { label: 'W6', value: 512 },
              ]} 
            />
          </CardContent>
        </Card>

        <Card variant="outlined" className="bg-white border-stone-200 flex flex-col h-[400px]">
          <CardHeader className="border-b border-stone-100 py-4 px-6 text-center">
            <Typography variant="titleSmall" className="font-black text-stone-800 uppercase tracking-tight">Expense Mix</Typography>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
             <DonutChart 
                height={220}
                label="SPEND"
                data={[
                    { label: 'Raw Slabs', value: 60 },
                    { label: 'Consumables', value: 20 },
                    { label: 'Logistics', value: 15 },
                    { label: 'Admin', value: 5 },
                ]}
             />
          </CardContent>
        </Card>
      </div>
      
      {/* Supplier Performance List */}
      <div className="flex flex-col gap-4">
         <Typography variant="labelMedium" className="text-stone-400 font-black uppercase tracking-widest px-2">Supply Continuity Index</Typography>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
                { name: 'Stone Mines India', health: 'Optimal', delay: '0 days', trend: 'UP' },
                { name: 'Logistics Hub', health: 'Critical', delay: '4 days', trend: 'DOWN' },
            ].map((s, i) => (
                <div key={i} className="bg-white border border-stone-200 p-5 rounded-xs flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn("w-2 h-10 rounded-full", s.health === 'Optimal' ? "bg-emerald-500" : "bg-error")} />
                        <div>
                            <Typography variant="titleSmall" className="font-black text-stone-900 uppercase truncate leading-none">{s.name}</Typography>
                            <span className="text-[10px] font-bold text-stone-400 uppercase mt-1 block">Supply Latency: {s.delay}</span>
                        </div>
                    </div>
                    <Button variant="tonal" size="sm" className="font-black text-[9px]">AUDIT VENDOR</Button>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};