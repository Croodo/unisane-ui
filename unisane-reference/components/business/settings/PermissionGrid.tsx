import React from 'react';
import { Typography } from '../../ui/Typography';
import { Checkbox } from '../../ui/SelectionControls';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';

export const PermissionGrid = ({ roleName, onBack }: { roleName: string, onBack?: () => void }) => {
  const MODULES = [
    { name: 'Sales Invoicing', permissions: ['View', 'Create', 'Edit', 'Delete', 'Print'] },
    { name: 'Purchase Registry', permissions: ['View', 'Create', 'Edit', 'Delete'] },
    { name: 'Inventory Master', permissions: ['View', 'Create', 'Edit', 'Adjust'] },
    { name: 'Accounting Ledger', permissions: ['View', 'Create', 'Audit'] },
    { name: 'Staff Management', permissions: ['View', 'Edit'] },
  ];

  return (
    <div className="flex flex-col gap-8u @container animate-in fade-in duration-500 pb-32">
       <header className="flex flex-col gap-1u">
          <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest text-[10px]">Access Control Matrix</Typography>
          <div className="flex justify-between items-end">
            <Typography variant="headlineSmall" className="font-black text-stone-900 uppercase tracking-tight">Edit Permissions: {roleName}</Typography>
            <div className="hidden @lg:flex gap-2u">
                <Button variant="outlined" size="md" className="font-black text-[9px] bg-white px-8" onClick={onBack}>CANCEL</Button>
                <Button variant="filled" size="md" className="bg-stone-900 text-white font-black text-[9px] px-12 shadow-2">SAVE RULESET</Button>
            </div>
          </div>
       </header>

       <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm overflow-x-auto relative">
          <Table className="min-w-[800px] @xl:min-w-full border-collapse">
             <TableHeader className="sticky top-0 z-20 shadow-sm">
                <TableRow className="bg-stone-50 border-b border-stone-200">
                   <TableHead className="w-64u sticky left-0 bg-stone-50 z-30 border-r border-stone-100">Operational Module</TableHead>
                   <TableHead className="text-center">View</TableHead>
                   <TableHead className="text-center">Create</TableHead>
                   <TableHead className="text-center">Edit</TableHead>
                   <TableHead className="text-center">Delete</TableHead>
                   <TableHead className="text-center">Special</TableHead>
                </TableRow>
             </TableHeader>
             <TableBody>
                {MODULES.map((mod, i) => (
                   <TableRow key={i} className="hover:bg-stone-50 transition-colors group">
                      <TableCell className="font-black text-stone-800 uppercase text-[12px] py-6u sticky left-0 bg-white group-hover:bg-stone-50 z-10 border-r border-stone-100 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                        {mod.name}
                      </TableCell>
                      <TableCell className="text-center"><div className="flex justify-center"><Checkbox defaultChecked /></div></TableCell>
                      <TableCell className="text-center"><div className="flex justify-center"><Checkbox defaultChecked={roleName !== 'Viewer'} /></div></TableCell>
                      <TableCell className="text-center"><div className="flex justify-center"><Checkbox defaultChecked={roleName === 'Owner' || roleName === 'Manager'} /></div></TableCell>
                      <TableCell className="text-center"><div className="flex justify-center"><Checkbox defaultChecked={roleName === 'Owner'} /></div></TableCell>
                      <TableCell className="text-center">
                         <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest">N/A</span>
                      </TableCell>
                   </TableRow>
                ))}
             </TableBody>
          </Table>
       </div>

       <div className="p-6u @md:p-10u bg-rose-50 border border-rose-100 rounded-xs flex flex-col gap-6u">
          <Typography variant="titleSmall" className="font-black text-rose-800 uppercase tracking-tight flex items-center gap-3u">
            <Icon symbol="security" className="text-rose-600" /> Security Sensitive Policy
          </Typography>
          <div className="flex flex-col gap-4u pl-4u @md:pl-8u border-l-2 border-rose-200">
             <Checkbox label="Hide Purchase Prices from this role" className="text-rose-900" />
             <Checkbox label="Hide Profit Margins on Dashboard" className="text-rose-900" />
             <Checkbox label="Require Admin approval for any Delete action" defaultChecked className="text-rose-900" />
          </div>
       </div>

       <div className="@lg:hidden fixed bottom-6u right-6u z-50">
          <Button variant="filled" size="md" className="bg-stone-900 text-white font-black shadow-3 px-12">SAVE CHANGES</Button>
       </div>
    </div>
  );
};