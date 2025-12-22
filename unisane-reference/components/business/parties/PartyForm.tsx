
import React, { useState } from 'react';
import { TextField } from '../../ui/TextField';
import { Select } from '../../ui/Select';
import { Typography } from '../../ui/Typography';
import { Divider } from '../../ui/Divider';

interface PartyFormProps {
  type: string;
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const PartyForm: React.FC<PartyFormProps> = ({ type, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    contactPerson: initialData?.contactPerson || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    group: initialData?.group || 'Standard',
    gstin: initialData?.gstin || '',
    pan: initialData?.pan || '',
    address: initialData?.address || '',
    creditLimit: initialData?.creditLimit || '50000',
    openingBalance: initialData?.openingBalance || '0',
    balanceType: initialData?.balanceType || (type === 'customers' ? 'Receivable' : 'Payable'),
    paymentTerms: initialData?.paymentTerms || 'NET 30 DAYS',
  });

  const bgClass = "bg-white";

  return (
    <div className="flex flex-col bg-white">
      <div className="flex flex-col gap-8 p-8 md:p-10">
        {/* Business Identity */}
        <div className="flex flex-col gap-6">
          <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-3 bg-primary rounded-full" /> Business Identity
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField 
              label="BUSINESS NAME" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              placeholder="e.g. Acme Corp Pvt Ltd" 
              labelClassName={bgClass} 
            />
            <TextField 
              label="PRIMARY CONTACT PERSON" 
              value={formData.contactPerson} 
              onChange={(e) => setFormData({...formData, contactPerson: e.target.value})} 
              placeholder="Full Name" 
              labelClassName={bgClass} 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <TextField 
                label="CONTACT NUMBER" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                placeholder="Primary Mobile" 
                labelClassName={bgClass} 
              />
              <TextField 
                label="EMAIL ADDRESS" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                placeholder="billing@company.com" 
                labelClassName={bgClass} 
              />
          </div>
          <Select 
            label="PARTY GROUP" 
            value={formData.group} 
            onChange={(val) => setFormData({...formData, group: val})} 
            options={[
              { label: 'Standard', value: 'Standard' },
              { label: 'Premium', value: 'Premium' },
              { label: 'VIP', value: 'VIP' },
              { label: 'Preferred', value: 'Preferred' },
            ]} 
          />
        </div>

        <Divider className="opacity-40" />

        {/* Tax Compliance */}
        <div className="flex flex-col gap-6">
          <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-3 bg-primary rounded-full" /> Statutory Compliance
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField 
              label="GSTIN" 
              value={formData.gstin} 
              onChange={(e) => setFormData({...formData, gstin: e.target.value})} 
              placeholder="15-digit Alpha-numeric" 
              labelClassName={bgClass} 
            />
            <TextField 
              label="PAN" 
              value={formData.pan} 
              onChange={(e) => setFormData({...formData, pan: e.target.value})} 
              placeholder="10-digit Alpha-numeric" 
              labelClassName={bgClass} 
            />
          </div>
        </div>

        <Divider className="opacity-40" />

        {/* Financial Settings */}
        <div className="flex flex-col gap-6">
          <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-3 bg-primary rounded-full" /> Credit & Terms
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField 
              label="CREDIT LIMIT (INR)" 
              type="number"
              value={formData.creditLimit}
              onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
              helperText="Auto-blocks invoicing if exceeded"
              labelClassName={bgClass} 
            />
             <Select 
                label="PAYMENT TERMS" 
                value={formData.paymentTerms} 
                onChange={(val) => setFormData({...formData, paymentTerms: val})} 
                options={[
                  { label: 'Net 30 Days', value: 'NET 30 DAYS' },
                  { label: 'Net 15 Days', value: 'NET 15 DAYS' },
                  { label: 'Due on Receipt', value: 'DUE ON RECEIPT' },
                  { label: 'Advance Payment', value: 'ADVANCE' },
                ]} 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField 
              label="OPENING BALANCE" 
              type="number"
              value={formData.openingBalance}
              onChange={(e) => setFormData({...formData, openingBalance: e.target.value})}
              labelClassName={bgClass} 
            />
            <Select 
                label="BALANCE TYPE" 
                value={formData.balanceType} 
                onChange={(val) => setFormData({...formData, balanceType: val})} 
                options={[
                    { label: 'Receivable (They owe you)', value: 'Receivable' },
                    { label: 'Payable (You owe them)', value: 'Payable' },
                ]} 
            />
          </div>
        </div>

        <Divider className="opacity-40" />

        {/* Address */}
        <div className="flex flex-col gap-6">
          <Typography variant="labelSmall" className="text-primary font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-3 bg-primary rounded-full" /> Registered Address
          </Typography>
          <TextField 
            label="BILLING ADDRESS" 
            multiline 
            rows={3} 
            value={formData.address} 
            onChange={(e) => setFormData({...formData, address: e.target.value})} 
            placeholder="Full office location for GST compliance..." 
            labelClassName={bgClass} 
          />
        </div>
      </div>
    </div>
  );
};
