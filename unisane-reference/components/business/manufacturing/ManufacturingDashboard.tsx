
import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { BarChart, DonutChart } from '../../ui/Charts';
import { Icons } from '../Icons';

export const ManufacturingDashboard = () => {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="outlined" className="bg-white border-stone-200 p-6 rounded-xs">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">Active Runs</Typography>
            <Typography variant="headlineSmall" className="font-black text-stone-900 mt-1">12 Orders</Typography>
            <div className="flex items-center gap-1 mt-2 text-emerald-600">
                <span className="text-[10px] font-black uppercase">All Machines Active</span>
            </div>
        </Card>

        <Card variant="outlined" className="bg-white border-stone-200 p-6 rounded-xs">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">Raw Consumption (MTD)</Typography>
            <Typography variant="headlineSmall" className="font-black text-stone-900 mt-1">14.2 Tons</Typography>
            <div className="flex items-center gap-1 mt-2 text-primary">
                <Icons.TrendUp size={14} />
                <span className="text-[10px] font-black uppercase">+12% vs Sep</span>
            </div>
        </Card>

        <Card variant="outlined" className="bg-white border-stone-200 p-6 rounded-xs">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">Process Efficiency</Typography>
            <Typography variant="headlineSmall" className="font-black text-emerald-600 mt-1">94.8%</Typography>
            <div className="flex items-center gap-1 mt-2 text-stone-400">
                <span className="text-[10px] font-black uppercase">Target: 95%</span>
            </div>
        </Card>

        <Card variant="filled" className="bg-stone-900 text-white p-6 rounded-xs border-none shadow-2">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">Wastage Rate</Typography>
            <Typography variant="headlineSmall" className="font-black text-amber-400 mt-1">3.2%</Typography>
            <div className="flex items-center gap-1 mt-2 text-stone-500">
                <span className="text-[10px] font-black uppercase">Historical Low</span>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card variant="outlined" className="xl:col-span-2 bg-white border-stone-200 h-[400px]">
          <CardHeader className="flex flex-row justify-between items-center border-b border-stone-100 py-4 px-6">
            <Typography variant="titleSmall" className="font-black text-stone-800 uppercase tracking-tight">Production Output Trend (SqFt)</Typography>
          </CardHeader>
          <CardContent className="h-full pt-8 px-6">
            <BarChart 
              height={280}
              color="bg-amber-600"
              data={[
                { label: 'W1', value: 4500 }, { label: 'W2', value: 3200 }, { label: 'W3', value: 5800 },
                { label: 'W4', value: 4900 },
              ]} 
            />
          </CardContent>
        </Card>

        <Card variant="outlined" className="bg-white border-stone-200 flex flex-col h-[400px]">
          <CardHeader className="border-b border-stone-100 py-4 px-6">
            <Typography variant="titleSmall" className="font-black text-stone-800 uppercase tracking-tight">Resource Load</Typography>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
            <DonutChart 
              data={[
                { label: 'Machine T1', value: 40 },
                { label: 'Machine T2', value: 30 },
                { label: 'Manual Finishing', value: 20 },
                { label: 'Maintenance', value: 10 },
              ]} 
              height={220} 
              label="CAPACITY" 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
