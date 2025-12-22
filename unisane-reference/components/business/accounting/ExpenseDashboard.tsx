import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { BarChart, DonutChart, ChartLegend } from '../../ui/Charts';
import { Icons } from '../Icons';

export const ExpenseDashboard = () => {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="outlined" className="bg-white border-stone-200 p-6 rounded-xs shadow-none">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">OpEx Total (MTD)</Typography>
            <Typography variant="headlineSmall" className="font-black text-stone-900 mt-1 tabular-nums">₹1,44,200</Typography>
            <div className="flex items-center gap-1 mt-2 text-rose-600">
                <Icons.TrendUp size={14} />
                <span className="text-[10px] font-bold">+8.2% vs Last Month</span>
            </div>
        </Card>

        <Card variant="outlined" className="bg-white border-stone-200 p-6 rounded-xs shadow-none">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">Fixed Costs</Typography>
            <Typography variant="headlineSmall" className="font-black text-stone-900 mt-1 tabular-nums">₹85,000</Typography>
            <div className="flex items-center gap-1 mt-2 text-stone-400">
                <span className="text-[10px] font-bold text-emerald-600">Rent, Salary, Insurance</span>
            </div>
        </Card>

        <Card variant="outlined" className="bg-white border-stone-200 p-6 rounded-xs shadow-none">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">Variable Costs</Typography>
            <Typography variant="headlineSmall" className="font-black text-stone-900 mt-1 tabular-nums">₹59,200</Typography>
            <div className="flex items-center gap-1 mt-2 text-stone-400">
                <span className="text-[10px] font-bold">Electricity, Fuel, Repairs</span>
            </div>
        </Card>

        <Card variant="filled" className="bg-stone-900 text-white p-6 rounded-xs shadow-2 border-none">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest text-[9px]">GST Input Claimable</Typography>
            <Typography variant="headlineSmall" className="font-black text-primary-container mt-1">₹18,240</Typography>
            <div className="flex items-center gap-1 mt-2 text-primary-container/80">
                <Icons.Check size={14} />
                <span className="text-[10px] font-bold">Ready for filing</span>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card variant="outlined" className="bg-white border-stone-200 h-[400px]">
          <CardHeader className="flex flex-row justify-between items-center border-b border-stone-100 py-4 px-6">
            <Typography variant="titleSmall" className="font-black text-stone-800 uppercase tracking-tight">Expense Category Distribution</Typography>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <DonutChart 
              height={220}
              label="OUTFLOW"
              data={[
                { label: 'Staff Salary', value: 45 },
                { label: 'Rent & Office', value: 25 },
                { label: 'Utility Bills', value: 15 },
                { label: 'Repairs', value: 10 },
                { label: 'Others', value: 5 },
              ]}
            />
            <ChartLegend data={[
                { label: 'Staff Salary', value: 45 },
                { label: 'Rent & Office', value: 25 },
                { label: 'Utility Bills', value: 15 },
                { label: 'Misc', value: 15 },
            ]} />
          </CardContent>
        </Card>

        <Card variant="outlined" className="bg-white border-stone-200 h-[400px]">
          <CardHeader className="flex flex-row justify-between items-center border-b border-stone-100 py-4 px-6">
            <Typography variant="titleSmall" className="font-black text-stone-800 uppercase tracking-tight">6-Month Burn Rate</Typography>
          </CardHeader>
          <CardContent className="h-full pt-8 px-6">
            <BarChart 
              height={260}
              color="bg-rose-500"
              data={[
                { label: 'May', value: 120 }, { label: 'Jun', value: 135 }, { label: 'Jul', value: 110 },
                { label: 'Aug', value: 150 }, { label: 'Sep', value: 142 }, { label: 'Oct', value: 144 },
              ]} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};