import React, { useState, useLayoutEffect } from 'react';
import { Typography } from '../../ui/Typography';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../ui/Table';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/Tabs';
import { EntityDetailHeader } from '../shared/EntityDetailHeader';
import { Avatar } from '../../ui/Avatar';

const MOCK_LEDGER = [
  { id: 'INV-1022', date: '26 Oct 2023', type: 'Sales Invoice', debit: 25000, credit: 0, balance: 45000, status: 'Unpaid' },
  { id: 'PAY-882', date: '20 Oct 2023', type: 'Payment In', debit: 0, credit: 15000, balance: 20000, status: 'Cleared' },
  { id: 'INV-1010', date: '15 Oct 2023', type: 'Sales Invoice', debit: 20000, credit: 0, balance: 35000, status: 'Paid' },
];

export const PartyDetailView = ({ party, onEdit, onRecordPayment }: any) => {
  const [activeTab, setActiveTab] = useState('summary');

  useLayoutEffect(() => {
    const scrollViewport = document.getElementById('detail-scroll-viewport');
    if (scrollViewport) scrollViewport.scrollTop = 0;
  }, [party?.id]);

  if (!party) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-8 text-stone-200">
       <div className="p-10 rounded-full bg-stone-50 border border-stone-100">
          <Icons.Parties size={96} strokeWidth={1} />
       </div>
       <div className="text-center">
          <Typography variant="titleLarge" className="font-black tracking-widest text-stone-300 uppercase">Select Partner</Typography>
          <Typography variant="bodyLarge" className="text-stone-300 font-bold uppercase tracking-tight mt-2 opacity-60">Pick a business entity to view commercial history</Typography>
       </div>
    </div>
  );

  const creditUtilization = (party.balance / party.creditLimit) * 100;
  const isOverLimit = party.balance > party.creditLimit;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col min-h-full bg-white animate-in fade-in duration-500 relative @container/party-detail">
      <EntityDetailHeader 
        id={party.id}
        title={party.name}
        subtitle={party.group}
        status={<Chip label={party.group} className="h-6 text-[10px] font-black uppercase rounded-xs border-none bg-stone-100 text-stone-500 px-3" />}
        actions={
          <>
            <Button variant="outlined" size="md" icon={<Icons.Money size={20} />} onClick={onRecordPayment} className="font-black">RECORD PAYMENT</Button>
            <Button variant="filled" size="md" icon={<Icons.Edit size={20} />} onClick={onEdit} className="shadow-2 font-black">EDIT PROFILE</Button>
          </>
        }
        tabs={
          <TabsList className="bg-transparent border-none p-0 h-auto gap-10 justify-start">
            <TabsTrigger value="summary" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none min-w-0 flex-none border-b-2 border-transparent">RELATIONSHIP</TabsTrigger>
            <TabsTrigger value="ledger" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none min-w-0 flex-none border-b-2 border-transparent">FINANCIAL LOGS</TabsTrigger>
            <TabsTrigger value="aging" className="px-0 py-4 h-auto text-xs font-black uppercase tracking-widest rounded-none min-w-0 flex-none border-b-2 border-transparent">OVERDUE AGING</TabsTrigger>
          </TabsList>
        }
      />

      <div className="p-6 @[800px]/party-detail:p-10 flex flex-col gap-10 pb-32 flex-1">
          <TabsContent value="summary" className="mt-0 space-y-12">
              <Card variant="outlined" className="bg-stone-50 border-stone-200 p-8 flex flex-col gap-8 rounded-xs hover:border-primary/30 transition-colors shadow-sm">
                 <div className="flex flex-col @[600px]/party-detail:flex-row @[600px]/party-detail:items-center justify-between gap-6">
                    <div className="flex flex-col">
                        <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest">Credit Utilization</Typography>
                        <Typography variant="displaySmall" className={cn("font-black tracking-tighter mt-2 leading-none", isOverLimit ? "text-error" : "text-stone-900")}>
                            ₹{party.balance.toLocaleString()} <span className="text-sm text-stone-400 font-black uppercase tracking-tight ml-3">Limit: ₹{party.creditLimit.toLocaleString()}</span>
                        </Typography>
                    </div>
                    <div className="flex flex-col @[600px]/party-detail:items-end">
                        <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest">System Rating</Typography>
                        <Chip label={party.creditRating} className="mt-3 h-12 px-10 text-xl font-black bg-emerald-600 text-white border-none rounded-xs shadow-1" />
                    </div>
                 </div>
                 <div className="flex flex-col gap-3">
                    <div className="h-3 w-full bg-stone-200 rounded-full overflow-hidden">
                        <div className={cn("h-full transition-all duration-1000 ease-emphasized", isOverLimit ? "bg-error" : "bg-primary")} style={{ width: `${Math.min(100, creditUtilization)}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-black text-stone-500 uppercase tracking-tight">
                        <span>Utilization: {creditUtilization.toFixed(1)}%</span>
                        {isOverLimit && <span className="text-error animate-pulse">CREDIT BLOCK ACTIVE</span>}
                    </div>
                 </div>
              </Card>

              <div className="grid grid-cols-1 @[1000px]/party-detail:grid-cols-2 gap-8">
                 <div className="flex flex-col gap-4">
                    <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest">Primary Contact Identity</Typography>
                    <div className="p-6 border border-stone-200 rounded-xs bg-white shadow-sm flex items-start gap-5">
                        <Avatar size="lg" fallback={party.contactPerson[0]} className="bg-stone-900 text-white rounded-xs font-black" />
                        <div>
                            <span className="text-base font-black text-stone-900 uppercase block leading-none">{party.contactPerson}</span>
                            <Typography variant="bodyLarge" className="text-stone-500 font-bold mt-2">{party.phone} • {party.email}</Typography>
                        </div>
                    </div>
                 </div>
                 <div className="flex flex-col gap-4">
                    <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest">Statutory Compliance</Typography>
                    <div className="p-6 border border-stone-200 rounded-xs bg-white shadow-sm flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-stone-400 uppercase tracking-widest w-16">GSTIN</span>
                            <span className="text-sm font-black text-primary uppercase">{party.gstin}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-stone-400 uppercase tracking-widest w-16">PAN</span>
                            <span className="text-sm font-black text-stone-800 uppercase">{party.pan}</span>
                        </div>
                    </div>
                 </div>
              </div>

              <section className="flex flex-col gap-4">
                <Typography variant="labelLarge" className="text-stone-400 font-black uppercase tracking-widest">Registered Billing Address</Typography>
                <div className="p-8 border border-stone-200 rounded-xs bg-white text-stone-700 font-black uppercase text-sm leading-loose shadow-sm tracking-tight border-l-4 border-l-stone-900">
                   {party.address}
                </div>
              </section>
          </TabsContent>

          <TabsContent value="ledger" className="mt-0">
              <div className="border border-stone-200 rounded-xs overflow-hidden shadow-sm bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-stone-50 border-b border-stone-100">
                            <TableHead className="py-5 px-8">Date</TableHead>
                            <TableHead>Voucher Details</TableHead>
                            <TableHead className="text-right">Debit (+)</TableHead>
                            <TableHead className="text-right">Credit (-)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MOCK_LEDGER.map((row, i) => (
                            <TableRow key={i} className="hover:bg-stone-50 border-b border-stone-50 transition-colors">
                                <TableCell className="text-xs font-black text-stone-400 tabular-nums px-8">{row.date}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col py-4">
                                        <span className="text-sm font-black text-stone-900 uppercase tracking-tight">{row.id}</span>
                                        <span className="text-[10px] font-black text-stone-400 uppercase mt-1 tracking-widest">{row.type}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-black text-stone-900 tabular-nums text-sm">₹{row.debit.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-black text-emerald-600 tabular-nums text-sm">₹{row.credit.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </div>
          </TabsContent>

          <TabsContent value="aging" className="mt-0">
             <div className="h-96 flex flex-col items-center justify-center opacity-30 gap-6">
                <div className="p-10 rounded-full border-4 border-dashed border-stone-200">
                    <Icons.History size={80} strokeWidth={1} className="text-stone-300" />
                </div>
                <Typography variant="labelLarge" className="font-black uppercase tracking-[12px] text-stone-400">Aging Logic Standby</Typography>
                <Typography variant="titleMedium" className="font-black text-stone-300 uppercase">Audit trace generated for {party.id}</Typography>
             </div>
          </TabsContent>
      </div>
    </Tabs>
  );
};