
import React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { Typography } from '../../ui/Typography';
import { LineChart, DonutChart } from '../../ui/Charts';
import { cn } from '../../../lib/utils';
import { Icons } from '../Icons';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Chip } from '../../ui/Chip';

const StatCard = ({ label, value, trend, color }: any) => (
  <Card variant="outlined" className="bg-white border-stone-200 shadow-sm hover:border-primary/30 transition-colors">
    <CardHeader className="pb-1 pt-4">
      <Typography variant="labelSmall" className="text-stone-500 font-bold uppercase tracking-widest text-[9px]">{label}</Typography>
      <Typography variant="headlineSmall" className={cn("font-black mt-0.5", color)}>{value}</Typography>
    </CardHeader>
    <CardContent className="pb-4">
      <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase tracking-tight">{trend}</Typography>
    </CardContent>
  </Card>
);

const MOCK_RECENT = [
    { id: 'INV-1022', party: 'Elite Builders', amount: 25000, type: 'Sale', time: '2m ago' },
    { id: 'PB-991', party: 'Logistics Hub', amount: 14200, type: 'Purchase', time: '15m ago' },
    { id: 'PAY-882', party: 'Raj Construction', amount: 5000, type: 'Payment', time: '1h ago' },
];

export const DashboardOverview = () => {
  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="TOTAL RECEIVABLE" value="₹2,57,200" trend="+₹12k today" color="text-primary" />
        <StatCard label="TOTAL PAYABLE" value="₹1,25,000" trend="Due in 3 days" color="text-error" />
        <StatCard label="STOCK VALUATION" value="₹18,45,000" trend="4,200 Units" color="text-stone-700" />
        <StatCard label="CASH ON HAND" value="₹4,12,000" trend="Synced" color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card variant="outlined" className="xl:col-span-2 bg-white border-stone-200 min-h-[400px]">
          <CardHeader className="flex flex-row justify-between items-center border-b border-stone-100 py-4 px-6 bg-stone-50/30">
            <Typography variant="titleSmall" className="font-black text-stone-800 uppercase tracking-tight">Revenue Projection</Typography>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Protocol Sync: Active</span>
          </CardHeader>
          <CardContent className="h-full pt-12 px-6">
            <LineChart 
              height={280}
              color="text-primary"
              data={[
                { label: 'Oct 01', value: 400 }, { label: 'Oct 05', value: 650 }, { label: 'Oct 10', value: 580 },
                { label: 'Oct 15', value: 890 }, { label: 'Oct 20', value: 1200 }, { label: 'Oct 25', value: 1050 },
              ]} 
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
            <Card variant="outlined" className="bg-white border-stone-200 flex flex-col h-[400px]">
                <CardHeader className="border-b border-stone-100 py-4 px-6 bg-stone-50/30">
                    <Typography variant="titleSmall" className="font-black text-stone-800 uppercase tracking-tight">Stock Mix</Typography>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
                    <DonutChart 
                    data={[
                        { label: 'Stone', value: 500 },
                        { label: 'Metal', value: 300 },
                        { label: 'Adhesives', value: 150 },
                    ]} 
                    height={220} 
                    label="UNITS" 
                    />
                </CardContent>
            </Card>
        </div>
      </div>

      <section className="flex flex-col gap-4">
         <div className="flex justify-between items-center px-1">
            <Typography variant="labelMedium" className="text-stone-400 font-black uppercase tracking-[0.3em]">Live Audit Feed</Typography>
            <span className="text-[10px] font-black text-primary uppercase">View Full Ledger</span>
         </div>
         <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-stone-50">
                        <TableHead>Protocol Ref</TableHead>
                        <TableHead>Counterparty</TableHead>
                        <TableHead>Logic Type</TableHead>
                        <TableHead className="text-right">Valuation</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {MOCK_RECENT.map((row, i) => (
                        <TableRow key={i} className="hover:bg-stone-50 transition-colors">
                            <TableCell className="font-mono text-primary font-black text-[11px] py-4">{row.id}</TableCell>
                            <TableCell className="font-black text-stone-800 uppercase text-[11px]">{row.party}</TableCell>
                            <TableCell><Chip label={row.type} className="h-5 text-[8px] font-black rounded-xs border-none bg-stone-100 text-stone-600" /></TableCell>
                            <TableCell className="text-right font-black text-stone-900 tabular-nums">₹{row.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-stone-400 font-bold uppercase text-[9px] tracking-tight">{row.time}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
         </div>
      </section>
    </div>
  );
};
