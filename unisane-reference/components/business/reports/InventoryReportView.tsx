
import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { INITIAL_ITEMS, INITIAL_WAREHOUSES } from '../../../data/inventory-data';
import { Chip } from '../../ui/Chip';
import { cn } from '../../../lib/utils';

export const InventoryReportView = () => {
  const totalValuation = INITIAL_ITEMS.reduce((acc, item) => {
    const stock = Object.values(item.warehouseStock).reduce((a: any, b: any) => a + b, 0) as number;
    return acc + (stock * item.purchasePrice);
  }, 0);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="outlined" className="p-6 bg-stone-900 text-white border-none shadow-2">
          <Typography variant="labelSmall" className="text-stone-500 font-black uppercase">Total Assets (Inventory)</Typography>
          <Typography variant="headlineSmall" className="font-black text-primary-container mt-2">₹{totalValuation.toLocaleString()}</Typography>
        </Card>
        <Card variant="outlined" className="p-6 bg-white border-stone-200">
          <Typography variant="labelSmall" className="text-stone-400 font-black uppercase">Low Stock SKUs</Typography>
          <Typography variant="headlineSmall" className="font-black text-rose-600 mt-2">12 Items</Typography>
        </Card>
        <Card variant="outlined" className="p-6 bg-white border-stone-200">
          <Typography variant="labelSmall" className="text-stone-400 font-black uppercase">Warehouse Occupancy</Typography>
          <Typography variant="headlineSmall" className="font-black text-stone-900 mt-2">82.4% Avg</Typography>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        <Typography variant="titleSmall" className="font-black text-stone-800 uppercase px-1">Warehouse-wise Breakdown</Typography>
        <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50 border-b border-stone-200">
                <TableHead>Location</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">Total Items</TableHead>
                <TableHead className="text-right">Value Contribution</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INITIAL_WAREHOUSES.map((wh) => (
                <TableRow key={wh.id} className="hover:bg-stone-50 border-b border-stone-100">
                  <TableCell className="font-black text-stone-900 uppercase text-[12px]">{wh.name}</TableCell>
                  <TableCell className="text-stone-500 font-bold uppercase text-[11px]">{wh.manager}</TableCell>
                  <TableCell className="text-right font-black text-stone-800 tabular-nums">{wh.items}</TableCell>
                  <TableCell className="text-right font-bold text-stone-600 tabular-nums">₹{((wh.items || 0) * 1500).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Chip label="Optimal" className="bg-emerald-50 text-emerald-700 border-none font-black h-5 text-[8px] rounded-xs" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <Typography variant="titleSmall" className="font-black text-stone-800 uppercase px-1">Critical Reorder List</Typography>
        <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
          <Table>
             <TableHeader>
                <TableRow className="bg-stone-50 border-b border-stone-200">
                   <TableHead>SKU Details</TableHead>
                   <TableHead className="text-right">Current Stock</TableHead>
                   <TableHead className="text-right">Reorder Point</TableHead>
                   <TableHead className="text-right">Lead Time</TableHead>
                   <TableHead className="text-right">Urgency</TableHead>
                </TableRow>
             </TableHeader>
             <TableBody>
                {INITIAL_ITEMS.slice(0, 3).map((item) => (
                   <TableRow key={item.id} className="hover:bg-stone-50 border-b border-stone-100">
                      <TableCell>
                         <div className="flex flex-col">
                            <span className="font-black text-stone-800 uppercase text-[12px]">{item.name}</span>
                            <span className="text-[10px] font-bold text-stone-400 uppercase">{item.id}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right font-black text-rose-600 tabular-nums">45 {item.unit}</TableCell>
                      <TableCell className="text-right font-bold text-stone-500 tabular-nums">{item.minStock} {item.unit}</TableCell>
                      <TableCell className="text-right text-stone-500 font-bold">4 Days</TableCell>
                      <TableCell className="text-right">
                         <div className="h-2 w-16 bg-rose-100 rounded-full ml-auto overflow-hidden">
                            <div className="h-full bg-rose-600 w-[85%]" />
                         </div>
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
