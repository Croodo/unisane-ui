
import React from 'react';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Icons } from '../Icons';
import { Avatar } from '../../ui/Avatar';
import { Chip } from '../../ui/Chip';
import { RegistryHeader } from '../shared/RegistryComponents';

export const ApprovalInbox = () => {
  const MOCK_APPROVALS = [
    { id: 'APP-991', type: 'Discount Override', requester: 'Amit S.', detail: 'Requested 25% discount for Elite Builders (Limit 10%)', amount: '₹12,400', time: '10m ago' },
    { id: 'APP-990', type: 'Document Cancellation', requester: 'Ramesh K.', detail: 'Voiding INV-2023-101 (Duplicate Entry)', amount: '₹45,000', time: '1h ago' },
    { id: 'APP-989', type: 'Credit Limit Increase', requester: 'Sales Desk', detail: 'Increase PRTY-002 limit to ₹2,00,000', amount: 'N/A', time: '2h ago' },
  ];

  return (
    <div className="h-full flex flex-col bg-stone-50 animate-in fade-in duration-500">
      <RegistryHeader 
        label="Administrative Control"
        title="Approval Inbox"
        hideSearch
        action={
            <div className="bg-stone-900 text-white px-6 py-2 rounded-xs flex flex-col justify-center h-12 shadow-3">
                <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest leading-none">Queue Size</span>
                <span className="text-sm font-black text-primary-container leading-none mt-1">{MOCK_APPROVALS.length} Vouchers</span>
            </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-12 pb-32">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
           {MOCK_APPROVALS.map(req => (
             <Card key={req.id} variant="outlined" className="bg-white border-stone-200 p-6 rounded-xs flex flex-col gap-6 shadow-sm hover:border-primary/40 transition-all group">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xs bg-stone-900 text-primary flex items-center justify-center shrink-0 shadow-1">
                        <Icons.Terminal size={24} />
                      </div>
                      <div className="flex flex-col">
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-primary font-black uppercase">{req.id}</span>
                            <Chip label={req.type} className="h-5 text-[8px] font-black uppercase bg-stone-100 text-stone-600 border-none rounded-xs" />
                         </div>
                         <Typography variant="titleMedium" className="font-black text-stone-900 uppercase mt-1 tracking-tight leading-none">{req.detail}</Typography>
                      </div>
                   </div>
                   <div className="text-right flex flex-col items-end">
                      <span className="text-xs font-black text-stone-900 tabular-nums">{req.amount}</span>
                      <span className="text-[9px] font-bold text-stone-400 uppercase mt-1">{req.time}</span>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                   <div className="flex items-center gap-3">
                      <Avatar fallback={req.requester[0]} size="sm" className="rounded-xs bg-stone-200 text-stone-600 font-black" />
                      <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Requested by {req.requester}</span>
                   </div>
                   <div className="flex gap-2">
                      <Button variant="text" size="md" className="text-rose-600 font-black text-[10px] px-6">REJECT</Button>
                      <Button variant="filled" size="md" className="font-black text-[10px] px-8 shadow-1">APPROVE ACTION</Button>
                   </div>
                </div>
             </Card>
           ))}
        </div>
      </div>
    </div>
  );
};
