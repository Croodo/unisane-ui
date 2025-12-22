
import React, { useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Typography } from '../../ui/Typography';
import { Chip } from '../../ui/Chip';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { RegistryHeader } from '../shared/RegistryComponents';

const MOCK_DOCS = [
  { id: 'INV-1001', party: 'Elite Builders', date: '2023-10-26', amount: 45000, status: 'Final', type: 'sales' },
  { id: 'INV-1002', party: 'Raj Construction', date: '2023-10-25', amount: 12000, status: 'Draft', type: 'sales' },
  { id: 'PB-440', party: 'Stone Mines India', date: '2023-10-22', amount: 88000, status: 'Final', type: 'purchases' },
];

export const DocumentsModule = ({ type, subType }: { type: string, subType: string }) => {
  const [search, setSearch] = useState('');
  const filtered = MOCK_DOCS.filter(d => 
    d.type === type && 
    (d.party.toLowerCase().includes(search.toLowerCase()) || d.id.includes(search))
  );

  return (
    <div className="h-full flex flex-col bg-white animate-in fade-in duration-500 @container">
      <RegistryHeader 
        label={`System of Record / ${type}`}
        title={subType.replace('_', ' ')}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search records..."
        action={
          <Button variant="filled" size="md" icon={<Icons.Add />} className="font-black text-[10px] px-8 shadow-2">
            CREATE {type === 'sales' ? 'INVOICE' : 'BILL'}
          </Button>
        }
      />
      
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50 border-b border-stone-200">
                <TableHead className="font-black text-[10px] uppercase text-stone-500">Document Number</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-stone-500">Counterparty Entity</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-stone-500">Execution Date</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-stone-500">Protocol Status</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-stone-500 text-right">Valuation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? filtered.map(doc => (
                <TableRow key={doc.id} className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer">
                  <TableCell className="font-black text-primary py-5">{doc.id}</TableCell>
                  <TableCell className="font-black text-stone-800 uppercase text-[12px]">{doc.party}</TableCell>
                  <TableCell className="text-stone-400 font-bold uppercase text-[11px]">{doc.date}</TableCell>
                  <TableCell>
                    <Chip 
                      label={doc.status} 
                      className={cn(
                        "h-5 text-[8px] border-none font-black rounded-xs uppercase",
                        doc.status === 'Final' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )} 
                    />
                  </TableCell>
                  <TableCell className="text-right font-black text-stone-900 tabular-nums">₹{doc.amount.toLocaleString()}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-32 text-stone-200">
                     <div className="flex flex-col items-center gap-4 opacity-40">
                        <Icons.File size={64} strokeWidth={1} />
                        <Typography variant="labelSmall" className="font-black uppercase tracking-widest">No matching registry records</Typography>
                     </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
