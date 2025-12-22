
import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { BarChart, DonutChart } from '../../ui/Charts';
import { Chip } from '../../ui/Chip';
// Added missing import for 'cn' utility
import { cn } from '../../../lib/utils';

export const SalesReportView = () => {
  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card variant="outlined" className="xl:col-span-2 p-8 bg-white border-stone-200 min-h-[400px]">
           <div className="flex justify-between items-start mb-10">
              <div>
                <Typography variant="titleMedium" className="font-black text-stone-900 uppercase">Revenue Realization</Typography>
                <Typography variant="bodySmall" className="text-stone-400 font-bold uppercase mt-1">Invoice Generation vs Payment Clearance</Typography>
              </div>
              <Chip label="October 2023" className="bg-stone-100 text-stone-600 border-none font-black h-7" />
           </div>
           <BarChart 
             height={260}
             color="bg-primary"
             data={[
                { label: 'Week 1', value: 120000 },
                { label: 'Week 2', value: 85000 },
                { label: 'Week 3', value: 190000 },
                { label: 'Week 4', value: 245000 },
             ]}
           />
        </Card>

        <Card variant="outlined" className="p-8 bg-white border-stone-200 flex flex-col items-center">
           <Typography variant="titleMedium" className="font-black text-stone-900 uppercase w-full mb-8">Segment Contribution</Typography>
           <DonutChart 
              height={220}
              label="TOTAL"
              data={[
                { label: 'Builders', value: 65 },
                { label: 'Retail', value: 20 },
                { label: 'Exports', value: 15 },
              ]}
           />
           <div className="flex flex-col gap-2 w-full mt-6">
              {[
                  { l: 'Real Estate Builders', v: '65%', c: 'bg-primary' },
                  { l: 'Direct Retail', v: '20%', c: 'bg-secondary' },
                  { l: 'Indirect Exports', v: '15%', c: 'bg-tertiary' },
              ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-black uppercase">
                      {/* Fixed: Added missing 'cn' utility usage */}
                      <div className="flex items-center gap-2"><div className={cn("w-2 h-2 rounded-full", s.c)} /> <span className="text-stone-500">{s.l}</span></div>
                      <span className="text-stone-900">{s.v}</span>
                  </div>
              ))}
           </div>
        </Card>
      </div>

      <section className="flex flex-col gap-5">
         <Typography variant="titleSmall" className="font-black text-stone-800 uppercase px-1">Top Customer Ledger Balances</Typography>
         <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
            <Table>
               <TableHeader>
                  <TableRow className="bg-stone-50 border-b border-stone-200">
                     <TableHead>Customer Entity</TableHead>
                     <TableHead>Last Order</TableHead>
                     <TableHead className="text-right">Sales Volume (YTD)</TableHead>
                     <TableHead className="text-right">Outstanding</TableHead>
                     <TableHead className="text-right">Status</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {[
                      { name: 'Elite Builders Pvt Ltd', last: '26 Oct', vol: '₹14.2L', out: '₹45,000', s: 'Active' },
                      { name: 'Raj Construction Co', last: '24 Oct', vol: '₹8.4L', out: '₹0', s: 'Paid' },
                      { name: 'Metro Slabs Hub', last: '20 Oct', vol: '₹22.1L', out: '₹1,12,000', s: 'Follow-up' },
                  ].map((p, i) => (
                     <TableRow key={i} className="hover:bg-stone-50 border-b border-stone-100">
                        <TableCell className="font-black text-stone-900 uppercase text-[12px] py-4">{p.name}</TableCell>
                        <TableCell className="text-stone-400 font-bold uppercase text-[11px]">{p.last}</TableCell>
                        <TableCell className="text-right font-bold text-stone-600 tabular-nums">{p.vol}</TableCell>
                        <TableCell className="text-right font-black text-stone-900 tabular-nums">{p.out}</TableCell>
                        <TableCell className="text-right">
                           {/* Fixed: Added missing 'cn' utility usage */}
                           <Chip label={p.s} className={cn("h-5 text-[8px] font-black uppercase rounded-xs border-none", p.s === 'Paid' ? 'bg-emerald-100 text-emerald-700' : p.s === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700')} />
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </div>
      </section>
    </div>
  );
};
