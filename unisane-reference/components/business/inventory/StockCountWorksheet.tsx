
import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { TextField } from '../../ui/TextField';
import { INITIAL_ITEMS } from '../../../data/inventory-data';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';

export const StockCountWorksheet = ({ warehouseId }: { warehouseId: string }) => {
  const [counts, setCounts] = useState<Record<string, string>>({});

  const items = INITIAL_ITEMS.filter(i => (i.warehouseStock[warehouseId] || 0) > 0);

  return (
    <div className="flex flex-col h-full bg-white @container">
      <div className="border border-stone-200 rounded-xs overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-stone-50">
              <TableHead className="py-4">Item Identity</TableHead>
              <TableHead className="text-right">System Stock</TableHead>
              <TableHead className="w-48">Physical Count</TableHead>
              <TableHead className="text-right">Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const systemQty = item.warehouseStock[warehouseId] || 0;
              const physicalQty = counts[item.id] !== undefined ? Number(counts[item.id]) : systemQty;
              const variance = physicalQty - systemQty;

              return (
                <TableRow key={item.id} className="hover:bg-stone-50/50">
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-stone-800 uppercase text-[12px]">{item.name}</span>
                      <span className="text-[10px] font-mono text-stone-400 uppercase">{item.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-stone-500 tabular-nums">
                    {systemQty} {item.unit}
                  </TableCell>
                  <TableCell>
                    <TextField 
                      type="number" 
                      label="ACTUAL QTY" 
                      value={counts[item.id] || ''} 
                      onChange={e => setCounts({...counts, [item.id]: e.target.value})}
                      placeholder={systemQty.toString()}
                      labelClassName="bg-white"
                      className="h-11"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "font-black tabular-nums",
                        variance > 0 ? "text-emerald-600" : variance < 0 ? "text-error" : "text-stone-300"
                      )}>
                        {variance > 0 ? `+${variance}` : variance}
                      </span>
                      {variance !== 0 && <span className="text-[8px] font-black uppercase text-stone-400">Requires Post</span>}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
