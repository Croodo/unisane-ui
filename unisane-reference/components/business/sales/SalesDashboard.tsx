
import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { BarChart, LineChart, DonutChart } from '../../ui/Charts';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';

export const SalesDashboard = () => {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      {/* Sales KPI Row - Standardized to Outlined Industrial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="outlined" className="bg-white border-stone-200 p-6 rounded-xs shadow-none group hover:border-primary transition-all">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">Total Sales (MTD)</Typography>
            <Typography variant="headlineSmall" className="font-black text-stone-900 mt-1 tabular-nums">₹8,42,000</Typography>
            <div className="flex items-center gap-1 mt-3 text-emerald-600">
                <Icons.TrendUp size={14} />
                <span className="text-[10px] font-black uppercase">+18% Growth</span>
            </div>
        </Card>

        <Card variant="outlined" className="bg-white border-stone-200 p-6 rounded-xs shadow-none group hover:border-primary transition-all">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">Average Ticket Size</Typography>
            <Typography variant="headlineSmall" className="font-black text-stone-900 mt-1 tabular-nums">₹42,100</Typography>
            <div className="flex items-center gap-1 mt-3 text-stone-400">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Stable Trend</span>
            </div>
        </Card>

        <Card variant="outlined" className="bg-rose-50/30 border-rose-200 p-6 rounded-xs shadow-none">
            <Typography variant="labelSmall" className="text-rose-600 font-black uppercase tracking-widest text-[9px]">Aged Receivables</Typography>
            <Typography variant="headlineSmall" className="font-black text-rose-700 mt-1 tabular-nums">₹2,10,500</Typography>
            <div className="flex items-center gap-1 mt-3 text-rose-500">
                <Icons.Warning size={14} />
                <span className="text-[10px] font-black uppercase">5 Vouchers Overdue</span>
            </div>
        </Card>

        <Card variant="outlined" className="bg-stone-900 text-white p-6 rounded-xs border-stone-800 shadow-3 relative overflow-hidden group">
            <div className="relative z-10">
                <Typography variant="labelSmall" className="text-stone-500 font-black uppercase tracking-widest text-[9px]">Net Conversion</Typography>
                <Typography variant="headlineSmall" className="font-black text-primary-container mt-1">74.2%</Typography>
                <div className="flex items-center gap-1 mt-3 text-emerald-400">
                    <Icons.Check size={14} />
                    <span className="text-[10px] font-black uppercase">Protocol Healthy</span>
                </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <Icons.Dashboard size={100} />
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card variant="outlined" className="xl:col-span-2 bg-white border-stone-200 min-h-[400px]">
          <CardHeader className="flex flex-row justify-between items-center border-b border-stone-100 py-4 px-6 bg-stone-50/50">
            <div className="flex flex-col">
                <Typography variant="titleSmall" className="font-black text-stone-800 uppercase tracking-tight">Lead-to-Cash Performance</Typography>
                <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase text-[9px]">Monthly Velocity Analysis</Typography>
            </div>
            <div className="flex gap-2">
                <Button variant="text" size="sm" className="font-black text-[9px] h-7 px-3 bg-stone-100 rounded-xs">DAILY</Button>
                <Button variant="text" size="sm" className="font-black text-[9px] h-7 px-3">WEEKLY</Button>
            </div>
          </CardHeader>
          <CardContent className="h-full pt-10 px-8">
            <LineChart 
              height={260}
              color="text-primary"
              data={[
                { label: 'May', value: 450 }, { label: 'Jun', value: 320 }, { label: 'Jul', value: 580 },
                { label: 'Aug', value: 490 }, { label: 'Sep', value: 920 }, { label: 'Oct', value: 842 },
              ]} 
            />
          </CardContent>
        </Card>

        <Card variant="outlined" className="bg-white border-stone-200 flex flex-col min-h-[400px]">
          <CardHeader className="border-b border-stone-100 py-4 px-6 text-center bg-stone-50/50">
            <Typography variant="titleSmall" className="font-black text-stone-800 uppercase tracking-tight">Material Mix Revenue</Typography>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-8">
            <DonutChart 
              data={[
                { label: 'Stone Slabs', value: 500 },
                { label: 'Metals', value: 200 },
                { label: 'Adhesives', value: 150 },
                { label: 'Others', value: 150 },
              ]} 
              height={220} 
              label="YIELD" 
            />
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2 w-full">
                {[
                    { l: 'SLABS', c: 'bg-primary' },
                    { l: 'METALS', c: 'bg-stone-500' },
                    { l: 'CHEM', c: 'bg-amber-600' },
                    { l: 'OTHER', c: 'bg-stone-200' }
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", item.c)} />
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{item.l}</span>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card variant="outlined" className="bg-stone-50 border-stone-200 p-6 flex items-center justify-between group cursor-pointer hover:bg-stone-100 transition-colors">
            <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xs bg-white border border-stone-200 flex items-center justify-center text-stone-400 group-hover:text-primary transition-colors">
                    <Icons.File size={24} />
                </div>
                <div>
                    <Typography variant="titleSmall" className="font-black text-stone-900 uppercase">Recent Outstanding Audit</Typography>
                    <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase text-[10px]">12 vouchers awaiting verification</Typography>
                </div>
            </div>
            <Button variant="tonal" size="sm" className="font-black text-[9px] px-4">VIEW AUDIT</Button>
         </Card>

         <Card variant="outlined" className="bg-emerald-50 border-emerald-100 p-6 flex items-center justify-between group cursor-pointer hover:bg-emerald-100/50 transition-colors">
            <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xs bg-white border border-emerald-200 flex items-center justify-center text-emerald-500">
                    <Icons.Money size={24} />
                </div>
                <div>
                    <Typography variant="titleSmall" className="font-black text-emerald-900 uppercase">Projected Liquidity</Typography>
                    <Typography variant="labelSmall" className="text-emerald-600 font-bold uppercase text-[10px]">₹12.4L estimated collection</Typography>
                </div>
            </div>
            <Icons.TrendUp className="text-emerald-500" />
         </Card>
      </div>
    </div>
  );
};
