import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Icon } from '../../ui/Icon';
import { Icons } from '../Icons';
import { Button } from '../../ui/Button';

export const GSTRReportView = () => {
  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="outlined" className="p-5 bg-emerald-50 border-emerald-100 rounded-xs">
           <Typography variant="labelSmall" className="text-emerald-700 font-black uppercase text-[9px]">GSTR-1 (Outward)</Typography>
           <Typography variant="titleLarge" className="font-black text-emerald-900 mt-1">₹8,42,000</Typography>
           <span className="text-[10px] font-bold text-emerald-600 uppercase mt-2 block">14 Invoices</span>
        </Card>
        <Card variant="outlined" className="p-5 bg-rose-50 border-rose-100 rounded-xs">
           <Typography variant="labelSmall" className="text-rose-700 font-black uppercase text-[9px]">GSTR-2A (Inward)</Typography>
           <Typography variant="titleLarge" className="font-black text-rose-900 mt-1">₹5,12,000</Typography>
           <span className="text-[10px] font-bold text-rose-600 uppercase mt-2 block">Recalculated</span>
        </Card>
        <Card variant="outlined" className="p-5 bg-stone-900 text-white border-none rounded-xs">
           <Typography variant="labelSmall" className="text-stone-500 font-black uppercase text-[9px]">Input Tax Credit (ITC)</Typography>
           <Typography variant="titleLarge" className="font-black text-primary-container mt-1">₹1,18,450</Typography>
           <span className="text-[10px] font-bold text-emerald-400 uppercase mt-2 block">Eligible</span>
        </Card>
        <Card variant="outlined" className="p-5 bg-white border-stone-200 rounded-xs">
           <Typography variant="labelSmall" className="text-stone-400 font-black uppercase text-[9px]">Net Tax Liability</Typography>
           <Typography variant="titleLarge" className="font-black text-stone-900 mt-1">₹32,200</Typography>
           <span className="text-[10px] font-bold text-error uppercase mt-2 block">Payable in Cash</span>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
         <Typography variant="titleSmall" className="font-black text-stone-800 uppercase px-1">GSTR-1 Summary (B2B)</Typography>
         <div className="border border-stone-200 rounded-xs overflow-hidden bg-white shadow-sm">
            <Table>
               <TableHeader>
                  <TableRow className="bg-stone-50 border-b border-stone-200">
                     <TableHead>GSTIN of Recipient</TableHead>
                     <TableHead>Trade Name</TableHead>
                     <TableHead className="text-right">Taxable Value</TableHead>
                     <TableHead className="text-right">IGST</TableHead>
                     <TableHead className="text-right">CGST / SGST</TableHead>
                     <TableHead className="text-right">Total Tax</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {[
                      { gstin: '27AAACE1234F1Z5', name: 'Elite Builders', taxable: 200000, igst: 0, cs: 18000, total: 36000 },
                      { gstin: '27BBBCF5678G2Z0', name: 'Raj Construction', taxable: 150000, igst: 27000, cs: 0, total: 27000 },
                  ].map((row, i) => (
                     <TableRow key={i} className="hover:bg-stone-50 border-b border-stone-100">
                        <TableCell className="font-mono text-primary font-bold text-[11px] py-4">{row.gstin}</TableCell>
                        <TableCell className="font-black text-stone-800 uppercase text-[11px]">{row.name}</TableCell>
                        <TableCell className="text-right font-bold text-stone-900 tabular-nums">₹{row.taxable.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-stone-500 tabular-nums">₹{row.igst.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-stone-500 tabular-nums">₹{row.cs.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-black text-emerald-600 tabular-nums">₹{row.total.toLocaleString()}</TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </div>
      </section>

      <Card variant="filled" className="bg-stone-50 border border-stone-200 p-8 rounded-xs flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-white border border-stone-200 flex items-center justify-center text-primary shadow-sm">
               <Icon symbol="gavel" size={32} />
            </div>
            <div>
               <Typography variant="titleLarge" className="font-black text-stone-900 uppercase">Compliance Audit Report</Typography>
               <Typography variant="bodySmall" className="text-stone-500 font-bold uppercase mt-1 leading-relaxed">
                  System has verified all HSN codes and GSTIN validations. Total 0 anomalies found in October data.
               </Typography>
            </div>
         </div>
         <Button variant="tonal" size="md" icon={<Icons.File />} className="h-12 px-8 font-black uppercase text-[11px] shadow-2 shrink-0">
            DOWNLOAD JSON FOR PORTAL
         </Button>
      </Card>
    </div>
  );
};