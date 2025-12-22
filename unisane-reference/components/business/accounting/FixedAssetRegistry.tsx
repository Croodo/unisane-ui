import React, { useState } from 'react';
import { Typography } from '../../ui/Typography';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Icons } from '../Icons';
import { Chip } from '../../ui/Chip';
import { RegistryHeader } from '../shared/RegistryComponents';
import { cn } from '../../../lib/utils';

const MOCK_ASSETS = [
  { id: 'AST-101', name: 'Primary Sawing Line (G1)', purchased: '12 Jan 2022', val: 3200000, current: 2850000, rate: '15%', type: 'Machinery' },
  { id: 'AST-102', name: 'Industrial Forklift (Toyota)', purchased: '05 Aug 2021', val: 1250000, current: 980000, rate: '20%', type: 'Vehicle' },
  { id: 'AST-103', name: 'Polishing Gantry Crane', purchased: '15 Mar 2023', val: 4500000, current: 4320000, rate: '10%', type: 'Machinery' },
];

export const FixedAssetRegistry = () => {
  const [search, setSearch] = useState('');

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500 @container">
        <RegistryHeader 
          variant="full"
          label="Capital Registry"
          title="Plant & Fixed Assets"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search equipment or ID..."
          action={
            <Button variant="filled" size="md" icon={<Icons.Add />} className="shadow-2 font-black px-6 text-[10px]">REGISTER ASSET</Button>
          }
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Card variant="outlined" className="p-6 bg-stone-900 text-white border-none shadow-3">
                    <Typography variant="labelSmall" className="text-stone-500 font-black uppercase">Net Asset Value (WDV)</Typography>
                    <Typography variant="headlineSmall" className="font-black text-primary-container mt-2">₹81,50,000</Typography>
                </Card>
                <Card variant="outlined" className="p-6 bg-white border-stone-200">
                    <Typography variant="labelSmall" className="text-stone-400 font-black uppercase">Avg. Life Cycle</Typography>
                    <Typography variant="headlineSmall" className="font-black text-stone-900 mt-2">8.4 Years</Typography>
                </Card>
                <Card variant="outlined" className="p-6 bg-white border-stone-200">
                    <Typography variant="labelSmall" className="text-stone-400 font-black uppercase">Maintenance Score</Typography>
                    <Typography variant="headlineSmall" className="font-black text-emerald-600 mt-2">92% Optimal</Typography>
                </Card>
            </div>

            <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-stone-50 border-b border-stone-200">
                            <TableHead className="py-4">Asset Details</TableHead>
                            <TableHead>Purchased On</TableHead>
                            <TableHead className="text-right">Original Cost</TableHead>
                            <TableHead className="text-right">Depr. Rate</TableHead>
                            <TableHead className="text-right">Current Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MOCK_ASSETS.map((asset, i) => (
                            <TableRow key={i} className="hover:bg-stone-50 border-b border-stone-50 transition-colors cursor-pointer">
                                <TableCell className="py-5">
                                    <div className="flex flex-col">
                                        <span className="font-black text-stone-900 uppercase text-[12px]">{asset.name}</span>
                                        <span className="text-[10px] font-mono text-primary font-bold uppercase">{asset.id} • {asset.type}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-stone-400 font-bold uppercase text-[11px]">{asset.purchased}</TableCell>
                                <TableCell className="text-right font-bold text-stone-600 tabular-nums text-sm">₹{asset.val.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-black text-amber-600 tabular-nums text-xs">{asset.rate}</TableCell>
                                <TableCell className="text-right font-black text-stone-900 tabular-nums text-sm">₹{asset.current.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    </div>
  );
};