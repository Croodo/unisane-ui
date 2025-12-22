
import React, { useState } from 'react';
import { TextField } from '../../ui/TextField';
import { Select } from '../../ui/Select';
import { Typography } from '../../ui/Typography';
import { Icons } from '../Icons';
import { cn } from '../../../lib/utils';

interface TransactionFormProps {
  party: any;
  type: string; // 'customers' or 'suppliers'
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ party, type }) => {
  const isIncoming = type === 'customers';
  
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Bank Transfer',
    reference: '',
    description: '',
  });

  const bgClass = "bg-white";

  return (
    <div className="flex flex-col bg-white">
      {/* Visual Context Header */}
      <div className={cn(
        "p-8 md:p-10 flex flex-col gap-1 border-b border-stone-100",
        isIncoming ? "bg-emerald-50/20" : "bg-stone-50/50"
      )}>
        <Typography variant="labelSmall" className="text-stone-400 font-black uppercase tracking-widest">
            Current Outstanding
        </Typography>
        <div className="flex items-baseline gap-2">
            <Typography variant="headlineMedium" className="font-black text-stone-900 tabular-nums text-4xl">
                ₹{Math.abs(party?.balance || 0).toLocaleString()}
            </Typography>
            <Typography variant="labelSmall" className="text-stone-400 font-bold uppercase">
                {party?.balance >= 0 ? (isIncoming ? 'Receivable' : 'Payable') : 'In Advance'}
            </Typography>
        </div>
      </div>

      <div className="p-8 md:p-10 flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField 
            label={isIncoming ? "AMOUNT RECEIVED" : "AMOUNT PAID"}
            type="number"
            value={formData.amount} 
            onChange={(e) => setFormData({...formData, amount: e.target.value})} 
            placeholder="0.00" 
            labelClassName={bgClass}
            className="text-2xl font-black"
            leadingIcon={<span className="font-black text-stone-400">₹</span>}
          />
          <TextField 
            label="TRANSACTION DATE" 
            type="date"
            value={formData.date} 
            onChange={(e) => setFormData({...formData, date: e.target.value})} 
            labelClassName={bgClass} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select 
            label="PAYMENT MODE" 
            value={formData.paymentMode} 
            onChange={(val) => setFormData({...formData, paymentMode: val})} 
            options={[
              { label: 'Bank Transfer / NEFT', value: 'Bank Transfer' },
              { label: 'Cash', value: 'Cash' },
              { label: 'Cheque', value: 'Cheque' },
              { label: 'UPI (GPay/PhonePe)', value: 'UPI' },
            ]} 
          />
          <TextField 
            label="REF NO / CHEQUE NO" 
            value={formData.reference} 
            onChange={(e) => setFormData({...formData, reference: e.target.value})} 
            placeholder="TXN ID or Slip No" 
            labelClassName={bgClass} 
          />
        </div>

        <TextField 
          label="REMARKS / NOTES" 
          multiline 
          rows={3}
          value={formData.description} 
          onChange={(e) => setFormData({...formData, description: e.target.value})} 
          placeholder="Optional notes for the ledger..." 
          labelClassName={bgClass} 
        />

        {/* Dynamic Impact Analysis */}
        {formData.amount && (
            <div className="p-6 bg-stone-900 text-white rounded-xs flex items-center gap-6 shadow-2">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-primary-container">
                    <Icons.Adjust size={24} />
                </div>
                <div className="flex flex-col gap-1">
                  <Typography variant="labelSmall" className="text-stone-500 font-black uppercase">Post-Entry Impact</Typography>
                  <Typography variant="bodyLarge" className="text-stone-200 font-bold leading-tight">
                      Adjusting {party.name}'s balance to 
                      <span className="text-emerald-400 ml-1.5">₹{(Math.abs(party.balance) - Number(formData.amount)).toLocaleString()}</span>.
                  </Typography>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
