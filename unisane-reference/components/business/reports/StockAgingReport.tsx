
import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Chip } from '../../ui/Chip';
import { INITIAL_ITEMS } from '../../../data/inventory-data';
import { cn } from '../../../lib/utils';

export const StockAgingReport = () => {
  const agingData = INITIAL_ITEMS.slice(0, 5).map(item => ({
    ...item,
    days: Math.floor(Math.random() * 120) + 10,
    qty: Object.values(item.warehouseStock).reduce((a:any, b:any) => a+b, 0)
  }));

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card variant="outlined" className="p-6 bg-white border-stone-200">
            <Typography variant="labelSmall" className="text-stone-400 font-black uppercase">Avg. Holding Period</Typography>
            <Typography variant="headlineSmall" className="font-black text-stone-900 mt-2">42 Days</Typography>
         </Card>
         <Card variant="outlined" className="p-6 bg-rose-50 border-rose-100">
            <Typography variant="labelSmall" className="text-rose-600 font-black uppercase">Dead Stock (90+ Days)</Typography>
            <Typography variant="headlineSmall" className="font-black text-rose-700 mt-2">₹1,24,000</Typography>
         </Card>
         <Card variant="outlined" className="p-6 bg-stone-900 text-white border-none shadow-2">
            <Typography variant="labelSmall" className="text-stone-500 font-black uppercase">Capital At Risk</Typography>
            <Typography variant="headlineSmall" className="font-black text-primary-container mt-2">12.5%</Typography>
         </Card>
      </div>

      <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
         <Table>
            <TableHeader>
               <TableRow className="bg-stone-50 border-b border-stone-200">
                  <TableHead>Item Details</TableHead>
                  <TableHead>Last Movement</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Valuation</TableHead>
                  <TableHead className="text-right">Aging Status</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {agingData.map((item: any, i) => (
                  <TableRow key={i} className="hover:bg-stone-50 transition-colors">
                     <TableCell className="py-4">
                        <div className="flex flex-col">
                           <span className="font-black text-stone-800 uppercase text-[12px]">{item.name}</span>
                           <span className="text-[10px] text-stone-400 font-mono uppercase">{item.id}</span>
                        </div>
                     </TableCell>
                     <TableCell className="text-stone-500 font-bold uppercase text-[11px]">{item.days} Days Ago</TableCell>
                     <TableCell className="text-right font-black text-stone-900 tabular-nums">{item.qty} {item.unit}</TableCell>
                     <TableCell className="text-right font-bold text-stone-600 tabular-nums">₹{(item.qty * item.purchasePrice).toLocaleString()}</TableCell>
                     <TableCell className="text-right">
                        <Chip 
                            label={item.days > 90 ? 'Critical' : item.days > 60 ? 'Slow' : 'Active'} 
                            className={cn(
                                "h-5 text-[8px] font-black uppercase rounded-xs border-none px-2",
                                item.days > 90 ? "bg-rose-100 text-rose-700" : item.days > 60 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                            )}
                        />
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </div>
    </div>
  );
};
