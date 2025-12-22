import React, { useState } from 'react';
import { TextField } from '../../ui/TextField';
import { Select } from '../../ui/Select';
import { Typography } from '../../ui/Typography';
import { Divider } from '../../ui/Divider';

export const ExpenseForm = ({ onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Utilities',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Bank Transfer',
    isGstExpense: false,
    gstAmount: '',
    refNo: '',
    notes: ''
  });

  const bgClass = "bg-white";

  return (
    <div className="flex flex-col bg-white">
      <div className="p-8 md:p-10 flex flex-col gap-8">
        <div className="flex flex-col gap-6">
            <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-primary rounded-full" /> Transaction Details
            </Typography>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField 
                    label="EXPENSE TITLE" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="e.g. Office Rent October" 
                    labelBg={bgClass} 
                />
                <Select 
                    label="CATEGORY" 
                    value={formData.category} 
                    onChange={v => setFormData({...formData, category: v})} 
                    options={[
                        { label: 'Utilities & Bills', value: 'Utilities' },
                        { label: 'Staff Salary', value: 'Salary' },
                        { label: 'Rent & Leasing', value: 'Rent' },
                        { label: 'Repairs & Maintenance', value: 'Repairs' },
                        { label: 'Marketing', value: 'Marketing' },
                        { label: 'General Misc', value: 'Misc' },
                    ]} 
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField 
                    label="TOTAL AMOUNT" 
                    type="number" 
                    value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: e.target.value})} 
                    leadingIcon={<span className="text-stone-400 font-bold">₹</span>}
                    labelBg={bgClass} 
                    className="text-xl font-black"
                />
                <TextField 
                    label="EXPENSE DATE" 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                    labelBg={bgClass} 
                />
            </div>
        </div>

        <Divider className="opacity-40" />

        <div className="flex flex-col gap-6">
            <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-primary rounded-full" /> Payment & Compliance
            </Typography>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select 
                    label="PAYMENT MODE" 
                    value={formData.paymentMode} 
                    onChange={v => setFormData({...formData, paymentMode: v})} 
                    options={[
                        { label: 'Bank Transfer / NEFT', value: 'Bank Transfer' },
                        { label: 'Cash', value: 'Cash' },
                        { label: 'Cheque', value: 'Cheque' },
                        { label: 'UPI', value: 'UPI' },
                    ]} 
                />
                <TextField 
                    label="REFERENCE NO / SLIP NO" 
                    value={formData.refNo} 
                    onChange={e => setFormData({...formData, refNo: e.target.value})} 
                    placeholder="Optional TXN ID" 
                    labelBg={bgClass} 
                />
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xs flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        id="gstCheck" 
                        className="rounded-xs text-primary focus:ring-primary h-5 w-5 border-stone-300"
                        checked={formData.isGstExpense}
                        onChange={e => setFormData({...formData, isGstExpense: e.target.checked})}
                    />
                    <label htmlFor="gstCheck" className="text-sm font-black text-stone-700 uppercase tracking-tight cursor-pointer">This expense includes GST for ITC</label>
                </div>
                {formData.isGstExpense && (
                    <TextField 
                        label="GST PORTION (CLAIMABLE)" 
                        type="number" 
                        value={formData.gstAmount} 
                        onChange={e => setFormData({...formData, gstAmount: e.target.value})} 
                        labelBg="bg-stone-50" 
                    />
                )}
            </div>
        </div>

        <TextField 
            label="NOTES / REMARKS" 
            multiline 
            rows={2} 
            value={formData.notes} 
            onChange={e => setFormData({...formData, notes: e.target.value})} 
            labelBg={bgClass} 
        />
      </div>
    </div>
  );
};